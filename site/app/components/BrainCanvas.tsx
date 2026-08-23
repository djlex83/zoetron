import { useEffect, useRef, useState } from 'react'
import { loadBrain, type Brain, type Neuron } from '../lib/brain'
import { reduced } from '../lib/anim'
import { useLang } from '../lib/lang'

type Mode = 'ambient' | 'stage'

/** age buckets: fresh and loud → old and quiet */
const FACT = ['#8fe0ff', '#71c6f0', '#59a8d8', '#4585b4', '#3b6488']
const GOAL = ['#ffd28a', '#ffb864', '#e39a4d', '#b8763a', '#8a5a30']

function sprite(hex: string) {
  const c = document.createElement('canvas')
  c.width = c.height = 48
  const g = c.getContext('2d')!
  const grad = g.createRadialGradient(24, 24, 0, 24, 24, 24)
  grad.addColorStop(0, hex)
  grad.addColorStop(0.22, hex + 'cc')
  grad.addColorStop(0.55, hex + '33')
  grad.addColorStop(1, hex + '00')
  g.fillStyle = grad
  g.fillRect(0, 0, 48, 48)
  return c
}

export default function BrainCanvas({
  mode, className = '', onReady,
}: { mode: Mode; className?: string; onReady?: (b: Brain) => void }) {
  const { lang } = useLang()
  const host = useRef<HTMLDivElement>(null)
  const cvs = useRef<HTMLCanvasElement>(null)
  const [brain, setBrain] = useState<Brain | null>(null)
  const [failed, setFailed] = useState(false)
  const [picked, setPicked] = useState<Neuron | null>(null)
  /** camera lives outside the render effect so a data refresh never jumps the view */
  const cam = useRef({ ry: 0.5, rx: -0.18, zoom: 1, panX: 0, panY: 0, scale: 0, auto: true })

  useEffect(() => {
    let alive = true
    const pull = () =>
      loadBrain()
        .then((b) => { if (alive) { setBrain(b); setFailed(false); onReady?.(b) } })
        .catch(() => { if (alive) setBrain((prev) => { if (!prev) setFailed(true); return prev }) })
    pull()
    // brain.html is rewritten every heartbeat; loadBrain() only refetches when
    // its own cache is older than 4 minutes, so both canvases share one request
    const id = window.setInterval(pull, 5 * 60_000)
    return () => { alive = false; clearInterval(id) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const canvas = cvs.current
    const box = host.current
    if (!canvas || !box || !brain) return

    // the hero paints over a gradient, the stage owns its own black
    const opaque = mode === 'stage'
    const ctx = canvas.getContext('2d', { alpha: !opaque })!
    const still = reduced()
    const interactive = mode === 'stage'
    const narrow = window.innerWidth < 700
    const maxLinks = mode === 'stage' ? (narrow ? 1100 : 2600) : narrow ? 420 : 900
    const links = brain.synapses.slice(0, maxLinks)
    const nodes = brain.neurons

    const spritesF = FACT.map(sprite)
    const spritesG = GOAL.map(sprite)
    const spritePulse = sprite('#ffd166')

    const dpr = Math.min(window.devicePixelRatio || 1, mode === 'stage' ? 2 : 1.5)
    let W = 0, H = 0
    const fit = () => {
      W = box.clientWidth
      H = box.clientHeight
      canvas.width = Math.round(W * dpr)
      canvas.height = Math.round(H * dpr)
      canvas.style.width = W + 'px'
      canvas.style.height = H + 'px'
    }
    fit()

    // The organism's coordinates drift with every heartbeat and its two
    // hemispheres sit far apart, so nothing fixed can frame this well: we
    // measure the rotated cloud each frame and ease the scale toward a fit.
    const centre: [number, number, number] = [0, 0, 0]
    for (const n of nodes) { centre[0] += n.p[0]; centre[1] += n.p[1]; centre[2] += n.p[2] }
    centre[0] /= nodes.length || 1; centre[1] /= nodes.length || 1; centre[2] /= nodes.length || 1

    const v = cam.current
    if (still) v.auto = false
    let dragging = false, moved = 0, px = 0, py = 0
    let hover: Neuron | null = null
    const proj = new Map<string, { x: number; y: number; d: number; z: number }>()
    let pulses: { l: typeof links[number]; t: number; sp: number }[] = []

    const coords = new Float64Array(nodes.length * 3)

    const project = () => {
      const cy = Math.cos(v.ry), sy = Math.sin(v.ry)
      const cx = Math.cos(v.rx), sx = Math.sin(v.rx)
      let maxX = 0.001, maxY = 0.001

      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i]!
        const p0 = n.p[0] - centre[0], p1 = n.p[1] - centre[1], p2 = n.p[2] - centre[2]
        const x = p0 * cy + p2 * sy
        const z = -p0 * sy + p2 * cy
        const y2 = p1 * cx - z * sx
        const z2 = p1 * sx + z * cx
        const d = 3.4 / (3.4 - Math.min(z2, 2.4))
        const fx = x * d, fy = y2 * d
        coords[i * 3] = fx; coords[i * 3 + 1] = fy; coords[i * 3 + 2] = z2
        if (Math.abs(fx) > maxX) maxX = Math.abs(fx)
        if (Math.abs(fy) > maxY) maxY = Math.abs(fy)
      }

      const target = v.zoom * Math.min((W * 0.44) / maxX, (H * 0.44) / maxY)
      v.scale = v.scale === 0 ? target : v.scale + (target - v.scale) * 0.07

      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i]!
        const z2 = coords[i * 3 + 2]!
        proj.set(n.id, {
          x: W / 2 + v.panX + coords[i * 3]! * v.scale,
          y: H / 2 + v.panY - coords[i * 3 + 1]! * v.scale,
          d: 3.4 / (3.4 - Math.min(z2, 2.4)),
          z: z2,
        })
      }
    }

    const draw = () => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      if (opaque) {
        ctx.fillStyle = '#06070a'
        ctx.fillRect(0, 0, W, H)
      } else {
        ctx.clearRect(0, 0, W, H)
      }

      // synapses first — a faint web behind the cells
      ctx.lineWidth = 1
      for (const l of links) {
        const A = proj.get(l.a), B = proj.get(l.b)
        if (!A || !B) continue
        const near = (A.d + B.d) / 2
        ctx.strokeStyle = l.c ? '#8a5cf6' : '#3f6ea8'
        ctx.globalAlpha = Math.min(0.42, (l.s ?? 0.2) * 0.55) * (near - 0.55)
        ctx.beginPath()
        ctx.moveTo(A.x, A.y)
        ctx.lineTo(B.x, B.y)
        ctx.stroke()
      }

      // action potentials travelling along a synapse
      for (const p of pulses) {
        const A = proj.get(p.l.a), B = proj.get(p.l.b)
        if (!A || !B) continue
        const x = A.x + (B.x - A.x) * p.t
        const y = A.y + (B.y - A.y) * p.t
        const r = 6 * ((A.d + B.d) / 2) * (v.scale / 200)
        ctx.globalAlpha = 0.85
        ctx.drawImage(spritePulse, x - r, y - r, r * 2, r * 2)
      }

      // neurons, painted back to front
      const order = [...nodes].sort((a, b) => (proj.get(a.id)!.z - proj.get(b.id)!.z))
      const active = hover ?? picked
      for (const n of order) {
        const q = proj.get(n.id)!
        if (q.x < -40 || q.x > W + 40 || q.y < -40 || q.y > H + 40) continue
        const bucket = Math.min(4, Math.round((n.a ?? 0) * 4))
        const s = n.f ? spritesF[bucket]! : spritesG[bucket]!
        const r = (0.95 + Math.min(n.d, 14) * 0.15) * Math.sqrt(q.d) * (v.scale / 200)
        const hot = active?.id === n.id
        ctx.globalAlpha = hot ? 1 : Math.min(0.95, 0.26 + (q.d - 0.6) * 0.8)
        ctx.drawImage(s, q.x - r * 2.1, q.y - r * 2.1, r * 4.2, r * 4.2)
        if (hot) {
          ctx.globalAlpha = 1
          ctx.strokeStyle = '#f5a524'
          ctx.lineWidth = 1.4
          ctx.beginPath()
          ctx.arc(q.x, q.y, Math.max(r * 1.8, 6), 0, Math.PI * 2)
          ctx.stroke()
        }
      }

      // the picked neuron lights up its own synapses
      if (active) {
        ctx.strokeStyle = '#f5a524'
        ctx.globalAlpha = 0.75
        ctx.lineWidth = 1.2
        for (const l of links) {
          if (l.a !== active.id && l.b !== active.id) continue
          const A = proj.get(l.a), B = proj.get(l.b)
          if (!A || !B) continue
          ctx.beginPath()
          ctx.moveTo(A.x, A.y)
          ctx.lineTo(B.x, B.y)
          ctx.stroke()
        }
      }
      ctx.globalAlpha = 1
    }

    let running = true
    let raf = 0
    let pulseTimer = 0
    const loop = () => {
      if (!running) return
      if (v.auto && !dragging) v.ry += 0.0011
      if (!still) {
        pulses = pulses.filter((p) => (p.t += p.sp) <= 1)
        if (links.length && pulses.length < 10 && ++pulseTimer % 26 === 0) {
          pulses.push({ l: links[(Math.random() * links.length) | 0]!, t: 0, sp: 0.008 + Math.random() * 0.014 })
        }
      }
      project()
      draw()
      raf = requestAnimationFrame(loop)
    }

    const start = () => { if (!running) { running = true; raf = requestAnimationFrame(loop) } }
    const stop = () => { running = false; cancelAnimationFrame(raf) }

    project()
    draw()
    if (!still) raf = requestAnimationFrame(loop)
    else running = false

    // never burn frames on an off-screen or hidden brain
    const io = new IntersectionObserver(([e]) => (e?.isIntersecting && !still ? start() : stop()), { threshold: 0 })
    io.observe(box)
    const onVis = () => (document.hidden ? stop() : !still && start())
    document.addEventListener('visibilitychange', onVis)

    const ro = new ResizeObserver(() => { fit(); project(); draw() })
    ro.observe(box)

    // ---- pointer handling (stage only) ----
    const pick = (cx2: number, cy2: number) => {
      let best: Neuron | null = null
      let bd = 26
      for (const n of nodes) {
        const q = proj.get(n.id)!
        const dist = Math.hypot(q.x - cx2, q.y - cy2)
        if (dist < bd) { bd = dist; best = n }
      }
      return best
    }
    const onDown = (e: PointerEvent) => {
      dragging = true; moved = 0; px = e.clientX; py = e.clientY; v.auto = false
      canvas.setPointerCapture(e.pointerId)
    }
    const onMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect()
      if (dragging) {
        const dx = e.clientX - px, dy = e.clientY - py
        moved += Math.abs(dx) + Math.abs(dy)
        if (e.shiftKey) { v.panX += dx; v.panY += dy }
        else {
          v.ry += dx * 0.005
          v.rx = Math.max(-1.25, Math.min(1.25, v.rx - dy * 0.004))
        }
        px = e.clientX; py = e.clientY
        if (still) { project(); draw() }
        return
      }
      hover = pick(e.clientX - rect.left, e.clientY - rect.top)
      canvas.style.cursor = hover ? 'pointer' : 'grab'
      if (still) draw()
    }
    const onCancel = () => { dragging = false }
    const onUp = (e: PointerEvent) => {
      dragging = false
      canvas.releasePointerCapture?.(e.pointerId)
      if (moved <= 6) {
        const rect = canvas.getBoundingClientRect()
        setPicked(pick(e.clientX - rect.left, e.clientY - rect.top))
      }
    }
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      v.zoom = Math.max(0.55, Math.min(3.2, v.zoom * (e.deltaY > 0 ? 0.92 : 1.08)))
      if (still) { project(); draw() }
    }
    const onDouble = () => {
      v.ry = 0.5; v.rx = -0.18; v.zoom = 1; v.panX = 0; v.panY = 0
      v.auto = !still; setPicked(null)
      if (still) { project(); draw() }
    }

    if (interactive) {
      canvas.style.cursor = 'grab'
      canvas.addEventListener('pointerdown', onDown)
      canvas.addEventListener('pointermove', onMove)
      canvas.addEventListener('pointerup', onUp)
      canvas.addEventListener('pointercancel', onCancel)
      canvas.addEventListener('wheel', onWheel, { passive: false })
      canvas.addEventListener('dblclick', onDouble)
    }

    return () => {
      stop()
      io.disconnect()
      ro.disconnect()
      document.removeEventListener('visibilitychange', onVis)
      if (interactive) {
        canvas.removeEventListener('pointerdown', onDown)
        canvas.removeEventListener('pointermove', onMove)
        canvas.removeEventListener('pointerup', onUp)
        canvas.removeEventListener('pointercancel', onCancel)
        canvas.removeEventListener('wheel', onWheel)
        canvas.removeEventListener('dblclick', onDouble)
      }
    }
  }, [brain, mode, picked])

  return (
    <div ref={host} className={`relative h-full w-full overflow-hidden ${className}`}>
      <canvas ref={cvs} className="absolute inset-0 block h-full w-full" style={{ touchAction: mode === 'stage' ? 'pan-y' : 'auto' }} />

      {!brain && !failed && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="label animate-pulse">
            {lang === 'de' ? 'Neuronen werden geladen' : 'loading neurons'}
          </span>
        </div>
      )}
      {failed && mode === 'stage' && (
        <div className="absolute inset-0 flex items-center justify-center px-6 text-center">
          <p className="max-w-sm text-[0.96rem] text-ink-faint">
            {lang === 'de'
              ? 'Das Gehirn ließ sich gerade nicht laden — es wird alle 5 Minuten neu geschrieben. '
              : 'The brain could not be loaded right now — it is rewritten every 5 minutes. '}
            <a className="text-amber underline" href="./brain.html">brain.html</a>
          </p>
        </div>
      )}

      {mode === 'stage' && picked && (
        <div className="panel absolute right-3 top-3 max-h-[78%] w-[min(24rem,calc(100%-1.5rem))] overflow-y-auto rounded-2xl p-4 text-left">
          <div className="flex items-start justify-between gap-3">
            <span className={`rounded-full px-2.5 py-1 font-mono text-[0.7rem] ${picked.f ? 'bg-synapse/15 text-synapse' : 'bg-amber/15 text-amber'}`}>
              {picked.f ? (lang === 'de' ? 'Fakt' : 'fact') : (lang === 'de' ? 'Ziel / Ereignis' : 'goal / event')}
            </span>
            <button onClick={() => setPicked(null)} className="text-ink-faint transition-colors hover:text-ink" aria-label="close">✕</button>
          </div>
          <p className="mt-3 text-[0.96rem] leading-relaxed text-ink-dim">{picked.t}</p>
          <div className="mt-4 flex gap-4 border-t border-white/8 pt-3 font-mono text-[0.73rem] text-ink-faint">
            <span>{picked.d} {lang === 'de' ? 'Synapsen' : 'synapses'}</span>
            <span>{lang === 'de' ? 'Frische' : 'freshness'} {Math.round((1 - (picked.a ?? 0)) * 100)} %</span>
          </div>
        </div>
      )}
    </div>
  )
}

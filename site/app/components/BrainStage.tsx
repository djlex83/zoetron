import { useEffect, useRef, useState } from 'react'
import { sections } from '../lib/content'
import { useLang } from '../lib/lang'
import { gsap, reduced, useGsap } from '../lib/anim'
import { agoDE, type Leaderboard, type Pulse } from '../lib/live'
import type { Brain } from '../lib/brain'
import BrainCanvas from './BrainCanvas'
import { LiveDot, Section, SectionHead } from './ui'

type View = '3d' | '2d'

export default function BrainStage({
  board, pulse, onBrain,
}: { board: Leaderboard | null; pulse: Pulse; onBrain?: (b: Brain) => void }) {
  const { lang } = useLang()
  const root = useRef<HTMLDivElement>(null)
  const frame = useRef<HTMLDivElement>(null)
  const [view, setView] = useState<View>('3d')
  const [visible, setVisible] = useState(false)
  const [drawn, setDrawn] = useState<Brain | null>(null)
  const [full, setFull] = useState(false)

  // only boot the heavy canvas once the reader is actually here
  useEffect(() => {
    const el = frame.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([e]) => { if (e?.isIntersecting) { setVisible(true); obs.disconnect() } },
      { rootMargin: '400px 0px' },
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  // real fullscreen, not a new tab — the canvas resizes itself with the frame
  useEffect(() => {
    const onChange = () => setFull(document.fullscreenElement === frame.current)
    document.addEventListener('fullscreenchange', onChange)
    return () => document.removeEventListener('fullscreenchange', onChange)
  }, [])

  const toggleFull = async () => {
    const el = frame.current as (HTMLDivElement & { webkitRequestFullscreen?: () => Promise<void> }) | null
    if (!el) return
    try {
      if (document.fullscreenElement) await document.exitFullscreen()
      else if (el.requestFullscreen) await el.requestFullscreen({ navigationUI: 'hide' })
      else if (el.webkitRequestFullscreen) await el.webkitRequestFullscreen()
      else setFull((f) => !f) // iOS Safari: fall back to a full-viewport overlay
    } catch {
      setFull((f) => !f)
    }
  }

  useEffect(() => {
    if (!full) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && !document.fullscreenElement) setFull(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [full])

  useGsap(() => {
    if (reduced() || !frame.current) return
    gsap.fromTo(
      frame.current,
      { clipPath: 'inset(12% 10% 12% 10% round 28px)', opacity: 0.4, scale: 0.975 },
      {
        clipPath: 'inset(0% 0% 0% 0% round 28px)', opacity: 1, scale: 1, ease: 'none',
        scrollTrigger: { trigger: frame.current, start: 'top 90%', end: 'top 40%', scrub: 0.6 },
      },
    )
  }, root, [])

  const original = view === '3d' ? './brain.html' : './graph.html'

  return (
    <Section id="gehirn">
      <div ref={root}>
        <div className="flex flex-wrap items-end justify-between gap-8">
          <SectionHead label={sections.gehirn.label} head={sections.gehirn.head} sub={sections.gehirn.sub} />
          <div data-reveal className="flex items-center gap-2">
            {(['3d', '2d'] as View[]).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className="pill tab"
                data-active={view === v ? '1' : '0'}
              >
                <span>
                  {v === '3d'
                    ? (lang === 'de' ? '🧠 3D-Gehirn' : '🧠 3D brain')
                    : (lang === 'de' ? '🗺 2D-Karte' : '🗺 2D map')}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div
          ref={frame}
          className={`panel relative mt-12 overflow-hidden rounded-[28px] lg:mt-16 ${
            full ? 'fixed inset-0 z-[90] mt-0 rounded-none' : ''
          }`}
          style={{ willChange: 'clip-path, transform' }}
        >
          <div className="flex items-center justify-between gap-3 border-b border-white/8 px-4 py-3.5 sm:px-6">
            <div className="flex items-center gap-3">
              <LiveDot label="live" />
              <span className="hidden font-mono text-[0.8rem] text-ink-faint sm:inline">
                {lang === 'de' ? 'gezeichnet aus docs/brain.html' : 'drawn from docs/brain.html'}
              </span>
            </div>

            <div className="flex items-center gap-4 font-mono text-[0.8rem] text-ink-faint">
              {(drawn || board) && (
                <>
                  <span className="hidden md:inline">
                    {(drawn?.totals.neurons ?? board?.neurons ?? 0).toLocaleString('de-DE')}{' '}
                    {lang === 'de' ? 'Neuronen' : 'neurons'}
                  </span>
                  <span
                    className="hidden md:inline"
                    title={
                      drawn
                        ? lang === 'de'
                          ? `fürs Web verdichtet: ${drawn.kept.synapses.toLocaleString('de-DE')} der stärksten Synapsen werden geladen`
                          : `slimmed for the web: the ${drawn.kept.synapses.toLocaleString('de-DE')} strongest synapses are loaded`
                        : undefined
                    }
                  >
                    {(drawn?.totals.synapses ?? board?.synapses ?? 0).toLocaleString('de-DE')}{' '}
                    {lang === 'de' ? 'Synapsen' : 'synapses'}
                  </span>
                </>
              )}
              <span className="hidden sm:inline">
                {lang === 'de' ? 'Schlag' : 'beat'} {agoDE(pulse.iso, lang)}
              </span>
              {drawn && view === '3d' && (
                <span className="hidden lg:inline" title={lang === 'de' ? 'brain.html wird alle 10 Minuten neu geholt' : 'brain.html is refetched every 10 minutes'}>
                  {lang === 'de' ? 'geholt ' : 'fetched '}
                  {agoDE(new Date(drawn.fetchedAt).toISOString(), lang)}
                </span>
              )}
              <button
                onClick={toggleFull}
                className="rounded-full border border-white/14 px-4 py-2 text-[0.85rem] text-ink transition-colors hover:border-amber/60 hover:text-amber"
              >
                {full
                  ? (lang === 'de' ? 'Vollbild schließen ✕' : 'Exit fullscreen ✕')
                  : (lang === 'de' ? 'Vollbild ⤢' : 'Fullscreen ⤢')}
              </button>
            </div>
          </div>

          <div
            className={
              full
                ? 'relative h-[calc(100%-7.5rem)] w-full'
                : 'relative aspect-[4/5] w-full sm:aspect-[16/10] lg:aspect-[16/7.5]'
            }
          >
            {visible ? (
              <>
                <BrainCanvas
                  mode="stage"
                  layout={view === '3d' ? '3d' : 'map'}
                  onReady={(b) => { setDrawn(b); onBrain?.(b) }}
                />
                <div className="pointer-events-none absolute bottom-3 left-4 right-4 flex flex-wrap gap-x-6 gap-y-1 font-mono text-[0.76rem] text-ink-faint">
                  <span className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-synapse" />
                    {lang === 'de' ? 'Fakten & Einsichten' : 'facts & insights'}
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-amber" />
                    {lang === 'de' ? 'Ziele & Ereignisse' : 'goals & events'}
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-[#8a5cf6]" />
                    {lang === 'de' ? 'Brücke zwischen Domänen' : 'cross-domain bridge'}
                  </span>
                  <span className="hidden sm:inline">{lang === 'de' ? 'blass = alt' : 'faded = old'}</span>
                </div>
              </>
            ) : !visible ? (
              <div className="absolute inset-0 flex items-center justify-center bg-abyss">
                <span className="label animate-pulse">{lang === 'de' ? 'Organ wird geladen' : 'loading organ'}</span>
              </div>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-1 border-t border-white/8 px-4 py-3.5 text-[0.86rem] text-ink-faint sm:px-6">
            <span>{lang === 'de' ? 'ziehen: ' : 'drag: '}{view === '3d' ? (lang === 'de' ? 'drehen' : 'rotate') : (lang === 'de' ? 'verschieben' : 'pan')}</span>
            {view === '2d' && (
              <span className="text-ink-faint">
                {lang === 'de' ? 'die Kugel flach ausgerollt' : 'the sphere rolled out flat'}
              </span>
            )}
            <span className="hidden sm:inline">{lang === 'de' ? 'scrollen: zoom' : 'scroll: zoom'}</span>
            <span>{lang === 'de' ? 'klick: Neuron öffnen' : 'click: open a neuron'}</span>
            <span className="hidden sm:inline">{lang === 'de' ? 'Doppelklick: zurücksetzen' : 'double click: reset'}</span>
            {drawn && (
              <span className="ml-auto text-ink-faint">
                {lang === 'de'
                  ? `fürs Web verdichtet — ${drawn.kept.synapses.toLocaleString('de-DE')} von ${drawn.totals.synapses.toLocaleString('de-DE')} Synapsen geladen`
                  : `slimmed for the web — ${drawn.kept.synapses.toLocaleString('de-DE')} of ${drawn.totals.synapses.toLocaleString('de-DE')} synapses loaded`}
              </span>
            )}
            <a
              href={original}
              target="_blank"
              rel="noreferrer"
              className={`text-ink-faint underline decoration-white/20 underline-offset-4 transition-colors hover:text-amber ${drawn ? '' : 'ml-auto'}`}
            >
              {lang === 'de' ? 'Original (vollständig) ↗' : 'Original (complete) ↗'}
            </a>
          </div>
        </div>

        {board && board.topSynapses.length > 0 && !full && (
          <div className="mt-16 grid gap-4 lg:mt-24 lg:grid-cols-2">
            <h3 data-reveal className="label lg:col-span-2">
              {lang === 'de' ? 'Die stärksten Synapsen gerade eben' : 'Strongest synapses right now'}
            </h3>
            {board.topSynapses.slice(0, 6).map((s) => (
              <div key={s.rank} data-reveal className="panel rounded-2xl p-5 sm:p-6">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-[0.92rem] text-synapse">{s.strength}</span>
                  <span className="h-1 flex-1 overflow-hidden rounded-full bg-white/8">
                    <span
                      className="block h-full rounded-full bg-gradient-to-r from-synapse/40 to-synapse"
                      style={{ width: `${Math.min(100, Number(s.strength) * 160)}%` }}
                    />
                  </span>
                </div>
                <div className="mt-4 grid gap-3 text-[0.92rem] leading-snug text-ink-dim sm:grid-cols-2">
                  <p className="border-l border-white/10 pl-3">{s.a}</p>
                  <p className="border-l border-amber/40 pl-3">{s.b}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Section>
  )
}

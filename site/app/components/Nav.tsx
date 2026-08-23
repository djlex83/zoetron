import { useEffect, useRef, useState } from 'react'
import { useLang } from '../lib/lang'
import { nav } from '../lib/content'
import { agoDE, type Pulse } from '../lib/live'
import { LiveDot } from './ui'

export default function Nav({ pulse }: { pulse: Pulse }) {
  const { lang, setLang, t } = useLang()
  const [solid, setSolid] = useState(false)
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState<string>('')
  const bar = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let frame = 0
    const onScroll = () => {
      if (frame) return
      frame = requestAnimationFrame(() => {
        frame = 0
        setSolid(window.scrollY > 40)
        const doc = document.documentElement
        const p = doc.scrollTop / Math.max(1, doc.scrollHeight - doc.clientHeight)
        if (bar.current) bar.current.style.transform = `scaleX(${p})`
      })
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => { window.removeEventListener('scroll', onScroll); cancelAnimationFrame(frame) }
  }, [])

  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        const seen = entries.filter((e) => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]
        if (seen) setActive(seen.target.id)
      },
      { rootMargin: '-45% 0px -50% 0px', threshold: [0, 0.25, 0.6] },
    )
    nav.forEach((n) => {
      const el = document.getElementById(n.id)
      if (el) obs.observe(el)
    })
    return () => obs.disconnect()
  }, [])

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  const beatLabel = pulse.iso ? agoDE(pulse.iso, lang) : '…'

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-[background,border,backdrop-filter] duration-500 ${
        solid ? 'border-b border-white/8 bg-void/72 backdrop-blur-xl' : 'border-b border-transparent'
      }`}
    >
      <div className="mx-auto flex h-[4.5rem] w-full max-w-6xl items-center justify-between gap-4 px-5 sm:h-20 sm:px-8">
        <a href="#top" className="group flex items-center gap-2.5">
          <span className="text-lg leading-none">🫀</span>
          <span className="display text-[1.6rem] tracking-tight text-ink">Zoetron</span>
        </a>

        <nav className="hidden items-center gap-1 lg:flex">
          {nav.map((n) => (
            <a
              key={n.id}
              href={`#${n.id}`}
              className={`rounded-full px-4 py-2.5 text-[0.98rem] transition-colors duration-300 ${
                active === n.id ? 'bg-white/6 text-ink' : 'text-ink-dim hover:text-ink'
              }`}
            >
              {t(n.label)}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <a
            href="#gehirn"
            className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/4 px-3 py-1.5 text-[0.8rem] text-ink-dim transition-colors hover:border-pulse/40 hover:text-ink sm:flex"
            title={lang === 'de' ? 'letzter Herzschlag' : 'last heartbeat'}
          >
            <LiveDot />
            <span className="font-mono">{beatLabel}</span>
          </a>

          <div className="flex overflow-hidden rounded-full border border-white/10 text-[0.78rem]">
            {(['de', 'en'] as const).map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={`px-2.5 py-1.5 font-mono uppercase transition-colors ${
                  lang === l ? 'bg-amber/90 text-void' : 'text-ink-faint hover:text-ink'
                }`}
                aria-pressed={lang === l}
              >
                {l}
              </button>
            ))}
          </div>

          <a
            href="https://github.com/djlex83/zoetron"
            target="_blank"
            rel="noreferrer"
            className="hidden rounded-full bg-ink px-5 py-2.5 text-[0.95rem] font-medium text-void transition-transform duration-300 hover:-translate-y-0.5 md:block"
          >
            GitHub
          </a>

          <button
            className="lg:hidden"
            onClick={() => setOpen((o) => !o)}
            aria-label={open ? 'Menü schließen' : 'Menü öffnen'}
            aria-expanded={open}
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-full border border-white/12">
              <span className="relative block h-2.5 w-4">
                <span className={`absolute inset-x-0 top-0 h-px bg-ink transition-transform duration-300 ${open ? 'translate-y-[5px] rotate-45' : ''}`} />
                <span className={`absolute inset-x-0 bottom-0 h-px bg-ink transition-transform duration-300 ${open ? '-translate-y-[5px] -rotate-45' : ''}`} />
              </span>
            </span>
          </button>
        </div>
      </div>

      <div ref={bar} className="h-px origin-left scale-x-0 bg-gradient-to-r from-amber via-pulse to-synapse" />

      {open && (
        <div className="fixed inset-x-0 top-[4.5rem] bottom-0 z-40 bg-void/96 px-5 pt-6 backdrop-blur-2xl lg:hidden">
          <nav className="flex flex-col">
            {nav.map((n, i) => (
              <a
                key={n.id}
                href={`#${n.id}`}
                onClick={() => setOpen(false)}
                className="display border-b border-white/6 py-5 text-3xl text-ink"
                style={{ animation: `menu-in .5s var(--ease-out-expo) both`, animationDelay: `${i * 45}ms` }}
              >
                {t(n.label)}
              </a>
            ))}
          </nav>
          <a
            href="./brain.html"
            className="mt-8 block rounded-full bg-amber px-5 py-3.5 text-center font-medium text-void"
          >
            {lang === 'de' ? '3D-Gehirn öffnen' : 'Open the 3D brain'}
          </a>
        </div>
      )}
    </header>
  )
}

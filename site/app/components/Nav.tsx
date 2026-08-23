import { useEffect, useRef, useState } from 'react'
import { useLang } from '../lib/lang'
import { nav } from '../lib/content'
import { agoDE, type Pulse } from '../lib/live'
import { LiveDot } from './ui'

/** entrance delays alternate scale / soft down the row */
const delay = (i: number) => `${(0.16 + i * 0.12).toFixed(2)}s`

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
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    const wide = window.matchMedia('(min-width: 1280px)')
    const onWide = () => { if (wide.matches) setOpen(false) }
    window.addEventListener('keydown', onKey)
    wide.addEventListener('change', onWide)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
      wide.removeEventListener('change', onWide)
    }
  }, [open])

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-[background,border,backdrop-filter] duration-500 ${
        solid ? 'border-b border-white/8 bg-void/72 backdrop-blur-xl' : 'border-b border-transparent'
      }`}
    >
      <div
        className="mx-auto flex w-full max-w-[1600px] items-center justify-between gap-4"
        style={{ padding: 'var(--header-y) var(--header-x) 10px' }}
      >
        <a
          href="#top"
          className="appear appear--scale flex shrink-0 items-center gap-2.5"
          style={{ '--d': '0.08s' } as React.CSSProperties}
          aria-label="Zoetron"
        >
          <span style={{ fontSize: 'var(--logo-mark)' }} className="leading-none">🫀</span>
          <span className="display tracking-tight text-ink" style={{ fontSize: 'calc(var(--logo-size) * 1.55)' }}>
            Zoetron
          </span>
        </a>

        <nav className="hidden items-center gap-1.5 xl:flex" aria-label="Primary">
          {nav.map((n, i) => (
            <a
              key={n.id}
              href={`#${n.id}`}
              className="pill appear appear--scale"
              data-active={active === n.id ? '1' : '0'}
              style={{ '--d': delay(i) } as React.CSSProperties}
            >
              <span>{t(n.label)}</span>
            </a>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-2.5">
          <a
            href="#gehirn"
            className="appear appear--soft hidden items-center gap-2 rounded-[7px] border border-white/12 bg-white/4 px-3 text-[0.72rem] text-ink-dim transition-colors hover:border-pulse/40 hover:text-ink sm:flex"
            style={{ height: 'var(--nav-h)', '--d': '0.9s' } as React.CSSProperties}
            title={lang === 'de' ? 'letzter Herzschlag' : 'last heartbeat'}
          >
            <LiveDot />
            <span className="font-mono">{pulse.iso ? agoDE(pulse.iso, lang) : '…'}</span>
          </a>

          <div
            className="appear appear--soft flex overflow-hidden rounded-[7px] border border-white/12 text-[0.7rem]"
            style={{ '--d': '1s' } as React.CSSProperties}
          >
            {(['de', 'en'] as const).map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={`px-2.5 font-mono uppercase transition-colors ${
                  lang === l ? 'bg-amber/90 text-void' : 'text-ink-faint hover:text-ink'
                }`}
                style={{ height: 'var(--nav-h)' }}
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
            className="btn btn-solid appear appear--scale hidden md:inline-flex"
            style={{ '--d': '1.06s' } as React.CSSProperties}
          >
            GitHub
          </a>

          <button
            className="appear appear--scale grid h-[42px] w-[42px] place-items-center rounded-md border border-white/16 bg-[rgba(8,8,8,0.55)] transition-colors hover:border-white/32 hover:bg-white/5 xl:hidden"
            style={{ '--d': '0.34s' } as React.CSSProperties}
            onClick={() => setOpen((o) => !o)}
            aria-label={open ? (lang === 'de' ? 'Menü schließen' : 'Close menu') : (lang === 'de' ? 'Menü öffnen' : 'Open menu')}
            aria-controls="site-nav"
            aria-expanded={open}
          >
            <span className="relative block h-[11px] w-4">
              <span className={`absolute inset-x-0 top-0 h-[1.5px] rounded-sm bg-ink transition-transform duration-250 ${open ? 'translate-y-[5px] rotate-45' : ''}`} />
              <span className={`absolute inset-x-0 top-[5px] h-[1.5px] rounded-sm bg-ink transition-opacity duration-200 ${open ? 'opacity-0' : ''}`} />
              <span className={`absolute inset-x-0 bottom-0 h-[1.5px] rounded-sm bg-ink transition-transform duration-250 ${open ? '-translate-y-[5px] -rotate-45' : ''}`} />
            </span>
          </button>
        </div>
      </div>

      <div ref={bar} className="h-px origin-left scale-x-0 bg-gradient-to-r from-amber via-pulse to-synapse" />

      {/* full-screen menu below the pill breakpoint */}
      <div
        className={`fixed inset-0 z-40 bg-[rgba(6,7,10,0.72)] transition-[opacity,backdrop-filter] duration-300 xl:hidden ${
          open ? 'visible opacity-100 backdrop-blur-2xl' : 'invisible opacity-0'
        }`}
        onClick={() => setOpen(false)}
      />
      <nav
        id="site-nav"
        aria-label="Primary"
        className={`fixed inset-0 z-45 flex-col items-stretch justify-center gap-3 px-5 transition-opacity duration-300 xl:hidden ${
          open ? 'flex opacity-100' : 'hidden opacity-0'
        }`}
        style={{ paddingTop: 'max(96px, calc(env(safe-area-inset-top) + 88px))', paddingBottom: '32px' }}
      >
        {nav.map((n) => (
          <a
            key={n.id}
            href={`#${n.id}`}
            onClick={() => setOpen(false)}
            className="pill w-full justify-center"
            style={{ height: '56px', fontSize: '19px', borderRadius: '10px' }}
          >
            <span>{t(n.label)}</span>
          </a>
        ))}
        <a href="#gehirn" onClick={() => setOpen(false)} className="btn btn-solid mt-2 w-full" style={{ height: '52px' }}>
          {lang === 'de' ? '3D-Gehirn öffnen' : 'Open the 3D brain'}
        </a>
      </nav>
    </header>
  )
}

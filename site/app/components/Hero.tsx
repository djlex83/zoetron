import { useEffect, useRef, useState } from 'react'
import { hero } from '../lib/content'
import { useLang } from '../lib/lang'
import { gsap, reduced, useGsap } from '../lib/anim'
import { agoDE, type Beat, type Leaderboard, type Pulse, type Seed } from '../lib/live'
import BrainCanvas from './BrainCanvas'

/** Heavy 3D canvas: never boot it on a data-saver or for a still-motion visitor. */
function saverOrStill() {
  const conn = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection
  return Boolean(conn?.saveData) || reduced()
}

const de = (n: number) => n.toLocaleString('de-DE')

function StatNeurons() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="6" cy="7" r="2.4" fill="#e8e8e8" />
      <circle cx="17.4" cy="5.6" r="1.7" fill="#9a9a9a" />
      <circle cx="12.6" cy="13.4" r="2.9" fill="#e8e8e8" />
      <circle cx="5.2" cy="17.6" r="1.9" fill="#9a9a9a" />
      <circle cx="18.6" cy="17.2" r="1.6" fill="#e8e8e8" />
      <path d="M6 7l6.6 6.4M17.4 5.6l-4.8 7.8M12.6 13.4l-7.4 4.2M12.6 13.4l6 3.8"
        stroke="#6b7689" strokeWidth="0.9" />
    </svg>
  )
}

function StatSynapses() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M3.4 18.6C7.2 18.6 8.6 5.4 12 5.4s4.8 13.2 8.6 13.2"
        stroke="#e8e8e8" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="12" cy="5.4" r="2" fill="#e8e8e8" />
      <circle cx="3.4" cy="18.6" r="1.6" fill="#9a9a9a" />
      <circle cx="20.6" cy="18.6" r="1.6" fill="#9a9a9a" />
    </svg>
  )
}

function StatBeats() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M2.5 12.4h4.2l1.7-4.6 3 9.4 2.3-6.2 1.4 3.1h6.4"
        stroke="#e8e8e8" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default function Hero({
  pulse, board, beat, seed,
}: { pulse: Pulse; board: Leaderboard | null; beat: Beat | null; seed: Seed | null }) {
  const { lang, t } = useLang()
  const root = useRef<HTMLDivElement>(null)
  const media = useRef<HTMLDivElement>(null)
  const copy = useRef<HTMLDivElement>(null)
  const [live, setLive] = useState(false)

  useEffect(() => {
    if (saverOrStill()) return
    // A media query, not innerWidth: the viewport can still measure 0 while the
    // effect runs (background tab, prerender). A plain timer, not
    // requestIdleCallback, because idle callbacks never fire in a hidden tab.
    const wide = window.matchMedia('(min-width: 380px)')
    let timer = 0
    const evaluate = () => {
      if (!wide.matches) return
      wide.removeEventListener('change', evaluate)
      timer = window.setTimeout(() => setLive(true), window.innerWidth < 700 ? 1500 : 700)
    }
    evaluate()
    wide.addEventListener('change', evaluate)
    return () => { wide.removeEventListener('change', evaluate); clearTimeout(timer) }
  }, [])

  // the scroll-driven transform stays with GSAP; the entrance is pure CSS
  useGsap(({ self }) => {
    if (reduced()) return
    gsap.to(media.current, {
      scale: 1.3, yPercent: 9, filter: 'blur(9px)', opacity: 0,
      ease: 'none',
      scrollTrigger: { trigger: self, start: 'top top', end: 'bottom top', scrub: 0.6 },
    })
    gsap.to(copy.current, {
      yPercent: -22, opacity: 0, ease: 'none',
      scrollTrigger: { trigger: self, start: 'top top', end: '76% top', scrub: 0.6 },
    })
  }, root, [])

  const stats = [
    {
      icon: <StatNeurons />,
      value: board?.neurons ?? seed?.memory.neurons ?? null,
      label: lang === 'de' ? 'Neuronen im Gedächtnis' : 'neurons in memory',
      d: '1.12s',
    },
    {
      icon: <StatSynapses />,
      value: board?.synapses ?? seed?.memory.synapses ?? null,
      label: lang === 'de' ? 'Synapsen nach Bedeutung' : 'synapses by meaning',
      d: '1.28s',
    },
    {
      icon: <StatBeats />,
      value: beat?.per24h || seed?.beats.per24h || null,
      label: lang === 'de' ? 'Herzschläge in 24 Stunden' : 'heartbeats in 24 hours',
      d: '1.44s',
    },
  ]

  return (
    <div id="top" ref={root} className="relative isolate flex min-h-[100svh] flex-col overflow-hidden">
      {/* --- live organ, used as scenery --- */}
      <div ref={media} className="absolute inset-0 -z-10 origin-center will-change-transform lg:left-[16%]">
        <div
          className="absolute inset-0"
          style={{ background: 'radial-gradient(58% 48% at 50% 42%, #16203a 0%, #0a0e18 46%, #06070a 78%)' }}
        />
        {live ? (
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.78]"
            style={{
              maskImage: 'radial-gradient(74% 64% at 50% 44%, #000 34%, transparent 84%)',
              WebkitMaskImage: 'radial-gradient(74% 64% at 50% 44%, #000 34%, transparent 84%)',
            }}
          >
            <BrainCanvas mode="ambient" />
          </div>
        ) : (
          <div
            className="absolute inset-0 opacity-70"
            style={{
              backgroundImage:
                'radial-gradient(circle at 34% 44%, rgb(127 208 255 / 0.18) 0 1.5px, transparent 2px), radial-gradient(circle at 66% 52%, rgb(245 165 36 / 0.16) 0 1.5px, transparent 2px)',
              backgroundSize: '54px 54px, 78px 78px',
              animation: 'drift 18s ease-in-out infinite alternate',
            }}
          />
        )}
        <div className="vignette absolute inset-0" />
        <div className="absolute inset-x-0 bottom-0 h-56 bg-gradient-to-b from-transparent to-void" />
      </div>
      {/* keeps the headline readable wherever the brain drifts */}
      <div className="pointer-events-none absolute inset-y-0 left-0 -z-10 w-[56%] bg-gradient-to-r from-void via-void/60 to-transparent" />

      {/* --- copy, anchored to the bottom of the first screen --- */}
      <div className="flex min-h-0 flex-1 items-end">
        <div
          ref={copy}
          className="mx-auto w-full max-w-[1600px]"
          style={{ padding: `112px var(--header-x) var(--hero-gap)` }}
        >
          <div style={{ maxWidth: 'var(--copy-max)' }}>
            <span
              className="badge-pill appear appear--pop"
              style={{ '--d': '0.22s' } as React.CSSProperties}
            >
              <span className="relative flex h-2 w-2">
                <span className="beat absolute inline-flex h-full w-full rounded-full bg-pulse opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-pulse" />
              </span>
              {t(hero.eyebrow)}
            </span>

            <h1
              className="display mt-6 text-ink"
              style={{ fontSize: 'var(--h1-size)', lineHeight: 1.0 }}
            >
              <span className="headline-line">
                <span
                  className="appear appear--mask block text-ink-dim"
                  style={{ '--d': '0.42s' } as React.CSSProperties}
                >
                  {t(hero.title1)}
                </span>
              </span>
              <span className="headline-line">
                <span
                  className="appear appear--mask block bg-gradient-to-br from-white via-amber-soft to-amber-deep bg-clip-text text-transparent"
                  style={{ '--d': '0.62s' } as React.CSSProperties}
                >
                  {t(hero.title2)}
                </span>
              </span>
            </h1>

            <p
              className="appear appear--soft mt-5 text-ink-dim"
              style={{
                '--d': '0.82s',
                animationDuration: '1.25s',
                maxWidth: 'var(--lede-max)',
                fontSize: 'var(--lede-size)',
                lineHeight: 1.55,
                letterSpacing: '-0.015em',
              } as React.CSSProperties}
            >
              {t(hero.sub)}
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-2.5">
              <a
                href="#gehirn"
                className="btn btn-hero btn-solid appear appear--btn"
                style={{ '--d': '0.96s' } as React.CSSProperties}
              >
                {t(hero.ctaBrain)}
              </a>
              <a
                href="#takt"
                className="btn btn-hero btn-ghost appear appear--side"
                style={{ '--d': '1.1s' } as React.CSSProperties}
              >
                {t(hero.ctaCadence)} ↓
              </a>
            </div>

            <p
              className="appear appear--soft mt-6 max-w-md font-mono text-[0.7rem] leading-relaxed text-ink-faint"
              style={{ '--d': '1.2s' } as React.CSSProperties}
            >
              {t(hero.liveNote)}
              {pulse.iso && ` · ${lang === 'de' ? 'letzter Schlag' : 'last beat'} ${agoDE(pulse.iso, lang)}`}
            </p>
          </div>
        </div>
      </div>

      {/* --- three live numbers close the first screen --- */}
      <div
        className="mx-auto flex w-full max-w-[1600px] flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6"
        style={{
          padding: `0 var(--stats-x) var(--stats-y)`,
          paddingBottom: 'max(var(--stats-y), env(safe-area-inset-bottom))',
        }}
      >
        {stats.map((s) => (
          <span
            key={s.label}
            className="appear appear--stat inline-flex items-center gap-3.5 text-stat"
            style={{ '--d': s.d, fontSize: 'var(--stat-size)', letterSpacing: '-0.015em' } as React.CSSProperties}
          >
            {s.icon}
            <span className="whitespace-nowrap">
              <span className="font-mono text-ink">{s.value ? de(s.value) : '—'}</span>{' '}
              <span className="text-ink-dim">{s.label}</span>
            </span>
          </span>
        ))}
      </div>
    </div>
  )
}

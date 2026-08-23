import { useEffect, useRef, useState } from 'react'
import { hero } from '../lib/content'
import { useLang } from '../lib/lang'
import { gsap, reduced, useGsap } from '../lib/anim'
import { agoDE, type Pulse } from '../lib/live'
import BrainCanvas from './BrainCanvas'
import { LiveDot } from './ui'

/** Heavy 3D canvas: never boot it on a data-saver or a phone-sized screen. */
function saverOrStill() {
  const conn = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection
  return Boolean(conn?.saveData) || reduced()
}

export default function Hero({ pulse }: { pulse: Pulse }) {
  const { lang, t } = useLang()
  const root = useRef<HTMLDivElement>(null)
  const media = useRef<HTMLDivElement>(null)
  const copy = useRef<HTMLDivElement>(null)
  const [live, setLive] = useState(false)

  useEffect(() => {
    if (saverOrStill()) return
    // A media query, not innerWidth: the viewport can still measure 0 while the
    // effect runs (background tab, prerender). The listener boots the brain as
    // soon as there really is room for it — and a plain timer, not
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

  useGsap(({ self }) => {
    if (reduced()) {
      gsap.set('[data-line] > span, [data-fade]', { opacity: 1, y: 0, yPercent: 0 })
      gsap.set(media.current, { opacity: 1, scale: 1 })
      return
    }

    const intro = gsap.timeline({ defaults: { ease: 'expo.out' } })
    intro
      .from('[data-line] > span', { yPercent: 118, duration: 1.5, stagger: 0.12 })
      .from('[data-fade]', { opacity: 0, y: 22, duration: 1.1, stagger: 0.09 }, 0.35)
      .fromTo(media.current, { opacity: 0, scale: 1.14 }, { opacity: 1, scale: 1, duration: 2.4 }, 0)

    // the scroll-driven transform: the brain swells and dissolves, the words lift
    gsap.to(media.current, {
      scale: 1.32, yPercent: 9, filter: 'blur(9px)', opacity: 0,
      ease: 'none',
      scrollTrigger: { trigger: self, start: 'top top', end: 'bottom top', scrub: 0.6 },
    })
    gsap.to(copy.current, {
      yPercent: -26, opacity: 0, ease: 'none',
      scrollTrigger: { trigger: self, start: 'top top', end: '72% top', scrub: 0.6 },
    })
  }, root)

  return (
    <div id="top" ref={root} className="relative isolate min-h-[100svh] overflow-hidden">
      {/* --- live organ, used as scenery --- */}
      <div ref={media} className="absolute inset-0 -z-10 origin-center will-change-transform">
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(58% 48% at 50% 42%, #16203a 0%, #0a0e18 46%, #06070a 78%)',
          }}
        />
        {live ? (
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.78] lg:left-[16%]"
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
        {/* keeps the headline readable wherever the brain happens to drift */}
        <div className="absolute inset-y-0 left-0 w-[70%] bg-gradient-to-r from-void via-void/72 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-56 bg-gradient-to-b from-transparent to-void" />
      </div>

      <div className="relative mx-auto flex min-h-[100svh] w-full max-w-6xl flex-col justify-center px-5 pt-28 pb-24 sm:px-8">
        <div ref={copy}>
          <div data-fade className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <LiveDot label={lang === 'de' ? 'lebt gerade' : 'alive right now'} />
            <span className="label">{t(hero.eyebrow)}</span>
          </div>

          <h1 className="mt-7 text-[clamp(3.1rem,11vw,8.8rem)]">
            <span data-line className="block overflow-hidden pb-[0.08em]">
              <span className="display block text-ink-dim">{t(hero.title1)}</span>
            </span>
            <span data-line className="block overflow-hidden pb-[0.08em]">
              <span className="display block bg-gradient-to-br from-white via-amber-soft to-amber-deep bg-clip-text text-transparent">
                {t(hero.title2)}
              </span>
            </span>
          </h1>

          <p data-fade className="mt-9 max-w-2xl text-[1.18rem] leading-relaxed text-ink-dim sm:text-[1.32rem]">
            {t(hero.sub)}
          </p>

          <div data-fade className="mt-10 flex flex-wrap items-center gap-3">
            <a
              href="#gehirn"
              className="group relative overflow-hidden rounded-full bg-amber px-8 py-4 text-[1.02rem] font-semibold text-void transition-transform duration-300 hover:-translate-y-0.5"
            >
              <span className="relative z-10">{t(hero.ctaBrain)}</span>
              <span className="absolute inset-0 -translate-x-full bg-white/35 transition-transform duration-700 group-hover:translate-x-full" />
            </a>
            <a
              href="#takt"
              className="rounded-full border border-white/14 px-8 py-4 text-[1.02rem] text-ink transition-colors duration-300 hover:border-white/35 hover:bg-white/5"
            >
              {t(hero.ctaCadence)} ↓
            </a>
          </div>

          <p data-fade className="mt-8 max-w-md font-mono text-[0.76rem] leading-relaxed text-ink-faint">
            {t(hero.liveNote)}
            {pulse.iso && ` · ${lang === 'de' ? 'letzter Schlag' : 'last beat'} ${agoDE(pulse.iso, lang)}`}
          </p>
        </div>
      </div>

      <div className="pointer-events-none absolute bottom-6 left-1/2 z-10 -translate-x-1/2 sm:bottom-8">
        <div className="flex flex-col items-center gap-2">
          <span className="label text-[0.7rem]">{t(hero.scroll)}</span>
          <span className="relative block h-10 w-px overflow-hidden bg-white/12">
            <span className="absolute inset-x-0 top-0 h-4 animate-[drift_1.8s_ease-in-out_infinite_alternate] bg-amber" />
          </span>
        </div>
      </div>
    </div>
  )
}

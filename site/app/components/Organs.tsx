import { useRef } from 'react'
import { organs, phases, sections } from '../lib/content'
import { useLang } from '../lib/lang'
import { gsap, ScrollTrigger, reduced, useGsap } from '../lib/anim'
import { SectionHead } from './ui'
import { mmss, timeToPhase, useCycle } from '../lib/pulse'
import type { Pulse } from '../lib/live'

const accents: Record<string, { dot: string; glow: string; text: string }> = {
  pulse: { dot: 'bg-pulse', glow: 'rgb(255 77 77 / 0.16)', text: 'text-pulse' },
  amber: { dot: 'bg-amber', glow: 'rgb(245 165 36 / 0.16)', text: 'text-amber' },
  synapse: { dot: 'bg-synapse', glow: 'rgb(127 208 255 / 0.16)', text: 'text-synapse' },
  moss: { dot: 'bg-moss', glow: 'rgb(74 222 128 / 0.14)', text: 'text-moss' },
  ink: { dot: 'bg-ink-dim', glow: 'rgb(255 255 255 / 0.10)', text: 'text-ink-dim' },
}

export default function Organs({ pulse }: { pulse: Pulse }) {
  const { lang, t } = useLang()
  const cycle = useCycle(pulse.iso)
  const root = useRef<HTMLDivElement>(null)
  const track = useRef<HTMLDivElement>(null)

  useGsap(({ self }) => {
    const el = track.current
    if (!el || reduced()) return

    const mm = gsap.matchMedia()

    // desktop: the section pins and the deck slides sideways under the pointer
    mm.add('(min-width: 1024px)', () => {
      const distance = () => Math.max(0, el.scrollWidth - window.innerWidth)
      const tween = gsap.to(el, {
        x: () => -distance(),
        ease: 'none',
        scrollTrigger: {
          trigger: self,
          start: 'top top',
          end: () => '+=' + distance(),
          pin: true,
          scrub: 0.55,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      })

      // cards breathe as they cross the middle of the screen
      gsap.utils.toArray<HTMLElement>('[data-organ]', el).forEach((card) => {
        gsap.fromTo(
          card,
          { rotateY: 5, scale: 0.965 },
          {
            rotateY: -5, scale: 1, ease: 'none',
            scrollTrigger: {
              trigger: card,
              containerAnimation: tween,
              start: 'left right',
              end: 'right left',
              scrub: true,
            },
          },
        )
      })
      return () => tween.kill()
    })

    // touch: native momentum + snap, no pinning (pins fight the scroll)
    mm.add('(max-width: 1023px)', () => {
      const cards = gsap.utils.toArray<HTMLElement>('[data-organ]', el)
      gsap.set(cards, { opacity: 1, y: 0 })
      ScrollTrigger.refresh()
    })

    return () => mm.revert()
  }, root, [])

  return (
    <section id="organe" ref={root} className="relative scroll-mt-24 overflow-hidden py-24 lg:h-[100svh] lg:py-0">
      <div className="flex h-full flex-col justify-center">
        <div className="mx-auto w-full max-w-6xl px-5 sm:px-8 lg:pt-28">
          <SectionHead label={sections.organe.label} head={sections.organe.head} sub={sections.organe.sub} />
        </div>

        <div
          ref={track}
          className="mt-12 flex gap-4 px-5 sm:gap-5 sm:px-8 lg:mt-14 lg:w-max lg:px-[max(1.25rem,calc((100vw-72rem)/2))] max-lg:snap-x max-lg:snap-mandatory max-lg:overflow-x-auto max-lg:pb-6"
          style={{ perspective: '1400px', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none' }}
        >
          {organs.map((o, i) => {
            const a = accents[o.accent] ?? accents.ink!
            const phaseIndex = o.phase ? phases.findIndex((p) => p.name === o.phase) : -1
            const live = cycle.known && phaseIndex >= 0 && phaseIndex === cycle.index
            return (
              <article
                key={o.name}
                data-organ
                data-reveal
                className={`glass group relative flex w-[80vw] shrink-0 snap-center flex-col justify-between rounded-3xl p-7 transition-colors duration-500 hover:border-white/20 sm:w-[22rem] sm:p-8 lg:h-[25rem] lg:w-[24rem] ${
                  live ? 'border-amber/45 shadow-[0_0_0_1px_rgba(245,165,36,0.25)]' : ''
                }`}
                style={{ transformStyle: 'preserve-3d' }}
              >
                <div
                  className={`pointer-events-none absolute inset-0 rounded-3xl transition-opacity duration-700 group-hover:opacity-100 ${live ? 'opacity-100' : 'opacity-0'}`}
                  style={{ background: `radial-gradient(70% 55% at 30% 0%, ${a.glow}, transparent 70%)` }}
                />
                <div className="relative">
                  <div className="flex items-start justify-between gap-3">
                    <span className={`text-3xl ${live ? 'beat' : ''}`}>{o.icon}</span>
                    <span
                      className={`flex items-center gap-2 rounded-full px-2.5 py-1 font-mono text-[0.71rem] ${
                        live
                          ? 'bg-amber/15 text-amber'
                          : o.always
                            ? 'bg-white/6 text-ink-dim'
                            : 'text-ink-faint'
                      }`}
                    >
                      {(live || o.always) && (
                        <span className={`h-1.5 w-1.5 rounded-full ${live ? 'bg-amber beat' : 'bg-moss'}`} />
                      )}
                      {live
                        ? (lang === 'de' ? 'läuft' : 'running')
                        : o.always
                          ? (lang === 'de' ? 'immer an' : 'always on')
                          : phaseIndex >= 0 && cycle.known
                            ? (lang === 'de' ? `in ${mmss(timeToPhase(cycle, phaseIndex))}` : `in ${mmss(timeToPhase(cycle, phaseIndex))}`)
                            : String(i + 1).padStart(2, '0')}
                    </span>
                  </div>
                  <h3 className={`mt-7 font-mono text-[1.1rem] tracking-[0.16em] ${a.text}`}>{o.name}</h3>
                  <div className="mt-2 text-[0.95rem] text-ink-faint">{t(o.analog)}</div>
                  <p className="mt-5 text-[0.98rem] leading-relaxed text-ink-dim">{t(o.body)}</p>
                </div>
                <div className="relative mt-6 flex items-center gap-2">
                  <span className={`h-1 w-1 rounded-full ${a.dot}`} />
                  <span className="h-px flex-1 bg-white/8" />
                </div>
              </article>
            )
          })}
        </div>

        <div className="mx-auto mt-4 w-full max-w-6xl px-5 sm:px-8">
          <span className="label text-[0.7rem]">
            {lang === 'de' ? '→ seitwärts scrollen' : '→ scroll sideways'}
          </span>
        </div>
      </div>
    </section>
  )
}

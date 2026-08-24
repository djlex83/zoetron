import { useRef, useState } from 'react'
import { cadenceNote, phases, sections } from '../lib/content'
import { useLang } from '../lib/lang'
import { gsap, reduced, useGsap } from '../lib/anim'
import { Section, SectionHead } from './ui'
import { mmss, useCycle } from '../lib/pulse'
import type { Pulse } from '../lib/live'

const RING = 2 * Math.PI * 54

export default function Cadence({ pulse }: { pulse: Pulse }) {
  const { lang, t } = useLang()
  const root = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(0)
  const cycle = useCycle(pulse.iso)

  useGsap(({ self }) => {

    const rail = self.querySelector<HTMLElement>('[data-rail]')
    const ring = self.querySelector<SVGCircleElement>('[data-ring]')
    const items = gsap.utils.toArray<HTMLElement>('[data-phase]', self)

    if (rail && !reduced()) {
      gsap.fromTo(
        rail,
        { scaleY: 0 },
        {
          scaleY: 1, ease: 'none', transformOrigin: 'top center',
          scrollTrigger: {
            trigger: items[0] ?? self,
            endTrigger: items[items.length - 1] ?? self,
            start: 'top 62%', end: 'bottom 62%', scrub: 0.4,
          },
        },
      )
    }

    if (ring && !reduced()) {
      gsap.fromTo(
        ring,
        { strokeDashoffset: RING },
        {
          strokeDashoffset: 0, ease: 'none',
          scrollTrigger: {
            trigger: items[0] ?? self,
            endTrigger: items[items.length - 1] ?? self,
            start: 'top 62%', end: 'bottom 62%', scrub: 0.4,
          },
        },
      )
    }

    items.forEach((item, i) => {
      gsap.to(item, {
        scrollTrigger: {
          trigger: item,
          start: 'top 62%',
          end: 'bottom 40%',
          onToggle: ({ isActive }) => {
            item.dataset.on = isActive ? '1' : '0'
            if (isActive) setActive(i)
          },
        },
      })
      if (reduced()) return
      gsap.from(item.querySelector('[data-phase-body]'), {
        opacity: 0, y: 24, duration: 0.9, ease: 'expo.out',
        scrollTrigger: { trigger: item, start: 'top 84%', once: true },
      })
    })
  }, root, [])

  const now = phases[active]!

  return (
    <Section id="takt">
      <div ref={root}>
        <SectionHead label={sections.takt.label} head={sections.takt.head} sub={sections.takt.sub} />

        {/* --- why the cadence is what it is --- */}
        <div data-reveal className="panel panel-lg mt-10 p-6 sm:p-7">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="eyebrow-pill">
              <span className="h-1.5 w-1.5 rounded-full bg-amber" />
              {t(cadenceNote.label)}
            </span>
            <span className="font-mono text-[0.72rem] text-ink-faint">
              {lang === 'de' ? 'gemessen am' : 'measured on'} {cadenceNote.since}
            </span>
          </div>

          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {cadenceNote.facts.map((f) => (
              <div key={f.v}>
                <div className="font-mono text-[1.5rem] leading-none text-ink tabular-nums">{f.v}</div>
                <div className="mt-2 text-[0.86rem] leading-snug text-ink-faint">{t(f.l)}</div>
              </div>
            ))}
          </div>

          <p className="mt-6 max-w-4xl border-t border-white/8 pt-5 text-[0.98rem] leading-relaxed text-ink-dim">
            {t(cadenceNote.body)}
          </p>
        </div>

        <div className="mt-16 grid gap-12 lg:mt-20 lg:grid-cols-[20rem_1fr] lg:gap-20">
          {/* --- sticky clock --- */}
          <div className="hidden lg:block">
            <div className="sticky top-32">
              <div className="relative h-[9rem] w-[9rem]">
                <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
                  <circle cx="60" cy="60" r="54" fill="none" stroke="rgb(255 255 255 / 0.08)" strokeWidth="1.5" />
                  <circle
                    data-ring cx="60" cy="60" r="54" fill="none"
                    stroke="url(#cadence)" strokeWidth="1.5" strokeLinecap="round"
                    strokeDasharray={RING} strokeDashoffset={RING}
                  />
                  <defs>
                    <linearGradient id="cadence" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#ff4d4d" />
                      <stop offset="55%" stopColor="#f5a524" />
                      <stop offset="100%" stopColor="#7fd0ff" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl leading-none">{now.icon}</span>
                  <span className="mt-2 font-mono text-[0.78rem] tracking-[0.2em] text-ink-faint">
                    {String(active + 1).padStart(2, '0')}/{String(phases.length).padStart(2, '0')}
                  </span>
                </div>
              </div>

              <div className="mt-8">
                <div className="font-mono text-[0.8rem] tracking-[0.24em] text-amber">{now.name}</div>
                <div className="display mt-2 text-3xl text-ink">{t(now.head)}</div>
                <p className="mt-4 max-w-[17rem] text-[0.92rem] leading-relaxed text-ink-faint">
                  {lang === 'de'
                    ? 'Ein Herzschlag dauert 40 Minuten. Nichts davon wartet auf einen Menschen.'
                    : 'One heartbeat lasts 40 minutes. None of it waits for a human.'}
                </p>

                {cycle.known && (
                  <div className="panel mt-6 px-4 py-4">
                    <span className="eyebrow-pill">
                      <span className="beat h-1.5 w-1.5 rounded-full bg-pulse" />
                      {lang === 'de' ? 'jetzt in Arbeit' : 'working now'}
                    </span>
                    <div className="mt-3 flex items-center gap-2 font-mono text-[0.95rem] text-ink">
                      <span className="h-2 w-2 rounded-full bg-amber beat" />
                      {phases[cycle.index]!.name}
                    </div>
                    <div className="mt-1.5 font-mono text-[0.8rem] text-ink-faint">
                      {lang === 'de' ? 'nächster Schlag in ' : 'next beat in '}{mmss(cycle.toNext)}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* --- the rail --- */}
          <ol className="relative pl-10 sm:pl-14">
            <div className="absolute left-[0.9rem] top-2 bottom-2 w-px bg-white/8 sm:left-[1.4rem]" />
            <div
              data-rail
              className="absolute left-[0.9rem] top-2 bottom-2 w-px origin-top bg-gradient-to-b from-pulse via-amber to-synapse sm:left-[1.4rem]"
              style={{ transform: 'scaleY(0)' }}
            />

            {phases.map((p) => (
              <li
                key={p.name}
                data-phase
                data-on="0"
                data-live={cycle.known && cycle.index === phases.indexOf(p) ? '1' : '0'}
                className="group relative pb-14 last:pb-0 sm:pb-20"
              >
                <span className="absolute -left-10 top-1.5 flex h-[2.1rem] w-[2.1rem] items-center justify-center rounded-full border border-white/12 bg-void text-[1rem] transition-all duration-500 group-data-[on=1]:border-amber group-data-[on=1]:bg-amber/12 group-data-[on=1]:shadow-[0_0_0_5px_rgb(245_165_36/0.08)] group-data-[live=1]:border-pulse group-data-[live=1]:shadow-[0_0_0_6px_rgb(255_77_77/0.12)] sm:-left-14 sm:h-[2.6rem] sm:w-[2.6rem] sm:text-[1.15rem]">
                  {p.icon}
                </span>

                <div data-phase-body>
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <h3 className="font-mono text-[1.15rem] tracking-[0.14em] text-ink transition-colors duration-500 group-data-[on=1]:text-amber">
                      {p.name}
                    </h3>
                    <span className="text-[1rem] text-ink-faint">{t(p.head)}</span>
                    <span className="hidden items-center gap-2 rounded-full bg-pulse/15 px-2.5 py-1 font-mono text-[0.71rem] text-pulse group-data-[live=1]:inline-flex">
                      <span className="h-1.5 w-1.5 rounded-full bg-pulse beat" />
                      {lang === 'de' ? 'läuft gerade' : 'running now'}
                    </span>
                  </div>
                  <p className="mt-4 max-w-2xl text-[1.02rem] leading-relaxed text-ink-dim transition-colors duration-500 group-data-[on=1]:text-ink">
                    {t(p.body)}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </Section>
  )
}

import { useRef, useState } from 'react'
import { sections } from '../lib/content'
import { useLang } from '../lib/lang'
import type { Ideas as IdeasData, Seed } from '../lib/live'
import { LiveDot, Section, SectionHead } from './ui'

type Tab = 'skills' | 'goals' | 'insights'

export default function Ideas({ ideas, seed }: { ideas: IdeasData | null; seed: Seed | null }) {
  const { lang } = useLang()
  const root = useRef<HTMLDivElement>(null)
  const [tab, setTab] = useState<Tab>('skills')

  const tabs: { key: Tab; label: string; note: string }[] = [
    {
      key: 'skills',
      label: lang === 'de' ? 'Fähigkeiten, die es sich wünscht' : 'Abilities it wishes for',
      note: lang === 'de' ? 'wie oft es dieselbe Idee hatte — öfter = dringlicher' : 'how often it had the same idea — more often = more urgent',
    },
    {
      key: 'goals',
      label: lang === 'de' ? 'Selbst gesetzte Ziele' : 'Self-set goals',
      note: lang === 'de' ? 'aus Lücken im eigenen Wissen geboren' : 'born from gaps in its own knowledge',
    },
    {
      key: 'insights',
      label: lang === 'de' ? 'Nächtliche Erkenntnisse' : 'Insights from the night',
      note: lang === 'de' ? 'in der Traumphase destilliert' : 'distilled in the dream phase',
    },
  ]

  const items = (ideas?.[tab] ?? []).slice(0, 12)
  const maxCount = Math.max(1, ...items.map((i) => i.count))
  const report = seed?.report

  return (
    <Section id="ideen" className="border-t border-white/6">
      <div ref={root}>
        <div className="flex flex-wrap items-end justify-between gap-6">
          <SectionHead label={sections.ideen.label} head={sections.ideen.head} sub={sections.ideen.sub} />
          <div data-reveal className="flex items-center gap-3">
            <LiveDot label={ideas?.stand ? `Stand ${ideas.stand}` : 'live'} tone="amber" />
          </div>
        </div>

        <div data-reveal className="mt-12 flex flex-wrap gap-2 lg:mt-16">
          {tabs.map((x) => (
            <button
              key={x.key}
              onClick={() => setTab(x.key)}
              className={`rounded-full border px-4 py-2.5 text-[0.92rem] transition-all duration-300 ${
                tab === x.key
                  ? 'border-amber/60 bg-amber/12 text-amber'
                  : 'border-white/10 text-ink-dim hover:border-white/25 hover:text-ink'
              }`}
            >
              {x.label}
            </button>
          ))}
        </div>

        <p data-reveal className="mt-4 text-[0.85rem] text-ink-faint">
          {tabs.find((x) => x.key === tab)?.note}
        </p>

        <ul className="mt-8 grid gap-3 md:grid-cols-2">
          {items.map((item, i) => (
            <li
              key={`${tab}-${i}`}
              className="glass group relative overflow-hidden rounded-2xl p-5 transition-colors duration-500 hover:border-amber/35"
            >
              <div className="flex items-start gap-4">
                <span className="font-mono text-[0.76rem] text-ink-faint">{String(i + 1).padStart(2, '0')}</span>
                <p className="flex-1 text-[1rem] leading-relaxed text-ink-dim transition-colors duration-500 group-hover:text-ink">
                  {item.text}
                </p>
                {item.count > 1 && (
                  <span className="shrink-0 rounded-full bg-amber/12 px-2.5 py-1 font-mono text-[0.71rem] text-amber">
                    {item.count}×
                  </span>
                )}
              </div>
              {item.count > 1 && (
                <span
                  className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-amber/70 to-transparent"
                  style={{ width: `${(item.count / maxCount) * 100}%` }}
                />
              )}
            </li>
          ))}
          {!ideas &&
            [0, 1, 2, 3, 4, 5].map((i) => (
              <li key={i} className="glass animate-pulse rounded-2xl p-5">
                <div className="h-2 w-full rounded bg-white/7" />
                <div className="mt-3 h-2 w-2/3 rounded bg-white/6" />
              </li>
            ))}
        </ul>

        {report && (
          <div data-reveal className="glass mt-10 overflow-hidden rounded-3xl lg:mt-14">
            <div className="grid gap-px bg-white/6 sm:grid-cols-4">
              {[
                { v: report.runs, l: lang === 'de' ? 'Schwarm-Läufe' : 'swarm runs' },
                { v: report.insights, l: lang === 'de' ? 'neue Einsichten' : 'new insights' },
                { v: report.evolutions, l: lang === 'de' ? 'Evolutionsrunden' : 'evolution rounds' },
                { v: report.executions, l: lang === 'de' ? 'Code-Ausführungen' : 'code executions' },
              ].map((s) => (
                <div key={s.l} className="bg-abyss/80 px-5 py-6">
                  <div className="font-mono text-2xl text-ink tabular-nums">{s.v}</div>
                  <div className="mt-1.5 text-[0.8rem] text-ink-faint">{s.l}</div>
                </div>
              ))}
            </div>
            {report.quote && (
              <blockquote className="px-6 py-7 sm:px-8">
                <div className="label">{lang === 'de' ? 'Zoetron sagt' : 'Zoetron says'}</div>
                <p className="display mt-4 text-[clamp(1.15rem,2.6vw,1.7rem)] leading-snug text-ink">
                  „{report.quote}“
                </p>
                <div className="mt-4 font-mono text-[0.76rem] text-ink-faint">
                  {lang === 'de' ? 'Wochenreport' : 'Weekly report'} {report.slug}
                  {report.topModel && ` · ${lang === 'de' ? 'Top-Modell' : 'top model'}: ${report.topModel}`}
                </div>
              </blockquote>
            )}
          </div>
        )}

        <p data-reveal className="mt-8 max-w-2xl text-[0.88rem] leading-relaxed text-ink-faint">
          {lang === 'de'
            ? 'Gefällt dir eine Idee? Über den Flüster-Kanal springt sie an die Spitze der Warteschlange — dann baut er sie als Nächstes.'
            : 'Like one of these ideas? Through the whisper channel it jumps to the front of the queue — and gets built next.'}
        </p>
      </div>
    </Section>
  )
}

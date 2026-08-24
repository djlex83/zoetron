import { useRef } from 'react'
import { sections } from '../lib/content'
import { useLang } from '../lib/lang'
import { gsap, reduced, useGsap } from '../lib/anim'
import type { MemoryFeed, Seed } from '../lib/live'
import { LiveDot, Section, SectionHead } from './ui'

/** the scale from the organism's own scoring page */
const band = (s: number) =>
  s >= 8 ? 'good' : s >= 5 ? 'mid' : 'weak'

const TONE: Record<string, { bar: string; dot: string; text: string; de: string; en: string }> = {
  good: { bar: '#4ade80', dot: 'bg-moss', text: 'text-moss', de: 'konvergiert', en: 'converged' },
  mid: { bar: '#f5a524', dot: 'bg-amber', text: 'text-amber', de: 'brauchbar', en: 'usable' },
  weak: { bar: '#ff4d4d', dot: 'bg-pulse', text: 'text-pulse', de: 'mangelhaft', en: 'insufficient' },
}

const W = 600
const H = 190

export default function Learning({ memory, seed }: { memory: MemoryFeed | null; seed: Seed | null }) {
  const { lang } = useLang()
  const root = useRef<HTMLDivElement>(null)

  const runs = memory?.scores ?? []
  const total = seed?.learning.swarm.n ?? runs.length
  const best = Math.max(seed?.learning.swarm.best ?? 0, ...runs.map((r) => r.score), 0)
  const avg = runs.length
    ? runs.reduce((a, r) => a + r.score, 0) / runs.length
    : seed?.learning.swarm.schnitt ?? 0

  // trend: the last ten runs against the ten before them
  const tail = runs.slice(-10)
  const prev = runs.slice(-20, -10)
  const mean = (xs: typeof runs) => (xs.length ? xs.reduce((a, r) => a + r.score, 0) / xs.length : 0)
  const delta = tail.length && prev.length ? mean(tail) - mean(prev) : 0

  // a five-run rolling average, the actual "learning curve"
  const rolling = runs.map((_, i) => {
    const from = Math.max(0, i - 4)
    const slice = runs.slice(from, i + 1)
    return slice.reduce((a, r) => a + r.score, 0) / slice.length
  })

  const barW = runs.length ? W / runs.length : W
  const x = (i: number) => i * barW
  const y = (v: number) => H - (v / 10) * H

  useGsap(() => {
    if (reduced()) return
    gsap.utils.toArray<SVGRectElement>('[data-run]', root.current!).forEach((bar, i) => {
      gsap.from(bar, {
        scaleY: 0, transformOrigin: 'bottom', duration: 0.5, ease: 'expo.out',
        delay: Math.min(i, 40) * 0.012,
        scrollTrigger: { trigger: root.current, start: 'top 78%', once: true },
      })
    })
  }, root, [runs.length])

  const fmt = (t: number) =>
    new Date(t).toLocaleString(lang === 'de' ? 'de-DE' : 'en-GB', {
      day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
    })

  return (
    <Section id="lernkurve" className="border-t border-white/6">
      <div ref={root}>
        <div className="flex flex-wrap items-end justify-between gap-6">
          <SectionHead label={sections.lernkurve.label} head={sections.lernkurve.head} sub={sections.lernkurve.sub} />
          <div data-reveal className="flex items-center gap-3">
            <LiveDot label={runs.length ? `${runs.length} ${lang === 'de' ? 'Urteile im Gedächtnis' : 'verdicts in memory'}` : 'live'} tone="amber" />
          </div>
        </div>

        {/* --- numbers --- */}
        <div data-reveal className="mt-12 grid grid-cols-2 gap-px overflow-hidden rounded-[16px] bg-white/6 sm:grid-cols-4 lg:mt-16">
          {[
            { v: total ? String(total) : '—', l: lang === 'de' ? 'bewertete Läufe' : 'scored runs' },
            { v: avg ? avg.toFixed(2).replace('.', ',') : '—', l: lang === 'de' ? 'Ø Score' : 'avg score' },
            { v: best ? String(best) : '—', l: lang === 'de' ? 'Bestwert' : 'best' },
            {
              v: delta ? `${delta > 0 ? '↑' : '↓'} ${Math.abs(delta).toFixed(1).replace('.', ',')}` : '—',
              l: lang === 'de' ? 'Trend, letzte 10' : 'trend, last 10',
              tone: delta > 0 ? 'text-moss' : delta < 0 ? 'text-pulse' : 'text-ink',
            },
          ].map((s) => (
            <div key={s.l} className="bg-abyss/80 px-5 py-6">
              <div className={`font-mono text-[1.9rem] leading-none tabular-nums ${s.tone ?? 'text-ink'}`}>{s.v}</div>
              <div className="mt-2 text-[0.82rem] text-ink-faint">{s.l}</div>
            </div>
          ))}
        </div>

        {/* --- the curve --- */}
        <div data-reveal className="panel panel-lg mt-4 p-5 sm:p-7">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <h3 className="text-[1rem] font-medium text-ink">
              {lang === 'de' ? 'Jedes Urteil des Critics, chronologisch' : 'Every critic verdict, in order'}
            </h3>
            <span className="font-mono text-[0.72rem] text-ink-faint">
              {lang === 'de' ? 'Konvergenz ab 8' : 'convergence from 8'}
            </span>
          </div>

          <div className="relative mt-6 h-[190px] w-full">
            {/* scale */}
            {[10, 8, 5, 0].map((v) => (
              <div key={v} className="pointer-events-none absolute inset-x-0 flex items-center gap-3"
                   style={{ top: `${(1 - v / 10) * 100}%` }}>
                <span className="w-5 shrink-0 text-right font-mono text-[0.62rem] text-ink-faint">{v}</span>
                <span className={`h-px flex-1 ${v === 8 ? 'bg-amber/35' : 'bg-white/7'}`} />
              </div>
            ))}

            <svg
              viewBox={`0 0 ${W} ${H}`}
              preserveAspectRatio="none"
              className="absolute inset-y-0 right-0 h-full"
              style={{ width: 'calc(100% - 2rem)' }}
              role="img"
              aria-label={lang === 'de' ? 'Verlauf der Critic-Scores' : 'Critic score history'}
            >
              {runs.map((r, i) => (
                <rect
                  key={r.at + '-' + i}
                  data-run
                  x={x(i) + barW * 0.12}
                  y={y(r.score)}
                  width={Math.max(barW * 0.76, 0.8)}
                  height={H - y(r.score)}
                  fill={TONE[band(r.score)]!.bar}
                  opacity={0.85}
                >
                  <title>{`${fmt(r.at)} · Score ${r.score}${r.label ? ' · ' + r.label : ''}`}</title>
                </rect>
              ))}

              {rolling.length > 1 && (
                <polyline
                  points={rolling.map((v, i) => `${x(i) + barW / 2},${y(v)}`).join(' ')}
                  fill="none"
                  stroke="#ffffff"
                  strokeOpacity="0.85"
                  strokeWidth="2"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  vectorEffect="non-scaling-stroke"
                />
              )}
            </svg>
          </div>

          <div className="mt-3 flex items-center justify-between pl-8 font-mono text-[0.66rem] text-ink-faint">
            <span>{runs.length ? fmt(runs[0]!.at) : ''}</span>
            <span className="flex items-center gap-2">
              <span className="inline-block h-px w-6 bg-white/80" />
              {lang === 'de' ? 'gleitender Ø über 5 Läufe' : '5-run rolling average'}
            </span>
            <span>{runs.length ? fmt(runs[runs.length - 1]!.at) : ''}</span>
          </div>
        </div>

        {/* --- form of the last runs --- */}
        <div data-reveal className="panel mt-4 p-5 sm:p-7">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <h3 className="text-[1rem] font-medium text-ink">
              {lang === 'de' ? 'Form der letzten Läufe' : 'Form of the last runs'}
            </h3>
            <div className="flex flex-wrap items-center gap-4 font-mono text-[0.68rem] text-ink-faint">
              {(['good', 'mid', 'weak'] as const).map((key) => (
                <span key={key} className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${TONE[key]!.dot}`} />
                  {lang === 'de' ? TONE[key]!.de : TONE[key]!.en}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {runs.slice(-14).map((r, i) => (
              <span
                key={r.at + '-' + i}
                title={`${fmt(r.at)} · ${r.issues || '—'}`}
                className={`flex h-9 w-9 items-center justify-center rounded-[7px] border font-mono text-[0.86rem] ${
                  band(r.score) === 'good'
                    ? 'border-moss/50 bg-moss/12 text-moss'
                    : band(r.score) === 'mid'
                      ? 'border-amber/45 bg-amber/12 text-amber'
                      : 'border-pulse/40 bg-pulse/10 text-pulse'
                }`}
              >
                {r.score}
              </span>
            ))}
            {!runs.length &&
              [0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
                <span key={i} className="h-9 w-9 animate-pulse rounded-[7px] bg-white/7" />
              ))}
          </div>

          <p className="mt-5 text-[0.92rem] leading-relaxed text-ink-faint">
            {lang === 'de'
              ? 'Der Critic bewertet mit Temperatur 0 und kappt gescheiterte Aufgaben hart auf 3. Unter 8 startet die Evolution und züchtet Varianten — die Kurve steigt also nicht, weil die Messlatte sinkt.'
              : 'The critic judges at temperature 0 and hard-caps failed tasks at 3. Below 8, evolution starts breeding variants — so the curve does not rise by lowering the bar.'}
          </p>
        </div>
      </div>
    </Section>
  )
}

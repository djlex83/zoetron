import { useEffect, useState } from 'react'
import { useLang } from '../lib/lang'
import { loadFootball, type Football as Data } from '../lib/football'
import { LiveDot } from './ui'

const W = 640
const H = 220

/** the two references the organism is measured against */
const colourFor = (label: string) =>
  /Buchmacher|bookmaker/i.test(label) ? '#7fd0ff' : /Basislinie|baseline/i.test(label) ? '#9a9a9a' : '#5b6472'

export default function Football() {
  const { lang } = useLang()
  const [data, setData] = useState<Data | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let alive = true
    const pull = () => loadFootball().then((d) => { if (alive) { setData(d); setFailed(false) } })
      .catch(() => { if (alive && !data) setFailed(true) })
    pull()
    const id = window.setInterval(pull, 5 * 60_000)
    return () => { alive = false; clearInterval(id) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (failed) {
    return (
      <div className="panel panel-lg mt-4 p-6 text-[0.95rem] text-ink-faint">
        {lang === 'de'
          ? 'Die Fußball-Auswertung ließ sich gerade nicht laden. '
          : 'The football scoreboard could not be loaded right now. '}
        <a className="text-amber underline" href="./fussball.html">fussball.html</a>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="panel panel-lg mt-4 space-y-3 p-6">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-2.5 animate-pulse rounded bg-white/7" style={{ width: `${88 - i * 13}%` }} />
        ))}
      </div>
    )
  }

  const hits = data.rows.map((r) => r.hit)
  const values = [...hits, ...data.refs.map((r) => r.value)]
  const lo = Math.floor(Math.min(...values) - 1)
  const hi = Math.ceil(Math.max(...values) + 1)
  const y = (v: number) => H - ((v - lo) / Math.max(1, hi - lo)) * H
  const x = (i: number) => (data.rows.length < 2 ? W / 2 : (i / (data.rows.length - 1)) * W)

  const book = data.refs.find((r) => /Buchmacher|bookmaker/i.test(r.label))
  const base = data.refs.find((r) => /Basislinie|baseline/i.test(r.label))
  const best = hits.length ? Math.max(...hits) : null
  const gapBook = book && best !== null ? best - book.value : null
  const gapBase = base && best !== null ? best - base.value : null

  return (
    <>
      {/* --- the honest headline numbers --- */}
      <div className="mt-4 grid grid-cols-2 gap-px overflow-hidden rounded-[16px] bg-white/6 sm:grid-cols-4">
        {[
          { v: String(data.rows.length), l: lang === 'de' ? 'Einreichungen' : 'submissions' },
          { v: best !== null ? `${best.toFixed(2).replace('.', ',')} %` : '—', l: lang === 'de' ? 'bester Treffer' : 'best hit rate' },
          {
            v: gapBook !== null ? `${gapBook >= 0 ? '+' : '−'}${Math.abs(gapBook).toFixed(2).replace('.', ',')} pp` : '—',
            l: lang === 'de' ? 'zum Buchmacher' : 'to the bookmaker',
            tone: gapBook !== null && gapBook >= 0 ? 'text-moss' : 'text-pulse',
          },
          {
            v: gapBase !== null ? `${gapBase >= 0 ? '+' : '−'}${Math.abs(gapBase).toFixed(2).replace('.', ',')} pp` : '—',
            l: lang === 'de' ? 'zur Basislinie' : 'to the baseline',
            tone: gapBase !== null && gapBase > 0.6 ? 'text-moss' : 'text-ink-dim',
          },
        ].map((s) => (
          <div key={s.l} className="bg-abyss/80 px-5 py-6">
            <div className={`font-mono text-[1.7rem] leading-none tabular-nums ${s.tone ?? 'text-ink'}`}>{s.v}</div>
            <div className="mt-2 text-[0.82rem] text-ink-faint">{s.l}</div>
          </div>
        ))}
      </div>

      {/* --- the curve against the references --- */}
      <div className="panel panel-lg mt-4 p-5 sm:p-7">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-[1rem] font-medium text-ink">
            {lang === 'de' ? 'Trefferquote je Einreichung' : 'Hit rate per submission'}
          </h3>
          <div className="flex flex-wrap items-center gap-4 font-mono text-[0.7rem] text-ink-faint">
            {data.refs.map((r) => (
              <span key={r.label} className="flex items-center gap-2">
                <span className="inline-block h-px w-5" style={{ background: colourFor(r.label), opacity: 0.9 }} />
                {r.label} {r.value.toString().replace('.', ',')} %
              </span>
            ))}
          </div>
        </div>

        <div className="relative mt-6 h-[220px] w-full">
          {[hi, Math.round((hi + lo) / 2), lo].map((v) => (
            <div key={v} className="pointer-events-none absolute inset-x-0 flex items-center gap-3" style={{ top: `${(1 - (v - lo) / (hi - lo)) * 100}%` }}>
              <span className="w-9 shrink-0 text-right font-mono text-[0.62rem] text-ink-faint">{v} %</span>
              <span className="h-px flex-1 bg-white/7" />
            </div>
          ))}

          <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="absolute inset-y-0 right-0 h-full"
               style={{ width: 'calc(100% - 3rem)' }} role="img"
               aria-label={lang === 'de' ? 'Trefferquote gegen Buchmacher und Basislinie' : 'Hit rate against bookmaker and baseline'}>
            {data.refs.map((r) => (
              <line key={r.label} x1="0" y1={y(r.value)} x2={W} y2={y(r.value)}
                    stroke={colourFor(r.label)} strokeWidth="1.5" strokeDasharray="6 5"
                    strokeOpacity="0.8" vectorEffect="non-scaling-stroke" />
            ))}
            {data.rows.length > 1 && (
              <polyline points={data.rows.map((r, i) => `${x(i)},${y(r.hit)}`).join(' ')}
                        fill="none" stroke="#f5a524" strokeWidth="2.5"
                        strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
            )}
            {data.rows.map((r, i) => (
              <circle key={r.n} cx={x(i)} cy={y(r.hit)} r="5" fill="#f5a524" vectorEffect="non-scaling-stroke">
                <title>{`#${r.n} ${r.name} · ${r.hit} % · Log-Loss ${r.logloss}`}</title>
              </circle>
            ))}
          </svg>
        </div>
      </div>

      {/* --- every submission, as written by the organism --- */}
      <div className="panel mt-4 overflow-x-auto">
        <table className="w-full border-collapse text-left text-[0.92rem]">
          <thead>
            <tr>
              {['#', lang === 'de' ? 'Einreichung' : 'Submission', lang === 'de' ? 'Treffer' : 'Hit rate', 'Log-Loss',
                lang === 'de' ? 'zur Basislinie' : 'to baseline'].map((h) => (
                <th key={h} className="whitespace-nowrap border-b border-white/10 px-4 py-3 font-mono text-[0.7rem] uppercase tracking-[0.1em] text-ink-faint">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.rows.map((r) => (
              <tr key={r.n}>
                <td className="border-b border-white/6 px-4 py-3 font-mono text-ink-faint">{r.n}</td>
                <td className="border-b border-white/6 px-4 py-3 font-mono text-ink">{r.name}</td>
                <td className="whitespace-nowrap border-b border-white/6 px-4 py-3 font-mono text-amber">{r.hit.toString().replace('.', ',')} %</td>
                <td className="border-b border-white/6 px-4 py-3 font-mono text-ink-dim">{r.logloss}</td>
                <td className="whitespace-nowrap border-b border-white/6 px-4 py-3 font-mono text-ink-dim">{r.delta}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2">
        <LiveDot label={data.stand ? `Stand ${data.stand}` : 'live'} tone="amber" />
        <a href="./fussball.html" target="_blank" rel="noreferrer"
           className="font-mono text-[0.74rem] text-ink-faint underline decoration-white/20 underline-offset-4 transition-colors hover:text-amber">
          docs/fussball.html ↗
        </a>
      </div>

      {data.footnote && (
        <p className="mt-4 max-w-3xl text-[0.92rem] leading-relaxed text-ink-faint">{data.footnote}</p>
      )}
    </>
  )
}

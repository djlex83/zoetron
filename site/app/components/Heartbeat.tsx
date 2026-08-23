import { useLang } from '../lib/lang'
import { phases } from '../lib/content'
import { useCycle, mmss } from '../lib/pulse'
import { agoDE, type Pulse } from '../lib/live'

/**
 * The heart, made visible: a running ECG, the organ that is working this very
 * second and the countdown to the next beat — all derived from the real
 * timestamp of the last heartbeat commit.
 */
export default function Heartbeat({ pulse }: { pulse: Pulse }) {
  const { lang } = useLang()
  const cycle = useCycle(pulse.iso)
  const phase = phases[cycle.index]!

  return (
    <section className="relative overflow-hidden border-y border-white/8 bg-abyss/70">
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: 'radial-gradient(60% 120% at 50% 0%, rgb(255 77 77 / 0.10), transparent 70%)' }}
      />

      <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-8 px-5 py-12 sm:px-8 lg:flex-row lg:items-center lg:gap-12 lg:py-16">
        {/* the heart itself */}
        <div className="flex items-center gap-5">
          <span className="beat text-[3.4rem] leading-none drop-shadow-[0_0_28px_rgba(255,77,77,0.45)] sm:text-[4.5rem]">
            🫀
          </span>
          <div>
            <div className="label text-pulse/90">{lang === 'de' ? 'Herzschlag' : 'heartbeat'}</div>
            <div className="display mt-1 text-[2.4rem] leading-none text-ink sm:text-[3rem]">
              {lang === 'de' ? 'alle 5 Min' : 'every 5 min'}
            </div>
            <div className="mt-2 font-mono text-[0.88rem] text-ink-faint">
              {pulse.iso
                ? `${lang === 'de' ? 'letzter Schlag' : 'last beat'} ${agoDE(pulse.iso, lang)}`
                : lang === 'de' ? 'warte auf das Logbuch …' : 'waiting for the logbook …'}
            </div>
          </div>
        </div>

        {/* the ECG */}
        <div className="relative min-w-0 flex-1">
          <div className="relative h-24 overflow-hidden rounded-2xl border border-white/8 bg-void/60 sm:h-28">
            <svg className="absolute inset-0 h-full w-full" viewBox="0 0 400 100" preserveAspectRatio="none" aria-hidden="true">
              <defs>
                <linearGradient id="ecg" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#ff4d4d" stopOpacity="0.15" />
                  <stop offset="55%" stopColor="#ff4d4d" stopOpacity="0.95" />
                  <stop offset="100%" stopColor="#f5a524" stopOpacity="0.9" />
                </linearGradient>
              </defs>
              <g className="ecg-run">
                {[0, 400].map((dx) => (
                  <polyline
                    key={dx}
                    points={`${dx},58 ${dx + 42},58 ${dx + 52},52 ${dx + 62},58 ${dx + 96},58 ${dx + 104},70 ${dx + 112},22 ${dx + 120},84 ${dx + 128},58 ${dx + 170},58 ${dx + 182},46 ${dx + 194},58 ${dx + 260},58 ${dx + 268},64 ${dx + 276},58 ${dx + 400},58`}
                    fill="none"
                    stroke="url(#ecg)"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    vectorEffect="non-scaling-stroke"
                  />
                ))}
              </g>
            </svg>
            <div className="pointer-events-none absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-void to-transparent" />
            <div className="pointer-events-none absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-void to-transparent" />
          </div>

          {/* progress through the current cycle */}
          <div className="mt-4 h-[3px] w-full overflow-hidden rounded-full bg-white/8">
            <div
              className="h-full rounded-full bg-gradient-to-r from-pulse via-amber to-synapse transition-[width] duration-1000 ease-linear"
              style={{ width: `${Math.round(cycle.t * 100)}%` }}
            />
          </div>
        </div>

        {/* what is running right now */}
        <div className="lg:w-64">
          <div className="label">{lang === 'de' ? 'läuft gerade' : 'running now'}</div>
          <div className="mt-2 flex items-center gap-3">
            <span className="text-3xl leading-none">{phase.icon}</span>
            <div>
              <div className="font-mono text-[1.05rem] tracking-[0.14em] text-amber">{phase.name}</div>
              <div className="text-[0.98rem] text-ink-faint">{phase.head[lang]}</div>
            </div>
          </div>
          <div className="mt-4 font-mono text-[0.92rem] text-ink-dim">
            {lang === 'de' ? 'nächster Schlag in ' : 'next beat in '}
            <span className="text-ink tabular-nums">{cycle.known ? mmss(cycle.toNext) : '—:—'}</span>
          </div>
          {cycle.known && !pulse.live && (
            <div className="mt-2 font-mono text-[0.72rem] text-ink-faint">
              {lang === 'de'
                ? '≈ geschätzt aus dem letzten bekannten Schlag'
                : '≈ estimated from the last known beat'}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

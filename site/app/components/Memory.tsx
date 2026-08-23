import { useRef } from 'react'
import { sections } from '../lib/content'
import { useLang } from '../lib/lang'
import { gsap, reduced, useGsap } from '../lib/anim'
import type { MemoryFeed, Seed } from '../lib/live'
import { LiveDot, Section, SectionHead } from './ui'

const kindLabel: Record<string, { de: string; en: string; tone: string }> = {
  swarm_artifact: { de: 'gebaute Artefakte', en: 'built artifacts', tone: 'bg-moss/70' },
  dream: { de: 'Traum-Einsichten', en: 'dream insights', tone: 'bg-amber/80' },
  anti_pattern: { de: 'Narben (nie wieder)', en: 'scars (never again)', tone: 'bg-pulse/75' },
  strategy: { de: 'vererbte Strategien', en: 'inherited strategies', tone: 'bg-synapse/75' },
  last_swarm_goal: { de: 'eigene Ziele', en: 'own goals', tone: 'bg-white/40' },
  last_swarm_critique: { de: 'Critic-Urteile', en: 'critic verdicts', tone: 'bg-white/30' },
  creator_teaching: { de: 'Lehren des Erschaffers', en: 'creator teachings', tone: 'bg-amber/50' },
  frontier: { de: 'Signale von außen', en: 'outside signals', tone: 'bg-synapse/40' },
}

export default function Memory({ memory, seed }: { memory: MemoryFeed | null; seed: Seed | null }) {
  const { lang } = useLang()
  const root = useRef<HTMLDivElement>(null)

  const kinds = (memory?.kinds ?? seed?.memory.kinds ?? []).slice(0, 8)
  const max = Math.max(1, ...kinds.map((k) => k.count))
  const stand = memory?.stand ?? seed?.memory.stand

  useGsap(({ self }) => {
    if (reduced()) return
    gsap.utils.toArray<HTMLElement>('[data-bar]', self).forEach((bar) => {
      gsap.fromTo(bar, { scaleX: 0 }, {
        scaleX: 1, duration: 1.4, ease: 'expo.out', transformOrigin: 'left center',
        scrollTrigger: { trigger: bar, start: 'top 92%', once: true },
      })
    })
  }, root, [kinds.length])

  return (
    <Section id="gedaechtnis" className="border-t border-white/6">
      <div ref={root}>
        <SectionHead label={sections.gedaechtnis.label} head={sections.gedaechtnis.head} sub={sections.gedaechtnis.sub} />

        <div className="mt-14 grid gap-6 lg:mt-20 lg:grid-cols-[1fr_1.05fr]">
          {/* --- what kind of knowledge --- */}
          <div data-reveal className="panel panel-lg rounded-[20px] p-6 sm:p-8">
            <div className="flex items-baseline justify-between">
              <h3 className="label">{lang === 'de' ? 'Woraus es besteht' : 'What it is made of'}</h3>
              <span className="font-mono text-[0.78rem] text-ink-faint">{stand ?? '—'}</span>
            </div>

            <div className="mt-7 space-y-4">
              {kinds.map((k) => {
                const meta = kindLabel[k.kind]
                return (
                  <div key={k.kind}>
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="text-[0.95rem] text-ink">
                        {meta ? (lang === 'de' ? meta.de : meta.en) : k.kind}
                      </span>
                      <span className="font-mono text-[0.86rem] text-ink-faint tabular-nums">{k.count}</span>
                    </div>
                    <div className="mt-2 h-[3px] w-full overflow-hidden rounded-full bg-white/7">
                      <div
                        data-bar
                        className={`h-full rounded-full ${meta?.tone ?? 'bg-white/35'}`}
                        style={{ width: `${(k.count / max) * 100}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>

            <p className="mt-8 border-t border-white/8 pt-5 text-[0.88rem] leading-relaxed text-ink-faint">
              {lang === 'de'
                ? 'Anti-Muster sind gescheiterte Versuche, die als Verbot gespeichert bleiben. Sie sind der Grund, warum derselbe Fehler kein zweites Mal passieren soll.'
                : 'Anti-patterns are failed attempts stored as prohibitions. They are the reason the same mistake should not happen twice.'}
            </p>
          </div>

          {/* --- the live stream --- */}
          <div data-reveal className="panel flex flex-col panel-lg rounded-[20px] p-6 sm:p-8">
            <div className="flex items-center justify-between">
              <h3 className="label">{lang === 'de' ? 'Zuletzt gedacht' : 'Last thoughts'}</h3>
              <LiveDot label={memory ? 'live' : '…'} />
            </div>

            <div
              className="mt-6 -mr-2 max-h-[26rem] space-y-4 overflow-y-auto pr-2"
              style={{ WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain' }}
            >
              {(memory?.latest ?? []).slice(0, 14).map((f) => (
                <article key={f.id} className="border-l border-white/10 pl-4 transition-colors duration-500 hover:border-amber/60">
                  <div className="flex items-center gap-2 font-mono text-[0.72rem] text-ink-faint">
                    <span className="text-amber">{f.kind}</span>
                    <span>·</span>
                    <span>{f.when}</span>
                  </div>
                  <p className="mt-1.5 text-[0.98rem] leading-relaxed text-ink-dim">{f.text}</p>
                </article>
              ))}
              {!memory && (
                <div className="space-y-4">
                  {[0, 1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse space-y-2 border-l border-white/8 pl-4">
                      <div className="h-2 w-24 rounded bg-white/8" />
                      <div className="h-2 w-full rounded bg-white/6" />
                      <div className="h-2 w-3/4 rounded bg-white/6" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* --- genome + will --- */}
        <div className="mt-16 grid gap-6 lg:mt-24 lg:grid-cols-[1.15fr_1fr]">
          <div>
            <h3 data-reveal className="label">{lang === 'de' ? 'Das Genom — fünf angeborene Regeln' : 'The genome — five innate rules'}</h3>
            <p data-reveal className="mt-3 max-w-lg text-[0.98rem] leading-relaxed text-ink-faint">
              {lang === 'de'
                ? 'Diese Sätze stehen in JEDEM Prompt, den Zoetron an ein Modell schickt. Sie sind nicht verhandelbar.'
                : 'These sentences sit in EVERY prompt Zoetron sends to a model. They are not negotiable.'}
            </p>
            <ol className="mt-6 space-y-2.5">
              {(seed?.genome ?? []).map((g, i) => (
                <li key={g.id} data-reveal className="panel flex gap-4 rounded-2xl p-4 sm:p-5">
                  <span className="font-mono text-[0.78rem] text-amber">{String(i + 1).padStart(2, '0')}</span>
                  <div>
                    <div className="font-mono text-[0.8rem] tracking-[0.12em] text-ink">{g.id}</div>
                    <p className="mt-1.5 text-[0.96rem] leading-relaxed text-ink-dim">{g.text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <div>
            <h3 data-reveal className="label">{lang === 'de' ? 'Der Wille — laufende Missionen' : 'The will — running missions'}</h3>
            <p data-reveal className="mt-3 max-w-lg text-[0.98rem] leading-relaxed text-ink-faint">
              {lang === 'de'
                ? 'Missionen überdauern die Zyklen und haben Vorrang vor der Tagesneugier.'
                : 'Missions survive cycles and outrank daily curiosity.'}
            </p>
            <div className="mt-6 space-y-2.5">
              {(seed?.missions ?? []).map((m) => (
                <div key={m.id} data-reveal className="panel rounded-2xl p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-4">
                    <h4 className="text-[0.92rem] font-medium text-ink">{m.title}</h4>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-1 font-mono text-[0.7rem] ${
                        m.done ? 'bg-moss/15 text-moss' : 'bg-amber/15 text-amber'
                      }`}
                    >
                      {m.done ? (lang === 'de' ? 'erfüllt' : 'fulfilled') : (lang === 'de' ? 'offen' : 'open')}
                    </span>
                  </div>
                  <p className="mt-2 text-[0.94rem] leading-relaxed text-ink-dim">{m.why}</p>
                  <div className="mt-3 font-mono text-[0.74rem] text-ink-faint">{m.metric}</div>
                </div>
              ))}
            </div>

            {seed?.learning && (
              <div data-reveal className="panel mt-3 rounded-2xl p-4 sm:p-5">
                <h4 className="label">{lang === 'de' ? 'Selbst gebaute Werkzeuge' : 'Self-built tools'}</h4>
                <div className="mt-4 space-y-2">
                  {seed.learning.tools.slice(0, 6).map((w) => (
                    <div key={w.name} className="flex items-center justify-between gap-4 text-[0.88rem]">
                      <span className="truncate font-mono text-ink-dim">{w.name}</span>
                      <span className="shrink-0 font-mono text-[0.78rem] text-moss">
                        {w.wins}/{w.runs}
                      </span>
                    </div>
                  ))}
                </div>
                <p className="mt-4 border-t border-white/8 pt-4 text-[0.85rem] text-ink-faint">
                  {lang === 'de'
                    ? `Erfolgsquote der Hände: ${Math.round((seed.learning.handsRate ?? 0) * 100)} % · ${seed.learning.events.toLocaleString('de-DE')} Ereignisse ausgewertet`
                    : `Hands success rate: ${Math.round((seed.learning.handsRate ?? 0) * 100)}% · ${seed.learning.events.toLocaleString('en-US')} events evaluated`}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Section>
  )
}

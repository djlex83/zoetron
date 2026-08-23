import { useLang } from '../lib/lang'
import { runChecks, type CheckState } from '../lib/consistency'
import type { Brain } from '../lib/brain'
import type { Beat, Ideas, Leaderboard, MemoryFeed, Seed } from '../lib/live'
import { LiveDot, Section } from './ui'

const tone: Record<CheckState, { dot: string; text: string; label: { de: string; en: string } }> = {
  ok: { dot: 'bg-moss', text: 'text-moss', label: { de: 'in Deckung', en: 'in agreement' } },
  drift: { dot: 'bg-amber', text: 'text-amber', label: { de: 'Abweichung', en: 'drift' } },
  info: { dot: 'bg-synapse', text: 'text-synapse', label: { de: 'unentschieden', en: 'undecided' } },
  unknown: { dot: 'bg-white/30', text: 'text-ink-faint', label: { de: 'nicht prüfbar', en: 'not checkable' } },
}

/**
 * Every number on this page comes from a file Zoetron writes itself. Here the
 * independent sources are held against each other, so a disagreement is
 * visible instead of hidden behind whichever value rendered first.
 */
export default function Consistency(input: {
  board: Leaderboard | null
  brain: Brain | null
  ideas: Ideas | null
  memory: MemoryFeed | null
  beat: Beat | null
  seed: Seed | null
}) {
  const { lang, t } = useLang()
  const checks = runChecks(input)
  const decidable = checks.filter((c) => c.state === 'ok' || c.state === 'drift')
  const agreeing = decidable.filter((c) => c.state === 'ok').length
  const allGood = decidable.length > 0 && agreeing === decidable.length

  return (
    <Section id="pruefung" className="border-t border-white/6">
      <div className="grid gap-10 lg:grid-cols-[22rem_1fr] lg:gap-16">
        <header>
          <div data-reveal className="flex items-center gap-3">
            <span className="h-px w-10 bg-amber/60" />
            <span className="label text-amber/90">{lang === 'de' ? 'Datenprüfung' : 'Data check'}</span>
          </div>
          <h2 data-reveal className="display mt-5 text-ink"
            style={{ fontSize: 'max(1.8rem, calc(var(--h1-size) * 0.7))', lineHeight: 1.05 }}>
            {lang === 'de' ? 'Prüft sich\nselbst gegen.' : 'Checks itself\nagainst itself.'}
          </h2>
          <p data-reveal className="mt-6 text-[1.02rem] leading-relaxed text-ink-dim">
            {lang === 'de'
              ? 'Jede Zahl auf dieser Seite stammt aus einer Datei, die Zoetron selbst schreibt. Diese Seite rechnet nichts nach — aber sie hält die unabhängigen Quellen gegeneinander und zeigt, wenn sie sich widersprechen.'
              : 'Every number on this page comes from a file Zoetron writes itself. This page does not recompute anything — but it holds the independent sources against each other and shows when they disagree.'}
          </p>

          <div data-reveal className="panel mt-8 rounded-2xl p-5">
            <div className="flex items-center justify-between gap-4">
              <LiveDot label={lang === 'de' ? 'bei jedem Abruf neu' : 're-run on every fetch'} tone={allGood ? 'amber' : 'pulse'} />
              <span className={`font-mono text-[0.85rem] ${allGood ? 'text-moss' : 'text-amber'}`}>
                {decidable.length ? `${agreeing}/${decidable.length}` : '—'}
              </span>
            </div>
            <p className="mt-3 text-[0.92rem] leading-relaxed text-ink-dim">
              {decidable.length === 0
                ? (lang === 'de' ? 'Noch keine Quelle vollständig geladen.' : 'No source fully loaded yet.')
                : allGood
                  ? (lang === 'de' ? 'Alle vergleichbaren Quellen stimmen überein.' : 'All comparable sources agree.')
                  : (lang === 'de'
                      ? 'Mindestens eine Quelle hängt hinterher — siehe rechts.'
                      : 'At least one source is lagging — see the list.')}
            </p>
          </div>
        </header>

        <ul className="space-y-3">
          {checks.map((c) => {
            const s = tone[c.state]
            return (
              <li key={c.id} data-reveal className="panel rounded-2xl p-5 sm:p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="text-[1rem] font-medium text-ink">{t(c.label)}</h3>
                  <span className={`flex items-center gap-2 font-mono text-[0.74rem] ${s.text}`}>
                    <span className={`h-2 w-2 rounded-full ${s.dot}`} />
                    {t(s.label)}
                  </span>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 font-mono text-[0.84rem] text-ink-dim">
                  <span className="pill" style={{ height: '34px', padding: '0 12px', fontSize: '0.82rem' }}>
                    <span>{c.a}</span>
                  </span>
                  <span className="text-ink-faint">↔</span>
                  <span className="pill" style={{ height: '34px', padding: '0 12px', fontSize: '0.82rem' }}>
                    <span>{c.b}</span>
                  </span>
                </div>

                <p className="mt-3 text-[0.92rem] leading-relaxed text-ink-faint">{t(c.note)}</p>
              </li>
            )
          })}

          {checks.length === 0 && (
            <li className="panel animate-pulse rounded-2xl p-6">
              <div className="h-2 w-40 rounded bg-white/8" />
              <div className="mt-3 h-2 w-full rounded bg-white/6" />
            </li>
          )}
        </ul>
      </div>
    </Section>
  )
}

import type { Brain } from './brain'
import type { Beat, Ideas, Leaderboard, MemoryFeed, Seed } from './live'
import type { L } from './content'

export type CheckState = 'ok' | 'drift' | 'info' | 'unknown'

export type Check = {
  id: string
  label: L
  /** the two values being held against each other */
  a: string
  b: string
  state: CheckState
  note: L
}

/** "2026-08-23 19:07 UTC" → Date */
export function parseStand(s: string | null | undefined): Date | null {
  if (!s) return null
  const d = new Date(s.trim().replace(' UTC', 'Z').replace(' ', 'T'))
  return Number.isNaN(d.getTime()) ? null : d
}

const de = (n: number) => n.toLocaleString('de-DE')
const mins = (ms: number) => Math.round(ms / 60_000)

/**
 * Holds the independent live sources against each other. Nothing here fixes
 * anything — it only makes a disagreement visible instead of silently showing
 * whichever number happened to load first.
 */
export function runChecks(input: {
  board: Leaderboard | null
  brain: Brain | null
  ideas: Ideas | null
  memory: MemoryFeed | null
  beat: Beat | null
  seed: Seed | null
}): Check[] {
  const { board, brain, ideas, memory, beat, seed } = input
  const checks: Check[] = []

  // 1) the same neuron count, written by two different organs
  if (board && brain) {
    const same = board.neurons === brain.totals.neurons
    const diff = Math.abs(board.neurons - brain.totals.neurons)
    checks.push({
      id: 'neurons',
      label: { de: 'Neuronen: Bestenliste ↔ Gehirn', en: 'Neurons: leaderboard ↔ brain' },
      a: `${de(board.neurons)} (wiki/Tabelle.md)`,
      b: `${de(brain.totals.neurons)} (brain.html)`,
      state: same ? 'ok' : 'drift',
      note: same
        ? { de: 'Beide Ansichten stammen aus demselben Herzschlag.', en: 'Both views come from the same heartbeat.' }
        : {
            de: `${de(diff)} Neuronen Unterschied — die beiden Dateien wurden in verschiedenen Herzschlägen geschrieben.`,
            en: `${de(diff)} neurons apart — the two files were written in different heartbeats.`,
          },
    })
  }

  // 2) synapses: shown side by side, deliberately not judged
  if (board && brain) {
    checks.push({
      id: 'synapses',
      label: { de: 'Synapsen: Bestenliste ↔ Gehirn', en: 'Synapses: leaderboard ↔ brain' },
      a: `${de(board.synapses)} (bewertet)`,
      b: `${de(brain.totals.synapses)} (brain.html)`,
      state: 'info',
      note: {
        de: 'Ohne Quellcode ist nicht belegbar, ob beide Organe dasselbe zählen — deshalb stehen beide Zahlen hier nebeneinander, statt eine davon als „die“ Wahrheit auszugeben.',
        en: 'Without the source it cannot be proven that both organs count the same thing — so both numbers stand side by side instead of one being sold as the truth.',
      },
    })
  }

  // 3) two markdown organs, one timestamp each
  if (ideas?.stand || memory?.stand) {
    const i = parseStand(ideas?.stand)
    const m = parseStand(memory?.stand)
    if (i && m) {
      const apart = Math.abs(i.getTime() - m.getTime())
      const close = apart <= 6 * 60_000
      checks.push({
        id: 'stand',
        label: { de: 'Zeitstand: Ideen-Board ↔ Gedächtnis', en: 'Timestamp: ideas board ↔ memory' },
        a: ideas!.stand!,
        b: memory!.stand!,
        state: close ? 'ok' : 'drift',
        note: close
          ? { de: 'Beide Organe wurden im selben Zyklus geschrieben.', en: 'Both organs were written in the same cycle.' }
          : {
              de: `${mins(apart)} Minuten auseinander — eines der beiden Dokumente hängt hinterher.`,
              en: `${mins(apart)} minutes apart — one of the two documents is lagging.`,
            },
      })
    }
  }

  // 4) is the page a visitor gets as new as the last heartbeat?
  const newest = [parseStand(ideas?.stand), parseStand(memory?.stand)]
    .filter((d): d is Date => Boolean(d))
    .sort((x, y) => y.getTime() - x.getTime())[0]
  if (newest && beat?.lastISO) {
    const lag = new Date(beat.lastISO).getTime() - newest.getTime()
    const fresh = lag <= 12 * 60_000
    checks.push({
      id: 'delivery',
      label: { de: 'Auslieferung: Seite ↔ letzter Herzschlag', en: 'Delivery: page ↔ last heartbeat' },
      a: `${newest.toISOString().slice(11, 16)} UTC`,
      b: `${new Date(beat.lastISO).toISOString().slice(11, 16)} UTC`,
      state: fresh ? 'ok' : 'drift',
      note: fresh
        ? { de: 'GitHub Pages liefert den aktuellen Stand aus.', en: 'GitHub Pages is serving the current state.' }
        : {
            de: `${mins(lag)} Minuten Verzug — Pages hat den letzten Herzschlag noch nicht ausgerollt (oder ein Cache hält die alte Datei).`,
            en: `${mins(lag)} minutes behind — Pages has not rolled out the last heartbeat yet (or a cache is holding the old file).`,
          },
    })
  } else if (newest) {
    checks.push({
      id: 'delivery',
      label: { de: 'Auslieferung: Seite ↔ letzter Herzschlag', en: 'Delivery: page ↔ last heartbeat' },
      a: `${newest.toISOString().slice(11, 16)} UTC`,
      b: '—',
      state: 'unknown',
      note: {
        de: 'Die GitHub-API antwortet gerade nicht (Rate-Limit) — ohne sie ist kein Vergleich möglich.',
        en: 'The GitHub API is not answering right now (rate limit) — no comparison possible without it.',
      },
    })
  }

  // 5) how old are the numbers frozen into the build?
  if (seed?.generatedAt) {
    const age = Date.now() - new Date(seed.generatedAt).getTime()
    const hours = age / 3_600_000
    const ok = hours <= 24
    checks.push({
      id: 'seed',
      label: { de: 'Eingefrorene Zahlen: Bauzeit der Seite', en: 'Frozen numbers: page build time' },
      a: seed.generatedAt.slice(0, 16).replace('T', ' ') + ' UTC',
      b: ok ? `${Math.max(1, Math.round(hours))} h` : `${Math.round(hours / 24)} d`,
      state: ok ? 'ok' : 'drift',
      note: ok
        ? { de: 'Genom, Missionen, Werkzeuge und Wochenreport sind jung genug.', en: 'Genome, missions, tools and weekly report are young enough.' }
        : {
            de: 'Genom, Missionen, Werkzeuge und Wochenreport kommen aus state.json und altern bis zum nächsten Build der Seite.',
            en: 'Genome, missions, tools and the weekly report come from state.json and age until the page is rebuilt.',
          },
    })
  }

  return checks
}

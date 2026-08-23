/**
 * snapshot.mjs — freezes Zoetron's own data into public/state.json.
 *
 * This is the SEED the landing page renders instantly. Everything that can be
 * refreshed at runtime (brain, graph, ideas board, leaderboard, memory,
 * heartbeat) is re-fetched live in the browser; the seed only guarantees the
 * page is never empty and stays honest about its timestamp.
 */
import { readFileSync, writeFileSync, existsSync, readdirSync, rmSync, mkdirSync } from 'node:fs'
import { execSync } from 'node:child_process'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const root = join(here, '..', '..')
const R = (p) => join(root, p)

const readJSON = (p, fallback) => {
  try { return JSON.parse(readFileSync(R(p), 'utf8')) } catch { return fallback }
}
const readText = (p) => {
  try { return readFileSync(R(p), 'utf8') } catch { return '' }
}

const learning = readJSON('data/memory/learning.json', {})
const will = readJSON('data/will.json', { missions: [] })
const genome = readJSON('data/genome.json', { rules: [] })

// "Stand: 1021 Neuronen · 12254 bewertete Synapsen"
const tabelle = readText('data/TABELLE.md')
const neurons = Number(tabelle.match(/Stand:\s*([\d.]+)\s*Neuronen/)?.[1]?.replace(/\./g, '') ?? 0)
const synapses = Number(tabelle.match(/·\s*([\d.]+)\s*bewertete Synapsen/)?.[1]?.replace(/\./g, '') ?? 0)

// "**1103 Fakten** · Stand 2026-08-23 19:07 UTC"
const memHead = readText('data/GEDAECHTNIS.md').slice(0, 4000)
const facts = Number(memHead.match(/\*\*([\d.]+)\s*Fakten\*\*/)?.[1]?.replace(/\./g, '') ?? 0)
const memStand = memHead.match(/Stand\s+([\d-]+\s[\d:]+\s*UTC)/)?.[1] ?? null
const factKinds = [...memHead.matchAll(/^-\s+\*\*([\w:]+):\*\*\s+(\d+)/gm)]
  .map((m) => ({ kind: m[1], count: Number(m[2]) }))

// newest weekly report
let report = null
try {
  const dir = readdirSync(R('docs/REPORTS')).filter((f) => f.endsWith('.md')).sort()
  const name = dir[dir.length - 1]
  if (name) {
    const t = readText(`docs/REPORTS/${name}`)
    const num = (re) => Number(t.match(re)?.[1] ?? 0)
    report = {
      slug: name.replace(/\.md$/, ''),
      runs: num(/\*\*(\d+)\s+Swarm-L[äa]ufe\*\*/),
      avgScore: Number(t.match(/ø\s*Score\s*([\d.]+)/)?.[1] ?? 0),
      insights: num(/\*\*(\d+)\s+dauerhafte Einsichten\*\*/),
      evolutions: num(/\*\*(\d+)\s+Evolutionsrunden\*\*/),
      executions: num(/\*\*(\d+)\s+erfolgreiche Code-Ausf[üu]hrungen\*\*/),
      topModel: t.match(/Top-Modell der Woche:\*\*\s*`([^`]+)`/)?.[1] ?? null,
      quote: t.match(/^>\s*(.+)$/m)?.[1] ?? null,
    }
  }
} catch { /* no reports yet */ }

// the wiki pages the organism currently keeps (it may add more at any beat)
let wiki = []
try {
  wiki = readdirSync(R('docs/wiki'))
    .filter((f) => f.endsWith('.md'))
    .map((file) => {
      const text = readText(`docs/wiki/${file}`)
      const title = text.match(/^#\s+(.+)$/m)?.[1]?.trim() ?? file.replace(/\.md$/, '')
      const intro = text
        .split('\n')
        .find((l) => l.trim() && !l.startsWith('#') && !l.startsWith('*') && !l.startsWith('|'))
      return {
        slug: file.replace(/\.md$/, ''),
        file,
        title: title.replace(/^[^\p{L}\d]+/u, '').trim(),
        intro: (intro ?? '').replace(/[*_`]/g, '').trim().slice(0, 120),
        bytes: text.length,
      }
    })
    .sort((a, b) => a.title.localeCompare(b.title, 'de'))
} catch { /* no wiki mirror */ }

// heartbeat rhythm straight out of git history
let beats = { last: null, per24h: 0, total: 0 }
try {
  const log = execSync(
    'git log --since="24 hours ago" --pretty=%cI -- data docs',
    { cwd: root, encoding: 'utf8' },
  ).trim().split('\n').filter(Boolean)
  const total = execSync('git rev-list --count HEAD', { cwd: root, encoding: 'utf8' }).trim()
  beats = { last: log[0] ?? null, per24h: log.length, total: Number(total) }
} catch { /* shallow clone */ }

// docs/ is never emptied (the heartbeat writes there too), so old hashed
// bundles would pile up forever — clear only the folder we own.
try {
  for (const f of readdirSync(R('docs/assets'))) rmSync(R(`docs/assets/${f}`), { force: true })
} catch { /* first build */ }

const state = {
  generatedAt: new Date().toISOString(),
  repo: 'djlex83/zoetron',
  memory: { facts, neurons, synapses, stand: memStand, kinds: factKinds },
  learning: {
    events: learning.ereignisse_ausgewertet ?? 0,
    handsRate: learning.haende_quote ?? 0,
    simulations: learning.simulationen_angewandt ?? 0,
    swarm: learning.swarm_scores ?? { n: 0, best: 0, schnitt: 0 },
    tools: (learning.werkzeuge ?? []).map((w) => ({
      name: w.tool, runs: w.laeufe, wins: w.erfolge, rate: w.quote,
    })),
    stand: learning.stand ?? null,
  },
  missions: (will.missions ?? []).map((m) => ({
    id: m.id, title: m.title, why: m.why, metric: m.target_metric, done: !!m.done,
  })),
  genome: (genome.rules ?? []).map((r) => ({ id: r.id, text: r.text })),
  firstBoot: genome.first_boot ?? null,
  report,
  beats,
  wiki,
}

// public/state.json is generated, so it is git-ignored — which means the
// folder can be missing entirely on a fresh checkout (CI).
const outDir = join(here, '..', 'public')
mkdirSync(outDir, { recursive: true })
writeFileSync(join(outDir, 'state.json'), JSON.stringify(state, null, 2) + '\n')
console.log(
  `[snapshot] ${facts} Fakten · ${neurons} Neuronen · ${synapses} Synapsen · ` +
  `${state.learning.tools.length} Werkzeuge · ${beats.per24h} Herzschläge/24h · ${wiki.length} Wiki-Seiten`,
)

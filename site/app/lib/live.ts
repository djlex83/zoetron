/**
 * live.ts — the wiring between the landing page and the organism.
 *
 * Zoetron rewrites docs/brain.html, docs/graph.html and docs/wiki/*.md on every
 * heartbeat (~5 min) and pushes to GitHub, which redeploys Pages. So the very
 * files this page fetches ARE the live organs — no API, no backend.
 */

export type Ideas = {
  stand: string | null
  skills: { text: string; count: number }[]
  goals: { text: string; count: number }[]
  insights: { text: string; count: number }[]
}

export type Leaderboard = {
  neurons: number
  synapses: number
  topNeurons: { rank: number; cat: string; text: string; syn: number; avg: string }[]
  topSynapses: { rank: number; strength: string; a: string; b: string }[]
}

export type MemoryFeed = {
  facts: number
  stand: string | null
  kinds: { kind: string; count: number }[]
  latest: { id: string; kind: string; when: string; text: string }[]
}

/** the heartbeat timestamp the whole page runs on, plus how sure we are */
export type Pulse = { iso: string | null; live: boolean }

export type Beat = {
  lastISO: string | null
  per24h: number
  messages: string[]
}

const REPO = 'djlex83/zoetron'
const RAW = `https://raw.githubusercontent.com/${REPO}/main`

/** cache-buster: Pages caches aggressively, the organism does not stand still */
const fresh = (url: string) =>
  url + (url.includes('?') ? '&' : '?') + 't=' + Math.floor(Date.now() / 60_000)

async function text(url: string, signal?: AbortSignal): Promise<string> {
  const res = await fetch(fresh(url), { signal, cache: 'no-store' })
  if (!res.ok) throw new Error(`${res.status} ${url}`)
  return res.text()
}

/* ------------------------------------------------------------------ seed */

export type Seed = {
  generatedAt: string
  memory: { facts: number; neurons: number; synapses: number; stand: string | null; kinds: { kind: string; count: number }[] }
  learning: {
    events: number; handsRate: number; simulations: number
    swarm: { n: number; best: number; schnitt: number }
    tools: { name: string; runs: number; wins: number; rate: number }[]
    stand: string | null
  }
  missions: { id: string; title: string; why: string; metric: string; done: boolean }[]
  genome: { id: string; text: string }[]
  firstBoot: string | null
  report: null | {
    slug: string; runs: number; avgScore: number; insights: number
    evolutions: number; executions: number; topModel: string | null; quote: string | null
  }
  beats: { last: string | null; per24h: number; total: number }
  wiki: { slug: string; path: string; group: 'wiki' | 'report'; title: string; intro: string; bytes: number }[]
}

export const fetchSeed = (signal?: AbortSignal): Promise<Seed> =>
  text('./state.json', signal).then((t) => JSON.parse(t) as Seed)

/* ----------------------------------------------------------- ideas board */

const countOf = (line: string) =>
  Number(line.match(/(?:hatte die Idee|wieder aufgegriffen:)\s*(\d+)\s*×/)?.[1] ?? 0)

/** The organism truncates its own board entries mid-word — say so honestly. */
const softEllipsis = (s: string) =>
  s.length > 40 && !/(\.{2,}|…|[.!?)„“"'])$/.test(s) ? s + ' …' : s

const clean = (line: string) =>
  line
    .replace(/^-\s+/, '')
    .replace(/\s*\*\((?:hatte die Idee|wieder aufgegriffen:)[^)]*\)\*\s*$/, '')
    .trim()

export async function fetchIdeas(signal?: AbortSignal): Promise<Ideas> {
  const md = await text('./wiki/Ideen.md', signal)
  const stand = md.match(/Stand\s+([\d-]+\s[\d:]+\s*UTC)/)?.[1] ?? null

  const section = (heading: RegExp) => {
    const start = md.search(heading)
    if (start < 0) return []
    const rest = md.slice(start)
    const end = rest.indexOf('\n## ', 3)
    const body = end > 0 ? rest.slice(0, end) : rest
    return body
      .split('\n')
      .filter((l) => l.startsWith('- '))
      .map((l) => ({ text: softEllipsis(clean(l)), count: countOf(l) }))
      .filter((i) => i.text.length > 0)
  }

  return {
    stand,
    skills: section(/^##.*F[äa]higkeiten, die er sich w[üu]nscht/m),
    goals: section(/^##.*Eigene Ziele/m),
    insights: section(/^##.*(N[äa]chtliche Erkenntnisse|Erkenntnisse)/m),
  }
}

/* ----------------------------------------------------------- leaderboard */

const cells = (row: string) =>
  row.split('|').slice(1, -1).map((c) => c.trim())

export async function fetchLeaderboard(signal?: AbortSignal): Promise<Leaderboard> {
  const md = await text('./wiki/Tabelle.md', signal)
  const neurons = Number(md.match(/Stand:\s*([\d.]+)\s*Neuronen/)?.[1]?.replace(/\./g, '') ?? 0)
  const synapses = Number(md.match(/·\s*([\d.]+)\s*bewertete Synapsen/)?.[1]?.replace(/\./g, '') ?? 0)

  const tables = md.split(/^##\s+/m).slice(1)
  const rowsOf = (t: string | undefined) =>
    (t ?? '')
      .split('\n')
      .filter((l) => l.startsWith('|') && !/^\|\s*[-:]+/.test(l) && !/^\|\s*#\s*\|/.test(l))
      .map(cells)

  const nRows = rowsOf(tables.find((t) => /besten Neuronen/.test(t)))
  const sRows = rowsOf(tables.find((t) => /st[äa]rksten Synapsen/.test(t)))

  return {
    neurons,
    synapses,
    topNeurons: nRows.map((c) => ({
      rank: Number(c[0] ?? 0), cat: c[1] ?? '', text: softEllipsis(c[2] ?? ''),
      syn: Number(c[3] ?? 0), avg: c[4] ?? '',
    })).filter((r) => r.rank > 0),
    topSynapses: sRows.map((c) => ({
      rank: Number(c[0] ?? 0),
      strength: (c[1] ?? '').replace(/\*/g, ''),
      a: softEllipsis(c[2] ?? ''), b: softEllipsis(c[3] ?? ''),
    })).filter((r) => r.rank > 0),
  }
}

/* ---------------------------------------------------------- live memory */

/** 300 kB of raw memory — only pulled once the reader actually asks for it. */
export async function fetchMemory(signal?: AbortSignal): Promise<MemoryFeed> {
  const md = await text(`${RAW}/data/GEDAECHTNIS.md`, signal)
  const facts = Number(md.match(/\*\*([\d.]+)\s*Fakten\*\*/)?.[1]?.replace(/\./g, '') ?? 0)
  const stand = md.match(/Stand\s+([\d-]+\s[\d:]+\s*UTC)/)?.[1] ?? null
  const kinds = [...md.slice(0, 4000).matchAll(/^-\s+\*\*([\w:]+):\*\*\s+(\d+)/gm)]
    .map((m) => ({ kind: m[1]!, count: Number(m[2]) }))

  const latest: MemoryFeed['latest'] = []
  const re = /^###\s+`([^`]+)`\n\*([^*]+)\*\n\n([\s\S]*?)(?=\n### |\n---|\s*$)/gm
  for (const m of md.matchAll(re)) {
    const id = m[1]!
    const meta = m[2]!
    latest.push({
      id,
      kind: id.split(':')[0] ?? 'fakt',
      when: meta.split('·')[0]!.trim(),
      text: m[3]!.trim().replace(/\s+/g, ' ').slice(0, 420),
    })
    if (latest.length >= 24) break
  }
  return { facts, stand, kinds, latest }
}

/* -------------------------------------------------------------- heartbeat */

export async function fetchBeat(signal?: AbortSignal): Promise<Beat> {
  const res = await fetch(
    `https://api.github.com/repos/${REPO}/commits?per_page=100`,
    { signal, headers: { Accept: 'application/vnd.github+json' } },
  )
  if (!res.ok) throw new Error(`github ${res.status}`)
  const commits = (await res.json()) as {
    commit: { message: string; committer: { date: string } }
  }[]
  const dayAgo = Date.now() - 86_400_000
  const dates = commits.map((c) => c.commit.committer.date)
  return {
    lastISO: dates[0] ?? null,
    per24h: dates.filter((d) => new Date(d).getTime() > dayAgo).length,
    messages: commits.slice(0, 8).map((c) => c.commit.message.split('\n')[0]!),
  }
}

/* ------------------------------------------------------------------ time */

export function agoDE(iso: string | null, lang: 'de' | 'en' = 'de'): string {
  if (!iso) return '—'
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000)
  const mk = (n: number, de: string, en: string) =>
    lang === 'de' ? `vor ${n} ${de}` : `${n} ${en} ago`
  if (s < 90) return lang === 'de' ? 'gerade eben' : 'just now'
  if (s < 5400) return mk(Math.round(s / 60), 'Min', 'min')
  if (s < 172800) return mk(Math.round(s / 3600), 'Std', 'h')
  return mk(Math.round(s / 86400), 'Tagen', 'days')
}

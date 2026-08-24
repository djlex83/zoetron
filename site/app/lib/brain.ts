/**
 * brain.ts — loads the organism's brain for the canvas.
 *
 * Primary source is docs/brain.min.json, derived at build time from the
 * original docs/brain.html (which keeps growing: 2.6 MB and counting). The
 * slim file carries only geometry — 41 kB gzipped instead of 407 kB — and the
 * neuron texts live in a second file that is fetched only when a reader opens
 * a neuron. If the derivation is ever missing, we fall back to parsing the
 * original so the page cannot go dark.
 */

export type Neuron = {
  /** unit-sphere-ish position */
  p: [number, number, number]
  /** degree = number of synapses */
  d: number
  /** 1 = fact/insight, 0 = goal/event */
  f: number
  /** age 0 (fresh) … 1 (old) */
  a: number
}

export type Link = { a: number; b: number; s: number; c: number }

export type Brain = {
  neurons: Neuron[]
  links: Link[]
  /** what the ORIGINAL holds, so the page can say what was left out */
  totals: { neurons: number; synapses: number }
  kept: { synapses: number }
  source: 'slim' | 'original'
  fetchedAt: number
}

const bust = () => '?t=' + Math.floor(Date.now() / 60_000)

/* ------------------------------------------------- original as a fallback */

function sliceArray(src: string, from: number): string {
  let depth = 0, inStr = false, esc = false
  for (let i = from; i < src.length; i++) {
    const ch = src[i]!
    if (inStr) {
      if (esc) esc = false
      else if (ch === '\\') esc = true
      else if (ch === '"') inStr = false
      continue
    }
    if (ch === '"') inStr = true
    else if (ch === '[') depth++
    else if (ch === ']') { depth--; if (depth === 0) return src.slice(from, i + 1) }
  }
  throw new Error('unbalanced array in brain.html')
}

async function fromOriginal(): Promise<Brain> {
  const res = await fetch('./brain.html' + bust(), { cache: 'no-store' })
  if (!res.ok) throw new Error(`brain.html ${res.status}`)
  const html = await res.text()

  const nAt = html.indexOf('const N=[')
  if (nAt < 0) throw new Error('no neurons in brain.html')
  const nRaw = sliceArray(html, nAt + 'const N='.length)
  const lAt = html.indexOf('L=[', nAt + nRaw.length)
  const lRaw = lAt < 0 ? '[]' : sliceArray(html, lAt + 'L='.length)

  type RawN = { id: string; l: string; t: string; d: number; f: number; a: number; p: [number, number, number] }
  const raw = JSON.parse(nRaw) as RawN[]
  const index = new Map(raw.map((n, i) => [n.id, i]))
  const rawLinks = (JSON.parse(lRaw) as { a: string; b: string; s?: number; c?: number }[])
    .filter((l) => index.has(l.a) && index.has(l.b))
    .sort((x, y) => (y.s ?? 0) - (x.s ?? 0))

  cachedTexts = Promise.resolve(raw.map((n) => [n.l ?? '', n.t ?? ''] as [string, string]))

  return {
    neurons: raw.map((n) => ({ p: n.p, d: n.d ?? 0, f: n.f ? 1 : 0, a: n.a ?? 0 })),
    links: rawLinks.slice(0, 6000).map((l) => ({
      a: index.get(l.a)!, b: index.get(l.b)!, s: l.s ?? 0, c: l.c ? 1 : 0,
    })),
    totals: { neurons: raw.length, synapses: rawLinks.length },
    kept: { synapses: Math.min(6000, rawLinks.length) },
    source: 'original',
    fetchedAt: Date.now(),
  }
}

/* ------------------------------------------------------------- slim first */

type Slim = {
  totals: { neurons: number; synapses: number }
  kept: { synapses: number }
  neurons: [number, number, number, number, number, number][]
  links: [number, number, number, number][]
}

async function fromSlim(): Promise<Brain> {
  const res = await fetch('./brain.min.json' + bust(), { cache: 'no-store' })
  if (!res.ok) throw new Error(`brain.min.json ${res.status}`)
  const d = (await res.json()) as Slim
  return {
    neurons: d.neurons.map(([x, y, z, deg, f, age]) => ({ p: [x, y, z], d: deg, f, a: age / 100 })),
    links: d.links.map(([a, b, s, c]) => ({ a, b, s: s / 100, c })),
    totals: d.totals,
    kept: d.kept,
    source: 'slim',
    fetchedAt: Date.now(),
  }
}

let cache: Promise<Brain> | null = null
let cachedAt = 0

export function loadBrain(force = false): Promise<Brain> {
  if (cache && !force && Date.now() - cachedAt < 9 * 60_000) return cache
  cachedAt = Date.now()
  cache = fromSlim().catch(() => fromOriginal())
  cache.catch(() => { cache = null })
  return cache
}

/* ----------------------------------------------------- texts, only on demand */

let cachedTexts: Promise<[string, string][]> | null = null

/** ~130 kB gzipped — pulled the first time someone opens a neuron */
export function loadBrainTexts(): Promise<[string, string][]> {
  if (!cachedTexts) {
    cachedTexts = fetch('./brain.text.json' + bust(), { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .catch(() => [] as [string, string][])
  }
  return cachedTexts
}

/**
 * brain.ts — reads the organism's real neurons out of docs/brain.html.
 *
 * The heartbeat regenerates that file every ~5 minutes with two embedded JSON
 * arrays (neurons and synapses). We parse them and render the brain ourselves:
 * same live data, but drawn to fit this page instead of a standalone window.
 */

export type Neuron = {
  id: string
  /** short label, e.g. "dream:2026…" or the goal name */
  l: string
  /** full readable text shown on click */
  t: string
  /** degree = number of synapses */
  d: number
  /** 1 = fact/insight, 0 = goal/event */
  f: number
  /** age 0 (fresh) … 1 (old) */
  a: number
  /** unit-sphere-ish position */
  p: [number, number, number]
}

export type Synapse = { a: string; b: string; c: number; s: number }
export type Brain = { neurons: Neuron[]; synapses: Synapse[]; fetchedAt: number }

/** Scans a balanced JSON array starting at `from`, quote- and escape-aware. */
function sliceArray(src: string, from: number): string {
  let depth = 0
  let inStr = false
  let esc = false
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
    else if (ch === ']') {
      depth--
      if (depth === 0) return src.slice(from, i + 1)
    }
  }
  throw new Error('unbalanced array in brain.html')
}

let cache: Promise<Brain> | null = null
let cachedAt = 0

export function loadBrain(force = false): Promise<Brain> {
  const stale = Date.now() - cachedAt > 9 * 60_000
  if (cache && !force && !stale) return cache
  cachedAt = Date.now()
  cache = (async () => {
    const res = await fetch('./brain.html?t=' + Math.floor(Date.now() / 60_000), { cache: 'no-store' })
    if (!res.ok) throw new Error(`brain.html ${res.status}`)
    const html = await res.text()

    const nAt = html.indexOf('const N=[')
    if (nAt < 0) throw new Error('no neurons in brain.html')
    const nRaw = sliceArray(html, nAt + 'const N='.length)
    const lAt = html.indexOf('L=[', nAt + nRaw.length)
    const lRaw = lAt < 0 ? '[]' : sliceArray(html, lAt + 'L='.length)

    const neurons = JSON.parse(nRaw) as Neuron[]
    const synapses = (JSON.parse(lRaw) as Synapse[]).sort((x, y) => (y.s ?? 0) - (x.s ?? 0))
    return { neurons, synapses, fetchedAt: Date.now() }
  })()
  cache.catch(() => { cache = null })
  return cache
}

/**
 * slim-brain.mjs — derives a web-sized copy of the organism's brain.
 *
 * docs/brain.html is written by the heartbeat and grows with the memory
 * (1.1 MB → 2.6 MB within a day). It stays untouched: it is the original and
 * remains linked. For the page we emit docs/brain.min.json, which keeps only
 * what the canvas actually draws:
 *
 *   - positions rounded to 3 decimals instead of 17
 *   - synapses referenced by index instead of by "f:396867924758" strings
 *   - only the strongest synapses (the canvas never draws more)
 *   - arrays instead of objects, so no key repeats 1766 times
 *   - the neuron texts move into a second file, fetched only when a reader
 *     actually opens a neuron — most never do, and they are 3/4 of the payload
 */
import { readFileSync, writeFileSync, statSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const SRC = join(here, '..', '..', 'docs', 'brain.html')
const OUT = join(here, '..', '..', 'docs', 'brain.min.json')
const OUT_TEXT = join(here, '..', '..', 'docs', 'brain.text.json')

/** how many synapses the page may ever need (stage draws 2600 at most) */
const KEEP_LINKS = 6000
const TEXT_MAX = 320

function sliceArray(src, from) {
  let depth = 0, inStr = false, esc = false
  for (let i = from; i < src.length; i++) {
    const ch = src[i]
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

let html
try {
  html = readFileSync(SRC, 'utf8')
} catch {
  console.log('[slim-brain] docs/brain.html fehlt — übersprungen')
  process.exit(0)
}

const nAt = html.indexOf('const N=[')
if (nAt < 0) {
  console.log('[slim-brain] keine Neuronen in brain.html gefunden — übersprungen')
  process.exit(0)
}
const nRaw = sliceArray(html, nAt + 'const N='.length)
const lAt = html.indexOf('L=[', nAt + nRaw.length)
const lRaw = lAt < 0 ? '[]' : sliceArray(html, lAt + 'L='.length)

const neurons = JSON.parse(nRaw)
const links = JSON.parse(lRaw)

const index = new Map(neurons.map((n, i) => [n.id, i]))
const r3 = (v) => Math.round(v * 1000) / 1000

const kept = links
  .filter((l) => index.has(l.a) && index.has(l.b))
  .sort((x, y) => (y.s ?? 0) - (x.s ?? 0))
  .slice(0, KEEP_LINKS)
  .map((l) => [index.get(l.a), index.get(l.b), Math.round((l.s ?? 0) * 100), l.c ? 1 : 0])

const out = {
  v: 1,
  at: new Date().toISOString(),
  // totals from the ORIGINAL, so the page can say what it left out
  totals: { neurons: neurons.length, synapses: links.length },
  kept: { synapses: kept.length },
  // [x, y, z, degree, isFact, age] — everything the canvas needs to draw
  neurons: neurons.map((n) => [
    r3(n.p[0]), r3(n.p[1]), r3(n.p[2]),
    n.d ?? 0,
    n.f ? 1 : 0,
    Math.round((n.a ?? 0) * 100),
  ]),
  links: kept,
}

// same order as out.neurons: [label, text]
const texts = neurons.map((n) => [(n.l ?? '').slice(0, 90), (n.t ?? '').slice(0, TEXT_MAX)])

writeFileSync(OUT, JSON.stringify(out))
writeFileSync(OUT_TEXT, JSON.stringify(texts))

const kb = (p) => (statSync(p).size / 1024).toFixed(0)
const before = statSync(SRC).size
console.log(
  `[slim-brain] ${(before / 1024 / 1024).toFixed(2)} MB → ${kb(OUT)} kB Geometrie ` +
  `+ ${kb(OUT_TEXT)} kB Texte (nur auf Klick) · ` +
  `${neurons.length} Neuronen · ${kept.length}/${links.length} Synapsen`,
)

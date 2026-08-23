import type { ReactNode } from 'react'

/**
 * A small Markdown renderer for the organism's own wiki pages.
 *
 * It builds React elements instead of an HTML string on purpose: the input is
 * written by an LLM-driven daemon, and nothing here should ever be able to
 * inject markup into this page.
 */

const INLINE = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\[\[[^\]]+\]\]|\[[^\]]+\]\([^)]+\))/g

/** set by renderMarkdown so [[WikiLinks]] can switch the reader's page */
let openPage: ((slug: string) => void) | null = null

function inline(text: string, keyBase: string): ReactNode[] {
  const out: ReactNode[] = []
  const parts = text.split(INLINE)
  parts.forEach((part, i) => {
    if (!part) return
    const key = `${keyBase}-${i}`
    if (part.startsWith('**') && part.endsWith('**')) {
      out.push(<strong key={key} className="font-semibold text-ink">{part.slice(2, -2)}</strong>)
    } else if (part.startsWith('`') && part.endsWith('`')) {
      out.push(
        <code key={key} className="rounded bg-white/8 px-1.5 py-0.5 font-mono text-[0.86em] text-amber-soft">
          {part.slice(1, -1)}
        </code>,
      )
    } else if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
      out.push(<em key={key} className="italic text-ink-dim">{part.slice(1, -1)}</em>)
    } else if (part.startsWith('[[') && part.endsWith(']]')) {
      // the wiki's own cross-links
      const name = part.slice(2, -2).trim()
      out.push(
        <button
          key={key}
          onClick={() => openPage?.(name)}
          className="text-amber underline decoration-amber/40 underline-offset-4 transition-colors hover:decoration-amber"
        >
          {name}
        </button>,
      )
    } else {
      const link = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/)
      if (link) {
        const href = link[2]!
        const external = /^https?:/.test(href)
        out.push(
          <a
            key={key}
            href={href}
            target={external ? '_blank' : undefined}
            rel="noreferrer"
            className="text-amber underline decoration-amber/40 underline-offset-4 transition-colors hover:decoration-amber"
          >
            {link[1]}
          </a>,
        )
      } else {
        out.push(part)
      }
    }
  })
  return out
}

const cells = (row: string) => row.split('|').slice(1, -1).map((c) => c.trim())

export function renderMarkdown(md: string, onPage?: (slug: string) => void): ReactNode[] {
  openPage = onPage ?? null
  const lines = md.replace(/\r/g, '').split('\n')
  const out: ReactNode[] = []
  let i = 0
  let key = 0
  const k = () => `md-${key++}`

  while (i < lines.length) {
    const line = lines[i]!

    if (!line.trim()) { i++; continue }

    // fenced code
    if (line.startsWith('```')) {
      const body: string[] = []
      i++
      while (i < lines.length && !lines[i]!.startsWith('```')) { body.push(lines[i]!); i++ }
      i++
      out.push(
        <pre key={k()} className="panel max-w-full overflow-x-auto p-4 font-mono text-[0.82rem] leading-relaxed text-ink-dim">
          <code>{body.join('\n')}</code>
        </pre>,
      )
      continue
    }

    // headings
    const h = line.match(/^(#{1,4})\s+(.*)$/)
    if (h) {
      const level = h[1]!.length
      const text = h[2]!
      if (level === 1) {
        out.push(<h3 key={k()} className="display mt-2 text-[1.9rem] leading-tight text-ink">{inline(text, k())}</h3>)
      } else if (level === 2) {
        out.push(<h4 key={k()} className="mt-8 text-[1.15rem] font-semibold tracking-tight text-ink">{inline(text, k())}</h4>)
      } else {
        out.push(<h5 key={k()} className="mt-6 font-mono text-[0.86rem] tracking-[0.1em] text-amber">{inline(text, k())}</h5>)
      }
      i++
      continue
    }

    // table
    if (line.startsWith('|') && lines[i + 1]?.match(/^\|\s*[-:| ]+\|/)) {
      const head = cells(line)
      i += 2
      const rows: string[][] = []
      while (i < lines.length && lines[i]!.startsWith('|')) { rows.push(cells(lines[i]!)); i++ }
      out.push(
        <div key={k()} className="panel mt-4 max-w-full overflow-x-auto">
          <table className="w-full border-collapse text-left text-[0.9rem]">
            <thead>
              <tr>
                {head.map((c, ci) => (
                  <th key={ci} className="border-b border-white/10 px-4 py-3 font-mono text-[0.72rem] uppercase tracking-[0.1em] text-ink-faint">
                    {inline(c, `h${ci}`)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, ri) => (
                <tr key={ri} className="align-top transition-colors hover:bg-white/3">
                  {r.map((c, ci) => (
                    <td key={ci} className="border-b border-white/6 px-4 py-3 text-ink-dim">{inline(c, `c${ri}-${ci}`)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>,
      )
      continue
    }

    // list (bullet or checkbox)
    if (/^\s*[-*]\s+/.test(line)) {
      const items: string[] = []
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i]!)) {
        items.push(lines[i]!.replace(/^\s*[-*]\s+/, ''))
        i++
      }
      out.push(
        <ul key={k()} className="mt-4 space-y-2.5">
          {items.map((item, ii) => {
            const done = item.startsWith('[x] ')
            const open = item.startsWith('[ ] ')
            const text = done || open ? item.slice(4) : item
            return (
              <li key={ii} className="flex gap-3 text-[0.98rem] leading-relaxed text-ink-dim">
                <span className={done ? 'text-moss' : open ? 'text-ink-faint' : 'text-amber/70'}>
                  {done ? '✓' : open ? '○' : '—'}
                </span>
                <span>{inline(text, `li${ii}`)}</span>
              </li>
            )
          })}
        </ul>,
      )
      continue
    }

    // blockquote
    if (line.startsWith('> ')) {
      const body: string[] = []
      while (i < lines.length && lines[i]!.startsWith('> ')) { body.push(lines[i]!.slice(2)); i++ }
      out.push(
        <blockquote key={k()} className="mt-5 border-l-2 border-amber/50 pl-5 text-[1rem] leading-relaxed text-ink-dim">
          {inline(body.join(' '), k())}
        </blockquote>,
      )
      continue
    }

    if (/^---+$/.test(line.trim())) {
      out.push(<hr key={k()} className="mt-8 border-white/8" />)
      i++
      continue
    }

    // paragraph
    const para: string[] = []
    while (i < lines.length && lines[i]!.trim() && !/^(#{1,4}\s|\||>\s|```|\s*[-*]\s|---+$)/.test(lines[i]!)) {
      para.push(lines[i]!)
      i++
    }
    out.push(
      <p key={k()} className="mt-4 text-[1rem] leading-relaxed text-ink-dim">{inline(para.join(' '), k())}</p>,
    )
  }

  return out
}

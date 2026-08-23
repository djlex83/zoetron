import { Fragment, useEffect, useRef, useState } from 'react'
import { sections } from '../lib/content'
import { useLang } from '../lib/lang'
import type { Seed } from '../lib/live'
import { renderMarkdown } from '../lib/markdown'
import { LiveDot, Section, SectionHead } from './ui'

/** the two pages that already have a section of their own */
const OWN_SECTION: Record<string, string> = { Ideen: '#ideen', Tabelle: '#gehirn' }

export default function Wiki({ seed }: { seed: Seed | null }) {
  const { lang } = useLang()
  const pages = (seed?.wiki ?? []).filter((p) => !(p.slug in OWN_SECTION))
  const [slug, setSlug] = useState<string | null>(null)
  const [body, setBody] = useState<string | null>(null)
  const [failed, setFailed] = useState(false)
  const reader = useRef<HTMLDivElement>(null)

  // start on the wiki's own home page as soon as the index arrives
  useEffect(() => {
    if (slug || !pages.length) return
    setSlug(pages.find((p) => p.slug === 'Home')?.slug ?? pages[0]!.slug)
  }, [pages.length, slug, pages])

  useEffect(() => {
    if (!slug) return
    const ctrl = new AbortController()
    setBody(null)
    setFailed(false)
    const page = pages.find((x) => x.slug === slug)
    if (!page) return
    fetch(`./${page.path}?t=${Math.floor(Date.now() / 60_000)}`, { signal: ctrl.signal, cache: 'no-store' })
      .then((r) => (r.ok ? r.text() : Promise.reject(new Error(String(r.status)))))
      .then(setBody)
      .catch((e) => { if (e.name !== 'AbortError') setFailed(true) })
    return () => ctrl.abort()
  }, [slug])

  const current = pages.find((p) => p.slug === slug)
  if (!pages.length) return null

  return (
    <Section id="wiki" className="border-t border-white/6">
      <SectionHead label={sections.wiki.label} head={sections.wiki.head} sub={sections.wiki.sub} />

      <div className="mt-12 grid min-w-0 grid-cols-[minmax(0,1fr)] gap-6 lg:mt-16 lg:grid-cols-[19rem_minmax(0,1fr)] lg:gap-10">
        {/* --- page list --- */}
        <div data-reveal className="lg:sticky lg:top-28 lg:self-start">
          <div className="flex gap-2 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible lg:pb-0"
               style={{ scrollbarWidth: 'none' }}>
            {pages.map((p, pi) => (
              <Fragment key={p.slug}>
                {p.group === 'report' && pages[pi - 1]?.group !== 'report' && (
                  <span className="label mt-4 hidden lg:block">
                    {lang === 'de' ? 'Wochenreports' : 'Weekly reports'}
                  </span>
                )}
              <button
                onClick={() => {
                  setSlug(p.slug)
                  if (window.innerWidth < 1024) {
                    requestAnimationFrame(() => reader.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
                  }
                }}
                className="pill shrink-0 lg:w-full lg:justify-start"
                data-active={p.slug === slug ? '1' : '0'}
                style={{ height: 'auto', padding: '10px 14px', whiteSpace: 'normal' }}
              >
                <span className="flex flex-col items-start gap-0.5 text-left">
                  <span className="text-[0.95rem] leading-tight">{p.title}</span>
                  {p.intro && (
                    <span className="hidden text-[0.72rem] leading-snug text-ink-faint lg:block">
                      {p.intro.slice(0, 54).trim()}…
                    </span>
                  )}
                </span>
              </button>
              </Fragment>
            ))}
          </div>

          <p className="mt-5 hidden text-[0.82rem] leading-relaxed text-ink-faint lg:block">
            {lang === 'de'
              ? 'Jede Seite schreibt der Organismus selbst und spiegelt sie bei jedem Herzschlag nach docs/wiki/.'
              : 'The organism writes every page itself and mirrors it into docs/wiki/ on every heartbeat.'}
          </p>
        </div>

        {/* --- reader --- */}
        <article ref={reader} data-reveal className="panel panel-lg min-w-0 scroll-mt-24 p-6 sm:p-9">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/8 pb-5">
            <div className="flex items-center gap-3">
              <LiveDot label="live" />
              <span className="font-mono text-[0.74rem] text-ink-faint">docs/{current?.path}</span>
            </div>
            <a
              href={`https://github.com/djlex83/zoetron/blob/main/docs/${current?.path ?? ''}`}
              target="_blank"
              rel="noreferrer"
              className="btn btn-ghost"
              style={{ height: 'calc(var(--nav-h) - 6px)', padding: '0 14px', fontSize: '0.78rem' }}
            >
              {lang === 'de' ? 'Quelle ansehen ↗' : 'View source ↗'}
            </a>
          </div>

          <div className="pt-2">
            {body && renderMarkdown(body, (name) => {
              const hit = pages.find((x) => x.slug.toLowerCase() === name.toLowerCase())
              if (hit) { setSlug(hit.slug); reader.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }) }
            })}

            {!body && !failed && (
              <div className="mt-6 space-y-3">
                {[0, 1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-2.5 animate-pulse rounded bg-white/7" style={{ width: `${90 - i * 11}%` }} />
                ))}
              </div>
            )}

            {failed && (
              <p className="mt-6 text-[0.95rem] text-ink-faint">
                {lang === 'de'
                  ? 'Diese Seite ließ sich gerade nicht laden — sie wird bei jedem Herzschlag neu geschrieben.'
                  : 'This page could not be loaded right now — it is rewritten on every heartbeat.'}
              </p>
            )}
          </div>

          {current && (
            <div className="mt-8 border-t border-white/8 pt-5 font-mono text-[0.72rem] text-ink-faint">
              {lang === 'de' ? 'Umfang' : 'size'}: {(current.bytes / 1024).toFixed(1)} kB
            </div>
          )}
        </article>
      </div>
    </Section>
  )
}

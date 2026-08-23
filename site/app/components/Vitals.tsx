import { useEffect, useRef } from 'react'
import { vitals, honesty } from '../lib/content'
import { useLang } from '../lib/lang'
import { countUp } from '../lib/anim'
import type { Beat, Leaderboard, MemoryFeed, Seed } from '../lib/live'
import { LiveDot } from './ui'

export default function Vitals({
  seed, board, beat, memory,
}: { seed: Seed | null; board: Leaderboard | null; beat: Beat | null; memory: MemoryFeed | null }) {
  const { lang, t } = useLang()
  const root = useRef<HTMLDivElement>(null)

  // null = not known right now; the tile shows an em dash instead of a lie
  const values: Record<string, { v: number | null; d?: number }> = {
    neurons: { v: board?.neurons || seed?.memory.neurons || null },
    synapses: { v: board?.synapses || seed?.memory.synapses || null },
    facts: { v: memory?.facts || seed?.memory.facts || null },
    beats: { v: beat?.per24h || seed?.beats.per24h || null },
    score: { v: seed?.learning.swarm.schnitt || null, d: 2 },
    tools: { v: seed?.learning.tools.length || null },
  }

  useEffect(() => {
    const host = root.current
    if (!host) return
    host.querySelectorAll<HTMLElement>('[data-count]').forEach((el) => {
      const key = el.dataset.count!
      const spec = values[key]
      if (!spec?.v) { el.textContent = '—'; return }
      countUp(el, spec.v, spec.d ?? 0)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [board?.neurons, memory?.facts, beat?.per24h, seed?.learning.swarm.schnitt])

  const messages = beat?.messages?.length
    ? beat.messages
    : [lang === 'de' ? 'herzschlag: organzyklus + gedächtnis-sync' : 'heartbeat: organ cycle + memory sync']

  return (
    <div ref={root} className="relative border-y border-white/6 bg-abyss/60">
      {/* live heartbeat ticker straight from the commit log */}
      <div className="ticker relative flex items-center gap-6 overflow-hidden border-b border-white/6 py-2.5">
        <div className="ticker-track flex w-max shrink-0 items-center gap-6 whitespace-nowrap">
          {[...messages, ...messages, ...messages, ...messages].map((m, i) => (
            <span key={i} className="flex items-center gap-3 font-mono text-[0.76rem] text-ink-faint">
              <span className="text-pulse">♥</span>
              {m}
            </span>
          ))}
        </div>
        <div className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-abyss to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-abyss to-transparent" />
      </div>

      <div className="mx-auto grid w-full max-w-6xl grid-cols-2 gap-px bg-white/6 sm:grid-cols-3 lg:grid-cols-6">
        {vitals.map((v) => (
          <div key={v.key} data-reveal className="group bg-void px-6 py-9 transition-colors duration-500 hover:bg-abyss">
            <div className="font-mono text-[2.4rem] leading-none text-ink tabular-nums sm:text-[2.9rem]">
              <span data-count={v.key}>—</span>
            </div>
            <div className="mt-3 text-[0.88rem] font-medium text-ink">{t(v.label)}</div>
            <div className="mt-1 text-[0.78rem] leading-snug text-ink-faint">{t(v.hint)}</div>
          </div>
        ))}
      </div>

      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-x-5 gap-y-2 border-t border-white/6 px-5 py-4 sm:px-8">
        <LiveDot label={lang === 'de' ? 'live aus dem Logbuch' : 'live from the logbook'} tone="amber" />
        <p className="max-w-3xl text-[0.8rem] leading-relaxed text-ink-faint">{t(honesty)}</p>
      </div>
    </div>
  )
}

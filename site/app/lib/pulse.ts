import { useEffect, useState } from 'react'
import { phases } from './content'

const CYCLE = 5 * 60 * 1000 // one heartbeat: 5 minutes

export type Cycle = {
  /** 0…1 through the current 5-minute cycle */
  t: number
  /** index into `phases` — the organ that is running right now */
  index: number
  /** ms until the next heartbeat */
  toNext: number
  /** ms since the last commit we know of */
  since: number
  /** false while we have no heartbeat timestamp yet */
  known: boolean
}

/**
 * Turns the last heartbeat commit into a live clock. The daemon runs a full
 * organ cycle every 5 minutes in a fixed order, so the elapsed time tells us
 * which organ is working at this very second.
 */
export function useCycle(lastISO: string | null): Cycle {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  const known = Boolean(lastISO)
  const last = lastISO ? new Date(lastISO).getTime() : now
  const since = Math.max(0, now - last)
  const t = (since % CYCLE) / CYCLE
  return {
    t,
    index: Math.min(phases.length - 1, Math.floor(t * phases.length)),
    toNext: CYCLE - (since % CYCLE),
    since,
    known,
  }
}

export const mmss = (ms: number) => {
  const s = Math.max(0, Math.round(ms / 1000))
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

/** ms until the given phase index starts again inside the 5-minute cycle */
export function timeToPhase(cycle: Cycle, index: number) {
  const share = index / phases.length
  return (((share - cycle.t) % 1) + 1) % 1 * CYCLE
}

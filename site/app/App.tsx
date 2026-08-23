import { useEffect, useState } from 'react'
import {
  fetchBeat, fetchIdeas, fetchLeaderboard, fetchMemory, fetchSeed,
  type Beat, type Ideas as IdeasData, type Leaderboard, type MemoryFeed, type Pulse, type Seed,
} from './lib/live'
import { ScrollTrigger } from './lib/anim'
import { installReveal } from './lib/reveal'
import { installAppear } from './lib/appear'
import type { Brain } from './lib/brain'
import Nav from './components/Nav'
import Hero from './components/Hero'
import Heartbeat from './components/Heartbeat'
import Vitals from './components/Vitals'
import Cadence from './components/Cadence'
import Organs from './components/Organs'
import BrainStage from './components/BrainStage'
import Memory from './components/Memory'
import Consistency from './components/Consistency'
import Ideas from './components/Ideas'
import Wiki from './components/Wiki'
import Access from './components/Access'
import Footer from './components/Footer'

/** Everything below is best-effort: a dead feed must never blank the page. */
function useFeed<T>(load: (s: AbortSignal) => Promise<T>, everyMs = 0, enabled = true) {
  const [data, setData] = useState<T | null>(null)
  useEffect(() => {
    if (!enabled) return
    const ctrl = new AbortController()
    let timer = 0
    const run = () => {
      load(ctrl.signal)
        .then((d) => { setData(d); ScrollTrigger.refresh() })
        .catch(() => { /* offline, rate-limited or file not deployed yet */ })
    }
    run()
    if (everyMs > 0) timer = window.setInterval(run, everyMs)
    return () => { ctrl.abort(); if (timer) clearInterval(timer) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled])
  return data
}

export default function App() {
  const seed = useFeed<Seed>(fetchSeed)
  const ideas = useFeed<IdeasData>(fetchIdeas, 5 * 60_000)
  const board = useFeed<Leaderboard>(fetchLeaderboard, 5 * 60_000)
  const beat = useFeed<Beat>(fetchBeat, 90_000)

  // 300 kB of raw memory — only once the reader is close to that section
  const [brain, setBrain] = useState<Brain | null>(null)
  const [wantsMemory, setWantsMemory] = useState(false)
  useEffect(() => {
    const el = document.getElementById('gedaechtnis')
    if (!el) return
    const obs = new IntersectionObserver(
      ([e]) => { if (e?.isIntersecting) { setWantsMemory(true); obs.disconnect() } },
      { rootMargin: '900px 0px' },
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [seed])
  const memory = useFeed<MemoryFeed>(fetchMemory, 5 * 60_000, wantsMemory)

  // the GitHub API is rate-limited per IP, so fall back to the timestamp the
  // build froze into state.json — flagged as not-live so nothing pretends
  const pulse: Pulse = {
    iso: beat?.lastISO ?? seed?.beats.last ?? null,
    live: Boolean(beat?.lastISO),
  }

  useEffect(() => installReveal(), [])
  useEffect(() => installAppear(), [])

  useEffect(() => {
    document.documentElement.classList.add('is-ready')
    const id = window.setTimeout(() => ScrollTrigger.refresh(), 400)
    return () => clearTimeout(id)
  }, [])

  return (
    <div className="grain relative">
      <Nav pulse={pulse} />
      <main>
        <Hero pulse={pulse} board={board} beat={beat} seed={seed} />
        <Heartbeat pulse={pulse} />
        <Vitals seed={seed} board={board} beat={beat} memory={memory} />
        <Cadence pulse={pulse} />
        <Organs pulse={pulse} />
        <BrainStage board={board} pulse={pulse} onBrain={setBrain} />
        <Memory memory={memory} seed={seed} />
        <Consistency board={board} brain={brain} ideas={ideas} memory={memory} beat={beat} seed={seed} onBrain={setBrain} />
        <Ideas ideas={ideas} seed={seed} />
        <Wiki seed={seed} />
        <Access />
      </main>
      <Footer pulse={pulse} seed={seed} />
    </div>
  )
}

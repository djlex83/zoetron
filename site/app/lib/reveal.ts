/**
 * Reveal-on-scroll for every [data-reveal] element.
 *
 * Deliberately CSS transitions instead of a GSAP batch: large parts of this
 * page arrive late (ideas board, leaderboard, memory), and a scope-bound GSAP
 * context would either miss those nodes or reset the ones it already animated.
 * A MutationObserver picks up whatever the organism delivers afterwards.
 */
const DONE = 'revealed'

export function installReveal() {
  if (typeof window === 'undefined') return () => {}

  const still =
    window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
    new URLSearchParams(window.location.search).has('still')

  if (still) {
    document.querySelectorAll('[data-reveal]').forEach((el) => el.classList.add(DONE))
    const mo = new MutationObserver(() =>
      document.querySelectorAll(`[data-reveal]:not(.${DONE})`).forEach((el) => el.classList.add(DONE)),
    )
    mo.observe(document.body, { childList: true, subtree: true })
    return () => mo.disconnect()
  }

  let batch: Element[] = []
  let flush = 0

  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue
        io.unobserve(entry.target)
        batch.push(entry.target)
      }
      if (!batch.length || flush) return
      // everything that crossed in the same frame shares one stagger
      flush = requestAnimationFrame(() => {
        flush = 0
        batch.forEach((el, i) => {
          ;(el as HTMLElement).style.transitionDelay = `${Math.min(i, 8) * 70}ms`
          el.classList.add(DONE)
        })
        batch = []
      })
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.08 },
  )

  const scan = () =>
    document.querySelectorAll(`[data-reveal]:not(.${DONE})`).forEach((el) => io.observe(el))

  scan()
  const mo = new MutationObserver(scan)
  mo.observe(document.body, { childList: true, subtree: true })

  return () => { mo.disconnect(); io.disconnect(); cancelAnimationFrame(flush) }
}

import { useLayoutEffect, useRef, type RefObject } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

/** iOS/Android address-bar resize must not re-trigger every pin. */
ScrollTrigger.config({ ignoreMobileResize: true })

/**
 * True when motion should be skipped entirely. `?still` forces the same path —
 * handy for screenshots, printing and debugging a stuck animation.
 */
export const reduced = () =>
  typeof window !== 'undefined' &&
  (window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
    new URLSearchParams(window.location.search).has('still'))

export const isTouch = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(hover: none), (pointer: coarse)').matches

export { gsap, ScrollTrigger }

/**
 * Scopes a GSAP context to a ref. Everything created inside is reverted on
 * unmount — including ScrollTriggers, which otherwise leak pin-spacers.
 */
export function useGsap(
  setup: (ctx: { self: HTMLElement }) => void,
  ref: RefObject<HTMLElement | null>,
  deps: unknown[] = [],
) {
  const saved = useRef(setup)
  saved.current = setup
  useLayoutEffect(() => {
    const self = ref.current
    if (!self) return
    const ctx = gsap.context(() => saved.current({ self }), self)
    return () => ctx.revert()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
}

/**
 * Count-up for a live number. Uses an IntersectionObserver rather than a
 * ScrollTrigger: these values arrive from the network long after the section
 * was laid out, and a refreshed once-trigger can silently never fire.
 */
export function countUp(el: HTMLElement, to: number, decimals = 0) {
  const fmt = (v: number) =>
    decimals > 0
      ? v.toFixed(decimals).replace('.', ',')
      : Math.round(v).toLocaleString('de-DE')

  if (reduced()) {
    el.textContent = fmt(to)
    return
  }

  const run = () => {
    const obj = { v: 0 }
    gsap.to(obj, {
      v: to,
      duration: 1.9,
      ease: 'expo.out',
      overwrite: true,
      onUpdate: () => { el.textContent = fmt(obj.v) },
    })
  }

  const box = el.getBoundingClientRect()
  if (box.top < window.innerHeight && box.bottom > 0) { run(); return }
  if (box.bottom <= 0) { el.textContent = fmt(to); return }

  const io = new IntersectionObserver(
    ([entry]) => { if (entry?.isIntersecting) { io.disconnect(); run() } },
    { threshold: 0.15 },
  )
  io.observe(el)
}

/** Fonts change layout metrics; stale trigger positions look like jitter. */
if (typeof document !== 'undefined' && 'fonts' in document) {
  document.fonts.ready.then(() => ScrollTrigger.refresh())
}

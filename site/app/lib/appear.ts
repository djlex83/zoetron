/**
 * Entrance choreography for the opening screen.
 *
 * The CSS keeps `.appear` at opacity 1 at rest, so a failed animation can
 * never leave the page blank. Each element promotes itself to `.is-in` when
 * its own animation ends; if nothing is animating two frames in, everything is
 * promoted at once.
 */
export function installAppear() {
  if (typeof document === 'undefined') return () => {}

  const nodes = Array.from(document.querySelectorAll<HTMLElement>('.appear'))
  const done = (el: HTMLElement) => el.classList.add('is-in')

  nodes.forEach((el) => el.addEventListener('animationend', () => done(el), { once: true }))

  let raf = requestAnimationFrame(() => {
    raf = requestAnimationFrame(() => {
      for (const el of nodes) {
        const anims = el.getAnimations?.() ?? []
        const live = anims.some((a) => a.playState === 'running' || a.playState === 'finished')
        if (!live) done(el)
      }
    })
  })

  return () => cancelAnimationFrame(raf)
}

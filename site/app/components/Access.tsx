import { useRef } from 'react'
import { accessNote, sections, tiers } from '../lib/content'
import { useLang } from '../lib/lang'
import { gsap, reduced, useGsap } from '../lib/anim'
import { Section, SectionHead } from './ui'

export default function Access() {
  const { lang, t } = useLang()
  const root = useRef<HTMLDivElement>(null)

  useGsap(({ self }) => {
    if (reduced()) return
    gsap.utils.toArray<HTMLElement>('[data-tier]', self).forEach((card, i) => {
      gsap.fromTo(
        card,
        { y: 40 + i * 12 },
        {
          y: 0, ease: 'none',
          scrollTrigger: { trigger: card, start: 'top 96%', end: 'top 46%', scrub: 0.7 },
        },
      )
    })
  }, root, [])

  return (
    <Section id="zugang" className="border-t border-white/6">
      <div ref={root}>
        <SectionHead label={sections.zugang.label} head={sections.zugang.head} sub={sections.zugang.sub} align="center" />

        <div className="mt-14 grid gap-4 lg:mt-20 lg:grid-cols-3 lg:items-start">
          {tiers.map((tier) => (
            <article
              key={tier.key}
              data-tier
              data-reveal
              className={`glass relative flex flex-col rounded-3xl p-7 transition-transform duration-500 hover:-translate-y-1 sm:p-8 ${
                tier.featured ? 'border-amber/35 lg:-mt-4 lg:pb-10' : ''
              }`}
            >
              {tier.featured && (
                <>
                  <div
                    className="pointer-events-none absolute inset-0 rounded-3xl"
                    style={{ background: 'radial-gradient(80% 55% at 50% 0%, rgb(245 165 36 / 0.14), transparent 70%)' }}
                  />
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-amber px-3 py-1 font-mono text-[0.7rem] uppercase tracking-[0.16em] text-void">
                    {lang === 'de' ? 'ernsthafte Anfrage' : 'serious request'}
                  </span>
                </>
              )}

              <div className="relative">
                <h3 className="display text-3xl text-ink">{t(tier.name)}</h3>
                <div className="mt-5 flex items-baseline gap-2">
                  <span className={`display text-[3.2rem] leading-none ${tier.featured ? 'text-amber' : 'text-ink'}`}>
                    {t(tier.price)}
                  </span>
                </div>
                <div className="mt-2 font-mono text-[0.74rem] uppercase tracking-[0.14em] text-ink-faint">
                  {t(tier.priceNote)}
                </div>
                <p className="mt-5 text-[0.98rem] leading-relaxed text-ink-dim">{t(tier.body)}</p>

                <ul className="mt-7 space-y-3 border-t border-white/8 pt-6">
                  {tier.items.map((item, i) => (
                    <li key={i} className="flex gap-3 text-[0.95rem] leading-relaxed text-ink-dim">
                      <span className={tier.featured ? 'text-amber' : 'text-ink-faint'}>—</span>
                      <span>{t(item)}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <a
                href={tier.href}
                target={tier.href.startsWith('http') ? '_blank' : undefined}
                rel="noreferrer"
                className={`btn btn-hero mt-8 w-full ${tier.featured ? 'btn-solid' : 'btn-ghost'}`}
              >
                {t(tier.cta)}
              </a>
            </article>
          ))}
        </div>

        <div data-reveal className="mx-auto mt-10 max-w-2xl rounded-2xl border border-amber/25 bg-amber/5 px-6 py-5 text-center">
          <div className="label text-amber/90">🔒 {lang === 'de' ? 'Zugang zum Quellcode' : 'Source access'}</div>
          <p className="mt-3 text-[0.95rem] leading-relaxed text-ink-dim">{t(accessNote)}</p>
        </div>
      </div>
    </Section>
  )
}

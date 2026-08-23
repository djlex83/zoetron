import { footer } from '../lib/content'
import { useLang } from '../lib/lang'
import { agoDE, type Pulse, type Seed } from '../lib/live'
import { LiveDot } from './ui'

export default function Footer({ pulse, seed }: { pulse: Pulse; seed: Seed | null }) {
  const { lang, t } = useLang()
  const built = seed?.generatedAt ? new Date(seed.generatedAt) : null

  return (
    <footer className="relative border-t border-white/8 px-5 pb-12 pt-16 sm:px-8">
      <div className="mx-auto w-full max-w-6xl">
        <div className="grid gap-12 lg:grid-cols-[1.3fr_repeat(3,minmax(0,1fr))]">
          <div>
            <a href="#top" className="flex items-center gap-2.5">
              <span className="text-lg leading-none beat">🫀</span>
              <span className="display text-2xl text-ink">Zoetron</span>
            </a>
            <p className="mt-4 max-w-xs text-[0.96rem] leading-relaxed text-ink-faint">{t(footer.tag)}</p>
            <div className="mt-6 flex items-center gap-3">
              <LiveDot label={`${lang === 'de' ? 'letzter Herzschlag' : 'last heartbeat'} ${agoDE(pulse.iso, lang)}`} />
            </div>
          </div>

          {footer.cols.map((col) => (
            <div key={col.head.en}>
              <h3 className="label">{t(col.head)}</h3>
              <ul className="mt-5 space-y-3">
                {col.links.map((l) => (
                  <li key={l.href}>
                    <a
                      href={l.href}
                      target={l.href.startsWith('http') ? '_blank' : undefined}
                      rel="noreferrer"
                      className="text-[0.98rem] text-ink-dim transition-colors duration-300 hover:text-amber"
                    >
                      {t(l.label)}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 flex flex-col gap-3 border-t border-white/8 pt-6 text-[0.8rem] text-ink-faint sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-xl leading-relaxed">{t(footer.legal)}</p>
          <p className="font-mono">
            {built
              ? `${lang === 'de' ? 'Seite gebaut' : 'page built'} ${built.toISOString().slice(0, 16).replace('T', ' ')} UTC`
              : ''}
          </p>
        </div>
      </div>
    </footer>
  )
}

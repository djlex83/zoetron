import type { ReactNode } from 'react'
import { useLang } from '../lib/lang'
import type { L } from '../lib/content'

export function SectionHead({
  label, head, sub, align = 'left',
}: { label: L; head: L; sub?: L; align?: 'left' | 'center' }) {
  const { t } = useLang()
  return (
    <header className={align === 'center' ? 'mx-auto max-w-2xl text-center' : 'max-w-3xl'}>
      <div data-reveal className="flex items-center gap-3" style={align === 'center' ? { justifyContent: 'center' } : undefined}>
        <span className="h-px w-10 bg-amber/60" />
        <span className="label text-amber/90">{t(label)}</span>
      </div>
      <h2 data-reveal className="display mt-5 text-[clamp(2.6rem,7.2vw,5.6rem)] whitespace-pre-line text-ink">
        {t(head)}
      </h2>
      {sub && (
        <p data-reveal className="mt-7 max-w-2xl text-[1.12rem] leading-relaxed text-ink-dim sm:text-[1.22rem]"
           style={align === 'center' ? { marginInline: 'auto' } : undefined}>
          {t(sub)}
        </p>
      )}
    </header>
  )
}

export function LiveDot({ label, tone = 'pulse' }: { label?: string; tone?: 'pulse' | 'amber' }) {
  const color = tone === 'pulse' ? 'bg-pulse' : 'bg-amber'
  return (
    <span className="inline-flex items-center gap-2">
      <span className="relative flex h-2 w-2">
        <span className={`absolute inline-flex h-full w-full rounded-full ${color} opacity-60 beat`} />
        <span className={`relative inline-flex h-2 w-2 rounded-full ${color}`} />
      </span>
      {label && <span className="label text-[0.71rem] text-ink-dim">{label}</span>}
    </span>
  )
}

export function Panel({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`glass rounded-2xl ${className}`}>{children}</div>
}

export function Section({
  id, children, className = '',
}: { id?: string; children: ReactNode; className?: string }) {
  return (
    <section id={id} className={`relative scroll-mt-24 px-5 py-28 sm:px-8 sm:py-36 lg:py-44 ${className}`}>
      <div className="mx-auto w-full max-w-6xl">{children}</div>
    </section>
  )
}

export function Hairline() {
  return <div className="hairline mx-auto h-px w-full max-w-6xl opacity-70" />
}

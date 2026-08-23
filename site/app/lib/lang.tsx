import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Lang, L } from './content'

const Ctx = createContext<{ lang: Lang; setLang: (l: Lang) => void }>({
  lang: 'de',
  setLang: () => {},
})

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>(() => {
    const saved = typeof localStorage !== 'undefined' ? localStorage.getItem('zoetron-lang') : null
    if (saved === 'de' || saved === 'en') return saved
    return typeof navigator !== 'undefined' && navigator.language.startsWith('de') ? 'de' : 'en'
  })
  useEffect(() => {
    document.documentElement.lang = lang
    localStorage.setItem('zoetron-lang', lang)
  }, [lang])
  return <Ctx.Provider value={{ lang, setLang }}>{children}</Ctx.Provider>
}

export function useLang() {
  const { lang, setLang } = useContext(Ctx)
  return { lang, setLang, t: (v: L) => v[lang] }
}

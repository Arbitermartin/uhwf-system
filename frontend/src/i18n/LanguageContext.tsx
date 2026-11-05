/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import en from './en'
import sw from './sw'
import type { Dictionary, TranslationKey } from './en'

export type Lang = 'en' | 'sw'

const STORAGE_KEY = 'lang'
const dictionaries: Record<Lang, Dictionary> = { en, sw }

const detectInitial = (): Lang => {
    try {
        const saved = localStorage.getItem(STORAGE_KEY)
        if (saved === 'en' || saved === 'sw') return saved
    } catch {
        /* storage can be blocked; fall through */
    }
    return navigator.language?.toLowerCase().startsWith('sw') ? 'sw' : 'en'
}

type Ctx = {
    lang: Lang
    setLang: (l: Lang) => void
    /** t('key') or t('key', { time: '1:30' }) for {time} placeholders */
    t: (key: TranslationKey, params?: Record<string, string | number>) => string
}

const LanguageContext = createContext<Ctx | null>(null)

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
    const [lang, setLangState] = useState<Lang>(detectInitial)

    useEffect(() => {
        document.documentElement.lang = lang // screen readers and browser translation use this
        try {
            localStorage.setItem(STORAGE_KEY, lang)
        } catch {
            /* ignore */
        }
    }, [lang])

    const setLang = useCallback((l: Lang) => setLangState(l), [])

    const t = useCallback<Ctx['t']>(
        (key, params) => {
            let text = dictionaries[lang][key] ?? dictionaries.en[key] ?? key
            if (params) {
                for (const [k, v] of Object.entries(params)) text = text.split(`{${k}}`).join(String(v))
            }
            return text
        },
        [lang],
    )

    const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t])
    return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export const useLanguage = () => {
    const ctx = useContext(LanguageContext)
    if (!ctx) throw new Error('useLanguage must be used inside <LanguageProvider>')
    return ctx
}

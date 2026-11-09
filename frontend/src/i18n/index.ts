import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import { en } from './en'
import { sw } from './sw'

void i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources: { en: { translation: en }, sw: { translation: sw } },
        fallbackLng: 'en',
        supportedLngs: ['en', 'sw'],
        nonExplicitSupportedLngs: true, // sw-TZ and sw-KE count as sw
        load: 'languageOnly',
        interpolation: { escapeValue: false }, // React already escapes
        detection: {
            order: ['localStorage', 'navigator'], // the saved choice first, then the browser language
            lookupLocalStorage: 'uhwf_lang',
            caches: ['localStorage'],
        },
    })

const setHtmlLang = (lng: string) => {
    document.documentElement.lang = lng.startsWith('sw') ? 'sw' : 'en'
}
i18n.on('languageChanged', setHtmlLang)
setHtmlLang(i18n.language)

export default i18n
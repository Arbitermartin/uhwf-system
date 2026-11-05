import { useLanguage } from '../i18n/LanguageContext'
import type { Lang } from '../i18n/LanguageContext'

const options: Lang[] = ['en', 'sw']

// Small EN | SW toggle. Put it in the Navbar, the auth page headers and the dashboards.
const LanguageSwitcher = ({ className = '' }: { className?: string }) => {
    const { lang, setLang, t } = useLanguage()
    return (
        <div
            role="group"
            aria-label={t('lang.switch')}
            className={`inline-flex overflow-hidden rounded-lg border border-gray-200 bg-white text-xs font-semibold ${className}`}
        >
            {options.map((l) => (
                <button
                    key={l}
                    type="button"
                    onClick={() => setLang(l)}
                    aria-pressed={lang === l}
                    title={t(l === 'en' ? 'lang.en' : 'lang.sw')}
                    className={`px-2.5 py-1.5 transition-colors ${lang === l ? 'bg-green-800 text-white' : 'text-gray-600 hover:bg-green-50'
                        }`}
                >
                    {l.toUpperCase()}
                </button>
            ))}
        </div>
    )
}

export default LanguageSwitcher

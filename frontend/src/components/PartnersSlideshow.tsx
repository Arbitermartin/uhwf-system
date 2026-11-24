import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FaChevronLeft, FaChevronRight, FaExternalLinkAlt, FaHandshake, FaPause, FaPlay } from 'react-icons/fa'
import { listPublicPartners } from '../services/partners'
import type { PublicPartner } from '../services/partners'

const INTERVAL_MS = 6000

const PartnersSlideshow = () => {
    const { t } = useTranslation()
    const [partners, setPartners] = useState<PublicPartner[]>([])
    const [index, setIndex] = useState(0)
    const [userPaused, setUserPaused] = useState(false)
    // const [hovering, setHovering] = useState(false)
    const [tabHidden, setTabHidden] = useState(false)
    const [reduced, setReduced] = useState(false)

    useEffect(() => {
        let cancelled = false
        listPublicPartners()
            .then((list) => !cancelled && setPartners(list))
            .catch(() => undefined) // the rest of the Home page still works without this section
        return () => {
            cancelled = true
        }
    }, [])

    useEffect(() => {
        const query = window.matchMedia('(prefers-reduced-motion: reduce)')
        setReduced(query.matches)
        const onChange = () => setReduced(query.matches)
        query.addEventListener('change', onChange)
        return () => query.removeEventListener('change', onChange)
    }, [])

    useEffect(() => {
        const onChange = () => setTabHidden(document.hidden)
        document.addEventListener('visibilitychange', onChange)
        return () => document.removeEventListener('visibilitychange', onChange)
    }, [])

    const count = partners.length
    const playing = count > 1 && !userPaused && !tabHidden && !reduced

    useEffect(() => {
        if (!playing) return
        const id = window.setInterval(() => setIndex((i) => (i + 1) % count), INTERVAL_MS)
        return () => window.clearInterval(id)
    }, [playing, count])

    if (count === 0) return null // no partners yet: the section does not show

    const current = Math.min(index, count - 1)
    const go = (n: number) => setIndex(((n % count) + count) % count)

    return (
        <section
            aria-label={t('home.partnersTitle')}
            className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8"
        // onMouseEnter={() => setHovering(true)}
        // onMouseLeave={() => setHovering(false)}
        // onFocus={() => setHovering(true)}
        // onBlur={() => setHovering(false)}
        >
            <h2 className="text-center text-3xl font-bold text-green-800">{t('home.partnersTitle')}</h2>
            <div className="mx-auto mt-3 h-1 w-16 rounded bg-green-600" />
            <p className="mx-auto mt-4 max-w-2xl text-center text-gray-600">{t('home.partnersText')}</p>

            <div className="mt-10 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm sm:p-10">
                <div className="grid" aria-live={playing ? 'off' : 'polite'}>
                    {partners.map((p, i) => {
                        const active = i === current
                        return (
                            <article
                                key={p.id}
                                aria-hidden={!active}
                                className="col-start-1 row-start-1 grid items-center gap-8 md:grid-cols-5"
                                style={{
                                    opacity: active ? 1 : 0,
                                    visibility: active ? 'visible' : 'hidden',
                                    transition: reduced
                                        ? 'none'
                                        : active
                                            ? 'opacity 700ms ease-in-out'
                                            : 'opacity 700ms ease-in-out, visibility 0s linear 700ms',
                                }}
                            >
                                <div className="flex h-48 items-center justify-center rounded-xl bg-green-50 p-6 md:col-span-2">
                                    {p.logoUrl ? (
                                        <img
                                            src={p.logoUrl}
                                            alt={p.name}
                                            loading={i === 0 ? 'eager' : 'lazy'}
                                            decoding="async"
                                            className="max-h-full max-w-full object-contain"
                                        />
                                    ) : (
                                        <FaHandshake className="h-16 w-16 text-green-300" />
                                    )}
                                </div>
                                <div className="md:col-span-3">
                                    <h3 className="text-2xl font-bold text-green-950">{p.name}</h3>
                                    <p className="mt-3 whitespace-pre-line leading-relaxed text-gray-600">{p.description}</p>
                                    {p.website && (
                                        <a
                                            href={p.website}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            tabIndex={active ? 0 : -1}
                                            className="mt-5 inline-flex items-center gap-2 font-medium text-green-700 hover:text-green-900"
                                        >
                                            {t('home.visitSite')} <FaExternalLinkAlt className="h-3 w-3" />
                                        </a>
                                    )}
                                </div>
                            </article>
                        )
                    })}
                </div>

                {count > 1 && (
                    <div className="mt-8 flex items-center justify-center gap-3">
                        <button
                            type="button"
                            onClick={() => go(current - 1)}
                            aria-label={t('home.slidePrev')}
                            className="flex h-9 w-9 items-center justify-center rounded-full border border-green-200 text-green-900 hover:bg-green-50"
                        >
                            <FaChevronLeft className="h-3 w-3" />
                        </button>
                        <div className="flex items-center gap-2">
                            {partners.map((p, i) => (
                                <button
                                    key={p.id}
                                    type="button"
                                    onClick={() => go(i)}
                                    aria-label={t('home.slideGo', { n: i + 1, total: count })}
                                    aria-current={i === current}
                                    className={`h-2.5 rounded-full transition-all ${i === current ? 'w-7 bg-amber-400' : 'w-2.5 bg-green-200 hover:bg-green-400'}`}
                                />
                            ))}
                        </div>
                        <button
                            type="button"
                            onClick={() => go(current + 1)}
                            aria-label={t('home.slideNext')}
                            className="flex h-9 w-9 items-center justify-center rounded-full border border-green-200 text-green-900 hover:bg-green-50"
                        >
                            <FaChevronRight className="h-3 w-3" />
                        </button>
                        <button
                            type="button"
                            onClick={() => setUserPaused((v) => !v)}
                            aria-pressed={userPaused}
                            aria-label={userPaused ? t('home.slidePlay') : t('home.slidePause')}
                            className="flex h-9 w-9 items-center justify-center rounded-full bg-green-100 text-green-900 hover:bg-green-200"
                        >
                            {userPaused ? <FaPlay className="h-3 w-3" /> : <FaPause className="h-3 w-3" />}
                        </button>
                    </div>
                )}
            </div>
        </section>
    )
}

export default PartnersSlideshow
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { FaMapMarkedAlt, FaPaw, FaUsers, FaCalendarAlt, FaMapMarkerAlt, FaNewspaper } from 'react-icons/fa'
import heroImage from '../../assets/conservation.webp'
import { getErrorMessage } from '../../services/api'
import { badgeParts, getPublicHome, longDate } from '../../services/content'
import type { PublicEvent, PublicNews } from '../../services/content'

const focusAreas = [
    { id: 'land', to: '/land', icon: FaMapMarkedAlt },
    { id: 'wildlife', to: '/wildlife', icon: FaPaw },
    { id: 'community', to: '/services/community', icon: FaUsers },
] as const

const Home = () => {
    const { t, i18n } = useTranslation()
    const locale = i18n.language.startsWith('sw') ? 'sw-TZ' : 'en-GB'

    const [news, setNews] = useState<PublicNews[]>([])
    const [events, setEvents] = useState<PublicEvent[]>([])
    const [loading, setLoading] = useState(true)
    const [failed, setFailed] = useState(false)
    const [detail, setDetail] = useState('')

    useEffect(() => {
        let cancelled = false
        getPublicHome()
            .then((r) => {
                if (cancelled) return
                setNews(r.news)
                setEvents(r.events)
            })
            .catch((err) => {
                if (cancelled) return
                setFailed(true)
                setDetail(getErrorMessage(err, ''))
            })
            .finally(() => {
                if (!cancelled) setLoading(false)
            })
        return () => {
            cancelled = true
        }
    }, [])

    return (
        <div>
            {/* Hero */}
            <section className="relative">
                <img src={heroImage} alt="" className="absolute inset-0 h-full w-full object-cover" />
                <div className="absolute inset-0 bg-green-950/70" />
                <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32 lg:px-8">
                    <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-green-300">{t('home.eyebrow')}</p>
                    <h1 className="max-w-2xl text-4xl font-bold text-white sm:text-5xl lg:text-6xl">{t('home.heroTitle')}</h1>
                    <p className="mt-5 max-w-xl text-lg text-green-50">{t('home.heroText')}</p>
                    <div className="mt-8 flex flex-wrap gap-3">
                        <Link to="/register" className="rounded-md bg-green-500 px-6 py-3 font-semibold text-white transition-colors hover:bg-green-400">
                            {t('home.register')}
                        </Link>
                        <Link to="/about" className="rounded-md border border-white/70 px-6 py-3 font-semibold text-white transition-colors hover:bg-white/10">
                            {t('home.learnMore')}
                        </Link>
                    </div>
                </div>
            </section>

            {/* About */}
            <section className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6 lg:px-8">
                <h2 className="text-3xl font-bold text-green-800">{t('home.whoTitle')}</h2>
                <div className="mx-auto mt-3 h-1 w-16 rounded bg-green-600" />
                <p className="mt-6 leading-relaxed text-gray-600">{t('home.whoText')}</p>
            </section>

            {/* Focus areas */}
            <section className="bg-green-50 py-16">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <h2 className="text-center text-3xl font-bold text-green-800">{t('home.whatTitle')}</h2>
                    <div className="mx-auto mt-3 h-1 w-16 rounded bg-green-600" />
                    <div className="mt-10 grid gap-6 md:grid-cols-3">
                        {focusAreas.map(({ id, to, icon: Icon }) => (
                            <div key={id} className="rounded-xl bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-700">
                                    <Icon className="h-6 w-6" />
                                </div>
                                <h3 className="mt-4 text-xl font-semibold text-gray-900">{t(`home.focus.${id}.title`)}</h3>
                                <p className="mt-2 text-gray-600">{t(`home.focus.${id}.text`)}</p>
                                <Link to={to} className="mt-4 inline-block font-medium text-green-700 hover:text-green-900">
                                    {t('home.readMore')}
                                </Link>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Latest news */}
            <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
                <h2 className="text-center text-3xl font-bold text-green-800">{t('home.newsTitle')}</h2>
                <div className="mx-auto mt-3 h-1 w-16 rounded bg-green-600" />

                {loading && <p className="mt-10 text-center text-sm text-gray-500">{t('home.newsLoading')}</p>}

                {!loading && failed && (
                    <p role="alert" className="mt-10 rounded-lg bg-red-50 p-4 text-center text-sm text-red-700">
                        {detail || t('home.loadError')}
                    </p>
                )}

                {!loading && !failed && news.length === 0 && (
                    <div className="mt-10 rounded-xl border border-dashed border-green-200 bg-green-50 p-10 text-center">
                        <FaNewspaper className="mx-auto h-10 w-10 text-green-300" />
                        <p className="mt-4 text-gray-500">{t('home.newsEmpty1')}</p>
                        <p className="text-sm text-gray-400">{t('home.newsEmpty2')}</p>
                    </div>
                )}

                {news.length > 0 && (
                    <>
                        <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {news.map((item) => (
                                <article key={item.id} className="flex flex-col overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
                                    {item.image ? (
                                        <img src={item.image} alt="" loading="lazy" className="h-48 w-full object-cover" />
                                    ) : (
                                        <div className="flex h-48 items-center justify-center bg-green-100 text-green-300">
                                            <FaNewspaper className="h-12 w-12" />
                                        </div>
                                    )}
                                    <div className="flex flex-1 flex-col p-5">
                                        {item.publishedAt && <p className="text-sm text-gray-400">{longDate(item.publishedAt, locale)}</p>}
                                        <h3 className="mt-1 text-lg font-semibold text-gray-900">{item.title}</h3>
                                        <p className="mt-2 flex-1 text-gray-600">{item.excerpt}</p>
                                        <Link to={`/news/${item.id}`} className="mt-3 inline-block font-medium text-green-700 hover:text-green-900">
                                            {t('home.readFull')}
                                        </Link>
                                    </div>
                                </article>
                            ))}
                        </div>
                        <div className="mt-8 text-center">
                            <Link to="/news" className="font-medium text-green-700 hover:text-green-900">{t('home.allNews')}</Link>
                        </div>
                    </>
                )}
            </section>

            {/* Events */}
            <section className="bg-green-50 py-16">
                <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
                    <h2 className="text-center text-3xl font-bold text-green-800">{t('home.eventsTitle')}</h2>
                    <div className="mx-auto mt-3 h-1 w-16 rounded bg-green-600" />

                    {loading && <p className="mt-10 text-center text-sm text-gray-500">{t('home.eventsLoading')}</p>}

                    {!loading && !failed && events.length === 0 && (
                        <div className="mt-10 rounded-xl border border-dashed border-green-200 bg-white p-10 text-center">
                            <FaCalendarAlt className="mx-auto h-10 w-10 text-green-300" />
                            <p className="mt-4 text-gray-500">{t('home.eventsEmpty1')}</p>
                            <p className="text-sm text-gray-400">{t('home.eventsEmpty2')}</p>
                        </div>
                    )}

                    {events.length > 0 && (
                        <>
                            <div className="mt-10 space-y-4">
                                {events.map((event) => {
                                    const { day, month } = badgeParts(event.date, locale)
                                    return (
                                        <article key={event.id} className="flex gap-5 rounded-xl bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
                                            <div aria-hidden="true" className="flex h-20 w-20 shrink-0 flex-col items-center justify-center rounded-lg bg-green-700 text-white">
                                                <span className="text-2xl font-bold leading-none">{day}</span>
                                                <span className="text-xs font-semibold tracking-wide">{month}</span>
                                                <span className="text-xs text-green-200">{event.date.slice(0, 4)}</span>
                                            </div>
                                            <div className="min-w-0">
                                                <h3 className="text-lg font-semibold text-gray-900">{event.title}</h3>
                                                <p className="mt-1 flex items-center gap-1 text-sm text-gray-500">
                                                    <FaMapMarkerAlt className="h-3 w-3 text-green-600" />
                                                    {event.location}
                                                    {event.time !== '00:00' && <span> · {event.time}</span>}
                                                </p>
                                                {event.description && <p className="mt-2 whitespace-pre-line text-gray-600">{event.description}</p>}
                                            </div>
                                        </article>
                                    )
                                })}
                            </div>
                            <div className="mt-8 text-center">
                                <Link to="/events" className="font-medium text-green-700 hover:text-green-900">{t('home.allEvents')}</Link>
                            </div>
                        </>
                    )}
                </div>
            </section>

            {/* Call to action */}
            <section className="bg-green-800 py-14">
                <div className="mx-auto max-w-3xl px-4 text-center">
                    <h2 className="text-3xl font-bold text-white">{t('home.ctaTitle')}</h2>
                    <p className="mt-3 text-green-100">{t('home.ctaText')}</p>
                    <Link to="/register" className="mt-6 inline-block rounded-md bg-white px-6 py-3 font-semibold text-green-800 transition-colors hover:bg-green-100">
                        {t('home.register')}
                    </Link>
                </div>
            </section>
        </div>
    )
}

export default Home
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FaMapMarkerAlt, FaNewspaper } from 'react-icons/fa'
import { badgeParts, eventWhen, getPublicHome, longDate } from '../services/content'
import type { PublicEvent, PublicNews } from '../services/content'

// The "Latest news" and "Upcoming events" sections of the home page, read from the database.
const HomeNewsEvents = () => {
    const [news, setNews] = useState<PublicNews[] | null>(null)
    const [events, setEvents] = useState<PublicEvent[] | null>(null)
    const [failed, setFailed] = useState(false)

    useEffect(() => {
        let cancelled = false
        getPublicHome()
            .then((d) => {
                if (cancelled) return
                setNews(d.news)
                setEvents(d.events)
            })
            .catch(() => {
                if (!cancelled) setFailed(true)
            })
        return () => {
            cancelled = true
        }
    }, [])

    return (
        <>
            {/* Latest news */}
            <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
                <h2 className="text-center text-3xl font-bold text-green-800">Latest News</h2>
                <div className="mx-auto mt-3 h-1 w-16 rounded bg-amber-400" />

                {failed && <p className="mt-8 text-center text-sm text-gray-500">The news could not be loaded right now. Please try again later.</p>}
                {!news && !failed && <p className="mt-8 text-center text-sm text-gray-500">Loading...</p>}
                {news && news.length === 0 && <p className="mt-8 text-center text-sm text-gray-500">No news has been published yet. Please check back soon.</p>}

                {news && news.length > 0 && (
                    <>
                        <div className="mt-10 grid gap-6 md:grid-cols-3">
                            {news.map((n) => (
                                <article key={n.id} className="flex flex-col overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
                                    {n.image ? (
                                        <img src={n.image} alt="" loading="lazy" className="h-44 w-full object-cover" />
                                    ) : (
                                        <span className="flex h-44 w-full items-center justify-center bg-green-50 text-green-200">
                                            <FaNewspaper className="h-10 w-10" />
                                        </span>
                                    )}
                                    <div className="flex flex-1 flex-col p-5">
                                        {n.publishedAt && <p className="text-sm text-gray-400">{longDate(n.publishedAt)}</p>}
                                        <h3 className="mt-1 text-lg font-semibold text-gray-900">{n.title}</h3>
                                        <p className="mt-2 flex-1 text-gray-600">{n.excerpt}</p>
                                        <Link to={`/news/${n.id}`} className="mt-3 inline-block font-medium text-green-700 hover:text-green-900">
                                            Read full update →
                                        </Link>
                                    </div>
                                </article>
                            ))}
                        </div>
                        <p className="mt-8 text-center">
                            <Link to="/news" className="font-medium text-green-800 hover:underline">
                                See all news
                            </Link>
                        </p>
                    </>
                )}
            </section>

            {/* Upcoming events */}
            <section className="bg-green-50 py-16">
                <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
                    <h2 className="text-center text-3xl font-bold text-green-800">Upcoming Events</h2>
                    <div className="mx-auto mt-3 h-1 w-16 rounded bg-amber-400" />

                    {!events && !failed && <p className="mt-8 text-center text-sm text-gray-500">Loading...</p>}
                    {events && events.length === 0 && (
                        <div className="mt-10 rounded-xl border border-dashed border-green-200 bg-white p-10 text-center">
                            <p className="text-gray-500">No upcoming events scheduled.</p>
                            <p className="text-sm text-gray-400">Check back soon for updates.</p>
                        </div>
                    )}

                    {events && events.length > 0 && (
                        <>
                            <div className="mt-10 space-y-4">
                                {events.map((e) => {
                                    const badge = badgeParts(e.date)
                                    return (
                                        <article key={e.id} className="flex gap-5 rounded-xl bg-white p-5 shadow-sm">
                                            <div className="flex h-20 w-20 shrink-0 flex-col items-center justify-center rounded-lg bg-green-700 text-white">
                                                <span className="text-2xl font-bold leading-none">{badge.day}</span>
                                                <span className="text-xs font-semibold tracking-wide">{badge.month}</span>
                                            </div>
                                            <div className="min-w-0">
                                                <h3 className="text-lg font-semibold text-gray-900">{e.title}</h3>
                                                <p className="mt-1 flex items-center gap-1 text-sm text-gray-500">
                                                    <FaMapMarkerAlt className="h-3 w-3 text-green-600" />
                                                    {e.location} · {eventWhen(e)}
                                                </p>
                                                {e.description && <p className="mt-2 line-clamp-2 text-gray-600">{e.description}</p>}
                                            </div>
                                        </article>
                                    )
                                })}
                            </div>
                            <p className="mt-8 text-center">
                                <Link to="/events" className="font-medium text-green-800 hover:underline">
                                    See all events
                                </Link>
                            </p>
                        </>
                    )}
                </div>
            </section>
        </>
    )
}

export default HomeNewsEvents

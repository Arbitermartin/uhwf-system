import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FaHeart, FaMapMarkerAlt, FaNewspaper } from 'react-icons/fa'
import { useAuth } from '../../hooks/useAuth'
import { getErrorMessage } from '../../services/api'
import { badgeParts, eventWhen, getPublicHome, longDate } from '../../services/content'
import type { PublicEvent, PublicNews } from '../../services/content'
import { getMyMembership, interestLabel } from '../../services/member'
import type { MyMembership } from '../../services/member'

const day = (iso: string) =>
    new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Africa/Dar_es_Salaam' })

// How much of the membership year has passed, as a percentage
const usedPercent = (joinedAt: string, validUntil: string) => {
    const start = new Date(joinedAt).getTime()
    const end = new Date(validUntil).getTime()
    if (end <= start) return 100
    return Math.min(100, Math.max(0, Math.round(((Date.now() - start) / (end - start)) * 100)))
}

// The first version of the member's home: the membership itself, plus what is happening at UHWF.
const MemberHome = () => {
    const { user } = useAuth()
    const [member, setMember] = useState<MyMembership | null>(null)
    const [news, setNews] = useState<PublicNews[] | null>(null)
    const [events, setEvents] = useState<PublicEvent[] | null>(null)
    const [error, setError] = useState('')

    useEffect(() => {
        let cancelled = false
        getMyMembership()
            .then((m) => {
                if (!cancelled) setMember(m)
            })
            .catch((err) => {
                if (!cancelled) setError(getErrorMessage(err, 'Could not load your membership.'))
            })
        getPublicHome()
            .then((h) => {
                if (cancelled) return
                setNews(h.news)
                setEvents(h.events)
            })
            .catch(() => {
                if (!cancelled) {
                    setNews([])
                    setEvents([])
                }
            })
        return () => {
            cancelled = true
        }
    }, [])

    const firstName = user?.name.split(' ')[0] ?? ''

    return (
        <div className="mx-auto max-w-5xl space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-green-950">Welcome, {firstName}</h1>
                    <p className="text-sm text-gray-500">Thank you for standing with UHWF.</p>
                </div>
                <Link
                    to="/donate"
                    className="inline-flex items-center gap-2 rounded-lg bg-amber-400 px-5 py-2.5 text-sm font-semibold text-green-950 hover:bg-amber-300"
                >
                    <FaHeart className="h-3.5 w-3.5" /> Donate
                </Link>
            </div>

            {error && (
                <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
                    {error}
                </p>
            )}
            {!member && !error && <p className="py-6 text-center text-sm text-gray-500">Loading your membership...</p>}

            {member?.status === 'expired' && (
                <p role="status" className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
                    Your membership ended on {day(member.validUntil)}. To renew it, please write to{' '}
                    <a href="mailto:info@uhwf.or.tz" className="font-medium underline">
                        info@uhwf.or.tz
                    </a>
                    .
                </p>
            )}

            {member && (
                <div className="grid gap-5 md:grid-cols-5">
                    <div className="flex min-h-[10.5rem] flex-col justify-between rounded-2xl bg-green-950 p-5 text-white md:col-span-3">
                        <div>
                            <p className="text-xs text-green-200">Universal Human-Wildlife Foundation</p>
                            <p className="mt-1 text-lg font-semibold">Member card</p>
                        </div>
                        <div>
                            <p className="text-xl font-semibold">{member.name}</p>
                            <p className="mt-1 text-sm font-medium tracking-wide text-amber-400">{member.memberNumber}</p>
                            <p className="mt-3 text-xs text-green-200">
                                Member since {day(member.joinedAt)} · Valid until {day(member.validUntil)}
                            </p>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-gray-200 bg-white p-5 md:col-span-2">
                        <div className="flex items-center justify-between">
                            <h2 className="font-semibold text-green-950">Membership</h2>
                            <span
                                className={`rounded-full px-3 py-0.5 text-xs font-semibold ${member.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-900'
                                    }`}
                            >
                                {member.status === 'active' ? 'Active' : 'Expired'}
                            </span>
                        </div>
                        <p className="mt-3 text-sm text-gray-500">{member.status === 'active' ? 'Time left this year' : 'Time left'}</p>
                        <p className="text-2xl font-bold text-green-950">
                            {member.daysLeft} {member.daysLeft === 1 ? 'day' : 'days'}
                        </p>
                        <div
                            className="mt-2 h-1.5 rounded bg-gray-100"
                            role="progressbar"
                            aria-label="Membership year used"
                            aria-valuenow={usedPercent(member.joinedAt, member.validUntil)}
                            aria-valuemin={0}
                            aria-valuemax={100}
                        >
                            <div className="h-1.5 rounded bg-green-900" style={{ width: `${usedPercent(member.joinedAt, member.validUntil)}%` }} />
                        </div>
                        {member.interests.length > 0 && (
                            <div className="mt-4 flex flex-wrap gap-1.5">
                                {member.interests.map((i) => (
                                    <span key={i} className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs text-green-800">
                                        {interestLabel(i)}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            <div className="grid gap-5 md:grid-cols-2">
                <section className="rounded-2xl border border-gray-200 bg-white p-5">
                    <div className="flex items-center justify-between">
                        <h2 className="font-semibold text-green-950">Upcoming events</h2>
                        <Link to="/events" className="text-sm font-medium text-green-800 hover:underline">
                            See all
                        </Link>
                    </div>
                    {!events && <p className="mt-3 text-sm text-gray-500">Loading...</p>}
                    {events && events.length === 0 && <p className="mt-3 text-sm text-gray-500">No upcoming events scheduled.</p>}
                    <ul className="mt-2 divide-y divide-gray-100">
                        {events?.map((e) => {
                            const badge = badgeParts(e.date)
                            return (
                                <li key={e.id} className="flex items-center gap-3 py-3">
                                    <span className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-lg bg-green-800 text-white">
                                        <span className="text-base font-bold leading-none">{badge.day}</span>
                                        <span className="text-[10px] font-semibold tracking-wide">{badge.month}</span>
                                    </span>
                                    <span className="min-w-0">
                                        <span className="block truncate text-sm font-medium text-green-950">{e.title}</span>
                                        <span className="flex items-center gap-1 text-xs text-gray-500">
                                            <FaMapMarkerAlt className="h-2.5 w-2.5 text-green-600" /> {e.location} · {eventWhen(e)}
                                        </span>
                                    </span>
                                </li>
                            )
                        })}
                    </ul>
                </section>

                <section className="rounded-2xl border border-gray-200 bg-white p-5">
                    <div className="flex items-center justify-between">
                        <h2 className="font-semibold text-green-950">Latest news</h2>
                        <Link to="/news" className="text-sm font-medium text-green-800 hover:underline">
                            See all
                        </Link>
                    </div>
                    {!news && <p className="mt-3 text-sm text-gray-500">Loading...</p>}
                    {news && news.length === 0 && <p className="mt-3 text-sm text-gray-500">No news has been published yet.</p>}
                    <ul className="mt-2 divide-y divide-gray-100">
                        {news?.map((n) => (
                            <li key={n.id} className="flex items-start gap-3 py-3">
                                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-green-50 text-green-500">
                                    <FaNewspaper className="h-4 w-4" />
                                </span>
                                <span className="min-w-0">
                                    <Link to={`/news/${n.id}`} className="block text-sm font-medium text-green-950 hover:underline">
                                        {n.title}
                                    </Link>
                                    {n.publishedAt && <span className="text-xs text-gray-500">{longDate(n.publishedAt)}</span>}
                                </span>
                            </li>
                        ))}
                    </ul>
                </section>
            </div>
        </div>
    )
}

export default MemberHome

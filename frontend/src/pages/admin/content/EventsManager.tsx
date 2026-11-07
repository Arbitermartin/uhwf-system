import { useEffect, useRef, useState } from 'react'
import { FaEdit, FaPlus, FaSearch, FaTrash } from 'react-icons/fa'
import { getErrorMessage } from '../../../services/api'
import { badgeParts, deleteEvent, eventWhen, listEvents } from '../../../services/content'
import type { EventList, EventRow } from '../../../services/content'
import EventFormModal from './EventFormModal'

const PAGE_SIZE = 10

type Tab = 'all' | 'upcoming' | 'past'

const tabs: { key: Tab; label: string }[] = [
    { key: 'upcoming', label: 'Upcoming' },
    { key: 'past', label: 'Past' },
    { key: 'all', label: 'All' },
]

const EventsManager = () => {
    const [tab, setTab] = useState<Tab>('upcoming')
    const [searchInput, setSearchInput] = useState('')
    const [search, setSearch] = useState('')
    const [page, setPage] = useState(1)
    const [reloadKey, setReloadKey] = useState(0)

    const [data, setData] = useState<EventList | null>(null)
    const [error, setError] = useState('')
    const [notice, setNotice] = useState('')
    const [form, setForm] = useState<{ event: EventRow | null } | null>(null)
    const [armedId, setArmedId] = useState<number | null>(null)
    const armTimer = useRef<number | undefined>(undefined)

    useEffect(() => {
        const t = window.setTimeout(() => {
            setSearch(searchInput.trim())
            setPage(1)
        }, 300)
        return () => window.clearTimeout(t)
    }, [searchInput])

    useEffect(() => () => window.clearTimeout(armTimer.current), [])

    useEffect(() => {
        let cancelled = false
        listEvents({ scope: tab === 'all' ? undefined : tab, search: search || undefined, page, pageSize: PAGE_SIZE })
            .then((res) => {
                if (!cancelled) {
                    setData(res)
                    setError('')
                }
            })
            .catch((err) => {
                if (!cancelled) setError(getErrorMessage(err, 'Could not load the events.'))
            })
        return () => {
            cancelled = true
        }
    }, [tab, search, page, reloadKey])

    useEffect(() => {
        if (data && data.events.length === 0 && page > 1) setPage(page - 1)
    }, [data, page])

    const refresh = () => setReloadKey((k) => k + 1)

    const remove = async (e: EventRow) => {
        if (armedId !== e.id) {
            setArmedId(e.id)
            window.clearTimeout(armTimer.current)
            armTimer.current = window.setTimeout(() => setArmedId(null), 4000)
            return
        }
        setArmedId(null)
        try {
            await deleteEvent(e.id)
            setNotice('Event deleted.')
            refresh()
        } catch (err) {
            setError(getErrorMessage(err, 'Could not delete the event.'))
        }
    }

    const totalPages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-gray-500">Events appear on the public website as soon as you add them, and move to "Past" by themselves.</p>
                <button
                    type="button"
                    onClick={() => {
                        setNotice('')
                        setForm({ event: null })
                    }}
                    className="inline-flex items-center gap-2 rounded-lg bg-amber-400 px-4 py-2 text-sm font-semibold text-green-950 hover:bg-amber-300"
                >
                    <FaPlus className="h-3 w-3" /> Add event
                </button>
            </div>

            {notice && (
                <p role="status" className="rounded-lg bg-green-50 px-4 py-2.5 text-sm text-green-800">
                    {notice}
                </p>
            )}

            <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-center gap-2">
                    {tabs.map((t) => (
                        <button
                            key={t.key}
                            type="button"
                            aria-pressed={tab === t.key}
                            onClick={() => {
                                setTab(t.key)
                                setPage(1)
                                setNotice('')
                            }}
                            className={`rounded-full border px-4 py-1.5 text-sm font-medium ${tab === t.key ? 'border-green-900 bg-green-900 text-white' : 'border-green-200 text-green-900 hover:bg-green-50'
                                }`}
                        >
                            {t.label}
                            {data && <span className="ml-1.5 text-xs opacity-80">{data.counts[t.key]}</span>}
                        </button>
                    ))}
                    <div className="ml-auto flex min-w-[14rem] items-center gap-2 rounded-lg bg-green-50 px-3">
                        <FaSearch className="h-3.5 w-3.5 text-gray-400" />
                        <input
                            type="text"
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            placeholder="Search title or place"
                            aria-label="Search events"
                            className="w-full bg-transparent py-2 text-sm outline-none placeholder:text-gray-400"
                        />
                    </div>
                </div>

                {error && (
                    <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                        {error}
                    </p>
                )}

                <ul className="mt-3 divide-y divide-gray-100">
                    {!data && !error && <li className="py-8 text-center text-sm text-gray-500">Loading...</li>}
                    {data && data.events.length === 0 && (
                        <li className="py-8 text-center text-sm text-gray-500">No events here. Click "Add event".</li>
                    )}
                    {data?.events.map((e) => {
                        const badge = badgeParts(e.date)
                        return (
                            <li key={e.id} className="flex flex-wrap items-center gap-4 py-3">
                                <span
                                    className={`flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-lg text-white ${e.upcoming ? 'bg-green-800' : 'bg-gray-400'
                                        }`}
                                >
                                    <span className="text-xl font-bold leading-none">{badge.day}</span>
                                    <span className="text-[10px] font-semibold tracking-wide">{badge.month}</span>
                                </span>
                                <div className="min-w-0 flex-1">
                                    <p className="font-medium text-green-950">{e.title}</p>
                                    <p className="text-xs text-gray-500">
                                        {eventWhen(e)} · {e.location}
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setNotice('')
                                            setForm({ event: e })
                                        }}
                                        aria-label={`Edit ${e.title}`}
                                        title="Edit"
                                        className="rounded-md border border-amber-500 p-2 text-amber-700 hover:bg-amber-50"
                                    >
                                        <FaEdit className="h-3.5 w-3.5" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => void remove(e)}
                                        aria-label={`Delete ${e.title}`}
                                        className={`inline-flex items-center gap-1 rounded-md border px-2 py-1.5 text-xs font-medium ${armedId === e.id ? 'border-red-700 bg-red-700 text-white' : 'border-red-600 text-red-700 hover:bg-red-50'
                                            }`}
                                    >
                                        <FaTrash className="h-3.5 w-3.5" />
                                        {armedId === e.id ? 'Confirm' : ''}
                                    </button>
                                </div>
                            </li>
                        )
                    })}
                </ul>

                {data && data.total > PAGE_SIZE && (
                    <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
                        <span>
                            Page {page} of {totalPages}
                        </span>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => setPage(page - 1)}
                                disabled={page <= 1}
                                className="rounded-md border border-green-200 px-4 py-1.5 text-green-900 hover:bg-green-50 disabled:opacity-40"
                            >
                                Previous
                            </button>
                            <button
                                type="button"
                                onClick={() => setPage(page + 1)}
                                disabled={page >= totalPages}
                                className="rounded-md border border-green-200 px-4 py-1.5 text-green-900 hover:bg-green-50 disabled:opacity-40"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </section>

            {form && (
                <EventFormModal
                    event={form.event}
                    onClose={() => setForm(null)}
                    onSaved={(message) => {
                        setForm(null)
                        setNotice(message)
                        refresh()
                    }}
                />
            )}
        </div>
    )
}

export default EventsManager

import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FaSearch } from 'react-icons/fa'
import { getErrorMessage } from '../../../services/api'
import { listIctTickets, updateTicket } from '../../../services/ict'
import type { IctTicketList } from '../../../services/ict'
import type { TicketStatus } from '../../../services/tickets'
import TicketModal from '../../../components/tickets/TicketModal'
import { priorityLabel, priorityTag, ticketStatusLabel, ticketStatusTag, timeAgo } from '../../../components/tickets/ticketLabels'

type Tab = TicketStatus | 'all'

const tabs: { key: Tab; label: string }[] = [
    { key: 'open', label: 'Open' },
    { key: 'resolved', label: 'Resolved' },
    { key: 'all', label: 'All' },
]

const roleName: Record<string, string> = {
    admin: 'Administrator',
    lecturer: 'Lecturer',
    student: 'Student',
    employee: 'Employee',
    ict: 'ICT',
}

const TicketsPanel = ({
    pageSize,
    viewAllTo,
    onChanged,
}: {
    pageSize: number
    viewAllTo?: string
    onChanged?: () => void
}) => {
    const [tab, setTab] = useState<Tab>('open')
    const [searchInput, setSearchInput] = useState('')
    const [search, setSearch] = useState('')
    const [page, setPage] = useState(1)
    const [reloadKey, setReloadKey] = useState(0)
    const [data, setData] = useState<IctTicketList | null>(null)
    const [error, setError] = useState('')
    const [openId, setOpenId] = useState<number | null>(null)

    useEffect(() => {
        const t = window.setTimeout(() => {
            setSearch(searchInput.trim())
            setPage(1)
        }, 300)
        return () => window.clearTimeout(t)
    }, [searchInput])

    useEffect(() => {
        let cancelled = false
        listIctTickets({ status: tab === 'all' ? undefined : tab, search: search || undefined, page, pageSize })
            .then((res) => {
                if (!cancelled) {
                    setData(res)
                    setError('')
                }
            })
            .catch((err) => {
                if (!cancelled) setError(getErrorMessage(err, 'Could not load the reports.'))
            })
        return () => {
            cancelled = true
        }
    }, [tab, search, page, pageSize, reloadKey])

    // If the last report on a page was resolved and moved away, step back one page
    useEffect(() => {
        if (data && data.tickets.length === 0 && page > 1) setPage(page - 1)
    }, [data, page])

    const changed = useCallback(() => {
        setReloadKey((k) => k + 1)
        onChanged?.()
    }, [onChanged])

    const resolve = async (id: number) => {
        try {
            await updateTicket(id, { status: 'resolved' })
            changed()
        } catch (err) {
            setError(getErrorMessage(err, 'Could not resolve the report.'))
        }
    }

    const totalPages = data ? Math.max(1, Math.ceil(data.total / pageSize)) : 1

    return (
        <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="font-semibold text-green-950">Support tickets</h2>
                {viewAllTo && (
                    <Link to={viewAllTo} className="text-sm font-medium text-green-800 hover:underline">
                        View all
                    </Link>
                )}
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
                {tabs.map((t) => (
                    <button
                        key={t.key}
                        type="button"
                        aria-pressed={tab === t.key}
                        onClick={() => {
                            setTab(t.key)
                            setPage(1)
                        }}
                        className={`rounded-full border px-3 py-1 text-xs font-medium ${tab === t.key ? 'border-green-900 bg-green-900 text-white' : 'border-green-200 text-green-900 hover:bg-green-50'
                            }`}
                    >
                        {t.label}
                        {data && <span className="ml-1 opacity-80">{data.counts[t.key]}</span>}
                    </button>
                ))}
                <div className="ml-auto flex min-w-[12rem] items-center gap-2 rounded-lg bg-green-50 px-3">
                    <FaSearch className="h-3 w-3 text-gray-400" />
                    <input
                        type="text"
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        placeholder="Search"
                        aria-label="Search reports"
                        className="w-full bg-transparent py-1.5 text-sm outline-none placeholder:text-gray-400"
                    />
                </div>
            </div>

            {error && (
                <p role="alert" className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                    {error}
                </p>
            )}

            <ul className="mt-2 divide-y divide-gray-100">
                {!data && !error && <li className="py-6 text-center text-sm text-gray-500">Loading...</li>}
                {data && data.tickets.length === 0 && (
                    <li className="py-6 text-center text-sm text-gray-500">No reports here.</li>
                )}
                {data?.tickets.map((t) => (
                    <li key={t.id} className="flex flex-wrap items-center gap-3 py-3 text-sm">
                        <span className="w-10 text-gray-500">#{t.id}</span>
                        <div className="min-w-0 flex-1">
                            <p className="truncate font-medium text-green-950">{t.subject}</p>
                            <p className="truncate text-xs text-gray-500">
                                {t.requester.fullName} ({roleName[t.requester.role]}) · {timeAgo(t.createdAt)} · {t.comments} message
                                {t.comments === 1 ? '' : 's'}
                                {t.assignedTo ? ` · ${t.assignedTo.fullName}` : ''}
                            </p>
                        </div>
                        <span className={`rounded px-2 py-0.5 text-xs font-medium ${priorityTag[t.priority]}`}>
                            {priorityLabel[t.priority]}
                        </span>
                        <span className={`rounded px-2 py-0.5 text-xs font-medium ${ticketStatusTag[t.status]}`}>
                            {ticketStatusLabel[t.status]}
                        </span>
                        <button
                            type="button"
                            onClick={() => setOpenId(t.id)}
                            className="rounded-md border border-green-900 px-3 py-1 text-xs font-medium text-green-900 hover:bg-green-50"
                        >
                            Open
                        </button>
                        {t.status === 'open' && (
                            <button
                                type="button"
                                onClick={() => void resolve(t.id)}
                                className="rounded-md bg-green-800 px-3 py-1 text-xs font-medium text-white hover:bg-green-900"
                            >
                                Resolve
                            </button>
                        )}
                    </li>
                ))}
            </ul>

            {data && data.total > pageSize && (
                <div className="mt-3 flex items-center justify-between text-sm text-gray-600">
                    <span>
                        Page {page} of {totalPages}
                    </span>
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={() => setPage(page - 1)}
                            disabled={page <= 1}
                            className="rounded-md border border-green-200 px-3 py-1 text-green-900 hover:bg-green-50 disabled:opacity-40"
                        >
                            Previous
                        </button>
                        <button
                            type="button"
                            onClick={() => setPage(page + 1)}
                            disabled={page >= totalPages}
                            className="rounded-md border border-green-200 px-3 py-1 text-green-900 hover:bg-green-50 disabled:opacity-40"
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}

            {openId !== null && <TicketModal ticketId={openId} ict onClose={() => setOpenId(null)} onChanged={changed} />}
        </section>
    )
}

export default TicketsPanel

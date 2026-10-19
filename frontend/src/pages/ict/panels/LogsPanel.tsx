import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FaDownload, FaSearch } from 'react-icons/fa'
import { getErrorMessage } from '../../../services/api'
import { listLogs, logsExportUrl } from '../../../services/ict'
import type { LogLevel, LogList } from '../../../services/ict'
import { dateTime } from '../../../components/tickets/ticketLabels'

type Filter = LogLevel | 'all'

const filters: { key: Filter; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'error', label: 'Errors' },
    { key: 'warning', label: 'Warnings' },
    { key: 'info', label: 'Info' },
]

const levelTag: Record<LogLevel, string> = {
    error: 'bg-red-100 text-red-800',
    warning: 'bg-amber-100 text-amber-900',
    info: 'bg-green-100 text-green-800',
}

const LogsPanel = ({ pageSize, viewAllTo }: { pageSize: number; viewAllTo?: string }) => {
    const [level, setLevel] = useState<Filter>('all')
    const [searchInput, setSearchInput] = useState('')
    const [search, setSearch] = useState('')
    const [page, setPage] = useState(1)
    const [data, setData] = useState<LogList | null>(null)
    const [error, setError] = useState('')

    useEffect(() => {
        const t = window.setTimeout(() => {
            setSearch(searchInput.trim())
            setPage(1)
        }, 300)
        return () => window.clearTimeout(t)
    }, [searchInput])

    useEffect(() => {
        let cancelled = false
        listLogs({ level: level === 'all' ? undefined : level, search: search || undefined, page, pageSize })
            .then((res) => {
                if (!cancelled) {
                    setData(res)
                    setError('')
                }
            })
            .catch((err) => {
                if (!cancelled) setError(getErrorMessage(err, 'Could not load the logs.'))
            })
        return () => {
            cancelled = true
        }
    }, [level, search, page, pageSize])

    const totalPages = data ? Math.max(1, Math.ceil(data.total / pageSize)) : 1

    return (
        <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="font-semibold text-green-950">System logs</h2>
                {viewAllTo && (
                    <Link to={viewAllTo} className="text-sm font-medium text-green-800 hover:underline">
                        View all
                    </Link>
                )}
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
                {filters.map((f) => (
                    <button
                        key={f.key}
                        type="button"
                        aria-pressed={level === f.key}
                        onClick={() => {
                            setLevel(f.key)
                            setPage(1)
                        }}
                        className={`rounded-full border px-3 py-1 text-xs font-medium ${level === f.key ? 'border-green-900 bg-green-900 text-white' : 'border-green-200 text-green-900 hover:bg-green-50'
                            }`}
                    >
                        {f.label}
                        {data && <span className="ml-1 opacity-80">{data.counts[f.key]}</span>}
                    </button>
                ))}
                <div className="ml-auto flex min-w-[12rem] items-center gap-2 rounded-lg bg-green-50 px-3">
                    <FaSearch className="h-3 w-3 text-gray-400" />
                    <input
                        type="text"
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        placeholder="Search logs"
                        aria-label="Search logs"
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
                {data && data.logs.length === 0 && <li className="py-6 text-center text-sm text-gray-500">No log entries.</li>}
                {data?.logs.map((l) => (
                    <li key={l.id} className="flex items-start gap-3 py-2.5 text-sm">
                        <span className="w-28 shrink-0 text-xs text-gray-500">{dateTime(l.createdAt)}</span>
                        <span className={`w-16 shrink-0 rounded px-2 py-0.5 text-center text-xs font-medium ${levelTag[l.level]}`}>
                            {l.level}
                        </span>
                        <span className="min-w-0 flex-1 text-gray-700">
                            {l.message}
                            {l.user && <span className="block truncate text-xs text-gray-400">by {l.user.email}</span>}
                        </span>
                    </li>
                ))}
            </ul>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-sm text-gray-600">
                <a
                    href={logsExportUrl(level === 'all' ? undefined : level, search || undefined)}
                    className="inline-flex items-center gap-2 font-medium text-green-900 hover:underline"
                >
                    <FaDownload className="h-3.5 w-3.5" /> Export logs (CSV)
                </a>
                {data && data.total > pageSize && (
                    <div className="flex items-center gap-2">
                        <span>
                            Page {page} of {totalPages}
                        </span>
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
                )}
            </div>
        </section>
    )
}

export default LogsPanel

import { useEffect, useState } from 'react'
import { FaSearch } from 'react-icons/fa'
import { getErrorMessage } from '../../services/api'
import { listMessages } from '../../services/messages'
import type { MessageList } from '../../services/messages'
import MessageModal from './messages/MessageModal'
import { formatDate, initials } from './users/userLabels'

const PAGE_SIZE = 10

type Tab = 'all' | 'unread' | 'read'

const tabs: { key: Tab; label: string }[] = [
    { key: 'unread', label: 'Unread' },
    { key: 'read', label: 'Read' },
    { key: 'all', label: 'All' },
]

const MessagesPage = () => {
    const [tab, setTab] = useState<Tab>('unread')
    const [searchInput, setSearchInput] = useState('')
    const [search, setSearch] = useState('')
    const [page, setPage] = useState(1)
    const [reloadKey, setReloadKey] = useState(0)

    const [data, setData] = useState<MessageList | null>(null)
    const [error, setError] = useState('')
    const [notice, setNotice] = useState('')
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
        listMessages({ status: tab === 'all' ? undefined : tab, search: search || undefined, page, pageSize: PAGE_SIZE })
            .then((res) => {
                if (!cancelled) {
                    setData(res)
                    setError('')
                }
            })
            .catch((err) => {
                if (!cancelled) setError(getErrorMessage(err, 'Could not load the messages.'))
            })
        return () => {
            cancelled = true
        }
    }, [tab, search, page, reloadKey])

    useEffect(() => {
        if (data && data.messages.length === 0 && page > 1) setPage(page - 1)
    }, [data, page])

    const totalPages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1
    const from = data && data.total > 0 ? (data.page - 1) * PAGE_SIZE + 1 : 0
    const to = data ? Math.min(data.page * PAGE_SIZE, data.total) : 0

    return (
        <div className="mx-auto max-w-5xl space-y-4">
            <div>
                <h1 className="text-2xl font-bold text-green-950">Messages</h1>
                <p className="text-sm text-gray-500">Messages sent from the Contact page of the public website.</p>
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
                            className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${tab === t.key ? 'border-green-900 bg-green-900 text-white' : 'border-green-200 bg-white text-green-900 hover:bg-green-50'
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
                            placeholder="Search name, email or subject"
                            aria-label="Search messages"
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
                    {!data && !error && <li className="py-8 text-center text-sm text-gray-500">Loading messages...</li>}
                    {data && data.messages.length === 0 && (
                        <li className="py-8 text-center text-sm text-gray-500">
                            {tab === 'unread' && !search ? 'No unread messages. You are up to date.' : 'No messages found.'}
                        </li>
                    )}
                    {data?.messages.map((m) => (
                        <li key={m.id}>
                            <button
                                type="button"
                                onClick={() => setOpenId(m.id)}
                                className={`flex w-full items-start gap-3 px-1 py-3 text-left hover:bg-green-50 ${m.isRead ? '' : 'bg-amber-50/60'}`}
                            >
                                <span
                                    aria-hidden="true"
                                    className={`mt-3 h-2 w-2 shrink-0 rounded-full ${m.isRead ? 'bg-transparent' : 'bg-red-500'}`}
                                />
                                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-green-200 text-xs font-semibold text-green-950">
                                    {initials(m.name)}
                                </span>
                                <span className="min-w-0 flex-1">
                                    <span className="flex flex-wrap items-baseline gap-x-2">
                                        <span className={`text-sm ${m.isRead ? 'text-green-950' : 'font-bold text-green-950'}`}>{m.name}</span>
                                        <span className="truncate text-xs text-gray-500">{m.email}</span>
                                    </span>
                                    <span className={`block truncate text-sm ${m.isRead ? 'text-gray-700' : 'font-semibold text-gray-900'}`}>
                                        {m.subject}
                                    </span>
                                    <span className="block truncate text-xs text-gray-500">{m.preview}</span>
                                </span>
                                <span className="shrink-0 text-xs text-gray-500">{formatDate(m.createdAt)}</span>
                                <span className="sr-only">{m.isRead ? 'Read' : 'Unread'}</span>
                            </button>
                        </li>
                    ))}
                </ul>

                {data && data.total > 0 && (
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-gray-600">
                        <p>
                            Showing {from} to {to} of {data.total}
                        </p>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => setPage(page - 1)}
                                disabled={page <= 1}
                                className="rounded-md border border-green-200 px-4 py-1.5 text-green-900 hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                Previous
                            </button>
                            <span className="px-2 py-1.5">
                                Page {page} of {totalPages}
                            </span>
                            <button
                                type="button"
                                onClick={() => setPage(page + 1)}
                                disabled={page >= totalPages}
                                className="rounded-md border border-green-200 px-4 py-1.5 text-green-900 hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </section>

            {openId !== null && (
                <MessageModal
                    messageId={openId}
                    onClose={() => setOpenId(null)}
                    onChanged={(text) => {
                        if (text) setNotice(text)
                        setReloadKey((k) => k + 1)
                    }}
                />
            )}
        </div>
    )
}

export default MessagesPage

import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getErrorMessage, api } from '../../services/api'

type Notice = {
    id: number
    type: string
    title: string
    body: string | null
    linkUrl: string | null
    isRead: boolean
    createdAt: string
}

type Reply = { notifications: Notice[]; total: number; unreadCount: number; page: number; pageSize: number }

const PAGE_SIZE = 15

const when = (iso: string) =>
    new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })

// The full list of a person's notifications. The same page for every role.
const NotificationsPage = () => {
    const navigate = useNavigate()
    const [tab, setTab] = useState<'all' | 'unread'>('all')
    const [page, setPage] = useState(1)
    const [data, setData] = useState<Reply | null>(null)
    const [error, setError] = useState('')

    const load = useCallback(async () => {
        try {
            const res = await api.get<Reply>('/notifications/list', {
                params: { status: tab === 'unread' ? 'unread' : undefined, page, pageSize: PAGE_SIZE },
            })
            setData(res.data)
            setError('')
        } catch (err) {
            setError(getErrorMessage(err, 'Could not load your notifications.'))
        }
    }, [tab, page])

    useEffect(() => {
        void load()
    }, [load])

    // If the last item on a page disappeared (it was read in the Unread tab), step back one page
    useEffect(() => {
        if (data && data.notifications.length === 0 && page > 1) setPage(page - 1)
    }, [data, page])

    const open = async (n: Notice) => {
        if (!n.isRead) {
            try {
                await api.post(`/notifications/${n.id}/read`)
            } catch {
                /* it stays unread; the page still opens */
            }
        }
        if (n.linkUrl && n.linkUrl.startsWith('/')) navigate(n.linkUrl)
        else void load()
    }

    const markAll = async () => {
        try {
            await api.post('/notifications/read-all')
            await load()
        } catch (err) {
            setError(getErrorMessage(err, 'Could not mark them as read.'))
        }
    }

    const totalPages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1

    return (
        <div className="mx-auto max-w-3xl space-y-4">
            <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-green-950">Notifications</h1>
                    <p className="text-sm text-gray-500">Updates about your application, courses, scores and reports.</p>
                </div>
                {data && data.unreadCount > 0 && (
                    <button
                        type="button"
                        onClick={() => void markAll()}
                        className="rounded-lg border border-green-900 px-4 py-2 text-sm font-medium text-green-900 hover:bg-green-50"
                    >
                        Mark all as read
                    </button>
                )}
            </div>

            <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="flex gap-2">
                    {(['all', 'unread'] as const).map((t) => (
                        <button
                            key={t}
                            type="button"
                            aria-pressed={tab === t}
                            onClick={() => {
                                setTab(t)
                                setPage(1)
                            }}
                            className={`rounded-full border px-4 py-1.5 text-sm font-medium ${tab === t ? 'border-green-900 bg-green-900 text-white' : 'border-green-200 text-green-900 hover:bg-green-50'
                                }`}
                        >
                            {t === 'all' ? 'All' : 'Unread'}
                            {t === 'unread' && data && <span className="ml-1.5 text-xs opacity-80">{data.unreadCount}</span>}
                        </button>
                    ))}
                </div>

                {error && (
                    <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                        {error}
                    </p>
                )}

                <ul className="mt-3 divide-y divide-gray-100">
                    {!data && !error && <li className="py-8 text-center text-sm text-gray-500">Loading...</li>}
                    {data && data.notifications.length === 0 && (
                        <li className="py-8 text-center text-sm text-gray-500">
                            {tab === 'unread' ? 'You have no unread notifications.' : 'You have no notifications yet.'}
                        </li>
                    )}
                    {data?.notifications.map((n) => (
                        <li key={n.id}>
                            <button
                                type="button"
                                onClick={() => void open(n)}
                                className={`flex w-full items-start gap-3 px-1 py-3 text-left hover:bg-green-50 ${n.isRead ? '' : 'bg-amber-50/60'}`}
                            >
                                <span aria-hidden="true" className={`mt-2 h-2 w-2 shrink-0 rounded-full ${n.isRead ? 'bg-transparent' : 'bg-red-500'}`} />
                                <span className="min-w-0 flex-1">
                                    <span className={`block text-sm ${n.isRead ? 'text-green-950' : 'font-bold text-green-950'}`}>{n.title}</span>
                                    {n.body && <span className="block text-sm text-gray-700">{n.body}</span>}
                                    <span className="block text-xs text-gray-500">{when(n.createdAt)}</span>
                                </span>
                                <span className="sr-only">{n.isRead ? 'Read' : 'Unread'}</span>
                            </button>
                        </li>
                    ))}
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
        </div>
    )
}

export default NotificationsPage

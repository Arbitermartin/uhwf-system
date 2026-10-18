import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FaBell } from 'react-icons/fa'
import { api } from '../services/api'

type Notice = {
    id: number
    type: string
    title: string
    body: string | null
    linkUrl: string | null
    isRead: boolean
    createdAt: string
}

type Reply = { notifications: Notice[]; unreadCount: number }

const POLL_MS = 60_000

const timeAgo = (iso: string) => {
    const minutes = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000)
    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes} min ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours} h ago`
    return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

// The bell in the top bar: a real unread count, and the latest notifications.
const NotificationBell = () => {
    const navigate = useNavigate()
    const [items, setItems] = useState<Notice[]>([])
    const [unread, setUnread] = useState(0)
    const [open, setOpen] = useState(false)
    const [failed, setFailed] = useState(false)
    const ref = useRef<HTMLDivElement>(null)

    const load = useCallback(async () => {
        try {
            const res = await api.get<Reply>('/notifications')
            setItems(res.data.notifications)
            setUnread(res.data.unreadCount)
            setFailed(false)
        } catch {
            setFailed(true) // keep showing the last list
        }
    }, [])

    // Load now, then check again every minute
    useEffect(() => {
        void load()
        const t = window.setInterval(() => void load(), POLL_MS)
        return () => window.clearInterval(t)
    }, [load])

    useEffect(() => {
        if (!open) return
        const onClick = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
        }
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setOpen(false)
        }
        document.addEventListener('mousedown', onClick)
        document.addEventListener('keydown', onKey)
        return () => {
            document.removeEventListener('mousedown', onClick)
            document.removeEventListener('keydown', onKey)
        }
    }, [open])

    const toggle = () => {
        if (!open) void load()
        setOpen((o) => !o)
    }

    const openItem = async (n: Notice) => {
        setOpen(false)
        if (!n.isRead) {
            setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, isRead: true } : x)))
            setUnread((u) => Math.max(0, u - 1))
            try {
                await api.post(`/notifications/${n.id}/read`)
            } catch {
                void load() // put the real state back
            }
        }
        if (n.linkUrl && n.linkUrl.startsWith('/')) navigate(n.linkUrl)
    }

    const markAll = async () => {
        setItems((prev) => prev.map((x) => ({ ...x, isRead: true })))
        setUnread(0)
        try {
            await api.post('/notifications/read-all')
        } catch {
            void load()
        }
    }

    return (
        <div ref={ref} className="relative">
            <button
                type="button"
                onClick={toggle}
                aria-label={unread > 0 ? `Notifications, ${unread} unread` : 'Notifications'}
                aria-haspopup="menu"
                aria-expanded={open}
                className="relative rounded-full p-2 text-green-950 hover:bg-green-50"
            >
                <FaBell className="h-5 w-5" />
                {unread > 0 && (
                    <span className="absolute right-0 top-0 rounded-full bg-red-500 px-1.5 text-[10px] font-semibold text-white">
                        {unread > 9 ? '9+' : unread}
                    </span>
                )}
            </button>

            {open && (
                <div
                    role="menu"
                    className="absolute right-0 top-full z-50 mt-2 w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg"
                >
                    <div className="flex items-center justify-between border-b border-gray-100 px-4 py-2.5">
                        <p className="text-sm font-semibold text-green-950">Notifications</p>
                        {unread > 0 && (
                            <button type="button" onClick={markAll} className="text-xs font-medium text-green-800 hover:underline">
                                Mark all as read
                            </button>
                        )}
                    </div>

                    {failed && <p className="bg-amber-50 px-4 py-2 text-xs text-amber-900">Could not refresh. Showing the last list.</p>}

                    <ul className="max-h-96 overflow-y-auto">
                        {items.length === 0 && <li className="px-4 py-8 text-center text-sm text-gray-500">No notifications yet.</li>}
                        {items.map((n) => (
                            <li key={n.id} className="border-b border-gray-50 last:border-0">
                                <button
                                    type="button"
                                    role="menuitem"
                                    onClick={() => void openItem(n)}
                                    className={`flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-green-50 ${n.isRead ? '' : 'bg-amber-50/60'}`}
                                >
                                    <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${n.isRead ? 'bg-transparent' : 'bg-red-500'}`} />
                                    <span className="min-w-0">
                                        <span className="block text-sm font-medium text-green-950">{n.title}</span>
                                        {n.body && <span className="block truncate text-xs text-gray-600">{n.body}</span>}
                                        <span className="block text-xs text-gray-400">{timeAgo(n.createdAt)}</span>
                                    </span>
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    )
}

export default NotificationBell

import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FaThumbtack } from 'react-icons/fa'
import { getErrorMessage } from '../../../services/api'
import { dateOnly, listNotices } from '../../../services/staff'
import type { Notice } from '../../../services/staff'

const roleName: Record<string, string> = { admin: 'Administration', ict: 'ICT', employee: 'Employee', lecturer: 'Lecturer', student: 'Student', member: 'Member' }

const NoticesPanel = ({ compact }: { compact?: boolean }) => {
    const [notices, setNotices] = useState<Notice[] | null>(null)
    const [error, setError] = useState('')

    useEffect(() => {
        let cancelled = false
        listNotices()
            .then((n) => {
                if (!cancelled) setNotices(n)
            })
            .catch((err) => {
                if (!cancelled) setError(getErrorMessage(err, 'Could not load the notices.'))
            })
        return () => {
            cancelled = true
        }
    }, [])

    const shown = compact ? (notices ?? []).slice(0, 3) : (notices ?? [])

    return (
        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <h2 className="text-lg font-semibold text-green-950">Notices</h2>
                    <p className="text-sm text-gray-500">From administration and ICT.</p>
                </div>
                {compact && (
                    <Link to="/employee/announcements" className="text-sm font-medium text-green-800 hover:underline">
                        See all
                    </Link>
                )}
            </div>

            {error && (
                <p role="alert" className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                    {error}
                </p>
            )}
            <ul className="mt-2 divide-y divide-gray-100">
                {!notices && !error && <li className="py-6 text-center text-sm text-gray-500">Loading...</li>}
                {notices && notices.length === 0 && <li className="py-6 text-center text-sm text-gray-500">There are no notices right now.</li>}
                {shown.map((n) => (
                    <li key={n.id} className="py-3">
                        <div className="flex items-center gap-2">
                            {n.pinned && <FaThumbtack className="h-3 w-3 shrink-0 text-amber-600" aria-label="Pinned" />}
                            <p className="font-medium text-green-950">{n.title}</p>
                        </div>
                        <p className="mt-0.5 whitespace-pre-line text-sm text-gray-700">{n.body}</p>
                        <p className="mt-1 text-xs text-gray-500">
                            {n.author} ({roleName[n.authorRole] ?? n.authorRole}) · {dateOnly(n.createdAt)}
                        </p>
                    </li>
                ))}
            </ul>
        </section>
    )
}

export default NoticesPanel

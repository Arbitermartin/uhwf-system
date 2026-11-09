
// export default AdminDashboard
import { useCallback, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import {
    FaUsers,
    FaUserGraduate,
    FaChalkboardTeacher,
    FaBook,
    FaClock,
    FaPlus,
    FaSyncAlt,
} from 'react-icons/fa'
import { getErrorMessage } from '../../services/api'
import { getAdminDashboard } from '../../services/dashboard'
import type { AdminDashboardData } from '../../services/dashboard'
import ApplicationReviewModal from './applications/ApplicationReviewModal'
import { payLabel, payTag, statusLabel, statusTag } from './applications/appLabels'
import { formatDate, initials } from './users/userLabels'

const StatCard = ({
    label,
    value,
    note,
    icon,
    noteClass = 'text-green-700',
    highlight,
}: {
    label: string
    value: number
    note: string
    icon: ReactNode
    noteClass?: string
    highlight?: boolean
}) => (
    <div className={`rounded-xl border bg-white p-4 shadow-sm ${highlight ? 'border-amber-400' : 'border-gray-200'}`}>
        <p className="flex items-center gap-1.5 text-xs text-gray-500">
            {icon} {label}
        </p>
        <p className={`mt-1 text-2xl font-bold ${highlight ? 'text-amber-700' : 'text-green-950'}`}>
            {value.toLocaleString('en-US')}
        </p>
        <p className={`text-xs ${noteClass}`}>{note}</p>
    </div>
)

const monthShort = (key: string) =>
    new Date(`${key}-01T12:00:00`).toLocaleDateString('en-GB', { month: 'short' })

const monthLong = (key: string) =>
    new Date(`${key}-01T12:00:00`).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })

const AdminDashboard = () => {
    const [data, setData] = useState<AdminDashboardData | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [reviewId, setReviewId] = useState<number | null>(null)

    const load = useCallback(async () => {
        setLoading(true)
        try {
            setData(await getAdminDashboard())
            setError('')
        } catch (err) {
            setError(getErrorMessage(err, 'Could not load the dashboard.'))
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        void load()
    }, [load])

    const heading = (
        <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
                <h1 className="text-2xl font-bold text-green-950">Dashboard</h1>
                <p className="text-sm text-gray-500">Welcome back. Here is what is happening today.</p>
            </div>
            <div className="flex gap-2">
                <button
                    type="button"
                    onClick={() => void load()}
                    disabled={loading}
                    aria-label="Refresh the numbers"
                    className="inline-flex items-center gap-2 rounded-lg border border-green-900 px-3 py-2 text-sm font-medium text-green-900 hover:bg-green-50 disabled:opacity-60"
                >
                    <FaSyncAlt className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} /> Refresh
                </button>
                <Link
                    to="/admin/users?new=1"
                    className="inline-flex items-center gap-2 rounded-lg bg-amber-400 px-4 py-2 text-sm font-semibold text-green-950 transition-colors hover:bg-amber-300"
                >
                    <FaPlus className="h-3 w-3" /> Add user
                </Link>
            </div>
        </div>
    )

    if (!data) {
        return (
            <div className="mx-auto max-w-6xl space-y-4">
                {heading}
                {error ? (
                    <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
                        {error}
                    </p>
                ) : (
                    <p className="py-10 text-center text-sm text-gray-500">Loading the numbers...</p>
                )}
            </div>
        )
    }

    const { stats, registrations, roles, recent } = data
    const maxCount = Math.max(...registrations.map((r) => r.count), 0)
    const roleRows = [
        { label: 'Students', count: roles.students, color: 'bg-green-900' },
        { label: 'Lecturers', count: roles.lecturers, color: 'bg-amber-400' },
        { label: 'Employees', count: roles.employees, color: 'bg-green-500' },
        { label: 'ICT and admin', count: roles.staff, color: 'bg-green-200' },

    ]
    const roleTotal = roleRows.reduce((sum, r) => sum + r.count, 0)

    return (
        <div className="mx-auto max-w-6xl space-y-6">
            {heading}

            {error && (
                <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
                    Could not refresh: {error} (showing the last numbers)
                </p>
            )}

            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
                <StatCard
                    label="Total users"
                    value={stats.totalUsers}
                    note={`+${stats.newUsersThisMonth} this month`}
                    icon={<FaUsers className="h-3 w-3" />}
                />
                <StatCard
                    label="Students"
                    value={stats.students}
                    note={`+${stats.newStudentsThisMonth} this month`}
                    icon={<FaUserGraduate className="h-3 w-3" />}
                />
                <StatCard
                    label="Lecturers"
                    value={stats.lecturers}
                    note={`+${stats.newLecturersThisMonth} this month`}
                    icon={<FaChalkboardTeacher className="h-3 w-3" />}
                />
                <StatCard
                    label="Active courses"
                    value={stats.courses}
                    note="Open for selection"
                    icon={<FaBook className="h-3 w-3" />}
                    noteClass="text-gray-500"
                />
                <StatCard
                    label="Needs review"
                    value={stats.needsReview}
                    note={
                        stats.pendingPayments > 0
                            ? `${stats.pendingPayments} payment${stats.pendingPayments === 1 ? '' : 's'} to confirm`
                            : 'Submitted applications'
                    }
                    icon={<FaClock className="h-3 w-3" />}
                    noteClass="text-amber-700"
                    highlight={stats.needsReview > 0 || stats.pendingPayments > 0}
                />
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
                <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                    <h2 className="font-semibold text-green-950">New registrations</h2>
                    <p className="text-xs text-gray-500">New student accounts per month, last 6 months</p>

                    {maxCount === 0 ? (
                        <p className="mt-6 rounded-lg bg-green-50 p-6 text-center text-sm text-gray-500">
                            No registrations in the last 6 months.
                        </p>
                    ) : (
                        <>
                            <div className="mt-4 flex h-40 items-end gap-3 border-b border-gray-200">
                                {registrations.map((r, i) => (
                                    <div key={r.month} className="flex h-full flex-1 flex-col items-center justify-end">
                                        <span className="mb-1 text-xs font-medium text-green-950">{r.count}</span>
                                        <div
                                            title={`${monthLong(r.month)}: ${r.count}`}
                                            style={{ height: `${r.count === 0 ? 2 : Math.max((r.count / maxCount) * 85, 6)}%` }}
                                            className={`w-full rounded-t ${i === registrations.length - 1 ? 'bg-green-900' : r.count === 0 ? 'bg-gray-200' : 'bg-green-300'
                                                }`}
                                        />
                                    </div>
                                ))}
                            </div>
                            <div className="mt-1 flex gap-3 text-center text-xs text-gray-500">
                                {registrations.map((r) => (
                                    <span key={r.month} className="flex-1">
                                        {monthShort(r.month)}
                                    </span>
                                ))}
                            </div>
                        </>
                    )}
                </section>

                <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                    <h2 className="font-semibold text-green-950">Users by role</h2>
                    {roleTotal > 0 && (
                        <div className="mt-4 flex h-4 overflow-hidden rounded-full bg-gray-100">
                            {roleRows.map((r) => (
                                <div
                                    key={r.label}
                                    className={r.color}
                                    style={{ width: `${(r.count / roleTotal) * 100}%` }}
                                    title={`${r.label}: ${r.count}`}
                                />
                            ))}
                        </div>
                    )}
                    <ul className="mt-4 space-y-2 text-sm">
                        {roleRows.map((r) => (
                            <li key={r.label} className="flex items-center justify-between">
                                <span className="flex items-center gap-2 text-gray-700">
                                    <span className={`h-2.5 w-2.5 rounded-sm ${r.color}`} />
                                    {r.label}
                                </span>
                                <span className="font-medium text-green-950">{r.count.toLocaleString('en-US')}</span>
                            </li>
                        ))}
                    </ul>
                </section>
            </div>

            <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                    <h2 className="font-semibold text-green-950">Recent applications</h2>
                    <Link to="/admin/applications" className="text-sm font-medium text-green-800 hover:underline">
                        View all
                    </Link>
                </div>

                <div className="mt-3 overflow-x-auto">
                    <table className="w-full min-w-[36rem] text-left text-sm">
                        <thead>
                            <tr className="text-xs text-gray-500">
                                <th className="py-2 font-normal">Applicant</th>
                                <th className="py-2 font-normal">Submitted</th>
                                <th className="py-2 font-normal">Payment</th>
                                <th className="py-2 font-normal">Status</th>
                                <th className="py-2 text-right font-normal">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recent.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="border-t border-gray-100 py-8 text-center text-gray-500">
                                        No applications have been submitted yet.
                                    </td>
                                </tr>
                            )}
                            {recent.map((a) => (
                                <tr key={a.id} className="border-t border-gray-100">
                                    <td className="py-3">
                                        <div className="flex items-center gap-3">
                                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-green-200 text-xs font-semibold text-green-950">
                                                {initials(a.student.name)}
                                            </span>
                                            <div className="min-w-0">
                                                <p className="truncate font-medium text-green-950">{a.student.name}</p>
                                                <p className="truncate text-xs text-gray-500">{a.student.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-3 text-gray-600">{a.submittedAt ? formatDate(a.submittedAt) : '-'}</td>
                                    <td className="py-3">
                                        <span className={`rounded px-2 py-0.5 text-xs font-medium ${payTag[a.paymentStatus]}`}>
                                            {payLabel[a.paymentStatus]}
                                        </span>
                                    </td>
                                    <td className="py-3">
                                        <span className={`rounded px-2 py-0.5 text-xs font-medium ${statusTag[a.status]}`}>
                                            {statusLabel[a.status]}
                                        </span>
                                    </td>
                                    <td className="py-3 text-right">
                                        <button
                                            type="button"
                                            onClick={() => setReviewId(a.id)}
                                            aria-label={`Review application of ${a.student.name}`}
                                            className="rounded-md border border-green-900 px-3 py-1.5 text-xs font-medium text-green-900 hover:bg-green-50"
                                        >
                                            {a.status === 'submitted' ? 'Review' : 'View'}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>

            {reviewId !== null && (
                <ApplicationReviewModal
                    applicationId={reviewId}
                    onClose={() => setReviewId(null)}
                    onChanged={() => void load()}
                />
            )}
        </div>
    )
}

export default AdminDashboard

import { useEffect, useRef, useState } from 'react'
import { FaPlus, FaSearch } from 'react-icons/fa'
import { getErrorMessage } from '../../services/api'
import { listEnrollments, removeEnrollment, setEnrollmentStatus } from '../../services/enrollments'
import type { EnrollmentList, EnrollmentRow, EnrollmentStatus } from '../../services/enrollments'
import AddEnrollmentModal from './enrollments/AddEnrollmentModal'
import { formatDate, initials } from './users/userLabels'

const PAGE_SIZE = 15

type Tab = EnrollmentStatus | 'all'

const tabs: { key: Tab; label: string }[] = [
    { key: 'active', label: 'Active' },
    { key: 'completed', label: 'Completed' },
    { key: 'dropped', label: 'Dropped' },
    { key: 'all', label: 'All' },
]

const statusTag: Record<EnrollmentStatus, string> = {
    active: 'bg-green-100 text-green-800',
    completed: 'bg-sky-100 text-sky-900',
    dropped: 'bg-gray-100 text-gray-700',
}

const statusLabel: Record<EnrollmentStatus, string> = { active: 'Active', completed: 'Completed', dropped: 'Dropped' }

const EnrollmentsPage = () => {
    const [tab, setTab] = useState<Tab>('active')
    const [courseId, setCourseId] = useState('')
    const [searchInput, setSearchInput] = useState('')
    const [search, setSearch] = useState('')
    const [page, setPage] = useState(1)
    const [reloadKey, setReloadKey] = useState(0)

    const [data, setData] = useState<EnrollmentList | null>(null)
    const [error, setError] = useState('')
    const [notice, setNotice] = useState('')
    const [adding, setAdding] = useState(false)
    const [armed, setArmed] = useState<{ id: number; action: 'drop' | 'remove' } | null>(null)
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
        listEnrollments({
            courseId: courseId ? Number(courseId) : undefined,
            status: tab === 'all' ? undefined : tab,
            search: search || undefined,
            page,
            pageSize: PAGE_SIZE,
        })
            .then((res) => {
                if (!cancelled) {
                    setData(res)
                    setError('')
                }
            })
            .catch((err) => {
                if (!cancelled) setError(getErrorMessage(err, 'Could not load the enrollments.'))
            })
        return () => {
            cancelled = true
        }
    }, [tab, courseId, search, page, reloadKey])

    useEffect(() => {
        if (data && data.enrollments.length === 0 && page > 1) setPage(page - 1)
    }, [data, page])

    const refresh = () => setReloadKey((k) => k + 1)

    // The first click on "Drop" or "Remove" asks for confirmation. It goes back after 4 seconds.
    const arm = (id: number, action: 'drop' | 'remove') => {
        setArmed({ id, action })
        window.clearTimeout(armTimer.current)
        armTimer.current = window.setTimeout(() => setArmed(null), 4000)
    }

    const change = async (row: EnrollmentRow, status: EnrollmentStatus, message: string) => {
        setArmed(null)
        setNotice('')
        try {
            await setEnrollmentStatus(row.id, status)
            setNotice(`${row.student.name} in ${row.course.code}: ${message}`)
            refresh()
        } catch (err) {
            setError(getErrorMessage(err, 'Could not change the enrollment.'))
        }
    }

    const remove = async (row: EnrollmentRow) => {
        setArmed(null)
        setNotice('')
        try {
            await removeEnrollment(row.id)
            setNotice(`${row.student.name} was removed from ${row.course.code}.`)
            refresh()
        } catch (err) {
            // for example: the student already has attendance, so the server says to drop instead
            setError(getErrorMessage(err, 'Could not remove the enrollment.'))
        }
    }

    const totalPages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1
    const from = data && data.total > 0 ? (data.page - 1) * PAGE_SIZE + 1 : 0
    const to = data ? Math.min(data.page * PAGE_SIZE, data.total) : 0

    return (
        <div className="mx-auto max-w-6xl space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-green-950">Enrollments</h1>
                    <p className="text-sm text-gray-500">Which student is in which course. Approving an application enrolls the student automatically.</p>
                </div>
                <button
                    type="button"
                    onClick={() => {
                        setNotice('')
                        setError('')
                        setAdding(true)
                    }}
                    className="inline-flex items-center gap-2 rounded-lg bg-amber-400 px-4 py-2 text-sm font-semibold text-green-950 hover:bg-amber-300"
                >
                    <FaPlus className="h-3 w-3" /> Enroll a student
                </button>
            </div>

            {notice && (
                <p role="status" className="rounded-lg bg-green-50 px-4 py-2.5 text-sm text-green-800">
                    {notice}
                </p>
            )}
            {error && (
                <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
                    {error}
                </p>
            )}

            <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="flex flex-wrap gap-2">
                    {tabs.map((t) => (
                        <button
                            key={t.key}
                            type="button"
                            aria-pressed={tab === t.key}
                            onClick={() => {
                                setTab(t.key)
                                setPage(1)
                                setNotice('')
                                setError('')
                            }}
                            className={`rounded-full border px-4 py-1.5 text-sm font-medium ${tab === t.key ? 'border-green-900 bg-green-900 text-white' : 'border-green-200 text-green-900 hover:bg-green-50'
                                }`}
                        >
                            {t.label}
                            {data && <span className="ml-1.5 text-xs opacity-80">{data.counts[t.key]}</span>}
                        </button>
                    ))}
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-3">
                    <div className="flex min-w-[14rem] max-w-sm flex-1 items-center gap-2 rounded-lg bg-green-50 px-3">
                        <FaSearch className="h-3.5 w-3.5 text-gray-400" />
                        <input
                            type="text"
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            placeholder="Search student name or reg. number"
                            aria-label="Search enrollments"
                            className="w-full bg-transparent py-2 text-sm outline-none placeholder:text-gray-400"
                        />
                    </div>
                    <select
                        value={courseId}
                        onChange={(e) => {
                            setCourseId(e.target.value)
                            setPage(1)
                        }}
                        aria-label="Filter by course"
                        className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-green-500"
                    >
                        <option value="">All courses</option>
                        {data?.courses.map((c) => (
                            <option key={c.id} value={c.id}>
                                {c.code} ({c.active} active)
                            </option>
                        ))}
                    </select>
                </div>

                <div className="mt-4 overflow-x-auto">
                    <table className="w-full min-w-[44rem] text-left text-sm">
                        <thead>
                            <tr className="text-xs text-gray-500">
                                <th className="py-2 font-normal">Student</th>
                                <th className="py-2 font-normal">Course</th>
                                <th className="py-2 font-normal">Enrolled</th>
                                <th className="py-2 font-normal">Status</th>
                                <th className="py-2 text-right font-normal">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {!data && !error && (
                                <tr>
                                    <td colSpan={5} className="border-t border-gray-100 py-8 text-center text-gray-500">
                                        Loading enrollments...
                                    </td>
                                </tr>
                            )}
                            {data && data.enrollments.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="border-t border-gray-100 py-8 text-center text-gray-500">
                                        No enrollments found.
                                    </td>
                                </tr>
                            )}
                            {data?.enrollments.map((e) => (
                                <tr key={e.id} className="border-t border-gray-100">
                                    <td className="py-3">
                                        <div className="flex items-center gap-3">
                                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-green-200 text-xs font-semibold text-green-950">
                                                {initials(e.student.name)}
                                            </span>
                                            <div className="min-w-0">
                                                <p className="truncate font-medium text-green-950">{e.student.name}</p>
                                                <p className="text-xs text-gray-500">{e.student.regNumber}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-3 text-gray-700">
                                        <span className="font-semibold">{e.course.code}</span> <span className="text-gray-600">{e.course.title}</span>
                                    </td>
                                    <td className="py-3 text-gray-600">{formatDate(e.enrolledAt)}</td>
                                    <td className="py-3">
                                        <span className={`rounded px-2 py-0.5 text-xs font-medium ${statusTag[e.status]}`}>{statusLabel[e.status]}</span>
                                    </td>
                                    <td className="py-3">
                                        <div className="flex flex-wrap justify-end gap-2">
                                            {e.status === 'active' && (
                                                <>
                                                    <button
                                                        type="button"
                                                        onClick={() => void change(e, 'completed', 'marked as completed.')}
                                                        className="rounded-md border border-green-900 px-3 py-1 text-xs font-medium text-green-900 hover:bg-green-50"
                                                    >
                                                        Complete
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => (armed?.id === e.id && armed.action === 'drop' ? void change(e, 'dropped', 'dropped from the course.') : arm(e.id, 'drop'))}
                                                        className={`rounded-md border px-3 py-1 text-xs font-medium ${armed?.id === e.id && armed.action === 'drop'
                                                            ? 'border-amber-700 bg-amber-700 text-white'
                                                            : 'border-amber-500 text-amber-700 hover:bg-amber-50'
                                                            }`}
                                                    >
                                                        {armed?.id === e.id && armed.action === 'drop' ? 'Confirm drop' : 'Drop'}
                                                    </button>
                                                </>
                                            )}
                                            {e.status !== 'active' && (
                                                <button
                                                    type="button"
                                                    onClick={() => void change(e, 'active', e.status === 'dropped' ? 're-enrolled.' : 're-opened.')}
                                                    className="rounded-md border border-green-900 px-3 py-1 text-xs font-medium text-green-900 hover:bg-green-50"
                                                >
                                                    {e.status === 'dropped' ? 'Re-enroll' : 'Re-open'}
                                                </button>
                                            )}
                                            <button
                                                type="button"
                                                onClick={() => (armed?.id === e.id && armed.action === 'remove' ? void remove(e) : arm(e.id, 'remove'))}
                                                className={`rounded-md border px-3 py-1 text-xs font-medium ${armed?.id === e.id && armed.action === 'remove'
                                                    ? 'border-red-700 bg-red-700 text-white'
                                                    : 'border-red-600 text-red-700 hover:bg-red-50'
                                                    }`}
                                            >
                                                {armed?.id === e.id && armed.action === 'remove' ? 'Confirm remove' : 'Remove'}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

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
                                className="rounded-md border border-green-200 px-4 py-1.5 text-green-900 hover:bg-green-50 disabled:opacity-40"
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
                                className="rounded-md border border-green-200 px-4 py-1.5 text-green-900 hover:bg-green-50 disabled:opacity-40"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </section>

            {adding && data && (
                <AddEnrollmentModal
                    courses={data.courses}
                    defaultCourseId={courseId ? Number(courseId) : null}
                    onClose={() => setAdding(false)}
                    onSaved={(message) => {
                        setAdding(false)
                        setNotice(message)
                        refresh()
                    }}
                />
            )}
        </div>
    )
}

export default EnrollmentsPage

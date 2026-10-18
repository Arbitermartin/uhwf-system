import { useEffect, useState } from 'react'
import { FaSearch, FaEye } from 'react-icons/fa'
import { getErrorMessage } from '../../services/api'
import { listApplications } from '../../services/applications'
import type { AppList } from '../../services/applications'
import type { ApplicationStatus } from '../../context/application-context'
import { docList } from '../../data/application'
import ApplicationReviewModal from './applications/ApplicationReviewModal'
import { payLabel, payTag, statusLabel, statusTag } from './applications/appLabels'
import { formatDate, initials } from './users/userLabels'

const PAGE_SIZE = 10

type Tab = ApplicationStatus | 'all'

const tabs: { key: Tab; label: string }[] = [
    { key: 'submitted', label: 'Needs review' },
    { key: 'approved', label: 'Approved' },
    { key: 'rejected', label: 'Rejected' },
    { key: 'draft', label: 'In progress' },
    { key: 'all', label: 'All' },
]

const ApplicationsPage = () => {
    const [tab, setTab] = useState<Tab>('submitted')
    const [searchInput, setSearchInput] = useState('')
    const [search, setSearch] = useState('')
    const [page, setPage] = useState(1)
    const [reloadKey, setReloadKey] = useState(0)

    const [data, setData] = useState<AppList | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [notice, setNotice] = useState('')
    const [reviewId, setReviewId] = useState<number | null>(null)

    // Wait until the admin stops typing before asking the server
    useEffect(() => {
        const t = window.setTimeout(() => {
            setSearch(searchInput.trim())
            setPage(1)
        }, 300)
        return () => window.clearTimeout(t)
    }, [searchInput])

    useEffect(() => {
        let cancelled = false
        setLoading(true)
        setError('')
        listApplications({
            status: tab === 'all' ? undefined : tab,
            search: search || undefined,
            page,
            pageSize: PAGE_SIZE,
        })
            .then((res) => {
                if (!cancelled) setData(res)
            })
            .catch((err) => {
                if (!cancelled) setError(getErrorMessage(err, 'Could not load applications.'))
            })
            .finally(() => {
                if (!cancelled) setLoading(false)
            })
        return () => {
            cancelled = true
        }
    }, [tab, search, page, reloadKey])

    // If the last item on a page was moved to another tab, step back one page
    useEffect(() => {
        if (data && data.applications.length === 0 && page > 1) setPage(page - 1)
    }, [data, page])

    const totalPages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1
    const from = data && data.total > 0 ? (data.page - 1) * PAGE_SIZE + 1 : 0
    const to = data ? Math.min(data.page * PAGE_SIZE, data.total) : 0

    return (
        <div className="mx-auto max-w-6xl space-y-4">
            <div>
                <h1 className="text-2xl font-bold text-green-950">Applications</h1>
                <p className="text-sm text-gray-500">
                    Review submitted student applications. Approving creates the registration number and enrolls the
                    student in the chosen courses.
                </p>
            </div>

            {notice && (
                <p role="status" className="rounded-lg bg-green-50 px-4 py-2.5 text-sm text-green-800">
                    {notice}
                </p>
            )}

            <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="flex flex-wrap gap-2">
                    {tabs.map((t) => (
                        <button
                            key={t.key}
                            type="button"
                            onClick={() => {
                                setTab(t.key)
                                setPage(1)
                                setNotice('')
                            }}
                            aria-pressed={tab === t.key}
                            className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${tab === t.key
                                ? 'border-green-900 bg-green-900 text-white'
                                : 'border-green-200 bg-white text-green-900 hover:bg-green-50'
                                }`}
                        >
                            {t.label}
                            {data && <span className="ml-1.5 text-xs opacity-80">{data.counts[t.key]}</span>}
                        </button>
                    ))}
                </div>

                <div className="mt-4 flex max-w-sm items-center gap-2 rounded-lg bg-green-50 px-3">
                    <FaSearch className="h-3.5 w-3.5 text-gray-400" />
                    <input
                        type="text"
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        placeholder="Search name or email"
                        aria-label="Search applications"
                        className="w-full bg-transparent py-2 text-sm outline-none placeholder:text-gray-400"
                    />
                </div>

                {error && (
                    <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                        {error}
                    </p>
                )}

                <div className="mt-4 overflow-x-auto">
                    <table className="w-full min-w-[44rem] text-left text-sm">
                        <thead>
                            <tr className="text-xs text-gray-500">
                                <th className="py-2 font-normal">Applicant</th>
                                <th className="py-2 font-normal">Submitted</th>
                                <th className="py-2 font-normal">Payment</th>
                                <th className="py-2 font-normal">Courses</th>
                                <th className="py-2 font-normal">Documents</th>
                                <th className="py-2 font-normal">Status</th>
                                <th className="py-2 text-right font-normal">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading && !data && (
                                <tr>
                                    <td colSpan={7} className="border-t border-gray-100 py-8 text-center text-gray-500">
                                        Loading applications...
                                    </td>
                                </tr>
                            )}
                            {data && data.applications.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="border-t border-gray-100 py-8 text-center text-gray-500">
                                        No applications here.
                                    </td>
                                </tr>
                            )}
                            {data?.applications.map((a) => (
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
                                    <td className="py-3 text-gray-600">{a.courseCount}</td>
                                    <td className="py-3 text-gray-600">
                                        {a.documentCount} of {docList.length}
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
                                            className="inline-flex items-center gap-2 rounded-md border border-green-900 px-3 py-1.5 text-xs font-medium text-green-900 hover:bg-green-50"
                                        >
                                            <FaEye className="h-3 w-3" /> {a.status === 'submitted' ? 'Review' : 'View'}
                                        </button>
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

            {reviewId !== null && (
                <ApplicationReviewModal
                    applicationId={reviewId}
                    onClose={() => setReviewId(null)}
                    onChanged={(message) => {
                        setNotice(message)
                        setReloadKey((k) => k + 1)
                    }}
                />
            )}
        </div>
    )
}

export default ApplicationsPage

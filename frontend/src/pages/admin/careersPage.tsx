import { useEffect, useRef, useState } from 'react'
import { FaEdit, FaPlus, FaSearch, FaTrash, FaUsers } from 'react-icons/fa'
import { getErrorMessage } from '../../services/api'
import { closesText, deleteJob, jobTypeLabel, listJobs, setJobOpen } from '../../services/careers'
import type { AdminJob, JobList } from '../../services/careers'
import ApplicationsModal from './careers/ApplicationsModal'
import JobFormModal from './careers/JobFormModal'

const PAGE_SIZE = 10

type Tab = 'all' | 'open' | 'closed'

const tabs: { key: Tab; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'open', label: 'Open' },
    { key: 'closed', label: 'Closed' },
]

const CareersPage = () => {
    const [tab, setTab] = useState<Tab>('all')
    const [searchInput, setSearchInput] = useState('')
    const [search, setSearch] = useState('')
    const [page, setPage] = useState(1)
    const [reloadKey, setReloadKey] = useState(0)

    const [data, setData] = useState<JobList | null>(null)
    const [error, setError] = useState('')
    const [notice, setNotice] = useState('')
    const [form, setForm] = useState<{ id: number | null } | null>(null)
    const [viewing, setViewing] = useState<AdminJob | null>(null)
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
        listJobs({ status: tab === 'all' ? undefined : tab, search: search || undefined, page, pageSize: PAGE_SIZE })
            .then((res) => {
                if (!cancelled) {
                    setData(res)
                    setError('')
                }
            })
            .catch((err) => {
                if (!cancelled) setError(getErrorMessage(err, 'Could not load the jobs.'))
            })
        return () => {
            cancelled = true
        }
    }, [tab, search, page, reloadKey])

    useEffect(() => {
        if (data && data.jobs.length === 0 && page > 1) setPage(page - 1)
    }, [data, page])

    const refresh = () => setReloadKey((k) => k + 1)

    // A closed job is reopened. An open job (or an expired one) is closed.
    const toggle = async (job: AdminJob) => {
        setNotice('')
        setError('')
        const opening = job.status === 'closed'
        try {
            await setJobOpen(job.id, opening)
            setNotice(opening ? 'Reopened. It is on the Career page again.' : 'Closed. It is hidden from the Career page.')
            refresh()
        } catch (err) {
            // for example: reopening a job whose closing date has passed, so the server asks for a new date
            setError(getErrorMessage(err, 'Could not change the job.'))
        }
    }

    const remove = async (job: AdminJob) => {
        if (armedId !== job.id) {
            setArmedId(job.id)
            window.clearTimeout(armTimer.current)
            armTimer.current = window.setTimeout(() => setArmedId(null), 4000)
            return
        }
        setArmedId(null)
        setNotice('')
        setError('')
        try {
            await deleteJob(job.id)
            setNotice('Job deleted.')
            refresh()
        } catch (err) {
            // for example: applications exist, so the server says to close it instead
            setError(getErrorMessage(err, 'Could not delete the job.'))
        }
    }

    const totalPages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1

    return (
        <div className="mx-auto max-w-6xl space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-green-950">Careers</h1>
                    <p className="text-sm text-gray-500">Post jobs for the Career page of the website, and read the applications.</p>
                </div>
                <button
                    type="button"
                    onClick={() => {
                        setNotice('')
                        setError('')
                        setForm({ id: null })
                    }}
                    className="inline-flex items-center gap-2 rounded-lg bg-amber-400 px-4 py-2 text-sm font-semibold text-green-950 hover:bg-amber-300"
                >
                    <FaPlus className="h-3 w-3" /> Post a job
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
                                setError('')
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
                            placeholder="Search title or location"
                            aria-label="Search jobs"
                            className="w-full bg-transparent py-2 text-sm outline-none placeholder:text-gray-400"
                        />
                    </div>
                </div>

                <div className="mt-3 overflow-x-auto">
                    <table className="w-full min-w-[46rem] text-left text-sm">
                        <thead>
                            <tr className="text-xs text-gray-500">
                                <th className="py-2 font-normal">Job</th>
                                <th className="py-2 font-normal">Status</th>
                                <th className="py-2 font-normal">Closes</th>
                                <th className="py-2 font-normal">Applications</th>
                                <th className="py-2 text-right font-normal">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {!data && !error && (
                                <tr>
                                    <td colSpan={5} className="border-t border-gray-100 py-8 text-center text-gray-500">
                                        Loading...
                                    </td>
                                </tr>
                            )}
                            {data && data.jobs.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="border-t border-gray-100 py-8 text-center text-gray-500">
                                        No jobs here. Click "Post a job" to add the first one.
                                    </td>
                                </tr>
                            )}
                            {data?.jobs.map((j) => (
                                <tr key={j.id} className="border-t border-gray-100">
                                    <td className="py-3">
                                        <p className="font-medium text-green-950">{j.title}</p>
                                        <p className="text-xs text-gray-500">
                                            {jobTypeLabel[j.jobType]} · {j.location}
                                        </p>
                                    </td>
                                    <td className="py-3">
                                        {j.status === 'open' && !j.expired && <span className="rounded bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">Open</span>}
                                        {j.expired && (
                                            <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-900" title="The closing date has passed, so visitors no longer see it">
                                                Expired
                                            </span>
                                        )}
                                        {j.status === 'closed' && <span className="rounded bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">Closed</span>}
                                    </td>
                                    <td className="py-3 text-gray-600">{j.closesOn ? closesText(j.closesOn) : 'No date'}</td>
                                    <td className="py-3">
                                        <button
                                            type="button"
                                            onClick={() => setViewing(j)}
                                            aria-label={`Applications for ${j.title}`}
                                            className="inline-flex items-center gap-2 rounded-md border border-green-900 px-3 py-1 text-xs font-medium text-green-900 hover:bg-green-50"
                                        >
                                            <FaUsers className="h-3 w-3" /> {j.applications.total}
                                            {j.applications.received > 0 && (
                                                <span className="rounded-full bg-red-500 px-1.5 text-[10px] font-semibold text-white">{j.applications.received} new</span>
                                            )}
                                        </button>
                                    </td>
                                    <td className="py-3">
                                        <div className="flex flex-wrap justify-end gap-2">
                                            {j.status === 'closed' ? (
                                                <button
                                                    type="button"
                                                    onClick={() => void toggle(j)}
                                                    className="rounded-md border border-green-900 px-3 py-1.5 text-xs font-medium text-green-900 hover:bg-green-50"
                                                >
                                                    Reopen
                                                </button>
                                            ) : (
                                                <button
                                                    type="button"
                                                    onClick={() => void toggle(j)}
                                                    className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                                                >
                                                    Close
                                                </button>
                                            )}
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setNotice('')
                                                    setError('')
                                                    setForm({ id: j.id })
                                                }}
                                                aria-label={`Edit ${j.title}`}
                                                title="Edit"
                                                className="rounded-md border border-amber-500 p-2 text-amber-700 hover:bg-amber-50"
                                            >
                                                <FaEdit className="h-3.5 w-3.5" />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => void remove(j)}
                                                aria-label={`Delete ${j.title}`}
                                                className={`inline-flex items-center gap-1 rounded-md border px-2 py-1.5 text-xs font-medium ${armedId === j.id ? 'border-red-700 bg-red-700 text-white' : 'border-red-600 text-red-700 hover:bg-red-50'
                                                    }`}
                                            >
                                                <FaTrash className="h-3.5 w-3.5" />
                                                {armedId === j.id ? 'Confirm' : ''}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

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
                <JobFormModal
                    jobId={form.id}
                    onClose={() => setForm(null)}
                    onSaved={(message) => {
                        setForm(null)
                        setNotice(message)
                        refresh()
                    }}
                />
            )}

            {viewing && (
                <ApplicationsModal jobId={viewing.id} jobTitle={viewing.title} onClose={() => setViewing(null)} onChanged={refresh} />
            )}
        </div>
    )
}

export default CareersPage

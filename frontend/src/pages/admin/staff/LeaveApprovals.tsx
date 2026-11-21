import { useEffect, useState } from 'react'
import { getErrorMessage } from '../../../services/api'
import { dayLong, decideLeave, leaveStatusLabel, leaveStatusTag, leaveTypeLabel, listAdminLeave } from '../../../services/staff'
import type { AdminLeave, AdminLeaveList, LeaveStatus } from '../../../services/staff'
import ModalShell from '../users/ModalShell'

const PAGE_SIZE = 10
type Tab = LeaveStatus | 'all'
const tabs: { key: Tab; label: string }[] = [
    { key: 'pending', label: 'Waiting' },
    { key: 'approved', label: 'Approved' },
    { key: 'rejected', label: 'Not approved' },
    { key: 'all', label: 'All' },
]

const RejectModal = ({ request, onClose, onDone }: { request: AdminLeave; onClose: () => void; onDone: () => void }) => {
    const [note, setNote] = useState('')
    const [busy, setBusy] = useState(false)
    const [error, setError] = useState('')

    const reject = async () => {
        setBusy(true)
        setError('')
        try {
            await decideLeave(request.id, 'rejected', note.trim())
            onDone()
        } catch (err) {
            setError(getErrorMessage(err, 'Could not save the decision.'))
            setBusy(false)
        }
    }

    return (
        <ModalShell title="Do not approve this leave?" subtitle={`${request.employee}: ${request.days} working day${request.days === 1 ? '' : 's'}`} onClose={onClose}>
            <label htmlFor="note" className="mb-1 block text-xs font-medium text-gray-600">
                Reason for the employee (optional)
            </label>
            <textarea
                id="note"
                rows={3}
                maxLength={300}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-500"
            />
            <p className="mt-1 text-xs text-gray-500">The employee is notified, and sees this note.</p>
            {error && (
                <p role="alert" className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                    {error}
                </p>
            )}
            <div className="mt-5 flex justify-end gap-3">
                <button type="button" onClick={onClose} className="rounded-lg border border-gray-200 px-5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                    Cancel
                </button>
                <button
                    type="button"
                    onClick={() => void reject()}
                    disabled={busy}
                    className="rounded-lg bg-red-700 px-5 py-2 text-sm font-semibold text-white hover:bg-red-800 disabled:opacity-60"
                >
                    {busy ? 'Saving...' : 'Do not approve'}
                </button>
            </div>
        </ModalShell>
    )
}

const LeaveApprovals = () => {
    const [tab, setTab] = useState<Tab>('pending')
    const [page, setPage] = useState(1)
    const [reloadKey, setReloadKey] = useState(0)
    const [data, setData] = useState<AdminLeaveList | null>(null)
    const [error, setError] = useState('')
    const [notice, setNotice] = useState('')
    const [rejecting, setRejecting] = useState<AdminLeave | null>(null)

    useEffect(() => {
        let cancelled = false
        listAdminLeave({ status: tab === 'all' ? undefined : tab, page, pageSize: PAGE_SIZE })
            .then((res) => {
                if (!cancelled) {
                    setData(res)
                    setError('')
                }
            })
            .catch((err) => {
                if (!cancelled) setError(getErrorMessage(err, 'Could not load the leave requests.'))
            })
        return () => {
            cancelled = true
        }
    }, [tab, page, reloadKey])

    useEffect(() => {
        if (data && data.requests.length === 0 && page > 1) setPage(page - 1)
    }, [data, page])

    const refresh = () => setReloadKey((k) => k + 1)

    const approve = async (r: AdminLeave) => {
        setNotice('')
        setError('')
        try {
            await decideLeave(r.id, 'approved', '')
            setNotice(`Approved: ${r.employee}.`)
            refresh()
        } catch (err) {
            setError(getErrorMessage(err, 'Could not approve the request.'))
        }
    }

    const totalPages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1

    return (
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
                        }}
                        className={`rounded-full border px-4 py-1.5 text-sm font-medium ${tab === t.key ? 'border-green-900 bg-green-900 text-white' : 'border-green-200 text-green-900 hover:bg-green-50'
                            }`}
                    >
                        {t.label}
                        {data && t.key !== 'all' && <span className="ml-1.5 text-xs opacity-80">{data.counts[t.key]}</span>}
                    </button>
                ))}
            </div>

            {notice && (
                <p role="status" className="mt-3 rounded-lg bg-green-50 px-4 py-2.5 text-sm text-green-800">
                    {notice}
                </p>
            )}
            {error && (
                <p role="alert" className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                    {error}
                </p>
            )}

            <ul className="mt-3 space-y-3">
                {!data && !error && <li className="py-8 text-center text-sm text-gray-500">Loading...</li>}
                {data && data.requests.length === 0 && (
                    <li className="py-8 text-center text-sm text-gray-500">{tab === 'pending' ? 'No leave requests are waiting. You are up to date.' : 'No requests here.'}</li>
                )}
                {data?.requests.map((r) => (
                    <li key={r.id} className="rounded-lg border border-gray-200 p-4">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="min-w-0">
                                <p className="font-semibold text-green-950">
                                    {r.employee}
                                    {r.position && <span className="font-normal text-gray-500"> · {r.position}</span>}
                                </p>
                                <p className="text-sm text-gray-700">
                                    {leaveTypeLabel[r.type]}: {dayLong(r.startDate)}
                                    {r.endDate !== r.startDate ? ` to ${dayLong(r.endDate)}` : ''} ({r.days} working day{r.days === 1 ? '' : 's'})
                                </p>
                            </div>
                            <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${leaveStatusTag[r.status]}`}>{leaveStatusLabel[r.status]}</span>
                        </div>
                        <p className="mt-2 rounded-lg bg-green-50 p-2.5 text-sm text-gray-700">{r.reason}</p>
                        <p className="mt-2 text-xs text-gray-500">
                            Annual leave left this year: <strong className="text-green-950">{r.annualLeft}</strong> of {data.annualDays} days
                            {r.decidedBy ? ` · decided by ${r.decidedBy}` : ''}
                        </p>
                        {r.status === 'pending' && (
                            <div className="mt-3 flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => void approve(r)}
                                    className="rounded-lg bg-green-800 px-4 py-1.5 text-sm font-semibold text-white hover:bg-green-900"
                                >
                                    Approve
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setRejecting(r)}
                                    className="rounded-lg border border-red-600 px-4 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50"
                                >
                                    Do not approve
                                </button>
                            </div>
                        )}
                    </li>
                ))}
            </ul>

            {data && data.total > PAGE_SIZE && (
                <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
                    <span>
                        Page {page} of {totalPages}
                    </span>
                    <div className="flex gap-2">
                        <button type="button" onClick={() => setPage(page - 1)} disabled={page <= 1} className="rounded-md border border-green-200 px-4 py-1.5 text-green-900 hover:bg-green-50 disabled:opacity-40">
                            Previous
                        </button>
                        <button type="button" onClick={() => setPage(page + 1)} disabled={page >= totalPages} className="rounded-md border border-green-200 px-4 py-1.5 text-green-900 hover:bg-green-50 disabled:opacity-40">
                            Next
                        </button>
                    </div>
                </div>
            )}

            {rejecting && (
                <RejectModal
                    request={rejecting}
                    onClose={() => setRejecting(null)}
                    onDone={() => {
                        setNotice(`Not approved: ${rejecting.employee}. The employee was notified.`)
                        setRejecting(null)
                        refresh()
                    }}
                />
            )}
        </section>
    )
}

export default LeaveApprovals

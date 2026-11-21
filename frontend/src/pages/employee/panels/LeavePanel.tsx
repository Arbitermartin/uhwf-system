import { useCallback, useEffect, useState } from 'react'
import type { ChangeEvent } from 'react'
import { Link } from 'react-router-dom'
import { FaPlus } from 'react-icons/fa'
import { getErrorMessage, getFieldErrors } from '../../../services/api'
import { addDaysTZ, todayTZ } from '../../../services/lecturer'
import {
    cancelLeave,
    dayLong,
    getMyLeave,
    leaveStatusLabel,
    leaveStatusTag,
    leaveTypeLabel,
    requestLeave,
    workingDays,
} from '../../../services/staff'
import type { LeaveBalance, LeaveType, MyLeave } from '../../../services/staff'
import ModalShell from '../../admin/users/ModalShell'

type Form = { type: LeaveType; startDate: string; endDate: string; reason: string }
type Errors = Partial<Record<keyof Form, string>>

const inputBase = 'w-full rounded-lg border bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-green-500'

const RequestModal = ({ balance, onClose, onSent }: { balance: LeaveBalance; onClose: () => void; onSent: (message: string) => void }) => {
    const [form, setForm] = useState<Form>({ type: 'annual', startDate: addDaysTZ(1), endDate: addDaysTZ(1), reason: '' })
    const [errors, setErrors] = useState<Errors>({})
    const [serverError, setServerError] = useState('')
    const [sending, setSending] = useState(false)

    const change = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target
        setForm((prev) => {
            const next = { ...prev, [name]: value }
            // the last day never comes before the first day
            if (name === 'startDate' && next.endDate < value) next.endDate = value
            return next
        })
        if (errors[name as keyof Form]) setErrors((p) => ({ ...p, [name]: undefined }))
        setServerError('')
    }

    const validDates = !!form.startDate && !!form.endDate && form.endDate >= form.startDate
    const days = validDates ? workingDays(form.startDate, form.endDate) : 0
    const tooMany = form.type === 'annual' && days > balance.remaining

    const send = async () => {
        const found: Errors = {}
        if (!validDates) found.endDate = 'Choose the first and last day.'
        if (form.reason.trim().length < 5) found.reason = 'Give a short reason (at least 5 characters).'
        setErrors(found)
        if (Object.keys(found).length > 0) return

        setSending(true)
        setServerError('')
        try {
            const n = await requestLeave({ ...form, reason: form.reason.trim() })
            onSent(`Your request for ${n} working day${n === 1 ? '' : 's'} was sent. You will be notified of the decision.`)
        } catch (err) {
            setErrors(getFieldErrors(err) as Errors)
            setServerError(getErrorMessage(err, 'Could not send your request.'))
            setSending(false)
        }
    }

    const cls = (k: keyof Form) => `${inputBase} ${errors[k] ? 'border-red-400' : 'border-gray-200'}`

    return (
        <ModalShell title="Request leave" subtitle={`Annual leave you can still request: ${Math.max(0, balance.remaining)} days`} onClose={onClose}>
            <div className="space-y-4">
                {serverError && (
                    <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                        {serverError}
                    </p>
                )}
                <div>
                    <label htmlFor="type" className="mb-1 block text-xs font-medium text-gray-600">
                        Type of leave
                    </label>
                    <select id="type" name="type" value={form.type} onChange={change} className={cls('type')}>
                        <option value="annual">Annual leave</option>
                        <option value="sick">Sick leave</option>
                        <option value="other">Other leave</option>
                    </select>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                        <label htmlFor="startDate" className="mb-1 block text-xs font-medium text-gray-600">
                            First day
                        </label>
                        <input
                            id="startDate"
                            name="startDate"
                            type="date"
                            value={form.startDate}
                            min={form.type === 'sick' ? addDaysTZ(-14) : todayTZ()}
                            onChange={change}
                            className={cls('startDate')}
                        />
                        {errors.startDate && <p className="mt-1 text-xs text-red-600">{errors.startDate}</p>}
                    </div>
                    <div>
                        <label htmlFor="endDate" className="mb-1 block text-xs font-medium text-gray-600">
                            Last day
                        </label>
                        <input id="endDate" name="endDate" type="date" value={form.endDate} min={form.startDate} onChange={change} className={cls('endDate')} />
                        {errors.endDate && <p className="mt-1 text-xs text-red-600">{errors.endDate}</p>}
                    </div>
                </div>

                {validDates && (
                    <p className={`rounded-lg px-3 py-2 text-sm ${tooMany || days === 0 ? 'bg-red-50 text-red-800' : 'bg-green-50 text-green-800'}`}>
                        {days === 0
                            ? 'That is only a weekend: no working days.'
                            : `${days} working day${days === 1 ? '' : 's'} (Monday to Friday).${tooMany ? ` You can only request ${Math.max(0, balance.remaining)}.` : ''}`}
                    </p>
                )}

                <div>
                    <label htmlFor="reason" className="mb-1 block text-xs font-medium text-gray-600">
                        Reason
                    </label>
                    <textarea id="reason" name="reason" rows={3} maxLength={500} value={form.reason} onChange={change} className={`${cls('reason')} resize-none`} />
                    {errors.reason && <p className="mt-1 text-xs text-red-600">{errors.reason}</p>}
                </div>

                <div className="flex justify-end gap-3">
                    <button type="button" onClick={onClose} className="rounded-lg border border-gray-200 px-5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={() => void send()}
                        disabled={sending}
                        className="rounded-lg bg-amber-400 px-5 py-2 text-sm font-semibold text-green-950 hover:bg-amber-300 disabled:opacity-60"
                    >
                        {sending ? 'Sending...' : 'Send request'}
                    </button>
                </div>
            </div>
        </ModalShell>
    )
}

const LeavePanel = ({ compact, onChanged }: { compact?: boolean; onChanged?: () => void }) => {
    const [data, setData] = useState<{ requests: MyLeave[]; balance: LeaveBalance } | null>(null)
    const [error, setError] = useState('')
    const [notice, setNotice] = useState('')
    const [asking, setAsking] = useState(false)

    const load = useCallback(async () => {
        try {
            setData(await getMyLeave())
            setError('')
        } catch (err) {
            setError(getErrorMessage(err, 'Could not load your leave.'))
        }
    }, [])

    useEffect(() => {
        void load()
    }, [load])

    const cancel = async (id: number) => {
        setError('')
        try {
            await cancelLeave(id)
            setNotice('Your request was cancelled.')
            await load()
            onChanged?.()
        } catch (err) {
            setError(getErrorMessage(err, 'Could not cancel the request.'))
        }
    }

    const rows = compact ? (data?.requests ?? []).slice(0, 3) : (data?.requests ?? [])

    return (
        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h2 className="text-lg font-semibold text-green-950">Leave</h2>
                    {data && (
                        <p className="text-sm text-gray-500">
                            {data.balance.left} of {data.balance.total} days of annual leave left
                            {data.balance.pending > 0 ? `, ${data.balance.pending} waiting for a decision` : ''}.
                        </p>
                    )}
                </div>
                <div className="flex items-center gap-3">
                    {compact && (
                        <Link to="/employee/leave" className="text-sm font-medium text-green-800 hover:underline">
                            View all
                        </Link>
                    )}
                    <button
                        type="button"
                        disabled={!data}
                        onClick={() => {
                            setNotice('')
                            setAsking(true)
                        }}
                        className="inline-flex items-center gap-2 rounded-lg bg-amber-400 px-4 py-2 text-sm font-semibold text-green-950 hover:bg-amber-300 disabled:opacity-50"
                    >
                        <FaPlus className="h-3 w-3" /> Request leave
                    </button>
                </div>
            </div>

            {notice && (
                <p role="status" className="mt-3 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-800">
                    {notice}
                </p>
            )}
            {error && (
                <p role="alert" className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                    {error}
                </p>
            )}

            <ul className="mt-2 divide-y divide-gray-100">
                {!data && !error && <li className="py-6 text-center text-sm text-gray-500">Loading...</li>}
                {data && data.requests.length === 0 && <li className="py-6 text-center text-sm text-gray-500">You have not requested any leave yet.</li>}
                {rows.map((r) => (
                    <li key={r.id} className="py-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="text-sm font-medium text-green-950">
                                {leaveTypeLabel[r.type]}: {dayLong(r.startDate)}
                                {r.endDate !== r.startDate ? ` to ${dayLong(r.endDate)}` : ''}
                            </p>
                            <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${leaveStatusTag[r.status]}`}>{leaveStatusLabel[r.status]}</span>
                        </div>
                        <p className="text-xs text-gray-500">
                            {r.days} working day{r.days === 1 ? '' : 's'}
                            {r.decidedBy ? ` · decided by ${r.decidedBy}` : ''} · {r.reason}
                        </p>
                        {r.status === 'pending' && (
                            <button type="button" onClick={() => void cancel(r.id)} className="mt-1 text-sm text-red-700 hover:underline">
                                Cancel this request
                            </button>
                        )}
                    </li>
                ))}
            </ul>

            {asking && data && (
                <RequestModal
                    balance={data.balance}
                    onClose={() => setAsking(false)}
                    onSent={(message) => {
                        setAsking(false)
                        setNotice(message)
                        void load()
                        onChanged?.()
                    }}
                />
            )}
        </section>
    )
}

export default LeavePanel

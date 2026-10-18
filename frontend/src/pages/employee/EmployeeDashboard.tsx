import { useState } from 'react'
import type { ChangeEvent, ReactNode } from 'react'
import { Link } from 'react-router-dom'
import {
    FaClock,
    FaTasks,
    FaCalendarCheck,
    FaHourglassHalf,
    FaBullhorn,
    FaEnvelope,
    FaSignInAlt,
    FaSignOutAlt,
} from 'react-icons/fa'
import { useAuth } from '../../hooks/useAuth'
import { useStoredState } from '../../hooks/useStoredState'
import { initialTickets } from '../../data/ict'
import type { Priority, Ticket } from '../../data/ict'
import {
    ANNUAL_LEAVE_DAYS,
    EMPLOYEE_INFO,
    businessDays,
    formatDuration,
    initialAttendance,
    initialLeave,
    initialTasks,
    localISODate,
    minutesBetween,
    notices,
    parseISO,
} from '../../data/employee'
import type { LeaveRequest, LeaveStatus, LeaveType, Task, TaskStatus, Workday } from '../../data/employee'

const priorityClass: Record<Priority, string> = {
    High: 'bg-red-100 text-red-800',
    Medium: 'bg-amber-100 text-amber-900',
    Low: 'bg-green-100 text-green-800',
}

const leaveClass: Record<LeaveStatus, string> = {
    Pending: 'bg-amber-100 text-amber-900',
    Approved: 'bg-green-100 text-green-800',
    Rejected: 'bg-red-100 text-red-800',
    Cancelled: 'bg-gray-100 text-gray-600',
}

const nextStatus: Record<TaskStatus, { to: TaskStatus; label: string }> = {
    'To do': { to: 'In progress', label: 'Start' },
    'In progress': { to: 'Done', label: 'Mark done' },
    Done: { to: 'To do', label: 'Reopen' },
}

const inputCls =
    'w-full rounded-lg border bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-green-500'
const primaryBtn =
    'rounded-lg bg-amber-400 px-4 py-2 text-sm font-semibold text-green-950 transition-colors hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-60'

const shortDate = (iso: string) =>
    parseISO(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })

const StatCard = ({
    label,
    value,
    note,
    icon,
    valueClass = 'text-green-950',
    highlight,
}: {
    label: string
    value: string
    note: string
    icon: ReactNode
    valueClass?: string
    highlight?: boolean
}) => (
    <div
        className={`rounded-xl border bg-white p-4 shadow-sm ${highlight ? 'border-amber-400' : 'border-gray-200'
            }`}
    >
        <p className="flex items-center gap-1.5 text-xs text-gray-500">
            {icon} {label}
        </p>
        <p className={`mt-1 text-lg font-bold ${valueClass}`}>{value}</p>
        <p className="text-xs text-gray-500">{note}</p>
    </div>
)

const Msg = ({ note }: { note: { text: string; bad: boolean } | null }) =>
    note ? (
        <p
            role="status"
            className={`mt-3 rounded-lg px-3 py-2 text-sm ${note.bad ? 'bg-red-50 text-red-800' : 'bg-green-50 text-green-800'
                }`}
        >
            {note.text}
        </p>
    ) : null

type LeaveForm = { type: LeaveType; start: string; end: string; reason: string }
type LeaveErrors = Partial<Record<keyof LeaveForm, string>>

const emptyLeave: LeaveForm = { type: 'Annual', start: '', end: '', reason: '' }

const EmployeeDashboard = () => {
    const { user } = useAuth()
    const base = `uhwf_employee_${user?.email ?? 'guest'}`
    const today = localISODate()

    const [attendance, setAttendance] = useStoredState<Record<string, Workday>>(`${base}_attendance`, initialAttendance)
    const [tasks, setTasks] = useStoredState<Task[]>(`${base}_tasks`, initialTasks)
    const [leave, setLeave] = useStoredState<LeaveRequest[]>(`${base}_leave`, initialLeave)
    // Same storage key as the ICT dashboard, so a ticket made here shows up there.
    const [, setTickets] = useStoredState<Ticket[]>('uhwf_ict_tickets', initialTickets)

    const [clockNote, setClockNote] = useState<{ text: string; bad: boolean } | null>(null)
    const [leaveForm, setLeaveForm] = useState<LeaveForm>(emptyLeave)
    const [leaveErrors, setLeaveErrors] = useState<LeaveErrors>({})
    const [leaveNote, setLeaveNote] = useState<{ text: string; bad: boolean } | null>(null)
    const [subject, setSubject] = useState('')
    const [priority, setPriority] = useState<Priority>('Medium')
    const [ticketError, setTicketError] = useState('')
    const [ticketNote, setTicketNote] = useState<{ text: string; bad: boolean } | null>(null)

    const record = attendance[today]
    const openTasks = tasks.filter((t) => t.status !== 'Done').length
    const used = leave
        .filter((r) => r.type === 'Annual' && (r.status === 'Pending' || r.status === 'Approved'))
        .reduce((sum, r) => sum + r.days, 0)
    const remaining = ANNUAL_LEAVE_DAYS - used
    const pendingLeave = leave.filter((r) => r.status === 'Pending').length

    const sortedTasks = [...tasks].sort(
        (a, b) => Number(a.status === 'Done') - Number(b.status === 'Done') || a.due.localeCompare(b.due),
    )
    const history = Object.entries(attendance)
        .filter(([date]) => date !== today)
        .sort((a, b) => b[0].localeCompare(a[0]))
        .slice(0, 5)

    let todayValue = 'Not clocked in'
    let todayNote = 'Clock in to start your day'
    let todayClass = 'text-amber-700'
    if (record && !record.out) {
        todayValue = `In since ${record.in}`
        todayNote = 'Remember to clock out'
        todayClass = 'text-green-700'
    } else if (record) {
        todayValue = formatDuration(minutesBetween(record.in, record.out))
        todayNote = `${record.in} to ${record.out}`
        todayClass = 'text-green-950'
    }

    const nowTime = () => new Date().toTimeString().slice(0, 5)

    const clockIn = () => {
        if (record) return
        // TODO: await axios.post('/api/attendance/clock-in'). The SERVER must record the time,
        // because a browser clock can be changed.
        setAttendance((prev) => ({ ...prev, [today]: { in: nowTime(), out: '' } }))
        setClockNote({ text: 'You are clocked in. Have a good day.', bad: false })
    }

    const clockOut = () => {
        if (!record || record.out) return
        const out = nowTime()
        if (minutesBetween(record.in, out) < 0) {
            setClockNote({ text: 'Clock-out time cannot be before clock-in time.', bad: true })
            return
        }
        // TODO: await axios.post('/api/attendance/clock-out')
        setAttendance((prev) => ({ ...prev, [today]: { in: record.in, out } }))
        setClockNote({ text: `You are clocked out. Worked ${formatDuration(minutesBetween(record.in, out))}.`, bad: false })
    }

    const changeStatus = (task: Task) => {
        // TODO: await axios.patch(`/api/tasks/${task.id}`, { status })
        const to = nextStatus[task.status].to
        setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, status: to } : t)))
    }

    const changeLeave = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target
        setLeaveForm((prev) => ({ ...prev, [name]: value }))
        if (leaveErrors[name as keyof LeaveForm]) {
            setLeaveErrors((prev) => ({ ...prev, [name]: undefined }))
        }
        setLeaveNote(null)
    }

    const validateLeave = (f: LeaveForm): LeaveErrors => {
        const e: LeaveErrors = {}
        if (!f.start) e.start = 'Choose a start date.'
        else if (f.type !== 'Sick' && f.start < today) e.start = 'Start date cannot be in the past.'
        if (!f.end) e.end = 'Choose an end date.'
        else if (f.start && f.end < f.start) e.end = 'End date cannot be before the start date.'
        if (f.reason.trim().length < 5) e.reason = 'Give a short reason (at least 5 characters).'

        if (!e.start && !e.end) {
            const days = businessDays(f.start, f.end)
            const overlaps = leave.some(
                (r) => (r.status === 'Pending' || r.status === 'Approved') && f.start <= r.end && f.end >= r.start,
            )
            if (days === 0) e.end = 'These dates are weekend days only.'
            else if (overlaps) e.start = 'You already have leave on these dates.'
            else if (f.type === 'Annual' && days > remaining) {
                e.end = `You only have ${remaining} annual leave day${remaining === 1 ? '' : 's'} left.`
            }
        }
        return e
    }

    const submitLeave = () => {
        const found = validateLeave(leaveForm)
        setLeaveErrors(found)
        if (Object.keys(found).length > 0) return
        // TODO: await axios.post('/api/leave', leaveForm). The server must re-check the balance,
        // and notify the administrator so the request can be approved or rejected.
        const request: LeaveRequest = {
            id: Date.now(),
            type: leaveForm.type,
            start: leaveForm.start,
            end: leaveForm.end,
            days: businessDays(leaveForm.start, leaveForm.end),
            reason: leaveForm.reason.trim(),
            status: 'Pending',
        }
        setLeave((prev) => [request, ...prev])
        setLeaveForm(emptyLeave)
        setLeaveNote({ text: 'Request sent to the administrator for approval.', bad: false })
    }

    const cancelLeave = (id: number) =>
        setLeave((prev) => prev.map((r) => (r.id === id ? { ...r, status: 'Cancelled' as const } : r)))

    const submitTicket = () => {
        if (subject.trim().length < 5) {
            setTicketError('Describe the problem in at least 5 characters.')
            return
        }
        // TODO: await axios.post('/api/tickets', { subject, priority })
        const ticket: Ticket = {
            id: Date.now(),
            subject: subject.trim(),
            requester: user?.name ?? 'Employee',
            priority,
            status: 'Open',
        }
        setTickets((prev) => [ticket, ...prev])
        setSubject('')
        setPriority('Medium')
        setTicketError('')
        setTicketNote({ text: 'Your problem was sent to ICT. You will get a reply in your notifications.', bad: false })
    }

    const fieldCls = (key: keyof LeaveForm) =>
        `${inputCls} ${leaveErrors[key] ? 'border-red-400' : 'border-gray-200'}`

    const firstName = (user?.name ?? 'there').split(' ')[0]
    const todayLabel = new Date().toLocaleDateString('en-GB', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    })

    return (
        <div className="mx-auto max-w-5xl space-y-4">
            {/* Heading */}
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-green-950">Welcome, {firstName}</h1>
                    <p className="text-sm text-gray-500">Your day at UHWF: attendance, tasks and leave.</p>
                </div>
                <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-900">
                    {todayLabel}
                </span>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
                <StatCard label="Today" value={todayValue} note={todayNote} icon={<FaClock className="h-3 w-3" />} valueClass={todayClass} />
                <StatCard
                    label="Open tasks"
                    value={String(openTasks)}
                    note={openTasks > 0 ? 'Need action' : 'All done'}
                    icon={<FaTasks className="h-3 w-3" />}
                    valueClass={openTasks > 0 ? 'text-amber-700' : 'text-green-700'}
                    highlight={openTasks > 0}
                />
                <StatCard
                    label="Annual leave left"
                    value={`${remaining} days`}
                    note={`Of ${ANNUAL_LEAVE_DAYS} (sample)`}
                    icon={<FaCalendarCheck className="h-3 w-3" />}
                />
                <StatCard
                    label="Leave pending"
                    value={String(pendingLeave)}
                    note="Waiting for approval"
                    icon={<FaHourglassHalf className="h-3 w-3" />}
                />
                <StatCard label="Notices" value={String(notices.length)} note="From admin and ICT" icon={<FaBullhorn className="h-3 w-3" />} />
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
                {/* Left column: attendance + details */}
                <div className="space-y-4">
                    <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                        <h2 className="font-semibold text-green-950">Attendance</h2>
                        <p className="text-xs text-gray-500">Clock in when you arrive and clock out when you leave.</p>
                        <div className="mt-3 flex flex-wrap gap-2">
                            <button
                                type="button"
                                onClick={clockIn}
                                disabled={!!record}
                                className={`${primaryBtn} inline-flex items-center gap-2`}
                            >
                                <FaSignInAlt className="h-3.5 w-3.5" /> Clock in
                            </button>
                            <button
                                type="button"
                                onClick={clockOut}
                                disabled={!record || !!record.out}
                                className="inline-flex items-center gap-2 rounded-lg border border-green-900 px-4 py-2 text-sm font-medium text-green-900 hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <FaSignOutAlt className="h-3.5 w-3.5" /> Clock out
                            </button>
                        </div>
                        <Msg note={clockNote} />

                        <ul className="mt-3 divide-y divide-gray-100">
                            {history.length === 0 && <li className="py-2 text-sm text-gray-500">No earlier days yet.</li>}
                            {history.map(([date, w]) => (
                                <li key={date} className="flex items-center justify-between py-2 text-sm">
                                    <span className="text-gray-700">
                                        {parseISO(date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}
                                    </span>
                                    <span className="text-xs text-gray-500">
                                        {w.in} to {w.out || '?'}
                                    </span>
                                    <span className="font-medium text-green-950">
                                        {w.out ? formatDuration(minutesBetween(w.in, w.out)) : 'No clock-out'}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </section>

                    <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                        <h2 className="font-semibold text-green-950">My details</h2>
                        <p className="text-xs text-gray-500">Sample values until the database is connected.</p>
                        <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
                            {[
                                ['Name', user?.name ?? ''],
                                ['Staff ID', EMPLOYEE_INFO.staffId],
                                ['Department', EMPLOYEE_INFO.department],
                                ['Position', EMPLOYEE_INFO.position],
                                ['Supervisor', EMPLOYEE_INFO.supervisor],
                                ['Email', user?.email ?? ''],
                            ].map(([k, v]) => (
                                <div key={k}>
                                    <dt className="text-xs text-gray-500">{k}</dt>
                                    <dd className="truncate font-medium text-green-950">{v}</dd>
                                </div>
                            ))}
                        </dl>
                    </section>
                </div>

                {/* Right column: tasks */}
                <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                    <h2 className="font-semibold text-green-950">My tasks</h2>
                    <p className="text-xs text-gray-500">Assigned to you by your supervisor.</p>
                    <ul className="mt-2 divide-y divide-gray-100">
                        {sortedTasks.map((t) => {
                            const overdue = t.status !== 'Done' && t.due < today
                            return (
                                <li key={t.id} className="py-3">
                                    <div className="flex items-start justify-between gap-2">
                                        <p className={`text-sm font-medium ${t.status === 'Done' ? 'text-gray-400 line-through' : 'text-green-950'}`}>
                                            {t.title}
                                        </p>
                                        <span className={`shrink-0 rounded px-2 py-0.5 text-xs font-medium ${priorityClass[t.priority]}`}>
                                            {t.priority}
                                        </span>
                                    </div>
                                    <p className="mt-0.5 text-xs text-gray-500">
                                        Due {shortDate(t.due)}
                                        {overdue && <span className="ml-1 font-semibold text-red-700">(overdue)</span>} · From {t.assignedBy} ·{' '}
                                        {t.status}
                                    </p>
                                    <button
                                        type="button"
                                        onClick={() => changeStatus(t)}
                                        className="mt-2 rounded-md border border-green-900 px-3 py-1 text-xs font-medium text-green-900 hover:bg-green-900 hover:text-white"
                                    >
                                        {nextStatus[t.status].label}
                                    </button>
                                </li>
                            )
                        })}
                    </ul>
                </section>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
                {/* Leave */}
                <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                    <h2 className="font-semibold text-green-950">Request leave</h2>
                    <p className="text-xs text-gray-500">Weekends are not counted. Public holidays are not excluded yet.</p>

                    <div className="mt-3 grid gap-3 sm:grid-cols-3">
                        <div>
                            <label htmlFor="type" className="mb-1 block text-xs font-medium text-gray-600">Type</label>
                            <select id="type" name="type" value={leaveForm.type} onChange={changeLeave} className={fieldCls('type')}>
                                <option>Annual</option>
                                <option>Sick</option>
                                <option>Other</option>
                            </select>
                        </div>
                        <div>
                            <label htmlFor="start" className="mb-1 block text-xs font-medium text-gray-600">From</label>
                            <input
                                id="start"
                                name="start"
                                type="date"
                                min={leaveForm.type === 'Sick' ? undefined : today}
                                value={leaveForm.start}
                                onChange={changeLeave}
                                className={fieldCls('start')}
                            />
                            {leaveErrors.start && <p className="mt-1 text-xs text-red-600">{leaveErrors.start}</p>}
                        </div>
                        <div>
                            <label htmlFor="end" className="mb-1 block text-xs font-medium text-gray-600">To</label>
                            <input
                                id="end"
                                name="end"
                                type="date"
                                min={leaveForm.start || undefined}
                                value={leaveForm.end}
                                onChange={changeLeave}
                                className={fieldCls('end')}
                            />
                            {leaveErrors.end && <p className="mt-1 text-xs text-red-600">{leaveErrors.end}</p>}
                        </div>
                    </div>

                    <div className="mt-3">
                        <label htmlFor="reason" className="mb-1 block text-xs font-medium text-gray-600">Reason</label>
                        <textarea
                            id="reason"
                            name="reason"
                            rows={2}
                            value={leaveForm.reason}
                            onChange={changeLeave}
                            className={`${fieldCls('reason')} resize-none`}
                        />
                        {leaveErrors.reason && <p className="mt-1 text-xs text-red-600">{leaveErrors.reason}</p>}
                    </div>

                    <button type="button" onClick={submitLeave} className={`${primaryBtn} mt-3`}>
                        Send request
                    </button>
                    <Msg note={leaveNote} />

                    <ul className="mt-3 divide-y divide-gray-100">
                        {leave.map((r) => (
                            <li key={r.id} className="flex flex-wrap items-center gap-2 py-2.5 text-sm">
                                <div className="min-w-0 flex-1">
                                    <p className="font-medium text-green-950">
                                        {r.type} · {r.days} day{r.days === 1 ? '' : 's'}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        {shortDate(r.start)} to {shortDate(r.end)}
                                    </p>
                                </div>
                                <span className={`rounded px-2 py-0.5 text-xs font-medium ${leaveClass[r.status]}`}>{r.status}</span>
                                {r.status === 'Pending' && (
                                    <button
                                        type="button"
                                        onClick={() => cancelLeave(r.id)}
                                        className="rounded-md border border-gray-300 px-2.5 py-1 text-xs text-gray-700 hover:bg-gray-50"
                                    >
                                        Cancel
                                    </button>
                                )}
                            </li>
                        ))}
                    </ul>
                </section>

                {/* Notices + problem report */}
                <div className="space-y-4">
                    <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                        <div className="flex items-center justify-between">
                            <h2 className="font-semibold text-green-950">Notices</h2>
                            <Link
                                to="/employee/messages"
                                className="inline-flex items-center gap-1.5 text-sm font-medium text-green-900 hover:underline"
                            >
                                <FaEnvelope className="h-3.5 w-3.5" /> Messages
                            </Link>
                        </div>
                        <ul className="mt-2 divide-y divide-gray-100">
                            {notices.map((n) => (
                                <li key={n.id} className="py-2.5 text-sm text-gray-700">
                                    {n.text}
                                    <p className="text-xs text-gray-500">
                                        {n.from} · {shortDate(n.date)}
                                    </p>
                                </li>
                            ))}
                        </ul>
                    </section>

                    <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                        <h2 className="font-semibold text-green-950">Report a problem to ICT</h2>
                        <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_8rem]">
                            <div>
                                <label htmlFor="subject" className="mb-1 block text-xs font-medium text-gray-600">What is wrong?</label>
                                <input
                                    id="subject"
                                    type="text"
                                    value={subject}
                                    onChange={(e) => {
                                        setSubject(e.target.value)
                                        setTicketError('')
                                        setTicketNote(null)
                                    }}
                                    placeholder="For example: cannot open the finance page"
                                    className={`${inputCls} ${ticketError ? 'border-red-400' : 'border-gray-200'}`}
                                />
                            </div>
                            <div>
                                <label htmlFor="priority" className="mb-1 block text-xs font-medium text-gray-600">Priority</label>
                                <select
                                    id="priority"
                                    value={priority}
                                    onChange={(e) => setPriority(e.target.value as Priority)}
                                    className={`${inputCls} border-gray-200`}
                                >
                                    <option>Low</option>
                                    <option>Medium</option>
                                    <option>High</option>
                                </select>
                            </div>
                        </div>
                        {ticketError && <p className="mt-1 text-xs text-red-600">{ticketError}</p>}
                        <button type="button" onClick={submitTicket} className={`${primaryBtn} mt-3`}>
                            Send to ICT
                        </button>
                        <Msg note={ticketNote} />
                    </section>
                </div>
            </div>
        </div>
    )
}

export default EmployeeDashboard
import { useCallback, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { FaBullhorn, FaCalendarCheck, FaClock, FaHourglassHalf, FaListUl } from 'react-icons/fa'
import { useAuth } from '../../hooks/useAuth'
import { getErrorMessage } from '../../services/api'
import { getEmployeeOverview, minutesText, timeText } from '../../services/staff'
import type { EmployeeOverview } from '../../services/staff'
import AttendancePanel from './panels/AttendancePanel'
import LeavePanel from './panels/LeavePanel'
import NoticesPanel from './panels/NoticesPanel'
import TasksPanel from './panels/TasksPanel'

const StatCard = ({
    label,
    value,
    note,
    icon,
    highlight,
    valueClass = 'text-green-950',
}: {
    label: string
    value: string
    note: string
    icon: ReactNode
    highlight?: boolean
    valueClass?: string
}) => (
    <div className={`rounded-2xl border bg-white p-4 shadow-sm ${highlight ? 'border-amber-400' : 'border-gray-200'}`}>
        <p className="flex items-center gap-2 text-sm text-gray-500">
            {icon} {label}
        </p>
        <p className={`mt-2 text-3xl font-bold ${valueClass}`}>{value}</p>
        <p className="mt-0.5 text-sm text-gray-500">{note}</p>
    </div>
)

const todayLabel = () =>
    new Date().toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Africa/Dar_es_Salaam' })

const EmployeeDashboard = () => {
    const { user } = useAuth()
    const [overview, setOverview] = useState<EmployeeOverview | null>(null)
    const [error, setError] = useState('')
    const [now, setNow] = useState(() => Date.now())

    const load = useCallback(async () => {
        try {
            setOverview(await getEmployeeOverview())
            setError('')
        } catch (err) {
            setError(getErrorMessage(err, 'Could not load your dashboard.'))
        }
    }, [])

    useEffect(() => {
        void load()
    }, [load])

    // while clocked in, "Today" counts up
    useEffect(() => {
        const t = window.setInterval(() => setNow(Date.now()), 30_000)
        return () => window.clearInterval(t)
    }, [])

    const firstName = user?.name.split(' ')[0] ?? ''
    const today = overview?.today
    const minutes = today ? (today.clockOut ? today.minutes : Math.max(0, Math.round((now - new Date(today.clockIn).getTime()) / 60_000))) : 0

    return (
        <div className="mx-auto max-w-6xl space-y-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h1 className="text-3xl font-bold text-green-950">Welcome, {firstName}</h1>
                    <p className="text-gray-500">Your day at UHWF: attendance, tasks and leave.</p>
                </div>
                <span className="rounded-full bg-green-100 px-4 py-1.5 text-sm font-medium text-green-800">{todayLabel()}</span>
            </div>

            {error && (
                <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
                    {error}
                </p>
            )}

            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
                <StatCard
                    label="Today"
                    value={minutesText(minutes)}
                    note={!today ? 'Not clocked in yet' : today.clockOut ? `${timeText(today.clockIn)} to ${timeText(today.clockOut)}` : `Since ${timeText(today.clockIn)}`}
                    icon={<FaClock className="h-3.5 w-3.5" />}
                />
                <StatCard
                    label="Open tasks"
                    value={String(overview?.openTasks ?? 0)}
                    note={overview && overview.overdue > 0 ? `${overview.overdue} overdue` : overview && overview.openTasks > 0 ? 'Need action' : 'All clear'}
                    icon={<FaListUl className="h-3.5 w-3.5" />}
                    highlight={(overview?.openTasks ?? 0) > 0}
                    valueClass={(overview?.openTasks ?? 0) > 0 ? 'text-amber-700' : 'text-green-950'}
                />
                <StatCard
                    label="Annual leave left"
                    value={overview ? `${overview.leave.left} days` : '-'}
                    note={overview ? `Of ${overview.leave.total} this year` : ''}
                    icon={<FaCalendarCheck className="h-3.5 w-3.5" />}
                />
                <StatCard
                    label="Leave pending"
                    value={String(overview?.leave.pendingRequests ?? 0)}
                    note="Waiting for approval"
                    icon={<FaHourglassHalf className="h-3.5 w-3.5" />}
                />
                <StatCard
                    label="Notices"
                    value={String(overview?.notices ?? 0)}
                    note="From admin and ICT, last 30 days"
                    icon={<FaBullhorn className="h-3.5 w-3.5" />}
                />
            </div>

            <div className="grid gap-5 lg:grid-cols-2">
                <AttendancePanel days={5} onChanged={() => void load()} />
                <TasksPanel compact onChanged={() => void load()} />
            </div>

            <div className="grid gap-5 lg:grid-cols-2">
                <LeavePanel compact onChanged={() => void load()} />
                <NoticesPanel compact />
            </div>
        </div>
    )
}

export default EmployeeDashboard

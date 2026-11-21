import { Link, useSearchParams } from 'react-router-dom'
import AttendanceBoard from './staff/AttendanceBoard'
import LeaveApprovals from './staff/LeaveApprovals'
import NoticesManager from './staff/NoticesManager'
import TasksManager from './staff/TasksManager'

type Tab = 'leave' | 'tasks' | 'attendance' | 'notices'

const tabs: { key: Tab; label: string }[] = [
    { key: 'leave', label: 'Leave requests' },
    { key: 'tasks', label: 'Tasks' },
    { key: 'attendance', label: 'Attendance' },
    { key: 'notices', label: 'Notices' },
]

// The administrator's side of the employee dashboard: decide leave, assign tasks, see who is at work, post notices.
const StaffWorkPage = () => {
    const [params] = useSearchParams()
    const asked = params.get('tab')
    const tab: Tab = tabs.some((t) => t.key === asked) ? (asked as Tab) : 'leave'

    return (
        <div className="mx-auto max-w-5xl space-y-4">
            <div>
                <h1 className="text-2xl font-bold text-green-950">Staff work</h1>
                <p className="text-sm text-gray-500">Approve leave, assign tasks, see who is at work, and post notices for the staff.</p>
            </div>

            <nav className="flex flex-wrap gap-2 border-b border-gray-200" aria-label="Staff work">
                {tabs.map((t) => (
                    <Link
                        key={t.key}
                        to={`/admin/staff-work?tab=${t.key}`}
                        aria-current={tab === t.key ? 'page' : undefined}
                        className={`-mb-px border-b-2 px-4 py-2.5 text-sm font-semibold ${tab === t.key ? 'border-amber-400 text-green-950' : 'border-transparent text-gray-500 hover:text-green-900'
                            }`}
                    >
                        {t.label}
                    </Link>
                ))}
            </nav>

            {tab === 'leave' && <LeaveApprovals />}
            {tab === 'tasks' && <TasksManager />}
            {tab === 'attendance' && <AttendanceBoard />}
            {tab === 'notices' && <NoticesManager />}
        </div>
    )
}

export default StaffWorkPage

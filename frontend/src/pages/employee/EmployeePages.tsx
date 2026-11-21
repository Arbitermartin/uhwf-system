import type { ReactNode } from 'react'
import AttendancePanel from './panels/AttendancePanel'
import LeavePanel from './panels/LeavePanel'
import NoticesPanel from './panels/NoticesPanel'
import TasksPanel from './panels/TasksPanel'

const Page = ({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) => (
    <div className="mx-auto max-w-3xl space-y-4">
        <div>
            <h1 className="text-2xl font-bold text-green-950">{title}</h1>
            <p className="text-sm text-gray-500">{subtitle}</p>
        </div>
        {children}
    </div>
)

export const EmployeeTasksPage = () => (
    <Page title="My tasks" subtitle="Work assigned to you. Start a task, then mark it done.">
        <TasksPanel />
    </Page>
)

export const EmployeeAttendancePage = () => (
    <Page title="Attendance" subtitle="Your clock-in and clock-out record for the last 31 days.">
        <AttendancePanel days={31} />
    </Page>
)

export const EmployeeLeavePage = () => (
    <Page title="Leave requests" subtitle="Ask for leave and follow the decision.">
        <LeavePanel />
    </Page>
)

export const EmployeeNoticesPage = () => (
    <Page title="Announcements" subtitle="Notices from administration and ICT.">
        <NoticesPanel />
    </Page>
)

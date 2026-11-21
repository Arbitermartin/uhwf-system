
import { api } from './api'

export type LeaveType = 'annual' | 'sick' | 'other'
export type LeaveStatus = 'pending' | 'approved' | 'rejected' | 'cancelled'
export type Priority = 'low' | 'medium' | 'high'
export type TaskStatus = 'todo' | 'in_progress' | 'submitted' | 'returned' | 'done'

export const leaveTypeLabel: Record<LeaveType, string> = { annual: 'Annual leave', sick: 'Sick leave', other: 'Other leave' }
export const leaveStatusLabel: Record<LeaveStatus, string> = {
    pending: 'Waiting',
    approved: 'Approved',
    rejected: 'Not approved',
    cancelled: 'Cancelled',
}
export const leaveStatusTag: Record<LeaveStatus, string> = {
    pending: 'bg-amber-100 text-amber-900',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
    cancelled: 'bg-gray-100 text-gray-700',
}
export const priorityLabel: Record<Priority, string> = { low: 'Low', medium: 'Medium', high: 'High' }
export const priorityTag: Record<Priority, string> = {
    low: 'bg-green-100 text-green-800',
    medium: 'bg-amber-100 text-amber-900',
    high: 'bg-red-100 text-red-800',
}
export const taskStatusLabel: Record<TaskStatus, string> = {
    todo: 'To do',
    in_progress: 'In progress',
    submitted: 'Waiting for review',
    returned: 'Returned for changes',
    done: 'Accepted',
}
export const taskStatusTag: Record<TaskStatus, string> = {
    todo: 'bg-gray-100 text-gray-700',
    in_progress: 'bg-sky-100 text-sky-900',
    submitted: 'bg-purple-100 text-purple-900',
    returned: 'bg-amber-100 text-amber-900',
    done: 'bg-green-100 text-green-800',
}

/* ---------- time and dates, always in Tanzania time ---------- */
const TZ = 'Africa/Dar_es_Salaam'
export const minutesText = (m: number) => `${Math.floor(m / 60)}h ${String(m % 60).padStart(2, '0')}m`
export const timeText = (iso: string) => new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: TZ })
export const dayShort = (d: string) =>
    new Date(`${d}T12:00:00`).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
export const dayLong = (d: string) => new Date(`${d}T12:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
export const dateOnly = (iso: string) => new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: TZ })

// Monday to Friday between two days (yyyy-mm-dd), both included. The same rule the server uses.
export const workingDays = (start: string, end: string) => {
    let n = 0
    for (let t = new Date(`${start}T00:00:00Z`).getTime(); t <= new Date(`${end}T00:00:00Z`).getTime(); t += 86_400_000) {
        const d = new Date(t).getUTCDay()
        if (d !== 0 && d !== 6) n++
    }
    return n
}

/* ============================ Employee ============================ */
export type EmployeeOverview = {
    today: { clockIn: string; clockOut: string | null; minutes: number } | null
    openTasks: number
    overdue: number
    leave: { total: number; left: number; pendingRequests: number }
    notices: number
}

export type AttendanceDay = { date: string; clockIn: string; clockOut: string | null; minutes: number | null }
export type AttendanceReply = { days: AttendanceDay[]; month: { daysWorked: number; minutes: number } }

export type MyTask = {
    id: number
    title: string
    priority: Priority
    dueDate: string
    status: TaskStatus
    from: string
    overdue: boolean
    submissions: number
    comments: number
}

export type MyLeave = {
    id: number
    type: LeaveType
    startDate: string
    endDate: string
    days: number
    reason: string
    status: LeaveStatus
    decidedAt: string | null
    decidedBy: string | null
    createdAt: string
}
export type LeaveBalance = { total: number; used: number; pending: number; left: number; remaining: number }

export type Notice = { id: number; title: string; body: string; pinned: boolean; createdAt: string; author: string; authorRole: string }

export const getEmployeeOverview = async () => (await api.get<EmployeeOverview>('/employee/overview')).data
export const clockIn = async () => {
    await api.post('/employee/attendance/clock-in')
}
export const clockOut = async () => {
    await api.post('/employee/attendance/clock-out')
}
export const getAttendance = async (days: number) => (await api.get<AttendanceReply>('/employee/attendance', { params: { days } })).data
export const listMyTasks = async (status: 'open' | 'done' | 'all') =>
    (await api.get<{ tasks: MyTask[] }>('/employee/tasks', { params: { status } })).data.tasks
// The employee can only start a task. Finishing it means handing in work that the administrator accepts.
export const startMyTask = async (id: number) => {
    await api.post(`/employee/tasks/${id}/status`, { status: 'in_progress' })
}
export const getMyLeave = async () => (await api.get<{ requests: MyLeave[]; balance: LeaveBalance }>('/employee/leave')).data
export const requestLeave = async (data: { type: LeaveType; startDate: string; endDate: string; reason: string }) =>
    (await api.post<{ days: number }>('/employee/leave', data)).data.days
export const cancelLeave = async (id: number) => {
    await api.post(`/employee/leave/${id}/cancel`)
}
export const listNotices = async () => (await api.get<{ notices: Notice[] }>('/employee/announcements')).data.notices

/* ============================ Admin ============================ */
export type StaffOption = { id: number; name: string; staffId: string; position: string }

export type AdminLeave = {
    id: number
    employee: string
    position: string | null
    type: LeaveType
    startDate: string
    endDate: string
    days: number
    reason: string
    status: LeaveStatus
    decidedBy: string | null
    decidedAt: string | null
    createdAt: string
    annualLeft: number
}
export type AdminLeaveList = {
    requests: AdminLeave[]
    total: number
    page: number
    pageSize: number
    counts: Record<LeaveStatus, number>
    annualDays: number
}

export type AdminTask = {
    id: number
    title: string
    priority: Priority
    dueDate: string
    status: TaskStatus
    employee: string
    assignedBy: string
    overdue: boolean
    submissions: number
}
export type AdminTaskList = { tasks: AdminTask[]; total: number; page: number; pageSize: number; counts: Record<TaskStatus, number> }

export type AttendanceRow = {
    id: number
    name: string
    staffId: string
    position: string
    clockIn: string | null
    clockOut: string | null
    minutes: number | null
    state: 'absent' | 'working' | 'done'
}
export type AttendanceBoardReply = { date: string; rows: AttendanceRow[]; summary: { present: number; working: number; absent: number } }

export type AdminNotice = { id: number; title: string; body: string; audience: string; pinned: boolean; createdAt: string; author: string }

export const noticeAudiences = [
    { value: 'all', label: 'Everyone' },
    { value: 'employee', label: 'Employees' },
    { value: 'lecturer', label: 'Lecturers' },
    { value: 'student', label: 'Students' },
    { value: 'member', label: 'Members' },
    { value: 'ict', label: 'ICT' },
    { value: 'admin', label: 'Administrators' },
] as const

export const listStaff = async () => (await api.get<{ employees: StaffOption[] }>('/admin/staff/employees')).data.employees
export const listAdminLeave = async (params: { status?: LeaveStatus; page: number; pageSize: number }) =>
    (await api.get<AdminLeaveList>('/admin/staff/leave', { params })).data
export const decideLeave = async (id: number, decision: 'approved' | 'rejected', note: string) => {
    await api.patch(`/admin/staff/leave/${id}`, { decision, note })
}
export const listAdminTasks = async (params: { status?: TaskStatus; employeeId?: number; page: number; pageSize: number }) =>
    (await api.get<AdminTaskList>('/admin/staff/tasks', { params })).data
export const assignTask = async (data: { assignedToId: number; title: string; priority: Priority; dueDate: string }) => {
    await api.post('/admin/staff/tasks', data)
}
export const deleteTask = async (id: number) => {
    await api.delete(`/admin/staff/tasks/${id}`)
}
export const getAttendanceBoard = async (date: string) =>
    (await api.get<AttendanceBoardReply>('/admin/staff/attendance', { params: { date } })).data
export const listAdminNotices = async () => (await api.get<{ notices: AdminNotice[] }>('/admin/staff/notices')).data.notices
export const postNotice = async (data: { title: string; body: string; audience: string; pinned: boolean }) =>
    (await api.post<{ notified: number }>('/admin/staff/notices', data)).data.notified
export const deleteNotice = async (id: number) => {
    await api.delete(`/admin/staff/notices/${id}`)
}

/* ============================ Handing in work and reviewing it ============================ */
export type TaskComment = { id: number; body: string; decision: 'accepted' | 'returned' | null; createdAt: string; author: string }
export type TaskFile = { id: number; fileName: string; note: string | null; createdAt: string }

export type MyTaskDetail = {
    task: { id: number; title: string; priority: Priority; dueDate: string; status: TaskStatus; from: string; overdue: boolean; canSubmit: boolean }
    submissions: TaskFile[]
    comments: TaskComment[]
}

export type AdminTaskDetail = {
    task: { id: number; title: string; priority: Priority; dueDate: string; status: TaskStatus; employee: string; assignedBy: string; overdue: boolean }
    submissions: TaskFile[]
    comments: TaskComment[]
}

export const WORK_MAX_BYTES = 10 * 1024 * 1024

export const getMyTask = async (id: number) => (await api.get<MyTaskDetail>(`/employee/tasks/${id}`)).data

export const submitTaskWork = async (id: number, file: File, note: string) => {
    const body = new FormData()
    body.append('file', file)
    if (note.trim()) body.append('note', note.trim())
    await api.post(`/employee/tasks/${id}/submit`, body, { timeout: 120_000 })
}

// Normal links: the browser downloads the file, and the login cookie proves who is asking.
export const myTaskFileLink = (taskId: number, fileId: number) => `/api/employee/tasks/${taskId}/submissions/${fileId}/file`
export const adminTaskFileLink = (taskId: number, fileId: number) => `/api/admin/staff/tasks/${taskId}/submissions/${fileId}/file`

export const getAdminTask = async (id: number) => (await api.get<AdminTaskDetail>(`/admin/staff/tasks/${id}`)).data

export const reviewTask = async (id: number, decision: 'accepted' | 'returned' | 'comment', comment: string) =>
    (await api.post<{ status: TaskStatus }>(`/admin/staff/tasks/${id}/review`, { decision, comment })).data.status


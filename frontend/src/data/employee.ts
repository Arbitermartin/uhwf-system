import type { Priority } from './ict'

export type TaskStatus = 'To do' | 'In progress' | 'Done'
export type LeaveType = 'Annual' | 'Sick' | 'Other'
export type LeaveStatus = 'Pending' | 'Approved' | 'Rejected' | 'Cancelled'

export type Task = {
    id: number
    title: string
    priority: Priority
    due: string // yyyy-mm-dd
    status: TaskStatus
    assignedBy: string
}

export type LeaveRequest = {
    id: number
    type: LeaveType
    start: string // yyyy-mm-dd
    end: string
    days: number // weekdays only
    reason: string
    status: LeaveStatus
}

export type Workday = { in: string; out: string } // 'HH:MM', out is '' until clock-out

export type StaffNotice = {
    id: number
    from: string
    text: string
    date: string // yyyy-mm-dd
}

// ---------- date helpers (all local time, never UTC) ----------

export const localISODate = (d: Date = new Date()) => {
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    return `${d.getFullYear()}-${mm}-${dd}`
}

export const parseISO = (iso: string) => {
    const [y, m, d] = iso.split('-').map(Number)
    return new Date(y, m - 1, d)
}

export const addDays = (iso: string, n: number) => {
    const d = parseISO(iso)
    d.setDate(d.getDate() + n)
    return localISODate(d)
}

// Counts Monday to Friday only. Public holidays are not excluded (see ANNUAL_LEAVE_DAYS note).
export const businessDays = (start: string, end: string) => {
    let count = 0
    const d = parseISO(start)
    const last = parseISO(end)
    while (d <= last) {
        const day = d.getDay()
        if (day !== 0 && day !== 6) count++
        d.setDate(d.getDate() + 1)
    }
    return count
}

export const minutesBetween = (from: string, to: string) => {
    const [fh, fm] = from.split(':').map(Number)
    const [th, tm] = to.split(':').map(Number)
    return th * 60 + tm - (fh * 60 + fm)
}

export const formatDuration = (mins: number) => `${Math.floor(mins / 60)}h ${String(mins % 60).padStart(2, '0')}m`

// ---------- sample data ----------

// SAMPLE values: replace with the real UHWF leave policy and the logged-in employee's record.
export const ANNUAL_LEAVE_DAYS = 28
export const EMPLOYEE_INFO = {
    staffId: 'EMP-0045',
    department: 'Finance',
    position: 'Accountant',
    supervisor: 'Amina Mushi',
}

const today = localISODate()

const previousWeekdays = (count: number) => {
    const days: string[] = []
    let cursor = today
    while (days.length < count) {
        cursor = addDays(cursor, -1)
        const day = parseISO(cursor).getDay()
        if (day !== 0 && day !== 6) days.push(cursor)
    }
    return days
}

const sampleTimes: Workday[] = [
    { in: '08:02', out: '17:05' },
    { in: '07:58', out: '16:50' },
    { in: '08:15', out: '17:20' },
    { in: '08:00', out: '17:00' },
]

export const initialAttendance: Record<string, Workday> = {}
previousWeekdays(4).forEach((date, i) => {
    initialAttendance[date] = sampleTimes[i]
})

export const initialTasks: Task[] = [
    { id: 1, title: 'Prepare the monthly finance report', priority: 'High', due: addDays(today, 2), status: 'In progress', assignedBy: 'Amina Mushi' },
    { id: 2, title: 'Reconcile mobile money payments', priority: 'High', due: addDays(today, -1), status: 'To do', assignedBy: 'Amina Mushi' },
    { id: 3, title: 'Update the office inventory list', priority: 'Low', due: addDays(today, 6), status: 'To do', assignedBy: 'Juma Kimaro' },
    { id: 4, title: 'File signed supplier contracts', priority: 'Medium', due: addDays(today, -3), status: 'Done', assignedBy: 'Amina Mushi' },
]

export const initialLeave: LeaveRequest[] = [
    {
        id: 1,
        type: 'Annual',
        start: addDays(today, -35),
        end: addDays(today, -33),
        days: businessDays(addDays(today, -35), addDays(today, -33)),
        reason: 'Family event',
        status: 'Approved',
    },
]

export const notices: StaffNotice[] = [
    { id: 1, from: 'Administrator', text: 'Staff meeting on Friday at 10:00 in the main office.', date: addDays(today, -1) },
    { id: 2, from: 'ICT', text: 'Planned system maintenance on Saturday night. The portal may be unavailable.', date: addDays(today, -3) },
    { id: 3, from: 'Administrator', text: 'Please submit your timesheets before the end of the month.', date: addDays(today, -6) },
]
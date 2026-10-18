export type Priority = 'High' | 'Medium' | 'Low'
export type LogLevel = 'Error' | 'Warning' | 'Info'

export type Ticket = {
    id: number
    subject: string
    requester: string
    priority: Priority
    status: 'Open' | 'Resolved'
}

export type LogEntry = {
    id: number
    at: string // ISO date-time
    level: LogLevel
    message: string
}

export type BackupItem = {
    id: number
    at: string // ISO date-time
    kind: 'Automatic' | 'Manual'
    size: string
}

// SAMPLE numbers. The real server will report these.
export const RESOURCES = { cpu: 34, memory: 61, disk: 78 }
export const DISK_WARNING = 75 // percent
export const FAILED_LOGINS_24H = 12
export const BACKUP_KEEP = 30
export const BACKUP_SIZE = '1.2 GB'

const hoursAgo = (h: number) => new Date(Date.now() - h * 3_600_000).toISOString()

// Automatic backups run at 02:00 every day
const atTwo = (daysAgo: number) => {
    const d = new Date()
    d.setDate(d.getDate() - daysAgo)
    d.setHours(2, 0, 0, 0)
    return d.toISOString()
}
const firstDay = new Date().getHours() >= 2 ? 0 : 1

export const initialBackups: BackupItem[] = [
    { id: 1, at: atTwo(firstDay), kind: 'Automatic', size: BACKUP_SIZE },
    { id: 2, at: atTwo(firstDay + 1), kind: 'Automatic', size: BACKUP_SIZE },
    { id: 3, at: atTwo(firstDay + 2), kind: 'Automatic', size: '1.1 GB' },
]

export const initialTickets: Ticket[] = [
    { id: 101, subject: 'Student cannot log in', requester: 'Neema Mollel', priority: 'High', status: 'Open' },
    { id: 102, subject: 'Payment not confirmed', requester: 'Hassan Said', priority: 'High', status: 'Open' },
    { id: 103, subject: 'Password reset request', requester: 'Grace Lyimo', priority: 'Low', status: 'Open' },
    { id: 104, subject: 'Document upload fails', requester: 'Daniel Mwakyusa', priority: 'Medium', status: 'Open' },
    { id: 105, subject: 'Course list not loading', requester: 'Furaha Ndege', priority: 'Medium', status: 'Resolved' },
]

export const initialLogs: LogEntry[] = [
    { id: 1, at: hoursAgo(1), level: 'Error', message: 'Payment callback timed out (retry 2 of 3)' },
    { id: 2, at: hoursAgo(2), level: 'Warning', message: '5 failed logins on one account, IP 196.xx.xx.12' },
    { id: 3, at: hoursAgo(3), level: 'Info', message: 'Admin approved application #2041' },
    { id: 4, at: hoursAgo(4), level: 'Error', message: 'File upload rejected: storage write failed' },
    { id: 5, at: hoursAgo(7), level: 'Info', message: 'Automatic database backup completed (1.2 GB)' },
    { id: 6, at: hoursAgo(10), level: 'Warning', message: 'Disk usage passed 75%' },
]
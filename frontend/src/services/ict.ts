import { api } from './api'
import type { TicketDetail, TicketPriority, TicketStatus } from './tickets'
import type { Role } from '../context/auth-context'

export type LogLevel = 'error' | 'warning' | 'info'

export type IctOverview = {
    server: { uptimeSeconds: number }
    database: { ok: boolean; latencyMs: number | null; sizeBytes: number | null }
    resources: { cpu: number; memory: number; disk: number | null }
    openTickets: number
    lastBackup: { createdAt: string; kind: 'automatic' | 'manual' } | null
    failedLogins24h: number
    maintenance: boolean
    autoBackup: boolean
}

export type IctTicketRow = {
    id: number
    subject: string
    category: string
    priority: TicketPriority
    status: TicketStatus
    createdAt: string
    requester: { fullName: string; email: string; role: Role }
    assignedTo: { fullName: string } | null
    comments: number
}

export type IctTicketList = {
    tickets: IctTicketRow[]
    total: number
    page: number
    pageSize: number
    counts: Record<TicketStatus | 'all', number>
}

export type LogRow = {
    id: number
    level: LogLevel
    message: string
    createdAt: string
    user: { fullName: string; email: string } | null
}

export type LogList = {
    logs: LogRow[]
    total: number
    page: number
    pageSize: number
    counts: Record<LogLevel | 'all', number>
}

export type BackupRow = {
    id: number
    kind: 'automatic' | 'manual'
    fileName: string
    sizeBytes: number
    createdAt: string
    createdBy: string | null
    fileExists: boolean
}

export type BackupList = { backups: BackupRow[]; autoBackup: boolean; keep: number }

export const getOverview = async () => (await api.get<IctOverview>('/ict/overview')).data

export const setMaintenance = async (on: boolean) => (await api.put<{ on: boolean }>('/ict/maintenance', { on })).data.on

export const listIctTickets = async (params: {
    status?: TicketStatus
    search?: string
    page: number
    pageSize: number
}) => (await api.get<IctTicketList>('/ict/tickets', { params })).data

export const updateTicket = async (
    id: number,
    patch: { status?: TicketStatus; priority?: TicketPriority; assign?: 'me' | 'none' },
) => (await api.patch<{ ticket: TicketDetail }>(`/ict/tickets/${id}`, patch)).data.ticket

export const listLogs = async (params: { level?: LogLevel; search?: string; page: number; pageSize: number }) =>
    (await api.get<LogList>('/ict/logs', { params })).data

// A normal link: the browser downloads the file, and the login cookie proves it is ICT.
export const logsExportUrl = (level?: LogLevel, search?: string) => {
    const q = new URLSearchParams()
    if (level) q.set('level', level)
    if (search) q.set('search', search)
    const text = q.toString()
    return `/api/ict/logs/export${text ? `?${text}` : ''}`
}

export const listBackups = async () => (await api.get<BackupList>('/ict/backups')).data

export const createBackup = async () => {
    await api.post('/ict/backups', undefined, { timeout: 11 * 60 * 1000 }) // pg_dump can take a while
}

export const deleteBackup = async (id: number) => {
    await api.delete(`/ict/backups/${id}`)
}

export const backupDownloadUrl = (id: number) => `/api/ict/backups/${id}/download`

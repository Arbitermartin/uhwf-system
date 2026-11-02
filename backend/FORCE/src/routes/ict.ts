import { Router } from 'express'
import fs from 'node:fs/promises'
import { Prisma } from '@prisma/client'
import { z } from 'zod'
import { env } from '../config'
import { prisma } from '../prisma'
import { requireAuth, requireRole } from '../middleware/auth'
import { HttpError } from '../utils/httpError'
import { BACKUP_KEEP, resolveBackupFile } from '../services/backupFiles'
import { runBackup } from '../services/backup'
import {
    cpuUsagePercent,
    databaseInfo,
    diskUsagePercent,
    isMaintenanceOn,
    memoryUsagePercent,
    setMaintenance,
} from '../services/system'
import { findTicketFor, toTicketDetail } from '../services/tickets'

const router = Router()

// Everything in this file is for the ICT team only, checked on the server.
router.use(requireAuth, requireRole('ict'))

const idSchema = z.coerce
    .number({ invalid_type_error: 'Invalid id.' })
    .int('Invalid id.')
    .positive('Invalid id.')

// ---------- Overview (the cards at the top of the ICT dashboard) ----------
router.get('/overview', async (_req, res) => {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000)

    const [database, cpu, disk, openTickets, lastBackup, failedLogins24h, maintenance] = await Promise.all([
        databaseInfo(),
        cpuUsagePercent(),
        diskUsagePercent(),
        prisma.supportTicket.count({ where: { status: 'open' } }),
        prisma.backup.findFirst({
            orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
            select: { createdAt: true, kind: true },
        }),
        prisma.activityLog.count({ where: { message: { startsWith: 'Failed login' }, createdAt: { gte: since } } }),
        isMaintenanceOn(),
    ])

    res.json({
        // how long the API (this server program) has been running, not the whole computer
        server: { uptimeSeconds: Math.round(process.uptime()) },
        database,
        resources: { cpu, memory: memoryUsagePercent(), disk },
        openTickets,
        lastBackup,
        failedLogins24h,
        maintenance,
        autoBackup: env.autoBackup,
    })
})

// ---------- Maintenance mode ----------
router.put('/maintenance', async (req, res) => {
    const { on } = z.object({ on: z.boolean() }).parse(req.body)
    await setMaintenance(on)
    await prisma.activityLog.create({
        data: { userId: req.user!.id, level: on ? 'warning' : 'info', message: `Maintenance mode turned ${on ? 'on' : 'off'}` },
    })
    res.json({ on })
})

// ---------- Support tickets ----------
const ticketListQuery = z.object({
    status: z.enum(['open', 'resolved']).optional(),
    search: z.string().trim().max(100).optional(),
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(50).default(10),
})

router.get('/tickets', async (req, res) => {
    const q = ticketListQuery.parse(req.query)

    const where: Prisma.SupportTicketWhereInput = {
        ...(q.status && { status: q.status }),
        ...(q.search && {
            OR: [
                { subject: { contains: q.search, mode: 'insensitive' } },
                { requester: { fullName: { contains: q.search, mode: 'insensitive' } } },
                { requester: { email: { contains: q.search, mode: 'insensitive' } } },
            ],
        }),
    }

    const [rows, total, grouped] = await Promise.all([
        prisma.supportTicket.findMany({
            where,
            // open reports first (that is the order the status was declared in), then newest first
            orderBy: [{ status: 'asc' }, { createdAt: 'desc' }, { id: 'desc' }],
            skip: (q.page - 1) * q.pageSize,
            take: q.pageSize,
            select: {
                id: true,
                subject: true,
                category: true,
                priority: true,
                status: true,
                createdAt: true,
                requester: { select: { fullName: true, email: true, role: true } },
                assignedTo: { select: { fullName: true } },
                _count: { select: { comments: true } },
            },
        }),
        prisma.supportTicket.count({ where }),
        prisma.supportTicket.groupBy({ by: ['status'], _count: { _all: true } }),
    ])

    const counts: Record<string, number> = { all: 0, open: 0, resolved: 0 }
    for (const g of grouped) {
        counts[g.status] = g._count._all
        counts.all += g._count._all
    }

    res.json({
        tickets: rows.map(({ _count, ...t }) => ({ ...t, comments: _count.comments })),
        total,
        page: q.page,
        pageSize: q.pageSize,
        counts,
    })
})

const ticketUpdateSchema = z
    .object({
        status: z.enum(['open', 'resolved']),
        priority: z.enum(['low', 'medium', 'high']),
        assign: z.enum(['me', 'none']),
    })
    .partial()
    .refine((v) => Object.keys(v).length > 0, 'Nothing to change.')

router.patch('/tickets/:id', async (req, res) => {
    const id = idSchema.parse(req.params.id)
    const body = ticketUpdateSchema.parse(req.body)
    const user = req.user!

    const ticket = await findTicketFor(id, user)
    if (!ticket) throw new HttpError(404, 'Report not found.')

    const data: Prisma.SupportTicketUncheckedUpdateInput = {}
    if (body.priority) data.priority = body.priority
    if (body.assign === 'me') data.assignedToId = user.id
    if (body.assign === 'none') data.assignedToId = null
    if (body.status && body.status !== ticket.status) {
        data.status = body.status
        data.resolvedAt = body.status === 'resolved' ? new Date() : null
    }

    await prisma.supportTicket.update({ where: { id }, data })

    if (data.status === 'resolved') {
        await prisma.notification.create({
            data: {
                userId: ticket.requesterId,
                type: 'ticket_resolved',
                title: 'Your problem was marked as resolved',
                body: ticket.subject,
                linkUrl: `/${ticket.requester.role}/support`,
            },
        })
        await prisma.activityLog.create({
            data: { userId: user.id, level: 'info', message: `Ticket #${id} resolved by ${user.email}` },
        })
    }

    const updated = await findTicketFor(id, user)
    res.json({ ticket: toTicketDetail(updated!, user.role) })
})

// ---------- System logs ----------
const logsQuery = z.object({
    level: z.enum(['error', 'warning', 'info']).optional(),
    search: z.string().trim().max(100).optional(),
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(50).default(15),
})

const searchWhere = (search: string | undefined): Prisma.ActivityLogWhereInput =>
    search
        ? {
            OR: [
                { message: { contains: search, mode: 'insensitive' } },
                { user: { email: { contains: search, mode: 'insensitive' } } },
            ],
        }
        : {}

router.get('/logs', async (req, res) => {
    const q = logsQuery.parse(req.query)
    const where: Prisma.ActivityLogWhereInput = { ...searchWhere(q.search), ...(q.level && { level: q.level }) }

    const [logs, total, grouped] = await Promise.all([
        prisma.activityLog.findMany({
            where,
            orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
            skip: (q.page - 1) * q.pageSize,
            take: q.pageSize,
            select: {
                id: true,
                level: true,
                message: true,
                createdAt: true,
                user: { select: { fullName: true, email: true } },
            },
        }),
        prisma.activityLog.count({ where }),
        // the numbers on the filter buttons follow the search, but not the level button
        prisma.activityLog.groupBy({ by: ['level'], where: searchWhere(q.search), _count: { _all: true } }),
    ])

    const counts: Record<string, number> = { all: 0, error: 0, warning: 0, info: 0 }
    for (const g of grouped) {
        counts[g.level] = g._count._all
        counts.all += g._count._all
    }

    res.json({ logs, total, page: q.page, pageSize: q.pageSize, counts })
})

// A cell that starts with = + - or @ would be run as a formula by Excel, so it gets a ' in front.
const csvCell = (value: string) => `"${(/^[=+\-@\t\r]/.test(value) ? `'${value}` : value).replace(/"/g, '""')}"`

router.get('/logs/export', async (req, res) => {
    const q = logsQuery.pick({ level: true, search: true }).parse(req.query)
    const where: Prisma.ActivityLogWhereInput = { ...searchWhere(q.search), ...(q.level && { level: q.level }) }

    const logs = await prisma.activityLog.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        take: 5000,
        select: { createdAt: true, level: true, message: true, user: { select: { email: true } } },
    })

    const rows = [
        ['Time (UTC)', 'Level', 'Message', 'User'],
        ...logs.map((l) => [l.createdAt.toISOString(), l.level, l.message, l.user?.email ?? '']),
    ]
    // the first character is a byte-order mark, so Excel reads the file as UTF-8
    const csv = '\uFEFF' + rows.map((r) => r.map(csvCell).join(',')).join('\r\n')

    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.setHeader('Content-Disposition', 'attachment; filename="uhwf-system-logs.csv"')
    res.setHeader('Cache-Control', 'private, no-store')
    res.send(csv)
})

// ---------- Backups ----------
router.get('/backups', async (_req, res) => {
    const rows = await prisma.backup.findMany({
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        take: BACKUP_KEEP,
        include: { createdBy: { select: { fullName: true } } },
    })

    const backups = await Promise.all(
        rows.map(async (b) => ({
            id: b.id,
            kind: b.kind,
            fileName: b.fileName,
            sizeMb: b.sizeMb,
            // sizeBytes: Number(b.sizeBytes),
            createdAt: b.createdAt,
            createdBy: b.createdBy?.fullName ?? null,
            fileExists: await fs
                .access(resolveBackupFile(b.fileName))
                .then(() => true)
                .catch(() => false),
        })),
    )

    res.json({ backups, autoBackup: env.autoBackup, keep: BACKUP_KEEP })
})

router.post('/backups', async (req, res) => {
    const backup = await runBackup('manual', req.user!.id)
    res.status(201).json({
        backup: { id: backup.id, kind: backup.kind, fileName: backup.fileName, sizeMb: Number(backup.sizeMb), createdAt: backup.createdAt },
    })
})

router.get('/backups/:id/download', async (req, res) => {
    const id = idSchema.parse(req.params.id)
    const backup = await prisma.backup.findUnique({ where: { id } })
    if (!backup) throw new HttpError(404, 'Backup not found.')

    const file = resolveBackupFile(backup.fileName)
    await fs.access(file).catch(() => {
        throw new HttpError(404, 'The backup file is missing on the server.')
    })

    await prisma.activityLog.create({
        data: { userId: req.user!.id, level: 'warning', message: `Downloaded backup ${backup.fileName}` },
    })
    res.setHeader('Cache-Control', 'private, no-store')
    res.download(file, backup.fileName)
})

router.delete('/backups/:id', async (req, res) => {
    const id = idSchema.parse(req.params.id)
    const backup = await prisma.backup.findUnique({ where: { id } })
    if (!backup) throw new HttpError(404, 'Backup not found.')

    await prisma.backup.delete({ where: { id } })
    await fs.rm(resolveBackupFile(backup.fileName), { force: true })
    await prisma.activityLog.create({
        data: { userId: req.user!.id, level: 'warning', message: `Deleted backup ${backup.fileName}` },
    })
    res.json({ message: 'Backup deleted.' })
})

export default router

import { Router } from 'express'
import type { Prisma } from '@prisma/client'
import { z } from 'zod'
import { prisma } from '../prisma'
import { requireAuth, requireRole } from '../middleware/auth'
import { HttpError } from '../utils/httpError'
import { dayToDate, isRealDay, todayInTanzania } from '../services/lecturerRules'
import { annualLeaveDays, leaveBalance } from '../services/staff'
import { minutesWorked } from '../services/staffRules'

const router = Router()

// Staff work is managed by administrators only. Checked on the server.
router.use(requireAuth, requireRole('admin'))

const idSchema = z.coerce
    .number({ invalid_type_error: 'Invalid id.' })
    .int('Invalid id.')
    .positive('Invalid id.')

const dayText = (d: Date) => d.toISOString().slice(0, 10)
const pageQuery = z.object({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(50).default(10),
})

// ---------- The active employees, for the "assign a task" window ----------
router.get('/employees', async (_req, res) => {
    const rows = await prisma.employeeProfile.findMany({
        where: { user: { status: 'active' } },
        orderBy: { user: { fullName: 'asc' } },
        select: { userId: true, staffId: true, position: true, user: { select: { fullName: true } } },
    })
    res.json({ employees: rows.map((e) => ({ id: e.userId, name: e.user.fullName, staffId: e.staffId, position: e.position })) })
})

// ============================ Leave ============================
const leaveList = pageQuery.extend({ status: z.enum(['pending', 'approved', 'rejected', 'cancelled']).optional() })

router.get('/leave', async (req, res) => {
    const q = leaveList.parse(req.query)
    const where: Prisma.LeaveRequestWhereInput = q.status ? { status: q.status } : {}

    const [rows, total, grouped] = await Promise.all([
        prisma.leaveRequest.findMany({
            where,
            // waiting requests first, oldest first (they have waited longest); the rest newest first
            orderBy: q.status === 'pending' ? [{ createdAt: 'asc' }] : [{ createdAt: 'desc' }, { id: 'desc' }],
            skip: (q.page - 1) * q.pageSize,
            take: q.pageSize,
            select: {
                id: true,
                userId: true,
                type: true,
                startDate: true,
                endDate: true,
                days: true,
                reason: true,
                status: true,
                decidedAt: true,
                createdAt: true,
                decidedBy: { select: { fullName: true } },
                user: { select: { fullName: true, employeeProfile: { select: { position: true } } } },
            },
        }),
        prisma.leaveRequest.count({ where }),
        prisma.leaveRequest.groupBy({ by: ['status'], _count: { _all: true } }),
    ])

    // the annual leave each of these people has left, so the decision is an informed one
    const year = Number(todayInTanzania().slice(0, 4))
    const balances = new Map<number, number>()
    await Promise.all(
        [...new Set(rows.map((r) => r.userId))].map(async (id) => balances.set(id, (await leaveBalance(id, year)).left)),
    )

    const counts: Record<string, number> = { pending: 0, approved: 0, rejected: 0, cancelled: 0 }
    for (const g of grouped) counts[g.status] = g._count._all

    res.json({
        requests: rows.map((r) => ({
            id: r.id,
            employee: r.user.fullName,
            position: r.user.employeeProfile?.position ?? null,
            type: r.type,
            startDate: dayText(r.startDate),
            endDate: dayText(r.endDate),
            days: r.days,
            reason: r.reason,
            status: r.status,
            decidedBy: r.decidedBy?.fullName ?? null,
            decidedAt: r.decidedAt,
            createdAt: r.createdAt,
            annualLeft: balances.get(r.userId) ?? 0,
        })),
        total,
        page: q.page,
        pageSize: q.pageSize,
        counts,
        annualDays: await annualLeaveDays(),
    })
})

const decisionSchema = z.object({
    decision: z.enum(['approved', 'rejected']),
    note: z.string().trim().max(300, 'The note is too long.').default(''),
})

router.patch('/leave/:id', async (req, res) => {
    const id = idSchema.parse(req.params.id)
    const { decision, note } = decisionSchema.parse(req.body)
    const me = req.user!

    const request = await prisma.leaveRequest.findUnique({
        where: { id },
        select: { userId: true, type: true, startDate: true, days: true, status: true },
    })
    if (!request) throw new HttpError(404, 'Leave request not found.')
    if (request.status !== 'pending') throw new HttpError(409, `This request was already ${request.status}.`)

    // Approving annual leave must not take the person above the yearly allowance
    if (decision === 'approved' && request.type === 'annual') {
        const balance = await leaveBalance(request.userId, request.startDate.getUTCFullYear())
        if (request.days > balance.left) {
            throw new HttpError(409, `Approving this would exceed the annual leave of this employee. They have ${balance.left} day${balance.left === 1 ? '' : 's'} left.`)
        }
    }

    // only one decision wins, even if two administrators click at the same moment
    const updated = await prisma.leaveRequest.updateMany({
        where: { id, status: 'pending' },
        data: { status: decision, decidedById: me.id, decidedAt: new Date() },
    })
    if (updated.count === 0) throw new HttpError(409, 'This request was just decided by someone else.')

    await prisma.notification.create({
        data: {
            userId: request.userId,
            type: 'leave_decision',
            title: decision === 'approved' ? 'Your leave was approved' : 'Your leave was not approved',
            body: `${request.days} working day${request.days === 1 ? '' : 's'} from ${dayText(request.startDate)}${note ? `. ${note}` : ''}`,
            linkUrl: '/employee/leave',
        },
    })
    await prisma.activityLog.create({
        data: { userId: me.id, level: 'info', message: `Leave request #${id} ${decision}` },
    })
    res.json({ status: decision })
})

// ============================ Tasks ============================
const taskList = pageQuery.extend({
    status: z.enum(['todo', 'in_progress', 'done']).optional(),
    employeeId: z.coerce.number().int().positive().optional(),
})

const taskSchema = z.object({
    assignedToId: z.number({ invalid_type_error: 'Choose an employee.' }).int().positive('Choose an employee.'),
    title: z.string().trim().min(3, 'Enter the task (at least 3 characters).').max(150, 'The task is too long.'),
    priority: z.enum(['low', 'medium', 'high']),
    dueDate: z.string().refine(isRealDay, 'Choose the due date.'),
})

router.get('/tasks', async (req, res) => {
    const q = taskList.parse(req.query)
    const today = dayToDate(todayInTanzania())
    const where: Prisma.TaskWhereInput = { ...(q.status && { status: q.status }), ...(q.employeeId && { assignedToId: q.employeeId }) }

    const [rows, total, grouped] = await Promise.all([
        prisma.task.findMany({
            where,
            orderBy: [{ status: 'asc' }, { dueDate: 'asc' }, { id: 'desc' }],
            skip: (q.page - 1) * q.pageSize,
            take: q.pageSize,
            select: {
                id: true,
                title: true,
                priority: true,
                dueDate: true,
                status: true,
                assignedTo: { select: { fullName: true } },
                assignedBy: { select: { fullName: true } },
            },
        }),
        prisma.task.count({ where }),
        prisma.task.groupBy({ by: ['status'], _count: { _all: true } }),
    ])

    const counts: Record<string, number> = { todo: 0, in_progress: 0, done: 0 }
    for (const g of grouped) counts[g.status] = g._count._all

    res.json({
        tasks: rows.map((t) => ({
            id: t.id,
            title: t.title,
            priority: t.priority,
            dueDate: dayText(t.dueDate),
            status: t.status,
            employee: t.assignedTo.fullName,
            assignedBy: t.assignedBy.fullName,
            overdue: t.status !== 'done' && t.dueDate < today,
        })),
        total,
        page: q.page,
        pageSize: q.pageSize,
        counts,
    })
})

router.post('/tasks', async (req, res) => {
    const body = taskSchema.parse(req.body)

    // the task can only go to an active employee
    const employee = await prisma.employeeProfile.findFirst({
        where: { userId: body.assignedToId, user: { status: 'active' } },
        select: { userId: true },
    })
    if (!employee) throw new HttpError(400, 'Choose an active employee.')

    const created = await prisma.task.create({
        data: {
            title: body.title,
            priority: body.priority,
            dueDate: dayToDate(body.dueDate),
            assignedToId: body.assignedToId,
            assignedById: req.user!.id,
        },
        select: { id: true },
    })

    await prisma.notification.create({
        data: {
            userId: body.assignedToId,
            type: 'task',
            title: 'You have a new task',
            body: `${body.title}, due ${body.dueDate}`,
            linkUrl: '/employee/tasks',
        },
    })
    res.status(201).json({ id: created.id })
})

router.delete('/tasks/:id', async (req, res) => {
    const result = await prisma.task.deleteMany({ where: { id: idSchema.parse(req.params.id) } })
    if (result.count === 0) throw new HttpError(404, 'Task not found.')
    res.json({ message: 'Task deleted.' })
})

// ============================ Attendance ============================
router.get('/attendance', async (req, res) => {
    const { date } = z
        .object({ date: z.string().refine(isRealDay, 'Choose a real date.').default(todayInTanzania()) })
        .parse(req.query)
    if (date > todayInTanzania()) throw new HttpError(400, 'Choose today or an earlier day.')

    const [people, days] = await Promise.all([
        prisma.employeeProfile.findMany({
            where: { user: { status: 'active' } },
            orderBy: { user: { fullName: 'asc' } },
            select: { userId: true, staffId: true, position: true, user: { select: { fullName: true } } },
        }),
        prisma.workDay.findMany({ where: { date: dayToDate(date) }, select: { userId: true, clockIn: true, clockOut: true } }),
    ])
    const byUser = new Map(days.map((d) => [d.userId, d]))

    const rows = people.map((p) => {
        const d = byUser.get(p.userId)
        return {
            id: p.userId,
            name: p.user.fullName,
            staffId: p.staffId,
            position: p.position,
            clockIn: d?.clockIn ?? null,
            clockOut: d?.clockOut ?? null,
            minutes: d ? minutesWorked(d.clockIn, d.clockOut) : null,
            state: !d ? ('absent' as const) : d.clockOut ? ('done' as const) : ('working' as const),
        }
    })

    res.json({
        date,
        rows,
        summary: {
            present: rows.filter((r) => r.state !== 'absent').length,
            working: rows.filter((r) => r.state === 'working').length,
            absent: rows.filter((r) => r.state === 'absent').length,
        },
    })
})

// ============================ Notices ============================
const AUDIENCES = ['all', 'employee', 'lecturer', 'student', 'member', 'ict', 'admin'] as const

const noticeSchema = z.object({
    title: z.string().trim().min(3, 'Add a title (at least 3 characters).').max(100, 'The title is too long.'),
    body: z.string().trim().min(5, 'Write at least 5 characters.').max(2000, 'The notice is too long.'),
    audience: z.enum(AUDIENCES, { errorMap: () => ({ message: 'Choose who should read it.' }) }),
    pinned: z.boolean().default(false),
})

router.get('/notices', async (_req, res) => {
    const rows = await prisma.announcement.findMany({
        where: { audience: { in: ['all', 'role'] } },
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        take: 30,
        select: { id: true, title: true, body: true, audience: true, targetRole: true, pinned: true, createdAt: true, author: { select: { fullName: true } } },
    })
    res.json({
        notices: rows.map((n) => ({
            id: n.id,
            title: n.title,
            body: n.body,
            audience: n.audience === 'all' ? 'all' : (n.targetRole ?? 'all'),
            pinned: n.pinned,
            createdAt: n.createdAt,
            author: n.author.fullName,
        })),
    })
})

router.post('/notices', async (req, res) => {
    const body = noticeSchema.parse(req.body)
    const me = req.user!

    await prisma.announcement.create({
        data: {
            authorId: me.id,
            title: body.title,
            body: body.body,
            pinned: body.pinned,
            audience: body.audience === 'all' ? 'all' : 'role',
            targetRole: body.audience === 'all' ? null : body.audience,
        },
    })

    // the bell of everyone who should read it
    const people = await prisma.user.findMany({
        where: { status: 'active', id: { not: me.id }, ...(body.audience !== 'all' && { role: body.audience }) },
        select: { id: true, role: true },
    })
    await prisma.notification.createMany({
        data: people.map((u) => ({
            userId: u.id,
            type: 'notice',
            title: `Notice: ${body.title}`,
            body: body.body.length > 120 ? `${body.body.slice(0, 120)}...` : body.body,
            linkUrl: u.role === 'employee' ? '/employee/announcements' : `/${u.role}`,
        })),
    })
    res.status(201).json({ notified: people.length })
})

router.delete('/notices/:id', async (req, res) => {
    const result = await prisma.announcement.deleteMany({
        where: { id: idSchema.parse(req.params.id), audience: { in: ['all', 'role'] } },
    })
    if (result.count === 0) throw new HttpError(404, 'Notice not found.')
    res.json({ message: 'Notice deleted.' })
})

export default router

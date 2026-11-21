import { Router } from 'express'
import { Prisma } from '@prisma/client'
import { z } from 'zod'
import { prisma } from '../prisma'
import { requireAuth, requireRole } from '../middleware/auth'
import { HttpError } from '../utils/httpError'
import { dayToDate, isRealDay, todayInTanzania } from '../services/lecturerRules'
import { employeeNotices, leaveBalance } from '../services/staff'
import { LEAVE_TYPES, canMoveTask, checkLeaveRequest, minutesWorked, periodsOverlap } from '../services/staffRules'
import type { TaskStatus } from '../services/staffRules'

const router = Router()

// Employees only, checked on the server. Every query below is limited to the signed-in employee.
router.use(requireAuth, requireRole('employee'))

const idSchema = z.coerce
    .number({ invalid_type_error: 'Invalid id.' })
    .int('Invalid id.')
    .positive('Invalid id.')

const dayText = (d: Date) => d.toISOString().slice(0, 10)

// ---------- Overview: the cards at the top of the dashboard ----------
router.get('/overview', async (req, res) => {
    const userId = req.user!.id
    const todayText = todayInTanzania()
    const today = dayToDate(todayText)
    const since = new Date(Date.now() - 30 * 86_400_000)

    const [workDay, openTasks, overdue, balance, pendingRequests, notices] = await Promise.all([
        prisma.workDay.findUnique({ where: { userId_date: { userId, date: today } } }),
        prisma.task.count({ where: { assignedToId: userId, status: { in: ['todo', 'in_progress'] } } }),
        prisma.task.count({ where: { assignedToId: userId, status: { not: 'done' }, dueDate: { lt: today } } }),
        leaveBalance(userId, Number(todayText.slice(0, 4))),
        prisma.leaveRequest.count({ where: { userId, status: 'pending' } }),
        prisma.announcement.count({ where: { ...employeeNotices, createdAt: { gte: since } } }),
    ])

    res.json({
        today: workDay
            ? { clockIn: workDay.clockIn, clockOut: workDay.clockOut, minutes: minutesWorked(workDay.clockIn, workDay.clockOut) }
            : null,
        openTasks,
        overdue,
        leave: { total: balance.total, left: balance.left, pendingRequests },
        notices,
    })
})

// ---------- Attendance ----------
router.post('/attendance/clock-in', async (req, res) => {
    const userId = req.user!.id
    const date = dayToDate(todayInTanzania())

    const existing = await prisma.workDay.findUnique({ where: { userId_date: { userId, date } } })
    if (existing) throw new HttpError(409, existing.clockOut ? 'You already clocked out today.' : 'You are already clocked in.')

    const clockIn = new Date()
    try {
        await prisma.workDay.create({ data: { userId, date, clockIn } })
    } catch (err) {
        // a second click at the very same moment
        if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
            throw new HttpError(409, 'You are already clocked in.')
        }
        throw err
    }
    res.status(201).json({ clockIn })
})

router.post('/attendance/clock-out', async (req, res) => {
    const userId = req.user!.id
    const date = dayToDate(todayInTanzania())

    const day = await prisma.workDay.findUnique({ where: { userId_date: { userId, date } } })
    if (!day) throw new HttpError(400, 'Clock in first.')
    if (day.clockOut) throw new HttpError(409, 'You already clocked out today.')

    const clockOut = new Date()
    await prisma.workDay.update({ where: { id: day.id }, data: { clockOut } })
    res.json({ clockIn: day.clockIn, clockOut, minutes: minutesWorked(day.clockIn, clockOut) })
})

router.get('/attendance', async (req, res) => {
    const userId = req.user!.id
    const { days } = z.object({ days: z.coerce.number().int().min(1).max(62).default(14) }).parse(req.query)
    const monthStart = dayToDate(`${todayInTanzania().slice(0, 7)}-01`)

    const [rows, thisMonth] = await Promise.all([
        prisma.workDay.findMany({ where: { userId }, orderBy: { date: 'desc' }, take: days }),
        prisma.workDay.findMany({ where: { userId, date: { gte: monthStart } }, select: { clockIn: true, clockOut: true } }),
    ])

    res.json({
        days: rows.map((r) => ({
            date: dayText(r.date),
            clockIn: r.clockIn,
            clockOut: r.clockOut,
            minutes: r.clockOut ? minutesWorked(r.clockIn, r.clockOut) : null, // null = never clocked out
        })),
        month: {
            daysWorked: thisMonth.length,
            minutes: thisMonth.reduce((sum, r) => (r.clockOut ? sum + minutesWorked(r.clockIn, r.clockOut) : sum), 0),
        },
    })
})

// ---------- Tasks ----------
router.get('/tasks', async (req, res) => {
    const { status } = z.object({ status: z.enum(['open', 'done', 'all']).default('open') }).parse(req.query)
    const today = dayToDate(todayInTanzania())

    const rows = await prisma.task.findMany({
        where: {
            assignedToId: req.user!.id,
            ...(status === 'open' && { status: { in: ['todo', 'in_progress'] as TaskStatus[] } }),
            ...(status === 'done' && { status: 'done' }),
        },
        orderBy: [{ status: 'asc' }, { dueDate: 'asc' }, { id: 'desc' }],
        take: 100,
        select: { id: true, title: true, priority: true, dueDate: true, status: true, assignedBy: { select: { fullName: true } } },
    })

    res.json({
        tasks: rows.map((t) => ({
            id: t.id,
            title: t.title,
            priority: t.priority,
            dueDate: dayText(t.dueDate),
            status: t.status,
            from: t.assignedBy.fullName,
            overdue: t.status !== 'done' && t.dueDate < today,
        })),
    })
})

router.post('/tasks/:id/status', async (req, res) => {
    const id = idSchema.parse(req.params.id)
    const { status } = z.object({ status: z.enum(['in_progress', 'done']) }).parse(req.body)
    const me = req.user!

    const task = await prisma.task.findFirst({
        where: { id, assignedToId: me.id }, // another person's task looks like it does not exist
        select: { title: true, status: true, assignedById: true },
    })
    if (!task) throw new HttpError(404, 'Task not found.')
    if (!canMoveTask(task.status, status)) throw new HttpError(409, 'This task cannot be moved to that status.')

    await prisma.task.update({ where: { id }, data: { status } })

    if (status === 'done') {
        await prisma.notification.create({
            data: {
                userId: task.assignedById,
                type: 'task_done',
                title: `${me.fullName} finished a task`,
                body: task.title,
                linkUrl: '/admin/staff-work',
            },
        })
    }
    res.json({ status })
})

// ---------- Leave ----------
const leaveSchema = z.object({
    type: z.enum(LEAVE_TYPES, { errorMap: () => ({ message: 'Choose the type of leave.' }) }),
    startDate: z.string().refine(isRealDay, 'Choose the first day.'),
    endDate: z.string().refine(isRealDay, 'Choose the last day.'),
    reason: z.string().trim().min(5, 'Give a short reason (at least 5 characters).').max(500, 'The reason is too long.'),
})

router.get('/leave', async (req, res) => {
    const userId = req.user!.id
    const [rows, balance] = await Promise.all([
        prisma.leaveRequest.findMany({
            where: { userId },
            orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
            take: 50,
            select: {
                id: true,
                type: true,
                startDate: true,
                endDate: true,
                days: true,
                reason: true,
                status: true,
                decidedAt: true,
                createdAt: true,
                decidedBy: { select: { fullName: true } },
            },
        }),
        leaveBalance(userId, Number(todayInTanzania().slice(0, 4))),
    ])

    res.json({
        requests: rows.map((r) => ({
            id: r.id,
            type: r.type,
            startDate: dayText(r.startDate),
            endDate: dayText(r.endDate),
            days: r.days,
            reason: r.reason,
            status: r.status,
            decidedAt: r.decidedAt,
            decidedBy: r.decidedBy?.fullName ?? null,
            createdAt: r.createdAt,
        })),
        balance,
    })
})

router.post('/leave', async (req, res) => {
    const me = req.user!
    const body = leaveSchema.parse(req.body)
    const todayText = todayInTanzania()

    const balance = await leaveBalance(me.id, Number(body.startDate.slice(0, 4)))
    const check = checkLeaveRequest({
        type: body.type,
        start: body.startDate,
        end: body.endDate,
        today: todayText,
        remaining: balance.remaining,
    })
    if (!check.ok) throw new HttpError(400, check.message)

    // not on top of leave that is already requested or approved
    const others = await prisma.leaveRequest.findMany({
        where: {
            userId: me.id,
            status: { in: ['pending', 'approved'] },
            startDate: { lte: dayToDate(body.endDate) },
            endDate: { gte: dayToDate(body.startDate) },
        },
        select: { startDate: true, endDate: true },
    })
    if (others.some((o) => periodsOverlap(body.startDate, body.endDate, dayText(o.startDate), dayText(o.endDate)))) {
        throw new HttpError(409, 'You already have leave requested or approved for some of these days.')
    }

    await prisma.leaveRequest.create({
        data: {
            userId: me.id,
            type: body.type,
            startDate: dayToDate(body.startDate),
            endDate: dayToDate(body.endDate),
            days: check.days,
            reason: body.reason,
        },
    })

    const admins = await prisma.user.findMany({ where: { role: 'admin', status: 'active' }, select: { id: true } })
    await prisma.notification.createMany({
        data: admins.map((a) => ({
            userId: a.id,
            type: 'leave_request',
            title: 'New leave request',
            body: `${me.fullName}: ${check.days} working day${check.days === 1 ? '' : 's'} of ${body.type} leave`,
            linkUrl: '/admin/staff-work',
        })),
    })
    res.status(201).json({ days: check.days })
})

router.post('/leave/:id/cancel', async (req, res) => {
    const id = idSchema.parse(req.params.id)
    const request = await prisma.leaveRequest.findFirst({ where: { id, userId: req.user!.id }, select: { status: true } })
    if (!request) throw new HttpError(404, 'Leave request not found.')
    if (request.status !== 'pending') throw new HttpError(409, 'Only a request that is still waiting can be cancelled.')

    await prisma.leaveRequest.update({ where: { id }, data: { status: 'cancelled' } })
    res.json({ status: 'cancelled' })
})

// ---------- Notices ----------
router.get('/announcements', async (_req, res) => {
    const rows = await prisma.announcement.findMany({
        where: employeeNotices,
        orderBy: [{ pinned: 'desc' }, { createdAt: 'desc' }, { id: 'desc' }],
        take: 50,
        select: { id: true, title: true, body: true, pinned: true, createdAt: true, author: { select: { fullName: true, role: true } } },
    })
    res.json({
        notices: rows.map((a) => ({
            id: a.id,
            title: a.title,
            body: a.body,
            pinned: a.pinned,
            createdAt: a.createdAt,
            author: a.author.fullName,
            authorRole: a.author.role,
        })),
    })
})

export default router

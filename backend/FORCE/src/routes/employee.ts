

import { Router } from 'express'
import multer from 'multer'
import path from 'node:path'
import { Prisma } from '@prisma/client'
import { z } from 'zod'
import { prisma } from '../prisma'
import { requireAuth, requireRole } from '../middleware/auth'
import { HttpError } from '../utils/httpError'
import { cleanFileName, removeUpload, resolveUpload, saveUpload } from '../services/files'
import { WORK_MAX_BYTES, detectWorkDocument, workContentType } from '../services/workFiles'
import { dayToDate, isRealDay, todayInTanzania } from '../services/lecturerRules'
import { employeeNotices, leaveBalance } from '../services/staff'
import { LEAVE_TYPES, canMoveTask, canSubmitWork, checkLeaveRequest, isOverdue, minutesWorked, periodsOverlap, taskRank } from '../services/staffRules'

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
        prisma.task.count({ where: { assignedToId: userId, status: { in: ['todo', 'in_progress', 'returned'] } } }),
        prisma.task.count({ where: { assignedToId: userId, status: { in: ['todo', 'in_progress', 'returned'] }, dueDate: { lt: today } } }),
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
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: WORK_MAX_BYTES, files: 1 } })

router.get('/tasks', async (req, res) => {
    const { status } = z.object({ status: z.enum(['open', 'done', 'all']).default('open') }).parse(req.query)
    const today = dayToDate(todayInTanzania())

    const rows = await prisma.task.findMany({
        where: {
            assignedToId: req.user!.id,
            ...(status === 'open' && { status: { not: 'done' } }), // everything not finished, including work waiting for review
            ...(status === 'done' && { status: 'done' }),
        },
        orderBy: [{ dueDate: 'asc' }, { id: 'desc' }],
        take: 100,
        select: {
            id: true,
            title: true,
            priority: true,
            dueDate: true,
            status: true,
            assignedBy: { select: { fullName: true } },
            _count: { select: { submissions: true, comments: true } },
        },
    })

    // what needs the employee's attention first, finished work last
    rows.sort((a, b) => taskRank(a.status) - taskRank(b.status) || a.dueDate.getTime() - b.dueDate.getTime())

    res.json({
        tasks: rows.map((t) => ({
            id: t.id,
            title: t.title,
            priority: t.priority,
            dueDate: dayText(t.dueDate),
            status: t.status,
            from: t.assignedBy.fullName,
            overdue: isOverdue(t.status, t.dueDate, today),
            submissions: t._count.submissions,
            comments: t._count.comments,
        })),
    })
})

// One task: the details, the work handed in so far, and everything the administrator has said
router.get('/tasks/:id', async (req, res) => {
    const id = idSchema.parse(req.params.id)
    const today = dayToDate(todayInTanzania())

    const task = await prisma.task.findFirst({
        where: { id, assignedToId: req.user!.id }, // another person's task looks like it does not exist
        select: {
            id: true,
            title: true,
            priority: true,
            dueDate: true,
            status: true,
            assignedBy: { select: { fullName: true } },
            submissions: { orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], select: { id: true, fileName: true, note: true, createdAt: true } },
            comments: {
                orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
                select: { id: true, body: true, decision: true, createdAt: true, author: { select: { fullName: true } } },
            },
        },
    })
    if (!task) throw new HttpError(404, 'Task not found.')

    res.json({
        task: {
            id: task.id,
            title: task.title,
            priority: task.priority,
            dueDate: dayText(task.dueDate),
            status: task.status,
            from: task.assignedBy.fullName,
            overdue: isOverdue(task.status, task.dueDate, today),
            canSubmit: canSubmitWork(task.status),
        },
        submissions: task.submissions,
        comments: task.comments.map((c) => ({ id: c.id, body: c.body, decision: c.decision, createdAt: c.createdAt, author: c.author.fullName })),
    })
})

// The employee can only START a task here. Finishing it means handing in the work and the administrator accepting it.
router.post('/tasks/:id/status', async (req, res) => {
    const id = idSchema.parse(req.params.id)
    z.object({ status: z.literal('in_progress') }).parse(req.body)

    const task = await prisma.task.findFirst({ where: { id, assignedToId: req.user!.id }, select: { status: true } })
    if (!task) throw new HttpError(404, 'Task not found.')
    if (!canMoveTask(task.status, 'in_progress')) throw new HttpError(409, 'This task has already been started.')

    await prisma.task.update({ where: { id }, data: { status: 'in_progress' } })
    res.json({ status: 'in_progress' })
})

// Hand in the work: a Word (.docx) or PDF file, with an optional note. It can be handed in again if it is returned.
router.post('/tasks/:id/submit', upload.single('file'), async (req, res) => {
    const id = idSchema.parse(req.params.id)
    const me = req.user!
    const note = z.string().trim().max(1000, 'The note is too long (1000 characters at most).').default('').parse(req.body?.note ?? '')

    const task = await prisma.task.findFirst({
        where: { id, assignedToId: me.id },
        select: { title: true, status: true, assignedById: true },
    })
    if (!task) throw new HttpError(404, 'Task not found.')
    if (!canSubmitWork(task.status)) throw new HttpError(409, 'This task was already accepted, so no more work can be handed in.')

    const file = req.file
    if (!file) throw new HttpError(400, 'Choose your file first.')
    // the real contents are checked, not the name
    const doc = detectWorkDocument(file.buffer)
    if (!doc) {
        throw new HttpError(400, 'Hand in a Word (.docx) or PDF file. Old .doc files are not accepted: in Word, choose "Save as" and pick .docx.')
    }

    const stored = await saveUpload('tasks', `task${id}`, file.buffer, doc.ext)
    const fileName = `${cleanFileName(file.originalname).replace(/\.(docx?|pdf)$/i, '')}.${doc.ext}`

    try {
        await prisma.$transaction([
            prisma.taskSubmission.create({ data: { taskId: id, authorId: me.id, filePath: stored, fileName, note: note || null } }),
            prisma.task.update({ where: { id }, data: { status: 'submitted' } }),
        ])
    } catch (err) {
        await removeUpload(stored) // never keep a file nobody points to
        throw err
    }

    await prisma.notification.create({
        data: {
            userId: task.assignedById,
            type: 'task_submitted',
            title: `${me.fullName} handed in work`,
            body: task.title,
            linkUrl: '/admin/staff-work?tab=tasks',
        },
    })
    res.status(201).json({ status: 'submitted' })
})

// The employee's own files only
router.get('/tasks/:id/submissions/:sid/file', async (req, res) => {
    const id = idSchema.parse(req.params.id)
    const sid = idSchema.parse(req.params.sid)

    const submission = await prisma.taskSubmission.findFirst({
        where: { id: sid, taskId: id, task: { assignedToId: req.user!.id } },
        select: { filePath: true, fileName: true },
    })
    if (!submission) throw new HttpError(404, 'File not found.')

    const file = resolveUpload(submission.filePath)
    // always a download, never opened inside the page
    res.setHeader('Content-Type', workContentType(path.extname(file).slice(1)))
    res.setHeader('Content-Disposition', `attachment; filename="${cleanFileName(submission.fileName)}"`)
    res.setHeader('Cache-Control', 'private, no-store')
    res.sendFile(file, (err) => {
        if (err && !res.headersSent) res.status(404).json({ message: 'The file is missing on the server.' })
    })
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

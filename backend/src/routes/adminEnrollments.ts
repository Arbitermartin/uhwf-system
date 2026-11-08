import { Router } from 'express'
import type { Prisma } from '@prisma/client'
import { z } from 'zod'
import { prisma } from '../prisma'
import { requireAuth, requireRole } from '../middleware/auth'
import { HttpError } from '../utils/httpError'

const router = Router()

// Enrollments are managed by administrators only. Checked on the server.
router.use(requireAuth, requireRole('admin'))

const idSchema = z.coerce
    .number({ invalid_type_error: 'Invalid id.' })
    .int('Invalid id.')
    .positive('Invalid id.')

const STATUSES = ['active', 'dropped', 'completed'] as const

const listQuery = z.object({
    courseId: z.coerce.number().int().positive().optional(),
    status: z.enum(STATUSES).optional(),
    search: z.string().trim().max(100).optional(),
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(50).default(15),
})

const createSchema = z.object({
    studentId: z.number({ invalid_type_error: 'Choose a student.' }).int().positive('Choose a student.'),
    courseId: z.number({ invalid_type_error: 'Choose a course.' }).int().positive('Choose a course.'),
})

const statusSchema = z.object({ status: z.enum(STATUSES) })

const select = {
    id: true,
    status: true,
    enrolledAt: true,
    course: { select: { id: true, code: true, title: true } },
    student: { select: { id: true, regNumber: true, userId: true, user: { select: { fullName: true } } } },
} satisfies Prisma.EnrollmentSelect

type Row = Prisma.EnrollmentGetPayload<{ select: typeof select }>

const toRow = (e: Row) => ({
    id: e.id,
    status: e.status,
    enrolledAt: e.enrolledAt,
    course: e.course,
    student: { id: e.student.id, name: e.student.user.fullName, regNumber: e.student.regNumber },
})

const statusLabel = { active: 'active', dropped: 'dropped', completed: 'completed' } as const

// ---------- List, with the courses for the filter ----------
router.get('/', async (req, res) => {
    const q = listQuery.parse(req.query)

    const where: Prisma.EnrollmentWhereInput = {
        ...(q.courseId && { courseId: q.courseId }),
        ...(q.status && { status: q.status }),
        ...(q.search && {
            student: {
                OR: [
                    { regNumber: { contains: q.search, mode: 'insensitive' } },
                    { user: { fullName: { contains: q.search, mode: 'insensitive' } } },
                ],
            },
        }),
    }

    const [rows, total, grouped, courses] = await Promise.all([
        prisma.enrollment.findMany({
            where,
            orderBy: [{ enrolledAt: 'desc' }, { id: 'desc' }],
            skip: (q.page - 1) * q.pageSize,
            take: q.pageSize,
            select,
        }),
        prisma.enrollment.count({ where }),
        // the numbers on the status tabs follow the course filter, but not the status tab itself
        prisma.enrollment.groupBy({
            by: ['status'],
            where: q.courseId ? { courseId: q.courseId } : {},
            _count: { _all: true },
        }),
        prisma.course.findMany({
            orderBy: { code: 'asc' },
            select: {
                id: true,
                code: true,
                title: true,
                _count: { select: { enrollments: { where: { status: 'active' } } } },
            },
        }),
    ])

    const counts: Record<string, number> = { all: 0, active: 0, dropped: 0, completed: 0 }
    for (const g of grouped) {
        counts[g.status] = g._count._all
        counts.all += g._count._all
    }

    res.json({
        enrollments: rows.map(toRow),
        total,
        page: q.page,
        pageSize: q.pageSize,
        counts,
        courses: courses.map((c) => ({ id: c.id, code: c.code, title: c.title, active: c._count.enrollments })),
    })
})

// ---------- Find an approved student, for the "Enroll a student" window ----------
router.get('/students', async (req, res) => {
    const { search } = z.object({ search: z.string().trim().max(100).default('') }).parse(req.query)

    const rows = await prisma.studentProfile.findMany({
        where: {
            user: { status: 'active' },
            ...(search && {
                OR: [
                    { regNumber: { contains: search, mode: 'insensitive' } },
                    { user: { fullName: { contains: search, mode: 'insensitive' } } },
                    { user: { email: { contains: search, mode: 'insensitive' } } },
                ],
            }),
        },
        orderBy: { user: { fullName: 'asc' } },
        take: 10,
        select: { id: true, regNumber: true, user: { select: { fullName: true } } },
    })

    res.json({ students: rows.map((s) => ({ id: s.id, name: s.user.fullName, regNumber: s.regNumber })) })
})

// ---------- Enroll a student in a course ----------
router.post('/', async (req, res) => {
    const body = createSchema.parse(req.body)

    const [student, course, existing] = await Promise.all([
        prisma.studentProfile.findUnique({ where: { id: body.studentId }, select: { userId: true, user: { select: { fullName: true } } } }),
        prisma.course.findUnique({ where: { id: body.courseId }, select: { code: true, title: true } }),
        prisma.enrollment.findUnique({
            where: { studentId_courseId: { studentId: body.studentId, courseId: body.courseId } },
            select: { id: true, status: true },
        }),
    ])
    if (!student) throw new HttpError(404, 'Student not found.')
    if (!course) throw new HttpError(404, 'Course not found.')
    if (existing?.status === 'active') {
        throw new HttpError(409, `${student.user.fullName} is already enrolled in ${course.code}.`)
    }

    // A student who was dropped or had completed the course is enrolled again, never twice.
    const saved = existing
        ? await prisma.enrollment.update({ where: { id: existing.id }, data: { status: 'active' }, select })
        : await prisma.enrollment.create({ data: { studentId: body.studentId, courseId: body.courseId }, select })

    await prisma.notification.create({
        data: {
            userId: student.userId,
            type: 'enrollment',
            title: `You were enrolled in ${course.code}`,
            body: course.title,
            linkUrl: '/student/courses',
        },
    })
    await prisma.activityLog.create({
        data: {
            userId: req.user!.id,
            level: 'info',
            message: `${existing ? 'Re-enrolled' : 'Enrolled'} ${student.user.fullName} in ${course.code}`,
        },
    })

    res.status(existing ? 200 : 201).json({ enrollment: toRow(saved) })
})

// ---------- Change the status: active, dropped, completed ----------
router.patch('/:id', async (req, res) => {
    const id = idSchema.parse(req.params.id)
    const { status } = statusSchema.parse(req.body)

    const current = await prisma.enrollment.findUnique({ where: { id }, select })
    if (!current) throw new HttpError(404, 'Enrollment not found.')
    if (current.status === status) {
        res.json({ enrollment: toRow(current) })
        return
    }

    const updated = await prisma.enrollment.update({ where: { id }, data: { status }, select })

    const text: Record<(typeof STATUSES)[number], string> = {
        active: `You are enrolled in ${current.course.code} again`,
        dropped: `You were dropped from ${current.course.code}`,
        completed: `${current.course.code} was marked as completed`,
    }
    await prisma.notification.create({
        data: {
            userId: current.student.userId,
            type: 'enrollment',
            title: text[status],
            body: current.course.title,
            linkUrl: '/student/courses',
        },
    })
    await prisma.activityLog.create({
        data: {
            userId: req.user!.id,
            level: status === 'dropped' ? 'warning' : 'info',
            message: `${current.student.user.fullName} in ${current.course.code}: ${statusLabel[current.status]} to ${statusLabel[status]}`,
        },
    })

    res.json({ enrollment: toRow(updated) })
})

// ---------- Remove an enrollment that has no history ----------
router.delete('/:id', async (req, res) => {
    const id = idSchema.parse(req.params.id)

    const current = await prisma.enrollment.findUnique({ where: { id }, select })
    if (!current) throw new HttpError(404, 'Enrollment not found.')

    // Attendance and scores belong to the student and the course. Removing the enrollment
    // would leave them behind with nothing to belong to, so it is refused: dropping keeps the history.
    const [attendance, scores] = await Promise.all([
        prisma.attendanceRecord.count({ where: { courseId: current.course.id, studentId: current.student.id } }),
        prisma.submission.count({ where: { studentId: current.student.id, assignment: { courseId: current.course.id } } }),
    ])
    if (attendance > 0 || scores > 0) {
        throw new HttpError(
            409,
            `${current.student.user.fullName} already has attendance or scores in ${current.course.code}, so this enrollment cannot be removed. Use "Drop" instead: the history is kept.`,
        )
    }

    await prisma.enrollment.delete({ where: { id } })
    await prisma.activityLog.create({
        data: { userId: req.user!.id, level: 'warning', message: `Removed ${current.student.user.fullName} from ${current.course.code}` },
    })
    res.json({ message: 'Enrollment removed.' })
})

export default router

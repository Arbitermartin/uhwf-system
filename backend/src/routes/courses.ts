import { Router } from 'express'
import { Prisma } from '@prisma/client'
import { z } from 'zod'
import { prisma } from '../prisma'
import { requireAuth, requireRole } from '../middleware/auth'
import { HttpError } from '../utils/httpError'

const router = Router()

// Course management is for administrators only, checked on the server.
router.use(requireAuth, requireRole('admin'))

const idSchema = z.coerce
    .number({ invalid_type_error: 'Invalid course id.' })
    .int('Invalid course id.')
    .positive('Invalid course id.')

const listQuery = z.object({
    search: z.string().trim().max(100).optional(),
    departmentId: z.coerce.number().int().positive().optional(),
    status: z.enum(['active', 'inactive']).optional(),
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(50).default(10),
})

const courseSchema = z.object({
    code: z
        .string()
        .trim()
        .toUpperCase()
        .regex(/^[A-Z0-9]{3,12}$/, 'Use 3 to 12 letters or digits, for example WLM101.'),
    title: z.string().trim().min(3, 'Enter the course title.').max(120, 'The title is too long.'),
    description: z
        .string()
        .trim()
        .max(1000, 'The description is too long.')
        .transform((v) => v || null),
    credits: z
        .number({ invalid_type_error: 'Enter the credits as a number.' })
        .int('Credits must be a whole number.')
        .min(1, 'At least 1 credit.')
        .max(20, 'At most 20 credits.'),
    departmentId: z.number({ invalid_type_error: 'Choose a department.' }).int().positive('Choose a department.'),
    lecturerId: z.number().int().positive().nullable(),
    isActive: z.boolean(),
})

const select = {
    id: true,
    code: true,
    title: true,
    description: true,
    credits: true,
    isActive: true,
    department: { select: { id: true, name: true } },
    lecturer: { select: { id: true, staffId: true, user: { select: { fullName: true } } } },
    _count: { select: { enrollments: true, applicationCourses: true } },
} satisfies Prisma.CourseSelect

type Row = Prisma.CourseGetPayload<{ select: typeof select }>

const toCourse = (c: Row) => ({
    id: c.id,
    code: c.code,
    title: c.title,
    description: c.description,
    credits: c.credits,
    isActive: c.isActive,
    department: c.department,
    lecturer: c.lecturer ? { id: c.lecturer.id, name: c.lecturer.user.fullName, staffId: c.lecturer.staffId } : null,
    enrolled: c._count.enrollments,
    chosenByApplicants: c._count.applicationCourses,
})

// ---------- Lecturers for the "taught by" dropdown ----------
router.get('/lecturers', async (_req, res) => {
    const rows = await prisma.lecturerProfile.findMany({
        where: { user: { status: 'active' } },
        orderBy: { user: { fullName: 'asc' } },
        select: {
            id: true,
            staffId: true,
            user: { select: { fullName: true } },
            department: { select: { name: true } },
        },
    })
    res.json({
        lecturers: rows.map((l) => ({ id: l.id, name: l.user.fullName, staffId: l.staffId, department: l.department.name })),
    })
})

// ---------- List ----------
router.get('/', async (req, res) => {
    const q = listQuery.parse(req.query)

    const where: Prisma.CourseWhereInput = {
        ...(q.departmentId && { departmentId: q.departmentId }),
        ...(q.status && { isActive: q.status === 'active' }),
        ...(q.search && {
            OR: [
                { code: { contains: q.search, mode: 'insensitive' } },
                { title: { contains: q.search, mode: 'insensitive' } },
            ],
        }),
    }

    const [rows, total, activeCount, inactiveCount] = await Promise.all([
        prisma.course.findMany({
            where,
            orderBy: { code: 'asc' },
            skip: (q.page - 1) * q.pageSize,
            take: q.pageSize,
            select,
        }),
        prisma.course.count({ where }),
        prisma.course.count({ where: { isActive: true } }),
        prisma.course.count({ where: { isActive: false } }),
    ])

    res.json({
        courses: rows.map(toCourse),
        total,
        page: q.page,
        pageSize: q.pageSize,
        counts: { all: activeCount + inactiveCount, active: activeCount, inactive: inactiveCount },
    })
})

const saveErrors = (err: unknown) => {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
        if (err.code === 'P2002') return new HttpError(409, 'A course with this code already exists.')
        if (err.code === 'P2003' || err.code === 'P2025') {
            return new HttpError(400, 'The selected department or lecturer does not exist.')
        }
    }
    return err
}

// ---------- Create ----------
router.post('/', async (req, res) => {
    const body = courseSchema.parse(req.body)

    let created: Row
    try {
        created = await prisma.course.create({ data: body, select })
    } catch (err) {
        throw saveErrors(err)
    }

    await prisma.activityLog.create({
        data: { userId: req.user!.id, level: 'info', message: `Created course ${created.code} (${created.title})` },
    })
    res.status(201).json({ course: toCourse(created) })
})

// ---------- Edit ----------
router.patch('/:id', async (req, res) => {
    const id = idSchema.parse(req.params.id)
    const body = courseSchema.parse(req.body)

    const existing = await prisma.course.findUnique({ where: { id }, select: { id: true } })
    if (!existing) throw new HttpError(404, 'Course not found.')

    let updated: Row
    try {
        updated = await prisma.course.update({ where: { id }, data: body, select })
    } catch (err) {
        throw saveErrors(err)
    }

    await prisma.activityLog.create({
        data: { userId: req.user!.id, level: 'info', message: `Updated course ${updated.code} (${updated.title})` },
    })
    res.json({ course: toCourse(updated) })
})

// ---------- Delete ----------
router.delete('/:id', async (req, res) => {
    const id = idSchema.parse(req.params.id)

    const course = await prisma.course.findUnique({
        where: { id },
        select: {
            code: true,
            _count: { select: { enrollments: true, applicationCourses: true, assignments: true, attendance: true } },
        },
    })
    if (!course) throw new HttpError(404, 'Course not found.')

    // A course that students or lecturers already use must be kept, because deleting it would
    // also delete their enrollments, attendance and assignments. Deactivating hides it instead.
    const used = Object.values(course._count).some((n) => n > 0)
    if (used) {
        throw new HttpError(
            409,
            'This course already has enrollments, applications, attendance or assignments, so it cannot be deleted. Deactivate it instead: students will no longer see it, and nothing is lost.',
        )
    }

    await prisma.course.delete({ where: { id } })
    await prisma.activityLog.create({
        data: { userId: req.user!.id, level: 'warning', message: `Deleted course ${course.code}` },
    })
    res.json({ message: 'Course deleted.' })
})

export default router

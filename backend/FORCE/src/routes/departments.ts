// import { Router } from 'express'
// import { prisma } from '../prisma'
// import { requireAuth, requireRole } from '../middleware/auth'

// const router = Router()
// router.use(requireAuth, requireRole('admin'))

// // Used by the admin Edit User form to fill the department dropdown.
// router.get('/', async (_req, res) => {
//     const departments = await prisma.department.findMany({
//         orderBy: { name: 'asc' },
//         select: { id: true, name: true },
//     })
//     res.json({ departments })
// })

// export default router
import { Router } from 'express'
import { Prisma } from '@prisma/client'
import { z } from 'zod'
import { prisma } from '../prisma'
import { requireAuth, requireRole } from '../middleware/auth'
import { HttpError } from '../utils/httpError'

const router = Router()
router.use(requireAuth, requireRole('admin'))

const idSchema = z.coerce
    .number({ invalid_type_error: 'Invalid department id.' })
    .int('Invalid department id.')
    .positive('Invalid department id.')

const nameSchema = z.object({
    name: z.string().trim().min(2, 'Enter the department name.').max(80, 'The name is too long.'),
})

const select = {
    id: true,
    name: true,
    _count: { select: { courses: true, lecturers: true, employees: true } },
} satisfies Prisma.DepartmentSelect

const toDepartment = (d: Prisma.DepartmentGetPayload<{ select: typeof select }>) => ({
    id: d.id,
    name: d.name,
    courses: d._count.courses,
    lecturers: d._count.lecturers,
    employees: d._count.employees,
})

// Used by the Add and Edit forms for users and courses, and by the Settings page.
router.get('/', async (_req, res) => {
    const rows = await prisma.department.findMany({ orderBy: { name: 'asc' }, select })
    res.json({ departments: rows.map(toDepartment) })
})

router.post('/', async (req, res) => {
    const { name } = nameSchema.parse(req.body)
    try {
        const created = await prisma.department.create({ data: { name }, select })
        await prisma.activityLog.create({
            data: { userId: req.user!.id, level: 'info', message: `Created department ${name}` },
        })
        res.status(201).json({ department: toDepartment(created) })
    } catch (err) {
        if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
            throw new HttpError(409, 'A department with this name already exists.')
        }
        throw err
    }
})

router.patch('/:id', async (req, res) => {
    const id = idSchema.parse(req.params.id)
    const { name } = nameSchema.parse(req.body)
    try {
        const updated = await prisma.department.update({ where: { id }, data: { name }, select })
        await prisma.activityLog.create({
            data: { userId: req.user!.id, level: 'info', message: `Renamed department #${id} to ${name}` },
        })
        res.json({ department: toDepartment(updated) })
    } catch (err) {
        if (err instanceof Prisma.PrismaClientKnownRequestError) {
            if (err.code === 'P2002') throw new HttpError(409, 'A department with this name already exists.')
            if (err.code === 'P2025') throw new HttpError(404, 'Department not found.')
        }
        throw err
    }
})

router.delete('/:id', async (req, res) => {
    const id = idSchema.parse(req.params.id)

    const dept = await prisma.department.findUnique({ where: { id }, select })
    if (!dept) throw new HttpError(404, 'Department not found.')

    // Courses, lecturers and employees belong to a department, so a used one cannot be deleted.
    const d = toDepartment(dept)
    if (d.courses + d.lecturers + d.employees > 0) {
        throw new HttpError(
            409,
            `This department still has ${d.courses} course(s), ${d.lecturers} lecturer(s) and ${d.employees} employee(s). Move them to another department first.`,
        )
    }

    await prisma.department.delete({ where: { id } })
    await prisma.activityLog.create({
        data: { userId: req.user!.id, level: 'warning', message: `Deleted department ${dept.name}` },
    })
    res.json({ message: 'Department deleted.' })
})

export default router

import { Router } from 'express'
import { Prisma } from '@prisma/client'
import { z } from 'zod'
import { prisma } from '../prisma'
import { requireAuth, requireRole } from '../middleware/auth'
import bcrypt from 'bcryptjs'
import { generateTemporaryPassword } from '../services/password'

const router = Router()

// Every route in this file is for administrators only, checked on the server.
router.use(requireAuth, requireRole('admin'))

const ROLES = ['admin', 'lecturer', 'student', 'employee', 'ict'] as const
const STATUSES = ['pending', 'active', 'suspended'] as const
const PHONE = /^[+\d\s-]{9,16}$/

const idSchema = z.coerce
    .number({ invalid_type_error: 'Invalid user id.' })
    .int('Invalid user id.')
    .positive('Invalid user id.')

const listQuery = z.object({
    search: z.string().trim().max(100).optional(),
    role: z.enum(ROLES).optional(),
    status: z.enum(STATUSES).optional(),
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(50).default(10),
})

const profileSchema = z
    .object({
        regNumber: z.string().trim().min(3, 'Registration number is too short.').max(40),
        programme: z.string().trim().max(100),
        yearOfStudy: z.string().trim().max(40),
        staffId: z.string().trim().min(3, 'Staff ID is too short.').max(40),
        departmentId: z.coerce.number().int().positive('Choose a department.'),
        qualification: z.string().trim().max(100),
        position: z.string().trim().min(2, 'Position is too short.').max(100),
    })
    .partial()

// Role and password are not editable here. Unknown fields are ignored.
const updateSchema = z.object({
    fullName: z.string().trim().min(2, 'Enter the full name.').max(100, 'Name is too long.'),
    email: z.string().trim().toLowerCase().email('Enter a valid email address.').max(254),
    phone: z
        .string()
        .trim()
        .regex(PHONE, 'Enter a valid phone number.')
        .or(z.literal(''))
        .transform((v) => v || null),
    gender: z
        .enum(['female', 'male'])
        .or(z.literal(''))
        .transform((v) => v || null),
    status: z.enum(STATUSES),
    profile: profileSchema.optional(),
})

// ---------- Create (staff accounts and admins) ----------
// Students are not created here: they apply through the Admission page.
const { fullName, email, phone, gender } = updateSchema.shape

const passwordField = z
    .string()
    .min(8, 'Use at least 8 characters.')
    .max(72, 'Password is too long (72 characters at most).')
    .regex(/[A-Za-z]/, 'Password must contain a letter.')
    .regex(/\d/, 'Password must contain a number.')

const base = z.object({ fullName, email, phone, gender, password: passwordField })

const staffId = z.string().trim().min(3, 'Staff ID is too short.').max(40)
const departmentId = z.coerce
    .number({ invalid_type_error: 'Choose a department.' })
    .int('Choose a department.')
    .positive('Choose a department.')

const createSchema = z.discriminatedUnion('role', [
    base.extend({
        role: z.literal('lecturer'),
        staffId,
        departmentId,
        qualification: z.string().trim().max(100).default(''),
    }),
    base.extend({
        role: z.literal('employee'),
        staffId,
        departmentId,
        position: z.string().trim().min(2, 'Position is too short.').max(100),
    }),
    base.extend({ role: z.literal('ict') }),
    base.extend({ role: z.literal('admin') }),
])

// Never select passwordHash: it must not leave the server.
const rowSelect = {
    id: true,
    fullName: true,
    email: true,
    phone: true,
    role: true,
    status: true,
    createdAt: true,
    lastLoginAt: true,
} satisfies Prisma.UserSelect

async function getUserDetail(id: number) {
    const u = await prisma.user.findUnique({
        where: { id },
        select: {
            ...rowSelect,
            gender: true,
            photoUrl: true,
            studentProfile: {
                select: { regNumber: true, programme: true, yearOfStudy: true, admittedAt: true },
            },
            lecturerProfile: {
                select: {
                    staffId: true,
                    qualification: true,
                    department: { select: { id: true, name: true } },
                    _count: { select: { courses: true } },
                },
            },
            employeeProfile: {
                select: {
                    staffId: true,
                    position: true,
                    department: { select: { id: true, name: true } },
                    supervisor: { select: { fullName: true } },
                },
            },
            application: { select: { status: true, intake: true, submittedAt: true } },
        },
    })
    if (!u) return null

    const { studentProfile, lecturerProfile, employeeProfile, application, ...rest } = u
    return {
        ...rest,
        student: studentProfile,
        lecturer: lecturerProfile
            ? {
                staffId: lecturerProfile.staffId,
                qualification: lecturerProfile.qualification,
                department: lecturerProfile.department,
                courses: lecturerProfile._count.courses,
            }
            : null,
        employee: employeeProfile
            ? {
                staffId: employeeProfile.staffId,
                position: employeeProfile.position,
                department: employeeProfile.department,
                supervisor: employeeProfile.supervisor?.fullName ?? null,
            }
            : null,
        application,
    }
}

const otherActiveAdmins = (excludeId: number) =>
    prisma.user.count({ where: { role: 'admin', status: 'active', id: { not: excludeId } } })

const blankToNull = (v: string | undefined) => (v === undefined ? undefined : v || null)

// ---------- List: search, filter by role and status, paginate ----------
router.get('/', async (req, res) => {
    const q = listQuery.parse(req.query)

    const where: Prisma.UserWhereInput = {
        ...(q.role && { role: q.role }),
        ...(q.status && { status: q.status }),
        ...(q.search && {
            OR: [
                { fullName: { contains: q.search, mode: 'insensitive' } },
                { email: { contains: q.search, mode: 'insensitive' } },
                { phone: { contains: q.search } },
            ],
        }),
    }

    const [users, total, grouped] = await Promise.all([
        prisma.user.findMany({
            where,
            orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
            skip: (q.page - 1) * q.pageSize,
            take: q.pageSize,
            select: rowSelect,
        }),
        prisma.user.count({ where }),
        prisma.user.groupBy({ by: ['role'], _count: { _all: true } }),
    ])

    const counts: Record<string, number> = { all: 0, admin: 0, lecturer: 0, student: 0, employee: 0, ict: 0 }
    for (const g of grouped) {
        counts[g.role] = g._count._all
        counts.all += g._count._all
    }

    res.json({ users, total, page: q.page, pageSize: q.pageSize, counts })
})

// ---------- Create one ----------
router.post('/', async (req, res) => {
    const body = createSchema.parse(req.body)
    const passwordHash = await bcrypt.hash(body.password, 12)

    let createdId: number
    try {
        const created = await prisma.user.create({
            data: {
                fullName: body.fullName,
                email: body.email,
                phone: body.phone,
                gender: body.gender,
                passwordHash,
                role: body.role,

                status: 'active',
                mustChangePassword: true, // the new user chooses their own password at first sign-in

                ...(body.role === 'lecturer' && {
                    lecturerProfile: {
                        create: {
                            staffId: body.staffId,
                            qualification: body.qualification || null,
                            department: { connect: { id: body.departmentId } },
                        },
                    },
                }),
                ...(body.role === 'employee' && {
                    employeeProfile: {
                        create: {
                            staffId: body.staffId,
                            position: body.position,
                            department: { connect: { id: body.departmentId } },
                        },
                    },
                }),
            },
            select: { id: true },
        })
        createdId = created.id
    } catch (err) {
        if (err instanceof Prisma.PrismaClientKnownRequestError) {
            if (err.code === 'P2002') {
                res.status(409).json({ message: 'That email or staff ID is already used by another user.' })
                return
            }
            if (err.code === 'P2025') {
                res.status(400).json({ message: 'The selected department does not exist.' })
                return
            }
        }
        throw err
    }

    await prisma.activityLog.create({
        data: {
            userId: req.user!.id,
            level: body.role === 'admin' ? 'warning' : 'info',
            message: `Created ${body.role} account #${createdId} (${body.email})`,
        },
    })

    res.status(201).json({ user: await getUserDetail(createdId) })
})

// ---------- View one ----------
router.get('/:id', async (req, res) => {
    const id = idSchema.parse(req.params.id)
    const user = await getUserDetail(id)
    if (!user) {
        res.status(404).json({ message: 'User not found.' })
        return
    }
    res.json({ user })
})

// ---------- Edit one ----------
router.patch('/:id', async (req, res) => {
    const id = idSchema.parse(req.params.id)
    const body = updateSchema.parse(req.body)

    const target = await prisma.user.findUnique({
        where: { id },
        select: {
            id: true,
            role: true,
            status: true,
            studentProfile: { select: { id: true } },
            lecturerProfile: { select: { id: true } },
            employeeProfile: { select: { id: true } },
        },
    })
    if (!target) {
        res.status(404).json({ message: 'User not found.' })
        return
    }

    if (id === req.user!.id && body.status !== 'active') {
        res.status(409).json({ message: 'You cannot suspend or deactivate your own account.' })
        return
    }
    if (target.role === 'admin' && target.status === 'active' && body.status !== 'active') {
        if ((await otherActiveAdmins(id)) === 0) {
            res.status(409).json({ message: 'This is the last active administrator and cannot be suspended.' })
            return
        }
    }

    try {
        await prisma.$transaction(async (tx) => {
            await tx.user.update({
                where: { id },
                data: {
                    fullName: body.fullName,
                    email: body.email,
                    phone: body.phone,
                    gender: body.gender,
                    status: body.status,
                },
            })

            const p = body.profile
            if (!p) return

            if (target.role === 'student' && target.studentProfile) {
                await tx.studentProfile.update({
                    where: { userId: id },
                    data: {
                        regNumber: p.regNumber,
                        programme: blankToNull(p.programme),
                        yearOfStudy: blankToNull(p.yearOfStudy),
                    },
                })
            } else if (target.role === 'lecturer' && target.lecturerProfile) {
                await tx.lecturerProfile.update({
                    where: { userId: id },
                    data: {
                        staffId: p.staffId,
                        departmentId: p.departmentId,
                        qualification: blankToNull(p.qualification),
                    },
                })
            } else if (target.role === 'employee' && target.employeeProfile) {
                await tx.employeeProfile.update({
                    where: { userId: id },
                    data: { staffId: p.staffId, departmentId: p.departmentId, position: p.position },
                })
            }
        })
    } catch (err) {
        if (err instanceof Prisma.PrismaClientKnownRequestError) {
            if (err.code === 'P2002') {
                res.status(409).json({ message: 'That email or ID number is already used by another user.' })
                return
            }
            if (err.code === 'P2003') {
                res.status(400).json({ message: 'The selected department does not exist.' })
                return
            }
        }
        throw err
    }

    await prisma.activityLog.create({
        data: { userId: req.user!.id, level: 'info', message: `Updated user #${id} (${body.email})` },
    })

    res.json({ user: await getUserDetail(id) })
})

// ---------- Reset a password (the server makes a new temporary one) ----------
router.post('/:id/reset-password', async (req, res) => {
    const id = idSchema.parse(req.params.id)

    if (id === req.user!.id) {
        res.status(409).json({ message: 'Use "Change password" to change your own password.' })
        return
    }

    const target = await prisma.user.findUnique({ where: { id }, select: { email: true } })
    if (!target) {
        res.status(404).json({ message: 'User not found.' })
        return
    }

    const temporaryPassword = generateTemporaryPassword()
    const passwordHash = await bcrypt.hash(temporaryPassword, 12)

    await prisma.user.update({
        where: { id },
        data: {
            passwordHash,
            mustChangePassword: true,
            passwordChangedAt: new Date(),
            tokenVersion: { increment: 1 }, // signs the user out everywhere
        },
    })

    await prisma.activityLog.create({
        data: { userId: req.user!.id, level: 'warning', message: `Reset password for user #${id} (${target.email})` },
    })

    res.setHeader('Cache-Control', 'no-store') // a password must never be cached
    res.json({ temporaryPassword })
})

// ---------- Delete one ----------
router.delete('/:id', async (req, res) => {
    const id = idSchema.parse(req.params.id)

    if (id === req.user!.id) {
        res.status(409).json({ message: 'You cannot delete your own account.' })
        return
    }

    const target = await prisma.user.findUnique({
        where: { id },
        select: {
            email: true,
            role: true,
            status: true,
            studentProfile: { select: { id: true } },
            lecturerProfile: { select: { _count: { select: { courses: true } } } },
        },
    })
    if (!target) {
        res.status(404).json({ message: 'User not found.' })
        return
    }

    if (target.role === 'admin' && target.status === 'active' && (await otherActiveAdmins(id)) === 0) {
        res.status(409).json({ message: 'This is the last active administrator and cannot be deleted.' })
        return
    }
    if (target.studentProfile) {
        res.status(409).json({
            message: 'This student has an academic record (enrollments, attendance, grades). Suspend the account instead of deleting it.',
        })
        return
    }
    const courseCount = target.lecturerProfile?._count.courses ?? 0
    if (courseCount > 0) {
        res.status(409).json({
            message: `This lecturer teaches ${courseCount} course${courseCount === 1 ? '' : 's'}. Reassign the courses first, or suspend the account.`,
        })
        return
    }

    try {
        await prisma.user.delete({ where: { id } })
    } catch (err) {
        // The user has messages, tickets, tasks or other records that must be kept.
        if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2003') {
            res.status(409).json({
                message: 'This user has records in the system (messages, tickets, tasks or similar) and cannot be deleted. Suspend the account instead.',
            })
            return
        }
        throw err
    }

    await prisma.activityLog.create({
        data: { userId: req.user!.id, level: 'warning', message: `Deleted user #${id} (${target.email})` },
    })

    res.json({ message: 'User deleted.' })
})

export default router
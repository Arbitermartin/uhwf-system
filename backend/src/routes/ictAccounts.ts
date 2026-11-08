import { Router } from 'express'
import bcrypt from 'bcryptjs'
import type { Prisma } from '@prisma/client'
import { z } from 'zod'
import { prisma } from '../prisma'
import { requireAuth, requireRole } from '../middleware/auth'
import { HttpError } from '../utils/httpError'
import { generateTemporaryPassword } from '../services/password'
import { whyNotManageable } from '../services/accountRules'

const router = Router()

// Account support for the ICT team. Checked on the server.
// ICT can look up accounts, reset a password, sign someone out everywhere, and suspend or reactivate.
// Creating, deleting and changing roles stay with the administrator.
router.use(requireAuth, requireRole('ict'))

const BCRYPT_ROUNDS = 12

const idSchema = z.coerce
    .number({ invalid_type_error: 'Invalid id.' })
    .int('Invalid id.')
    .positive('Invalid id.')

const ROLES = ['student', 'lecturer', 'employee', 'ict', 'admin'] as const

const listQuery = z.object({
    search: z.string().trim().max(100).optional(),
    role: z.enum(ROLES).optional(),
    status: z.enum(['active', 'suspended', 'pending']).optional(),
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(50).default(15),
})

const statusSchema = z.object({ status: z.enum(['active', 'suspended']) })

// Only what ICT needs. The password hash is never selected.
const select = {
    id: true,
    fullName: true,
    email: true,
    role: true,
    status: true,
    lastLoginAt: true,
    createdAt: true,
    mustChangePassword: true,
} satisfies Prisma.UserSelect

type Row = Prisma.UserGetPayload<{ select: typeof select }>

const toRow = (u: Row, actorId: number, failed: number) => ({
    id: u.id,
    name: u.fullName,
    email: u.email,
    role: u.role,
    status: u.status,
    lastLoginAt: u.lastLoginAt,
    createdAt: u.createdAt,
    mustChangePassword: u.mustChangePassword,
    failedLogins24h: failed,
    // false = shown for support, but ICT cannot act on it
    manageable: whyNotManageable({ id: actorId, role: 'ict' }, { id: u.id, role: u.role }) === null,
})

// Loads the target and refuses when ICT may not manage it.
async function manageable(id: number, actor: { id: number }) {
    const target = await prisma.user.findUnique({ where: { id }, select })
    if (!target) throw new HttpError(404, 'Account not found.')
    const problem = whyNotManageable({ id: actor.id, role: 'ict' }, { id: target.id, role: target.role })
    if (problem) throw new HttpError(403, problem)
    return target
}

const log = (userId: number, level: 'info' | 'warning', message: string) =>
    prisma.activityLog.create({ data: { userId, level, message } })

// ---------- List ----------
router.get('/', async (req, res) => {
    const q = listQuery.parse(req.query)
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000)

    const where: Prisma.UserWhereInput = {
        ...(q.role && { role: q.role }),
        ...(q.status && { status: q.status }),
        ...(q.search && {
            OR: [
                { fullName: { contains: q.search, mode: 'insensitive' } },
                { email: { contains: q.search, mode: 'insensitive' } },
            ],
        }),
    }

    const [rows, total, grouped] = await Promise.all([
        prisma.user.findMany({
            where,
            orderBy: [{ fullName: 'asc' }, { id: 'asc' }],
            skip: (q.page - 1) * q.pageSize,
            take: q.pageSize,
            select,
        }),
        prisma.user.count({ where }),
        prisma.user.groupBy({ by: ['status'], _count: { _all: true } }),
    ])

    // failed sign-ins in the last 24 hours, for the people on this page only
    const failed = await prisma.activityLog.groupBy({
        by: ['userId'],
        where: { userId: { in: rows.map((r) => r.id) }, message: { startsWith: 'Failed login' }, createdAt: { gte: since } },
        _count: { _all: true },
    })
    const failedBy = new Map(failed.map((f) => [f.userId, f._count._all]))

    const counts: Record<string, number> = { all: 0, active: 0, suspended: 0, pending: 0 }
    for (const g of grouped) {
        counts[g.status] = g._count._all
        counts.all += g._count._all
    }

    res.json({
        accounts: rows.map((u) => toRow(u, req.user!.id, failedBy.get(u.id) ?? 0)),
        total,
        page: q.page,
        pageSize: q.pageSize,
        counts,
    })
})

// ---------- One account, with its recent activity ----------
router.get('/:id', async (req, res) => {
    const id = idSchema.parse(req.params.id)

    const user = await prisma.user.findUnique({
        where: { id },
        select: {
            ...select,
            phone: true,
            studentProfile: { select: { regNumber: true } },
            lecturerProfile: { select: { staffId: true } },
            employeeProfile: { select: { staffId: true } },
        },
    })
    if (!user) throw new HttpError(404, 'Account not found.')

    // the person's own sign-in events, and what ICT or the administrator did to the account
    const activity = await prisma.activityLog.findMany({
        where: { OR: [{ userId: id }, { message: { contains: user.email, mode: 'insensitive' } }] },
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        take: 15,
        select: { id: true, level: true, message: true, createdAt: true },
    })

    res.json({
        account: {
            ...toRow(user, req.user!.id, 0),
            phone: user.phone,
            reference: user.studentProfile?.regNumber ?? user.lecturerProfile?.staffId ?? user.employeeProfile?.staffId ?? null,
        },
        activity,
    })
})

// ---------- Reset the password ----------
// A new temporary password is made by the server and shown ONCE. The person must change it at the next sign-in.
router.post('/:id/reset-password', async (req, res) => {
    const target = await manageable(idSchema.parse(req.params.id), req.user!)

    const temporary = generateTemporaryPassword()
    const passwordHash = await bcrypt.hash(temporary, BCRYPT_ROUNDS)

    await prisma.user.update({
        where: { id: target.id },
        data: {
            passwordHash,
            mustChangePassword: true,
            passwordChangedAt: new Date(),
            tokenVersion: { increment: 1 }, // signs the person out everywhere
        },
    })
    // the log says that it happened, never what the password is
    await log(req.user!.id, 'warning', `ICT reset the password of ${target.email}`)

    res.setHeader('Cache-Control', 'no-store')
    res.json({ temporaryPassword: temporary })
})

// ---------- Sign the person out everywhere ----------
router.post('/:id/sign-out', async (req, res) => {
    const target = await manageable(idSchema.parse(req.params.id), req.user!)

    await prisma.user.update({ where: { id: target.id }, data: { tokenVersion: { increment: 1 } } })
    await log(req.user!.id, 'warning', `ICT signed ${target.email} out of all devices`)
    res.json({ message: `${target.fullName} was signed out of all devices.` })
})

// ---------- Suspend or reactivate ----------
router.post('/:id/status', async (req, res) => {
    const { status } = statusSchema.parse(req.body)
    const target = await manageable(idSchema.parse(req.params.id), req.user!)

    if (target.status === status) {
        res.json({ status })
        return
    }

    await prisma.user.update({
        where: { id: target.id },
        data: {
            status,
            // a suspended person is signed out at once, not when their cookie expires
            ...(status === 'suspended' && { tokenVersion: { increment: 1 } }),
        },
    })
    await log(req.user!.id, 'warning', `ICT ${status === 'suspended' ? 'suspended' : 'reactivated'} the account ${target.email}`)
    res.json({ status })
})

export default router

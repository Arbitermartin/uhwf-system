import { Router } from 'express'
import { z } from 'zod'
import type { Prisma } from '@prisma/client'
import { prisma } from '../prisma'
import { requireAuth } from '../middleware/auth'
import { HttpError } from '../utils/httpError'

const router = Router()

// Only these roles may open the review pages.
const REVIEWERS: string[] = ['ict', 'employee', 'admin']
router.use(requireAuth, (req, res, next) => {
    if (!REVIEWERS.includes(req.user!.role)) {
        return res.status(403).json({ message: 'You do not have access to this page.' })
    }
    next()
})

type Idea = Prisma.InnovationIdeaGetPayload<{ include: { reviewer: { select: { fullName: true } } } }>
const withReviewer = { reviewer: { select: { fullName: true } } } as const

const STATUSES = ['received', 'reviewing', 'shortlisted', 'rejected'] as const

const rowOf = (i: Idea, me: number, role: string) => {
    const admin = role === 'admin'
    const mine = i.reviewedById === me
    return {
        id: i.id,
        title: i.title,
        category: i.category,
        region: i.region,
        stage: i.stage,
        status: i.status,
        createdAt: i.createdAt,
        fullName: i.fullName,
        reviewer: i.reviewer?.fullName ?? null,
        mine,
        canStart: i.status === 'received',
        canDecide: (i.status === 'reviewing' && (mine || admin)) || (admin && i.status === 'received'),
        canRelease: i.status === 'reviewing' && (mine || admin),
    }
}

const fullOf = (i: Idea, me: number, role: string) => ({
    ...rowOf(i, me, role),
    email: i.email,
    phone: i.phone,
    description: i.description,
    beneficiaries: i.beneficiaries,
    link: i.link,
    reviewNote: i.reviewNote,
    reviewedAt: i.reviewedAt,
})

const idOf = (v: string) => {
    const id = Number(v)
    if (!Number.isInteger(id) || id < 1) throw new HttpError(404, 'Idea not found.')
    return id
}

const load = async (id: number) => {
    const idea = await prisma.innovationIdea.findUnique({ where: { id }, include: withReviewer })
    if (!idea) throw new HttpError(404, 'Idea not found.')
    return idea
}

router.get('/', async (req, res) => {
    const page = Math.max(1, parseInt(String(req.query.page ?? '1'), 10) || 1)
    const pageSize = 10
    const status = String(req.query.status ?? '')
    const search = String(req.query.search ?? '').trim()

    const where: Prisma.InnovationIdeaWhereInput = {
        ...((STATUSES as readonly string[]).includes(status) ? { status: status as (typeof STATUSES)[number] } : {}),
        ...(search
            ? {
                OR: [
                    { title: { contains: search, mode: 'insensitive' } },
                    { fullName: { contains: search, mode: 'insensitive' } },
                ],
            }
            : {}),
    }

    const [rows, total, groups] = await Promise.all([
        prisma.innovationIdea.findMany({
            where,
            include: withReviewer,
            orderBy: { createdAt: 'desc' },
            skip: (page - 1) * pageSize,
            take: pageSize,
        }),
        prisma.innovationIdea.count({ where }),
        prisma.innovationIdea.groupBy({ by: ['status'], _count: { _all: true } }),
    ])

    const counts = { all: 0, received: 0, reviewing: 0, shortlisted: 0, rejected: 0 }
    for (const g of groups) {
        counts[g.status] = g._count._all
        counts.all += g._count._all
    }

    res.json({ ideas: rows.map((i) => rowOf(i, req.user!.id, req.user!.role)), total, page, pageSize, counts })
})

router.get('/:id', async (req, res) => {
    res.json({ idea: fullOf(await load(idOf(req.params.id)), req.user!.id, req.user!.role) })
})

// Take an idea. If two people click at the same moment, only one update succeeds.
router.post('/:id/start', async (req, res) => {
    const id = idOf(req.params.id)
    const me = req.user!.id
    const taken = await prisma.innovationIdea.updateMany({
        where: { id, status: 'received' },
        data: { status: 'reviewing', reviewedById: me, reviewedAt: null, reviewNote: null },
    })
    if (taken.count === 0) {
        const cur = await load(id)
        const alreadyMine = cur.status === 'reviewing' && cur.reviewedById === me
        if (!alreadyMine) throw new HttpError(409, 'Someone has already started reviewing this idea.')
    }
    res.json({ idea: fullOf(await load(id), me, req.user!.role) })
})

const decisionSchema = z
    .object({
        decision: z.enum(['shortlisted', 'rejected']),
        note: z.string().trim().max(1000, 'The note is too long.'),
    })
    .refine((v) => v.decision === 'shortlisted' || v.note.length >= 10, {
        path: ['note'],
        message: 'Explain the reason in at least 10 characters.',
    })

router.post('/:id/decision', async (req, res) => {
    const id = idOf(req.params.id)
    const me = req.user!.id
    const parsed = decisionSchema.safeParse(req.body)
    if (!parsed.success) {
        throw new HttpError(400, parsed.error.issues[0]?.message ?? 'Check the decision and the note.')
    }

    const idea = await load(id)
    if (!rowOf(idea, me, req.user!.role).canDecide) {
        throw new HttpError(409, 'You cannot decide on this idea. Start the review first.')
    }

    // The status must still be what we just read, or someone else changed it meanwhile.
    const done = await prisma.innovationIdea.updateMany({
        where: { id, status: idea.status },
        data: {
            status: parsed.data.decision,
            reviewNote: parsed.data.note || null,
            reviewedById: me,
            reviewedAt: new Date(),
        },
    })
    if (done.count === 0) throw new HttpError(409, 'This idea was just changed by someone else. Reload and try again.')

    res.json({ idea: fullOf(await load(id), me, req.user!.role) })
})

router.post('/:id/release', async (req, res) => {
    const id = idOf(req.params.id)
    const me = req.user!.id
    const idea = await load(id)
    if (!rowOf(idea, me, req.user!.role).canRelease) throw new HttpError(409, 'You cannot release this idea.')

    await prisma.innovationIdea.updateMany({
        where: { id, status: 'reviewing' },
        data: { status: 'received', reviewedById: null },
    })
    res.json({ idea: fullOf(await load(id), me, req.user!.role) })
})

export default router
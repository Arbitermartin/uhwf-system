import { Router } from 'express'
import multer from 'multer'
import path from 'node:path'
import type { Prisma } from '@prisma/client'
import { z } from 'zod'
import { prisma } from '../prisma'
import { requireAuth } from '../middleware/auth'
import { HttpError } from '../utils/httpError'
import { cleanFileName, detectFileType, removeUpload, resolveUpload, saveUpload } from '../services/files'
import {
    REVIEWER_ROLES,
    canSee,
    checkFeedback,
    feedbackKind,
    feedbackSchema,
    ideaSchema,
    isReviewer,
    statusAfterFeedback,
    statusSchema,
    whyCannotDecide,
} from '../services/ideaRules'

const router = Router()

// Anyone who can sign in may share an idea. What each person can see and do is decided below,
// on the server, for every request.
router.use(requireAuth)

const ATTACHMENT_MAX = 5 * 1024 * 1024
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: ATTACHMENT_MAX, files: 1 } })

const idSchema = z.coerce
    .number({ invalid_type_error: 'Invalid id.' })
    .int('Invalid id.')
    .positive('Invalid id.')

const listQuery = z.object({
    scope: z.enum(['mine', 'review']).default('mine'),
    status: z.enum(['submitted', 'under_review', 'needs_info', 'decided']).optional(),
    search: z.string().trim().max(100).optional(),
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(50).default(10),
})

const listSelect = {
    id: true,
    title: true,
    category: true,
    status: true,
    createdAt: true,
    author: { select: { id: true, fullName: true, role: true } },
    _count: { select: { feedback: true } },
} satisfies Prisma.IdeaSelect

const detailSelect = {
    id: true,
    title: true,
    category: true,
    description: true,
    status: true,
    attachmentName: true,
    createdAt: true,
    author: { select: { id: true, fullName: true, role: true } },
    feedback: {
        orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
        select: {
            id: true,
            comment: true,
            recommendation: true,
            impact: true,
            feasibility: true,
            effort: true,
            createdAt: true,
            author: { select: { id: true, fullName: true, role: true } },
        },
    },
} satisfies Prisma.IdeaSelect

type Viewer = { id: number; role: string }
type Detail = Prisma.IdeaGetPayload<{ select: typeof detailSelect }>

// What this person is allowed to see. The names of reviewers are shown to other reviewers.
// The person who shared the idea sees the role of each reviewer (Administrator, ICT, Employee),
// together with every word of the feedback.
function toDetail(i: Detail, viewer: Viewer) {
    const reviewerView = isReviewer(viewer.role)
    const kind = feedbackKind(viewer, i.author.id)
    return {
        id: i.id,
        title: i.title,
        category: i.category,
        description: i.description,
        status: i.status,
        createdAt: i.createdAt,
        attachmentName: i.attachmentName,
        author: { name: i.author.fullName, role: i.author.role },
        mine: i.author.id === viewer.id,
        canReview: kind === 'review',
        canReply: kind === 'reply',
        canDecide: whyCannotDecide(viewer, i.author.id) === null,
        feedback: i.feedback.map((f) => {
            const isReply = f.author.id === i.author.id
            return {
                id: f.id,
                kind: isReply ? ('reply' as const) : ('review' as const),
                role: f.author.role,
                name: reviewerView || isReply ? f.author.fullName : null,
                comment: f.comment,
                recommendation: f.recommendation,
                impact: f.impact,
                feasibility: f.feasibility,
                effort: f.effort,
                createdAt: f.createdAt,
            }
        }),
    }
}

// An idea the person may open, or "not found". Other people's ideas look like they do not exist.
async function openIdea(id: number, viewer: Viewer) {
    const idea = await prisma.idea.findUnique({ where: { id }, select: detailSelect })
    if (!idea || !canSee(viewer, idea.author.id)) throw new HttpError(404, 'Idea not found.')
    return idea
}

const reviewers = (exceptUserId?: number) =>
    prisma.user.findMany({
        where: { role: { in: [...REVIEWER_ROLES] }, status: 'active', ...(exceptUserId && { id: { not: exceptUserId } }) },
        select: { id: true, role: true },
    })

const link = (role: string, ideaId: number) => `/${role}/ideas?idea=${ideaId}`

// ---------- List ----------
router.get('/', async (req, res) => {
    const q = listQuery.parse(req.query)
    const me = req.user!

    if (q.scope === 'review' && !isReviewer(me.role)) {
        throw new HttpError(403, 'Only administrators, ICT and employees review ideas.')
    }

    const base: Prisma.IdeaWhereInput = {
        ...(q.scope === 'mine' && { authorId: me.id }),
        ...(q.search && { title: { contains: q.search, mode: 'insensitive' } }),
    }
    const where: Prisma.IdeaWhereInput = {
        ...base,
        ...(q.status === 'decided' && { status: { in: ['approved', 'not_selected'] } }),
        ...(q.status && q.status !== 'decided' && { status: q.status }),
    }

    const [rows, total, grouped] = await Promise.all([
        prisma.idea.findMany({
            where,
            orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
            skip: (q.page - 1) * q.pageSize,
            take: q.pageSize,
            select: listSelect,
        }),
        prisma.idea.count({ where }),
        // the numbers on the counters follow the search, but not the status that is selected
        prisma.idea.groupBy({ by: ['status'], where: base, _count: { _all: true } }),
    ])

    const counts = { all: 0, submitted: 0, under_review: 0, needs_info: 0, decided: 0 }
    for (const g of grouped) {
        counts.all += g._count._all
        if (g.status === 'approved' || g.status === 'not_selected') counts.decided += g._count._all
        else counts[g.status] += g._count._all
    }

    res.json({
        ideas: rows.map((r) => ({
            id: r.id,
            title: r.title,
            category: r.category,
            status: r.status,
            createdAt: r.createdAt,
            author: { name: r.author.fullName, role: r.author.role },
            mine: r.author.id === me.id,
            feedbackCount: r._count.feedback,
        })),
        total,
        page: q.page,
        pageSize: q.pageSize,
        counts,
    })
})

// ---------- Share an idea ----------
router.post('/', async (req, res) => {
    const body = ideaSchema.parse(req.body)
    const me = req.user!

    const lastHour = await prisma.idea.count({
        where: { authorId: me.id, createdAt: { gte: new Date(Date.now() - 60 * 60 * 1000) } },
    })
    if (lastHour >= 10) throw new HttpError(429, 'You shared many ideas in the last hour. Please wait a little before sharing another.')

    const created = await prisma.idea.create({
        data: { authorId: me.id, title: body.title, category: body.category, description: body.description },
        select: { id: true },
    })

    // tell every reviewer (except the author, if the author is one)
    const people = await reviewers(me.id)
    await prisma.notification.createMany({
        data: people.map((u) => ({
            userId: u.id,
            type: 'idea',
            title: 'New idea to review',
            body: `${me.fullName}: ${body.title}`,
            linkUrl: link(u.role, created.id),
        })),
    })

    const idea = await openIdea(created.id, me)
    res.status(201).json({ idea: toDetail(idea, me) })
})

// ---------- One idea, with all its feedback ----------
router.get('/:id', async (req, res) => {
    const idea = await openIdea(idSchema.parse(req.params.id), req.user!)
    res.json({ idea: toDetail(idea, req.user!) })
})

// ---------- Add feedback: a review from a reviewer, or a reply from the author ----------
router.post('/:id/feedback', async (req, res) => {
    const id = idSchema.parse(req.params.id)
    const me = req.user!
    const body = feedbackSchema.parse(req.body)

    const idea = await openIdea(id, me)
    const kind = feedbackKind(me, idea.author.id)
    if (kind === 'none') throw new HttpError(403, 'Only reviewers and the author can comment on this idea.')

    const problems = checkFeedback(kind, body)
    if (Object.keys(problems).length > 0) {
        // one message that names the problems, and the same problems by field for the form
        res.status(400).json({ message: Object.values(problems)[0], errors: problems })
        return
    }

    const nextStatus = statusAfterFeedback(idea.status, kind)

    await prisma.$transaction([
        prisma.ideaFeedback.create({
            data: {
                ideaId: id,
                authorId: me.id,
                comment: body.comment,
                // a reply carries no recommendation or scores, even if someone sends them
                ...(kind === 'review' && {
                    recommendation: body.recommendation,
                    impact: body.impact,
                    feasibility: body.feasibility,
                    effort: body.effort,
                }),
            },
        }),
        ...(nextStatus !== idea.status ? [prisma.idea.update({ where: { id }, data: { status: nextStatus } })] : []),
    ])

    if (kind === 'review') {
        // the person who shared the idea is told, and can read it
        await prisma.notification.create({
            data: {
                userId: idea.author.id,
                type: 'idea_feedback',
                title: 'New feedback on your idea',
                body: idea.title,
                linkUrl: link(idea.author.role, id),
            },
        })
    } else {
        // the reviewers who already gave feedback are told; if nobody has yet, every administrator is
        const voices = new Set(idea.feedback.filter((f) => f.author.id !== idea.author.id).map((f) => f.author.id))
        const people = await reviewers(me.id)
        const targets = voices.size > 0 ? people.filter((u) => voices.has(u.id)) : people.filter((u) => u.role === 'admin')
        await prisma.notification.createMany({
            data: targets.map((u) => ({
                userId: u.id,
                type: 'idea_reply',
                title: 'The author replied on an idea',
                body: idea.title,
                linkUrl: link(u.role, id),
            })),
        })
    }

    const updated = await openIdea(id, me)
    res.status(201).json({ idea: toDetail(updated, me) })
})

// ---------- The final decision: the administrator only ----------
router.post('/:id/status', async (req, res) => {
    const id = idSchema.parse(req.params.id)
    const me = req.user!
    const { status } = statusSchema.parse(req.body)

    const idea = await openIdea(id, me)
    const problem = whyCannotDecide(me, idea.author.id)
    if (problem) throw new HttpError(403, problem)

    if (idea.status !== status) {
        await prisma.idea.update({ where: { id }, data: { status } })
        const labels = {
            under_review: 'is under review again',
            needs_info: 'needs more information from you',
            approved: 'was approved',
            not_selected: 'was not selected',
        } as const
        await prisma.notification.create({
            data: {
                userId: idea.author.id,
                type: 'idea_status',
                title: `Your idea ${labels[status]}`,
                body: idea.title,
                linkUrl: link(idea.author.role, id),
            },
        })
        await prisma.activityLog.create({
            data: { userId: me.id, level: 'info', message: `Idea #${id} set to ${status}` },
        })
    }

    const updated = await openIdea(id, me)
    res.json({ idea: toDetail(updated, me) })
})

// ---------- Delete your own idea, as long as nobody has answered it ----------
router.delete('/:id', async (req, res) => {
    const id = idSchema.parse(req.params.id)
    const me = req.user!

    const idea = await prisma.idea.findUnique({
        where: { id },
        select: { authorId: true, attachmentPath: true, _count: { select: { feedback: true } } },
    })
    if (!idea || idea.authorId !== me.id) throw new HttpError(404, 'Idea not found.')
    if (idea._count.feedback > 0) {
        throw new HttpError(409, 'Reviewers have already answered this idea, so it cannot be deleted. Reply to them instead.')
    }

    await prisma.idea.delete({ where: { id } })
    if (idea.attachmentPath) await removeUpload(idea.attachmentPath)
    res.json({ message: 'Idea deleted.' })
})

// ---------- The attachment: a PDF or a picture, added by the author ----------
router.post('/:id/attachment', upload.single('file'), async (req, res) => {
    const id = idSchema.parse(req.params.id)
    const me = req.user!
    const file = req.file
    if (!file) throw new HttpError(400, 'Choose a file to attach.')

    // the real file contents are checked, not its name
    const detected = detectFileType(file.buffer)
    if (!detected) throw new HttpError(400, 'Attach a PDF, JPG or PNG file.')

    const idea = await prisma.idea.findUnique({ where: { id }, select: { authorId: true, attachmentPath: true } })
    if (!idea || idea.authorId !== me.id) throw new HttpError(404, 'Idea not found.')

    const stored = await saveUpload('ideas', `idea${id}`, file.buffer, detected.ext)
    try {
        await prisma.idea.update({
            where: { id },
            data: { attachmentPath: stored, attachmentName: cleanFileName(file.originalname) || `attachment.${detected.ext}` },
        })
    } catch (err) {
        await removeUpload(stored)
        throw err
    }
    if (idea.attachmentPath) await removeUpload(idea.attachmentPath)

    const updated = await openIdea(id, me)
    res.json({ idea: toDetail(updated, me) })
})

router.get('/:id/attachment', async (req, res) => {
    const id = idSchema.parse(req.params.id)
    await openIdea(id, req.user!) // only the author and the reviewers get past this line

    const idea = await prisma.idea.findUnique({ where: { id }, select: { attachmentPath: true, attachmentName: true } })
    if (!idea?.attachmentPath) throw new HttpError(404, 'This idea has no attachment.')

    const file = resolveUpload(idea.attachmentPath)
    res.setHeader('Content-Disposition', `attachment; filename="${cleanFileName(idea.attachmentName ?? 'attachment')}"`)
    res.setHeader('Cache-Control', 'private, no-store')
    res.type(path.extname(file))
    res.sendFile(file, (err) => {
        if (err && !res.headersSent) res.status(404).json({ message: 'The file is missing on the server.' })
    })
})

router.delete('/:id/attachment', async (req, res) => {
    const id = idSchema.parse(req.params.id)
    const me = req.user!

    const idea = await prisma.idea.findUnique({ where: { id }, select: { authorId: true, attachmentPath: true } })
    if (!idea || idea.authorId !== me.id) throw new HttpError(404, 'Idea not found.')

    await prisma.idea.update({ where: { id }, data: { attachmentPath: null, attachmentName: null } })
    if (idea.attachmentPath) await removeUpload(idea.attachmentPath)

    const updated = await openIdea(id, me)
    res.json({ idea: toDetail(updated, me) })
})

export default router

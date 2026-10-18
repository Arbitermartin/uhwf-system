import { Router } from 'express'
import path from 'node:path'
import { Prisma } from '@prisma/client'
import { z } from 'zod'
import { prisma } from '../prisma'
import { requireAuth, requireRole } from '../middleware/auth'
import { HttpError } from '../utils/httpError'
import { DOC_TYPES, nextRegistrationSeq } from '../services/application'
import { cleanFileName, resolveUpload } from '../services/files'

const router = Router()

// Reviewing applications is for administrators only, checked on the server.
router.use(requireAuth, requireRole('admin'))

const STATUSES = ['draft', 'submitted', 'approved', 'rejected'] as const

const idSchema = z.coerce
    .number({ invalid_type_error: 'Invalid application id.' })
    .int('Invalid application id.')
    .positive('Invalid application id.')

const listQuery = z.object({
    status: z.enum(STATUSES).optional(),
    search: z.string().trim().max(100).optional(),
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(50).default(10),
})

const rejectSchema = z.object({
    note: z.string().trim().min(5, 'Write a short reason (at least 5 characters).').max(500, 'The reason is too long.'),
})

async function getDetail(id: number) {
    const a = await prisma.application.findUnique({
        where: { id },
        include: {
            user: {
                select: {
                    id: true,
                    fullName: true,
                    email: true,
                    phone: true,
                    gender: true,
                    studentProfile: { select: { regNumber: true } },
                },
            },
            reviewer: { select: { fullName: true } },
            payments: { orderBy: { createdAt: 'desc' } },
            courses: { include: { course: { select: { code: true, title: true, credits: true } } } },
            documents: { orderBy: { type: 'asc' } },
        },
    })
    if (!a) return null

    return {
        id: a.id,
        intake: a.intake,
        status: a.status,
        submittedAt: a.submittedAt,
        reviewedAt: a.reviewedAt,
        reviewedBy: a.reviewer?.fullName ?? null,
        reviewNote: a.reviewNote,
        regNumber: a.user.studentProfile?.regNumber ?? null,
        student: {
            id: a.user.id,
            name: a.user.fullName,
            email: a.user.email,
            phone: a.user.phone,
            gender: a.user.gender,
        },
        personal: {
            dob: a.dob ? a.dob.toISOString().slice(0, 10) : null,
            nationality: a.nationality,
            region: a.region,
            kinName: a.kinName,
            kinPhone: a.kinPhone,
        },
        payments: a.payments.map((p) => ({
            id: p.id,
            amount: p.amount,
            method: p.method,
            status: p.status,
            reference: p.reference,
            paidAt: p.paidAt,
            createdAt: p.createdAt,
        })),
        courses: a.courses.map((c) => c.course),
        documents: a.documents.map((d) => ({ type: d.type, fileName: d.fileName, uploadedAt: d.uploadedAt })),
    }
}

// ---------- List ----------
router.get('/', async (req, res) => {
    const q = listQuery.parse(req.query)

    const where: Prisma.ApplicationWhereInput = {
        ...(q.status && { status: q.status }),
        ...(q.search && {
            user: {
                OR: [
                    { fullName: { contains: q.search, mode: 'insensitive' } },
                    { email: { contains: q.search, mode: 'insensitive' } },
                ],
            },
        }),
    }

    const [rows, total, grouped] = await Promise.all([
        prisma.application.findMany({
            where,
            orderBy: [{ submittedAt: { sort: 'desc', nulls: 'last' } }, { id: 'desc' }],
            skip: (q.page - 1) * q.pageSize,
            take: q.pageSize,
            select: {
                id: true,
                intake: true,
                status: true,
                submittedAt: true,
                reviewedAt: true,
                user: { select: { fullName: true, email: true, phone: true } },
                payments: { select: { status: true } },
                _count: { select: { courses: true, documents: true } },
            },
        }),
        prisma.application.count({ where }),
        prisma.application.groupBy({ by: ['status'], _count: { _all: true } }),
    ])

    const counts: Record<string, number> = { all: 0, draft: 0, submitted: 0, approved: 0, rejected: 0 }
    for (const g of grouped) {
        counts[g.status] = g._count._all
        counts.all += g._count._all
    }

    const applications = rows.map((r) => ({
        id: r.id,
        intake: r.intake,
        status: r.status,
        submittedAt: r.submittedAt,
        reviewedAt: r.reviewedAt,
        student: { name: r.user.fullName, email: r.user.email, phone: r.user.phone },
        paymentStatus: r.payments.some((p) => p.status === 'paid')
            ? 'paid'
            : r.payments.some((p) => p.status === 'pending')
                ? 'pending'
                : 'none',
        courseCount: r._count.courses,
        documentCount: r._count.documents,
    }))

    res.json({ applications, total, page: q.page, pageSize: q.pageSize, counts })
})

// ---------- One application ----------
router.get('/:id', async (req, res) => {
    const application = await getDetail(idSchema.parse(req.params.id))
    if (!application) throw new HttpError(404, 'Application not found.')
    res.json({ application })
})

// ---------- Open one uploaded document ----------
router.get('/:id/documents/:type/file', async (req, res) => {
    const id = idSchema.parse(req.params.id)
    const type = z.enum(DOC_TYPES).parse(req.params.type)

    const doc = await prisma.applicationDocument.findUnique({
        where: { applicationId_type: { applicationId: id, type } },
    })
    if (!doc) throw new HttpError(404, 'Document not found.')

    const abs = resolveUpload(doc.fileUrl)
    res.setHeader('Content-Disposition', `inline; filename="${cleanFileName(doc.fileName)}"`)
    res.setHeader('Cache-Control', 'private, no-store')
    res.type(path.extname(abs))
    res.sendFile(abs, (err) => {
        if (err && !res.headersSent) res.status(404).json({ message: 'The file is missing on the server.' })
    })
})

// ---------- Confirm a payment by hand (bank or cash, or while no gateway is connected) ----------
router.post('/:id/payment/confirm', async (req, res) => {
    const id = idSchema.parse(req.params.id)

    const application = await prisma.application.findUnique({ where: { id }, select: { userId: true, status: true } })
    if (!application) throw new HttpError(404, 'Application not found.')

    const pending = await prisma.payment.findFirst({
        where: { applicationId: id, status: 'pending' },
        orderBy: { createdAt: 'desc' },
    })
    if (!pending) throw new HttpError(409, 'There is no pending payment to confirm.')

    await prisma.payment.update({ where: { id: pending.id }, data: { status: 'paid', paidAt: new Date() } })

    await prisma.notification.create({
        data: {
            userId: application.userId,
            type: 'payment_confirmed',
            title: 'Payment received',
            body: 'Your application fee was confirmed. You can now choose your courses.',
            linkUrl: '/student/application',
        },
    })
    await prisma.activityLog.create({
        data: {
            userId: req.user!.id,
            level: 'info',
            message: `Confirmed payment ${pending.reference ?? '#' + pending.id} for application #${id}`,
        },
    })

    res.json({ application: await getDetail(id) })
})

// ---------- Approve ----------
router.post('/:id/approve', async (req, res) => {
    const id = idSchema.parse(req.params.id)

    const app = await prisma.application.findUnique({
        where: { id },
        include: { payments: true, courses: true, documents: true, user: { select: { fullName: true } } },
    })
    if (!app) throw new HttpError(404, 'Application not found.')

    if (app.status !== 'submitted') throw new HttpError(409, 'Only submitted applications can be approved.')
    if (!app.payments.some((p) => p.status === 'paid')) throw new HttpError(409, 'The payment has not been confirmed yet.')
    if (app.courses.length === 0) throw new HttpError(409, 'The student has not chosen any courses.')
    if (DOC_TYPES.some((t) => !app.documents.some((d) => d.type === t))) {
        throw new HttpError(409, 'Some required documents are missing.')
    }

    // Registration numbers use the first year of the intake: "2026/2027" gives UHWF/2026/0001
    const year = Number.parseInt(app.intake.slice(0, 4), 10) || new Date().getFullYear()
    let regNumber = ''

    try {
        await prisma.$transaction(async (tx) => {
            // Claim the application first. If two admins click at once, only one gets through.
            const claimed = await tx.application.updateMany({
                where: { id, status: 'submitted' },
                data: { status: 'approved', reviewedById: req.user!.id, reviewedAt: new Date(), reviewNote: null },
            })
            if (claimed.count === 0) throw new HttpError(409, 'This application was already reviewed.')

            const seq = await nextRegistrationSeq(tx, year)
            regNumber = `UHWF/${year}/${String(seq).padStart(4, '0')}`

            const profile = await tx.studentProfile.create({
                data: { userId: app.userId, regNumber, yearOfStudy: 'Year 1' },
            })
            await tx.enrollment.createMany({
                data: app.courses.map((c) => ({ studentId: profile.id, courseId: c.courseId })),
            })
            await tx.notification.create({
                data: {
                    userId: app.userId,
                    type: 'application_approved',
                    title: 'Your application was approved',
                    body: `Welcome to UHWF. Your registration number is ${regNumber}.`,
                    linkUrl: '/student',
                },
            })
        })
    } catch (err) {
        if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
            throw new HttpError(409, 'This student already has a registration record.')
        }
        throw err
    }

    await prisma.activityLog.create({
        data: {
            userId: req.user!.id,
            level: 'info',
            message: `Approved application #${id} (${app.user.fullName}), registration number ${regNumber}`,
        },
    })

    res.json({ application: await getDetail(id) })
})

// ---------- Reject ----------
router.post('/:id/reject', async (req, res) => {
    const id = idSchema.parse(req.params.id)
    const { note } = rejectSchema.parse(req.body)

    const app = await prisma.application.findUnique({
        where: { id },
        select: { userId: true, user: { select: { fullName: true } } },
    })
    if (!app) throw new HttpError(404, 'Application not found.')

    const claimed = await prisma.application.updateMany({
        where: { id, status: 'submitted' },
        data: { status: 'rejected', reviewedById: req.user!.id, reviewedAt: new Date(), reviewNote: note },
    })
    if (claimed.count === 0) throw new HttpError(409, 'Only submitted applications can be rejected.')

    await prisma.notification.create({
        data: {
            userId: app.userId,
            type: 'application_rejected',
            title: 'Your application was not approved',
            body: note,
            linkUrl: '/student/application',
        },
    })
    await prisma.activityLog.create({
        data: { userId: req.user!.id, level: 'info', message: `Rejected application #${id} (${app.user.fullName})` },
    })

    res.json({ application: await getDetail(id) })
})

export default router

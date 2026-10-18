import { Prisma } from '@prisma/client'
import { prisma } from '../prisma'
import { getAdmission } from './admission'

export const MAX_COURSES = 3
export const DOC_TYPES = ['photo', 'id', 'cert', 'birth'] as const
export type DocKey = (typeof DOC_TYPES)[number]
export const PAYMENT_METHODS = ['M-Pesa', 'Tigo Pesa', 'Airtel Money', 'Bank or card'] as const

export async function ensureApplication(userId: number) {
    const existing = await prisma.application.findUnique({ where: { userId } })
    if (existing) return existing

    const admission = await getAdmission()
    try {
        return await prisma.application.create({ data: { userId, intake: admission.intake } })
    } catch (err) {
        // two requests arrived at the same moment: the other one created it
        if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
            return prisma.application.findUniqueOrThrow({ where: { userId } })
        }
        throw err
    }
}

const isoDate = (d: Date | null) => (d ? d.toISOString().slice(0, 10) : '')

// Everything the student dashboard needs, in one object.
export async function loadApplicationPayload(userId: number) {
    const base = await ensureApplication(userId)

    const [app, admission, catalog] = await Promise.all([
        prisma.application.findUniqueOrThrow({
            where: { id: base.id },
            include: {
                user: { select: { phone: true, gender: true } },
                payments: { orderBy: { createdAt: 'desc' } },
                courses: { include: { course: { select: { code: true } } } },
                documents: true,
            },
        }),
        getAdmission(),
        prisma.course.findMany({
            where: { isActive: true },
            orderBy: { code: 'asc' },
            select: { code: true, title: true, credits: true },
        }),
    ])

    const payment = app.payments.find((p) => p.status !== 'failed')

    const documents = Object.fromEntries(DOC_TYPES.map((t) => [t, ''])) as Record<DocKey, string>
    for (const d of app.documents) documents[d.type] = d.fileName

    return {
        id: app.id,
        intake: app.intake,
        status: app.status,
        fee: admission.fee,
        maxCourses: MAX_COURSES,
        personal: {
            dob: isoDate(app.dob),
            gender: app.user.gender ?? '',
            nationality: app.nationality ?? '',
            phone: app.user.phone ?? '',
            region: app.region ?? '',
            kinName: app.kinName ?? '',
            kinPhone: app.kinPhone ?? '',
        },
        payment: {
            status: payment ? payment.status : 'none',
            method: payment?.method ?? '',
            reference: payment?.reference ?? null,
            amount: payment?.amount ?? admission.fee,
        },
        courses: app.courses.map((c) => c.course.code),
        catalog,
        documents,
        submittedAt: app.submittedAt,
        reviewNote: app.reviewNote,
    }
}

export type ApplicationPayload = Awaited<ReturnType<typeof loadApplicationPayload>>

export const personalDone = (a: ApplicationPayload) => Object.values(a.personal).every((v) => v !== '')
export const paymentDone = (a: ApplicationPayload) => a.payment.status === 'paid'
export const coursesDone = (a: ApplicationPayload) => a.courses.length > 0
export const documentsDone = (a: ApplicationPayload) => DOC_TYPES.every((t) => a.documents[t] !== '')

// Next registration number for a year. One atomic statement, so two approvals at the same
// moment can never receive the same number.
export async function nextRegistrationSeq(tx: Prisma.TransactionClient, year: number) {
    const rows = await tx.$queryRaw<{ value: string }[]>`
    INSERT INTO settings ("key", "value", "updatedAt")
    VALUES (${`regseq.${year}`}, '1', now())
    ON CONFLICT ("key") DO UPDATE
      SET "value" = ((settings."value")::int + 1)::text, "updatedAt" = now()
    RETURNING "value"`
    return Number(rows[0].value)
}

import { Router } from 'express'
import multer from 'multer'
import { z } from 'zod'
import { prisma } from '../prisma'
import { env } from '../config'
import { requireAuth, requireRole } from '../middleware/auth'
import { HttpError } from '../utils/httpError'
import { getAdmission } from '../services/admission'
import {
    DOC_TYPES,
    MAX_COURSES,
    PAYMENT_METHODS,
    coursesDone,
    documentsDone,
    loadApplicationPayload,
    paymentDone,
    personalDone,
} from '../services/application'
import type { ApplicationPayload } from '../services/application'
import { MAX_FILE_BYTES, cleanFileName, detectFileType, removeUpload, saveUpload } from '../services/files'

const router = Router()

// The student's own application. Every route here is for students only.
router.use(requireAuth, requireRole('student'))

const PHONE = /^[+\d\s-]{9,16}$/

const personalSchema = z.object({
    dob: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, 'Enter your date of birth.')
        .refine((v) => {
            const d = new Date(`${v}T00:00:00Z`)
            return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === v
        }, 'Enter a real date.')
        .refine((v) => v <= new Date().toISOString().slice(0, 10), 'Date of birth cannot be in the future.')
        .refine((v) => v >= '1900-01-01', 'Enter a real date of birth.'),
    gender: z.enum(['female', 'male'], { errorMap: () => ({ message: 'Select your gender.' }) }),
    nationality: z.string().trim().min(3, 'Enter your nationality.').max(60),
    phone: z.string().trim().regex(PHONE, 'Enter a valid phone number.'),
    region: z.string().trim().min(2, 'Enter your region or city.').max(60),
    kinName: z.string().trim().min(2, 'Enter the full name.').max(100),
    kinPhone: z.string().trim().regex(PHONE, 'Enter a valid phone number.'),
})

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: MAX_FILE_BYTES, files: 1 },
})

// After a student submits, the answers are locked.
const mustBeDraft = (a: ApplicationPayload) => {
    if (a.status !== 'draft') {
        throw new HttpError(409, 'Your application was already submitted and can no longer be changed.')
    }
}

router.get('/', async (req, res) => {
    res.json({ application: await loadApplicationPayload(req.user!.id) })
})

// ---------- Stage 1: personal details ----------
router.put('/personal', async (req, res) => {
    const body = personalSchema.parse(req.body)
    const userId = req.user!.id

    const before = await loadApplicationPayload(userId)
    mustBeDraft(before)

    await prisma.$transaction([
        prisma.application.update({
            where: { id: before.id },
            data: {
                dob: new Date(`${body.dob}T00:00:00.000Z`),
                nationality: body.nationality,
                region: body.region,
                kinName: body.kinName,
                kinPhone: body.kinPhone,
            },
        }),
        prisma.user.update({ where: { id: userId }, data: { phone: body.phone, gender: body.gender } }),
    ])

    res.json({ application: await loadApplicationPayload(userId) })
})

// ---------- Stage 2: payment ----------
router.post('/payment', async (req, res) => {
    const { method } = z
        .object({ method: z.enum(PAYMENT_METHODS, { errorMap: () => ({ message: 'Choose a payment method.' }) }) })
        .parse(req.body)
    const userId = req.user!.id

    const before = await loadApplicationPayload(userId)
    mustBeDraft(before)
    if (!personalDone(before)) throw new HttpError(409, 'Complete your personal details first.')
    if (paymentDone(before)) throw new HttpError(409, 'Your payment was already received.')

    const { fee } = await getAdmission()
    if (fee <= 0) throw new HttpError(409, 'The application fee has not been set. Contact the administrator.')

    const pending = await prisma.payment.findFirst({
        where: { applicationId: before.id, status: 'pending' },
        orderBy: { createdAt: 'desc' },
    })

    // TEST_PAYMENTS=true: the payment is simulated and counts as paid at once.
    // Otherwise it stays pending until the administrator confirms it (or a payment gateway is connected).
    const status = env.testPayments ? ('paid' as const) : ('pending' as const)
    const paidAt = env.testPayments ? new Date() : null

    if (pending) {
        await prisma.payment.update({ where: { id: pending.id }, data: { method, status, paidAt } })
    } else {
        const reference = `UHWF-${before.id}-${Math.random().toString(16).slice(2, 8).toUpperCase()}`
        await prisma.payment.create({
            data: { applicationId: before.id, amount: fee, method, status, paidAt, reference },
        })
    }

    if (env.testPayments) {
        await prisma.activityLog.create({
            data: { userId, level: 'warning', message: `TEST payment recorded for application #${before.id}` },
        })
    }

    res.json({ application: await loadApplicationPayload(userId) })
})

// ---------- Stage 3: courses ----------
router.put('/courses', async (req, res) => {
    const { codes } = z
        .object({
            codes: z
                .array(z.string().trim().min(1).max(20))
                .min(1, 'Choose at least one course.')
                .max(MAX_COURSES, `You can choose up to ${MAX_COURSES} courses.`),
        })
        .parse(req.body)
    const userId = req.user!.id

    if (new Set(codes).size !== codes.length) throw new HttpError(400, 'Each course can only be chosen once.')

    const before = await loadApplicationPayload(userId)
    mustBeDraft(before)
    if (!paymentDone(before)) throw new HttpError(409, 'Pay the application fee before choosing courses.')

    const courses = await prisma.course.findMany({
        where: { code: { in: codes }, isActive: true },
        select: { id: true },
    })
    if (courses.length !== codes.length) throw new HttpError(400, 'One or more courses are not available.')

    await prisma.$transaction([
        prisma.applicationCourse.deleteMany({ where: { applicationId: before.id } }),
        prisma.applicationCourse.createMany({
            data: courses.map((c) => ({ applicationId: before.id, courseId: c.id })),
        }),
    ])

    res.json({ application: await loadApplicationPayload(userId) })
})

// ---------- Stage 4: documents ----------
router.post('/documents/:type', upload.single('file'), async (req, res) => {
    const type = z
        .enum(DOC_TYPES, { errorMap: () => ({ message: 'Unknown document type.' }) })
        .parse(req.params.type)
    const userId = req.user!.id

    const file = req.file
    if (!file) throw new HttpError(400, 'Choose a file to upload.')

    const detected = detectFileType(file.buffer)
    if (!detected) throw new HttpError(400, 'Only PDF, JPG or PNG files are accepted.')

    const before = await loadApplicationPayload(userId)
    mustBeDraft(before)
    if (!coursesDone(before)) throw new HttpError(409, 'Choose your courses before uploading documents.')

    const key = { applicationId_type: { applicationId: before.id, type } }
    const previous = await prisma.applicationDocument.findUnique({ where: key })

    const stored = await saveUpload(`applications/${before.id}`, type, file.buffer, detected.ext)
    try {
        await prisma.applicationDocument.upsert({
            where: key,
            create: { applicationId: before.id, type, fileName: cleanFileName(file.originalname), fileUrl: stored },
            update: { fileName: cleanFileName(file.originalname), fileUrl: stored, uploadedAt: new Date() },
        })
    } catch (err) {
        await removeUpload(stored) // do not leave a file nobody points to
        throw err
    }
    if (previous) await removeUpload(previous.fileUrl)

    res.json({ application: await loadApplicationPayload(userId) })
})

// ---------- Stage 5: submit ----------
router.post('/submit', async (req, res) => {
    const userId = req.user!.id
    const before = await loadApplicationPayload(userId)
    mustBeDraft(before)

    if (!personalDone(before)) throw new HttpError(409, 'Complete your personal details first.')
    if (!paymentDone(before)) throw new HttpError(409, 'Your payment has not been received yet.')
    if (!coursesDone(before)) throw new HttpError(409, 'Choose your courses first.')
    if (!documentsDone(before)) throw new HttpError(409, 'Upload all required documents first.')

    const claimed = await prisma.application.updateMany({
        where: { id: before.id, status: 'draft' },
        data: { status: 'submitted', submittedAt: new Date() },
    })
    if (claimed.count === 0) throw new HttpError(409, 'Your application was already submitted.')

    await prisma.activityLog.create({
        data: { userId, level: 'info', message: `Application #${before.id} submitted by ${req.user!.email}` },
    })

    // Tell every active administrator there is something to review
    const admins = await prisma.user.findMany({ where: { role: 'admin', status: 'active' }, select: { id: true } })
    await prisma.notification.createMany({
        data: admins.map((a) => ({
            userId: a.id,
            type: 'application_submitted',
            title: 'New application submitted',
            body: `${req.user!.fullName} submitted an application.`,
            linkUrl: '/admin/applications',
        })),
    })

    res.json({ application: await loadApplicationPayload(userId) })
})

export default router

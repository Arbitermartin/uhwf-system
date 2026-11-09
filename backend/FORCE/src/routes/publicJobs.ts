import { Router } from 'express'
import multer from 'multer'
import rateLimit from 'express-rate-limit'
import { z } from 'zod'
import { prisma } from '../prisma'
import { HttpError } from '../utils/httpError'
import { detectFileType, removeUpload, saveUpload } from '../services/files'
import { applicationSchema, dayFromDeadline } from '../services/careers'

const router = Router()

const CV_MAX_BYTES = 5 * 1024 * 1024
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: CV_MAX_BYTES, files: 1 } })

const idSchema = z.coerce
    .number({ invalid_type_error: 'Invalid id.' })
    .int('Invalid id.')
    .positive('Invalid id.')

// Open to everyone, so both the list and the form are limited.
const readLimiter = rateLimit({
    windowMs: 60 * 1000,
    limit: 120,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { message: 'Too many requests. Please slow down.' },
})

const applyLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    limit: 5,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { message: 'You have sent several applications already. Please try again in an hour, or email us directly.' },
})

// Open now = status open, and the closing date (if there is one) has not passed
const openNow = () => ({
    status: 'open' as const,
    OR: [{ deadline: null }, { deadline: { gte: new Date() } }],
})

// ---------- The open jobs ----------
router.get('/', readLimiter, async (_req, res) => {
    const rows = await prisma.jobPosition.findMany({
        where: openNow(),
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        select: { id: true, title: true, location: true, jobType: true, description: true, deadline: true, createdAt: true },
    })
    res.json({
        jobs: rows.map((j) => ({
            id: j.id,
            title: j.title,
            location: j.location,
            jobType: j.jobType,
            description: j.description,
            closesOn: j.deadline ? dayFromDeadline(j.deadline) : null,
            postedAt: j.createdAt,
        })),
    })
})

// ---------- Apply: text fields and one PDF (the CV) ----------
router.post('/:id/apply', applyLimiter, upload.single('cv'), async (req, res) => {
    const jobId = idSchema.parse(req.params.id)
    const body = applicationSchema.parse(req.body)
    const thanks = { message: 'Thank you. Your application was received. We will contact you if you are shortlisted.' }

    // A bot filled the hidden field. Pretend it worked, and store nothing.
    if (body.website && body.website.trim() !== '') {
        res.status(201).json(thanks)
        return
    }

    const file = req.file
    if (!file) throw new HttpError(400, 'Please attach your CV as a PDF.')
    // the real file contents are checked, not its name
    if (detectFileType(file.buffer)?.ext !== 'pdf') throw new HttpError(400, 'Your CV must be a PDF file.')

    const job = await prisma.jobPosition.findFirst({ where: { id: jobId, ...openNow() }, select: { id: true, title: true } })
    if (!job) throw new HttpError(404, 'This position is no longer open.')

    const duplicate = await prisma.jobApplication.findFirst({
        where: { positionId: jobId, email: body.email },
        select: { id: true },
    })
    if (duplicate) throw new HttpError(409, 'You have already applied for this position with this email address.')

    const stored = await saveUpload('careers', `job${jobId}`, file.buffer, 'pdf')
    try {
        await prisma.jobApplication.create({
            data: {
                positionId: jobId,
                fullName: body.fullName,
                email: body.email,
                phone: body.phone,
                coverNote: body.coverNote,
                cvUrl: stored,
            },
        })
    } catch (err) {
        await removeUpload(stored) // never keep a file nobody points to
        throw err
    }

    const admins = await prisma.user.findMany({ where: { role: 'admin', status: 'active' }, select: { id: true } })
    await prisma.notification.createMany({
        data: admins.map((a) => ({
            userId: a.id,
            type: 'job_application',
            title: 'New job application',
            body: `${body.fullName}: ${job.title}`,
            linkUrl: '/admin/careers',
        })),
    })

    res.status(201).json(thanks)
})

export default router

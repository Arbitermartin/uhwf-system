import { Router } from 'express'
import type { Prisma } from '@prisma/client'
import { z } from 'zod'
import { prisma } from '../prisma'
import { requireAuth, requireRole } from '../middleware/auth'
import { HttpError } from '../utils/httpError'
import { cleanFileName, resolveUpload } from '../services/files'
import {
    APPLICATION_STATUSES,
    dayFromDeadline,
    deadlineFromDay,
    isJobOpen,
    jobSchema,
} from '../services/careers'

const router = Router()

// Jobs and applications are managed by administrators only. Checked on the server.
router.use(requireAuth, requireRole('admin'))

const idSchema = z.coerce
    .number({ invalid_type_error: 'Invalid id.' })
    .int('Invalid id.')
    .positive('Invalid id.')

const listQuery = z.object({
    status: z.enum(['open', 'closed']).optional(),
    search: z.string().trim().max(100).optional(),
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(50).default(10),
})

const select = {
    id: true,
    title: true,
    location: true,
    jobType: true,
    description: true,
    status: true,
    deadline: true,
    createdAt: true,
    postedBy: { select: { fullName: true } },
    _count: { select: { applications: true } },
} satisfies Prisma.JobPositionSelect

type Row = Prisma.JobPositionGetPayload<{ select: typeof select }>

const toRow = (j: Row, newApplications: number) => ({
    id: j.id,
    title: j.title,
    location: j.location,
    jobType: j.jobType,
    status: j.status,
    deadline: j.deadline,
    closesOn: j.deadline ? dayFromDeadline(j.deadline) : '',
    // "open" in the database, but the closing date has passed: the public no longer sees it
    expired: j.status === 'open' && !isJobOpen(j.status, j.deadline),
    createdAt: j.createdAt,
    postedBy: j.postedBy.fullName,
    applications: { total: j._count.applications, received: newApplications },
})

// How many applications per job are still "received" (nobody has looked at them yet)
async function newCounts(ids: number[]) {
    const rows = await prisma.jobApplication.groupBy({
        by: ['positionId'],
        where: { positionId: { in: ids }, status: 'received' },
        _count: { _all: true },
    })
    return new Map(rows.map((r) => [r.positionId, r._count._all]))
}

// ---------- List ----------
router.get('/', async (req, res) => {
    const q = listQuery.parse(req.query)

    const where: Prisma.JobPositionWhereInput = {
        ...(q.status && { status: q.status }),
        ...(q.search && {
            OR: [
                { title: { contains: q.search, mode: 'insensitive' } },
                { location: { contains: q.search, mode: 'insensitive' } },
            ],
        }),
    }

    const [rows, total, open, all] = await Promise.all([
        prisma.jobPosition.findMany({
            where,
            orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
            skip: (q.page - 1) * q.pageSize,
            take: q.pageSize,
            select,
        }),
        prisma.jobPosition.count({ where }),
        prisma.jobPosition.count({ where: { status: 'open' } }),
        prisma.jobPosition.count(),
    ])
    const fresh = await newCounts(rows.map((r) => r.id))

    res.json({
        jobs: rows.map((r) => toRow(r, fresh.get(r.id) ?? 0)),
        total,
        page: q.page,
        pageSize: q.pageSize,
        counts: { all, open, closed: all - open },
    })
})

// ---------- Applications. These paths come before /:id on purpose. ----------
const statusSchema = z.object({ status: z.enum(APPLICATION_STATUSES) })

router.patch('/applications/:appId', async (req, res) => {
    const id = idSchema.parse(req.params.appId)
    const { status } = statusSchema.parse(req.body)

    const app = await prisma.jobApplication.findUnique({
        where: { id },
        select: { fullName: true, position: { select: { title: true } } },
    })
    if (!app) throw new HttpError(404, 'Application not found.')

    await prisma.jobApplication.update({ where: { id }, data: { status } })
    await prisma.activityLog.create({
        data: { userId: req.user!.id, level: 'info', message: `Application of ${app.fullName} for "${app.position.title.slice(0, 50)}" set to ${status}` },
    })
    res.json({ status })
})

// The CV is private: only an administrator can open it, and it is never served as a public file.
router.get('/applications/:appId/cv', async (req, res) => {
    const app = await prisma.jobApplication.findUnique({
        where: { id: idSchema.parse(req.params.appId) },
        select: { cvUrl: true, fullName: true },
    })
    if (!app) throw new HttpError(404, 'Application not found.')

    const file = resolveUpload(app.cvUrl)
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="${cleanFileName(app.fullName)}-CV.pdf"`)
    res.setHeader('Cache-Control', 'private, no-store')
    res.sendFile(file, (err) => {
        if (err && !res.headersSent) res.status(404).json({ message: 'The CV file is missing on the server.' })
    })
})

router.get('/:id/applications', async (req, res) => {
    const id = idSchema.parse(req.params.id)
    const job = await prisma.jobPosition.findUnique({ where: { id }, select: { title: true } })
    if (!job) throw new HttpError(404, 'Job not found.')

    const rows = await prisma.jobApplication.findMany({
        where: { positionId: id },
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        take: 200,
        select: { id: true, fullName: true, email: true, phone: true, coverNote: true, status: true, createdAt: true },
    })
    res.json({ job: { id, title: job.title }, applications: rows })
})

// ---------- One job ----------
router.get('/:id', async (req, res) => {
    const job = await prisma.jobPosition.findUnique({ where: { id: idSchema.parse(req.params.id) }, select })
    if (!job) throw new HttpError(404, 'Job not found.')
    res.json({ job: { ...toRow(job, 0), description: job.description } })
})

// ---------- Create ----------
router.post('/', async (req, res) => {
    const body = jobSchema.parse(req.body)
    const deadline = body.deadline ? deadlineFromDay(body.deadline) : null
    if (body.open && deadline && deadline < new Date()) {
        throw new HttpError(400, 'The closing date has already passed. Choose a later date, or save the job as closed.')
    }

    const created = await prisma.jobPosition.create({
        data: {
            postedById: req.user!.id,
            title: body.title,
            location: body.location,
            jobType: body.jobType,
            description: body.description,
            deadline,
            status: body.open ? 'open' : 'closed',
        },
        select,
    })
    await prisma.activityLog.create({
        data: { userId: req.user!.id, level: 'info', message: `Job "${created.title.slice(0, 60)}" posted (${body.open ? 'open' : 'closed'})` },
    })
    res.status(201).json({ job: { ...toRow(created, 0), description: created.description } })
})

// ---------- Edit ----------
router.patch('/:id', async (req, res) => {
    const id = idSchema.parse(req.params.id)
    const body = jobSchema.parse(req.body)
    const deadline = body.deadline ? deadlineFromDay(body.deadline) : null
    if (body.open && deadline && deadline < new Date()) {
        throw new HttpError(400, 'The closing date has already passed. Choose a later date, or save the job as closed.')
    }

    const existing = await prisma.jobPosition.findUnique({ where: { id }, select: { id: true } })
    if (!existing) throw new HttpError(404, 'Job not found.')

    const updated = await prisma.jobPosition.update({
        where: { id },
        data: {
            title: body.title,
            location: body.location,
            jobType: body.jobType,
            description: body.description,
            deadline,
            status: body.open ? 'open' : 'closed',
        },
        select,
    })
    await prisma.activityLog.create({
        data: { userId: req.user!.id, level: 'info', message: `Job #${id} updated (${body.open ? 'open' : 'closed'})` },
    })
    res.json({ job: { ...toRow(updated, 0), description: updated.description } })
})

// ---------- Close or reopen, without touching anything else ----------
router.post('/:id/status', async (req, res) => {
    const id = idSchema.parse(req.params.id)
    const { open } = z.object({ open: z.boolean() }).parse(req.body)

    const job = await prisma.jobPosition.findUnique({ where: { id }, select: { title: true, deadline: true } })
    if (!job) throw new HttpError(404, 'Job not found.')
    if (open && job.deadline && job.deadline < new Date()) {
        throw new HttpError(400, 'The closing date has passed. Edit the job and choose a later date first.')
    }

    await prisma.jobPosition.update({ where: { id }, data: { status: open ? 'open' : 'closed' } })
    await prisma.activityLog.create({
        data: { userId: req.user!.id, level: 'info', message: `Job "${job.title.slice(0, 60)}" ${open ? 'reopened' : 'closed'}` },
    })
    res.json({ open })
})

// ---------- Delete ----------
router.delete('/:id', async (req, res) => {
    const id = idSchema.parse(req.params.id)
    const job = await prisma.jobPosition.findUnique({ where: { id }, select: { title: true, _count: { select: { applications: true } } } })
    if (!job) throw new HttpError(404, 'Job not found.')

    // Deleting a job would also delete every application and CV sent for it
    if (job._count.applications > 0) {
        throw new HttpError(
            409,
            `${job._count.applications} application(s) were sent for this job, so it cannot be deleted. Close it instead: it disappears from the Career page and nothing is lost.`,
        )
    }

    await prisma.jobPosition.delete({ where: { id } })
    await prisma.activityLog.create({
        data: { userId: req.user!.id, level: 'warning', message: `Job "${job.title.slice(0, 60)}" deleted` },
    })
    res.json({ message: 'Job deleted.' })
})

export default router

import { Router } from 'express'
import type { Prisma } from '@prisma/client'
import { z } from 'zod'
import { prisma } from '../prisma'
import { requireAuth, requireRole } from '../middleware/auth'
import { HttpError } from '../utils/httpError'
import { TIME, eventDateFrom, isRealDay, splitEventDate, startOfTodayTz } from '../services/content'

const router = Router()

// The administrator manages the events. Checked on the server.
router.use(requireAuth, requireRole('admin'))

const idSchema = z.coerce
    .number({ invalid_type_error: 'Invalid id.' })
    .int('Invalid id.')
    .positive('Invalid id.')

const listQuery = z.object({
    scope: z.enum(['upcoming', 'past']).optional(),
    search: z.string().trim().max(100).optional(),
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(50).default(10),
})

const eventSchema = z.object({
    title: z.string().trim().min(3, 'Enter a title (at least 3 characters).').max(150, 'The title is too long.'),
    location: z.string().trim().min(2, 'Enter the place.').max(150, 'The place is too long.'),
    description: z
        .string()
        .trim()
        .max(3000, 'The description is too long.')
        .transform((v) => v || null),
    date: z.string().refine(isRealDay, 'Choose a real date.'),
    // empty = an all-day event
    time: z.string().refine((v) => v === '' || TIME.test(v), 'Use a time like 14:30.'),
})

const select = {
    id: true,
    title: true,
    location: true,
    description: true,
    eventDate: true,
} satisfies Prisma.EventSelect

type Row = Prisma.EventGetPayload<{ select: typeof select }>

const toRow = (e: Row) => ({
    id: e.id,
    title: e.title,
    location: e.location,
    description: e.description,
    eventDate: e.eventDate,
    ...splitEventDate(e.eventDate), // { date, time } for the edit form. time 00:00 = all day
    upcoming: e.eventDate >= startOfTodayTz(),
})

router.get('/', async (req, res) => {
    const q = listQuery.parse(req.query)
    const today = startOfTodayTz()

    const where: Prisma.EventWhereInput = {
        ...(q.scope === 'upcoming' && { eventDate: { gte: today } }),
        ...(q.scope === 'past' && { eventDate: { lt: today } }),
        ...(q.search && {
            OR: [
                { title: { contains: q.search, mode: 'insensitive' } },
                { location: { contains: q.search, mode: 'insensitive' } },
            ],
        }),
    }

    const [rows, total, upcoming, all] = await Promise.all([
        prisma.event.findMany({
            where,
            // upcoming events: the soonest first. Everything else: the newest first.
            orderBy: [{ eventDate: q.scope === 'upcoming' ? 'asc' : 'desc' }, { id: 'desc' }],
            skip: (q.page - 1) * q.pageSize,
            take: q.pageSize,
            select,
        }),
        prisma.event.count({ where }),
        prisma.event.count({ where: { eventDate: { gte: today } } }),
        prisma.event.count(),
    ])

    res.json({
        events: rows.map(toRow),
        total,
        page: q.page,
        pageSize: q.pageSize,
        counts: { all, upcoming, past: all - upcoming },
    })
})

router.post('/', async (req, res) => {
    const body = eventSchema.parse(req.body)
    const created = await prisma.event.create({
        data: {
            createdById: req.user!.id,
            title: body.title,
            location: body.location,
            description: body.description,
            eventDate: eventDateFrom(body.date, body.time),
        },
        select,
    })
    await prisma.activityLog.create({
        data: { userId: req.user!.id, level: 'info', message: `Event "${created.title.slice(0, 60)}" created for ${body.date}` },
    })
    res.status(201).json({ event: toRow(created) })
})

router.patch('/:id', async (req, res) => {
    const id = idSchema.parse(req.params.id)
    const body = eventSchema.parse(req.body)

    const existing = await prisma.event.findUnique({ where: { id }, select: { id: true } })
    if (!existing) throw new HttpError(404, 'Event not found.')

    const updated = await prisma.event.update({
        where: { id },
        data: {
            title: body.title,
            location: body.location,
            description: body.description,
            eventDate: eventDateFrom(body.date, body.time),
        },
        select,
    })
    await prisma.activityLog.create({
        data: { userId: req.user!.id, level: 'info', message: `Event #${id} updated` },
    })
    res.json({ event: toRow(updated) })
})

router.delete('/:id', async (req, res) => {
    const id = idSchema.parse(req.params.id)
    const event = await prisma.event.findUnique({ where: { id }, select: { title: true } })
    if (!event) throw new HttpError(404, 'Event not found.')

    await prisma.event.delete({ where: { id } })
    await prisma.activityLog.create({
        data: { userId: req.user!.id, level: 'warning', message: `Event "${event.title.slice(0, 60)}" deleted` },
    })
    res.json({ message: 'Event deleted.' })
})

export default router

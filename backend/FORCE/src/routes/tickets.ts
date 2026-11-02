import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../prisma'
import { requireAuth } from '../middleware/auth'
import { HttpError } from '../utils/httpError'
import { findTicketFor, notifyIct, toTicketDetail } from '../services/tickets'

const router = Router()

// "Report a problem": every signed-in role can use this.
router.use(requireAuth)

const CATEGORIES = [
    'Login or password',
    'Application or payment',
    'Courses or grades',
    'Website problem',
    'Other',
] as const

const idSchema = z.coerce
    .number({ invalid_type_error: 'Invalid report number.' })
    .int('Invalid report number.')
    .positive('Invalid report number.')

const createSchema = z.object({
    subject: z.string().trim().min(5, 'Describe the problem in a few words (at least 5 characters).').max(120),
    description: z.string().trim().min(10, 'Tell us more (at least 10 characters).').max(2000),
    priority: z.enum(['low', 'medium', 'high']).default('medium'),
    category: z.enum(CATEGORIES).default('Other'),
})

const commentSchema = z.object({
    body: z.string().trim().min(1, 'Write a message.').max(2000, 'The message is too long.'),
    // only ICT can write internal notes. For everyone else this is ignored.
    isInternal: z.boolean().optional(),
})

router.post('/', async (req, res) => {
    const body = createSchema.parse(req.body)
    const user = req.user!

    const lastHour = await prisma.supportTicket.count({
        where: { requesterId: user.id, createdAt: { gte: new Date(Date.now() - 60 * 60 * 1000) } },
    })
    if (lastHour >= 10) {
        throw new HttpError(429, 'You sent many reports in the last hour. Please wait a little before sending another.')
    }

    // The description becomes the first message of the conversation
    const ticket = await prisma.supportTicket.create({
        data: {
            requesterId: user.id,
            subject: body.subject,
            category: body.category,
            priority: body.priority,
            comments: { create: { authorId: user.id, body: body.description } },
        },
        select: { id: true },
    })

    await notifyIct('New problem reported', `${user.fullName}: ${body.subject}`, user.id)

    const created = await findTicketFor(ticket.id, user)
    res.status(201).json({ ticket: toTicketDetail(created!, user.role) })
})

// The signed-in person's own reports
router.get('/mine', async (req, res) => {
    const rows = await prisma.supportTicket.findMany({
        where: { requesterId: req.user!.id },
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        take: 50,
        select: {
            id: true,
            subject: true,
            category: true,
            priority: true,
            status: true,
            createdAt: true,
            resolvedAt: true,
            _count: { select: { comments: true } },
        },
    })
    res.json({
        tickets: rows.map(({ _count, ...t }) => ({ ...t, comments: _count.comments })),
    })
})

router.get('/:id', async (req, res) => {
    const ticket = await findTicketFor(idSchema.parse(req.params.id), req.user!)
    if (!ticket) throw new HttpError(404, 'Report not found.')
    res.json({ ticket: toTicketDetail(ticket, req.user!.role) })
})

router.post('/:id/comments', async (req, res) => {
    const id = idSchema.parse(req.params.id)
    const body = commentSchema.parse(req.body)
    const user = req.user!

    const ticket = await findTicketFor(id, user)
    if (!ticket) throw new HttpError(404, 'Report not found.')

    const isIct = user.role === 'ict'
    const internal = isIct && body.isInternal === true

    await prisma.$transaction(async (tx) => {
        await tx.ticketComment.create({
            data: { ticketId: id, authorId: user.id, body: body.body, isInternal: internal },
        })
        if (!isIct && ticket.status === 'resolved') {
            // the person answered a resolved report: it is open again
            await tx.supportTicket.update({ where: { id }, data: { status: 'open', resolvedAt: null } })
        }
        if (isIct && !ticket.assignedToId) {
            // the first ICT person to reply takes the report
            await tx.supportTicket.update({ where: { id }, data: { assignedToId: user.id } })
        }
    })

    if (isIct && !internal) {
        await prisma.notification.create({
            data: {
                userId: ticket.requesterId,
                type: 'ticket_reply',
                title: 'ICT replied to your report',
                body: ticket.subject,
                linkUrl: `/${ticket.requester.role}/support`,
            },
        })
    } else if (!isIct) {
        if (ticket.assignedToId) {
            await prisma.notification.create({
                data: {
                    userId: ticket.assignedToId,
                    type: 'ticket',
                    title: 'New reply on a report',
                    body: `${user.fullName}: ${ticket.subject}`,
                    linkUrl: '/ict/tickets',
                },
            })
        } else {
            await notifyIct('New reply on a report', `${user.fullName}: ${ticket.subject}`, user.id)
        }
    }

    const updated = await findTicketFor(id, user)
    res.status(201).json({ ticket: toTicketDetail(updated!, user.role) })
})

export default router

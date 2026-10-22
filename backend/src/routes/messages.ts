import { Router } from 'express'
import { Prisma } from '@prisma/client'
import { z } from 'zod'
import { prisma } from '../prisma'
import { requireAuth, requireRole } from '../middleware/auth'
import { HttpError } from '../utils/httpError'

const router = Router()

// The inbox of messages sent from the public Contact page. Administrators only.
router.use(requireAuth, requireRole('admin'))

const idSchema = z.coerce
    .number({ invalid_type_error: 'Invalid message id.' })
    .int('Invalid message id.')
    .positive('Invalid message id.')

const listQuery = z.object({
    status: z.enum(['unread', 'read']).optional(),
    search: z.string().trim().max(100).optional(),
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(50).default(10),
})

router.get('/', async (req, res) => {
    const q = listQuery.parse(req.query)

    const where: Prisma.ContactMessageWhereInput = {
        ...(q.status && { isRead: q.status === 'read' }),
        ...(q.search && {
            OR: [
                { name: { contains: q.search, mode: 'insensitive' } },
                { email: { contains: q.search, mode: 'insensitive' } },
                { subject: { contains: q.search, mode: 'insensitive' } },
            ],
        }),
    }

    const [rows, total, unread, all] = await Promise.all([
        prisma.contactMessage.findMany({
            where,
            // unread first, then newest first
            orderBy: [{ isRead: 'asc' }, { createdAt: 'desc' }, { id: 'desc' }],
            skip: (q.page - 1) * q.pageSize,
            take: q.pageSize,
        }),
        prisma.contactMessage.count({ where }),
        prisma.contactMessage.count({ where: { isRead: false } }),
        prisma.contactMessage.count(),
    ])

    res.json({
        messages: rows.map((m) => ({
            id: m.id,
            name: m.name,
            email: m.email,
            subject: m.subject,
            preview: m.message.length > 140 ? `${m.message.slice(0, 140)}...` : m.message,
            isRead: m.isRead,
            createdAt: m.createdAt,
        })),
        total,
        page: q.page,
        pageSize: q.pageSize,
        counts: { all, unread, read: all - unread },
    })
})

router.get('/:id', async (req, res) => {
    const message = await prisma.contactMessage.findUnique({ where: { id: idSchema.parse(req.params.id) } })
    if (!message) throw new HttpError(404, 'Message not found.')
    res.json({ message })
})

router.patch('/:id', async (req, res) => {
    const id = idSchema.parse(req.params.id)
    const { isRead } = z.object({ isRead: z.boolean() }).parse(req.body)

    const result = await prisma.contactMessage.updateMany({ where: { id }, data: { isRead } })
    if (result.count === 0) throw new HttpError(404, 'Message not found.')
    res.json({ isRead })
})

router.delete('/:id', async (req, res) => {
    const id = idSchema.parse(req.params.id)

    const message = await prisma.contactMessage.findUnique({ where: { id }, select: { subject: true } })
    if (!message) throw new HttpError(404, 'Message not found.')

    await prisma.contactMessage.delete({ where: { id } })
    await prisma.activityLog.create({
        data: { userId: req.user!.id, level: 'info', message: `Deleted contact message #${id} (${message.subject.slice(0, 60)})` },
    })
    res.json({ message: 'Message deleted.' })
})

export default router

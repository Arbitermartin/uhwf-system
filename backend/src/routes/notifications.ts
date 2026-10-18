import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../prisma'
import { requireAuth } from '../middleware/auth'

const router = Router()

// A person's own notifications. Every query below includes userId, so nobody can read or
// change someone else's notification, even by guessing an id.
router.use(requireAuth)

const idSchema = z.coerce
    .number({ invalid_type_error: 'Invalid notification id.' })
    .int('Invalid notification id.')
    .positive('Invalid notification id.')

router.get('/', async (req, res) => {
    const userId = req.user!.id
    const [notifications, unreadCount] = await Promise.all([
        prisma.notification.findMany({
            where: { userId },
            orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
            take: 15,
            select: { id: true, type: true, title: true, body: true, linkUrl: true, isRead: true, createdAt: true },
        }),
        prisma.notification.count({ where: { userId, isRead: false } }),
    ])
    res.json({ notifications, unreadCount })
})

router.post('/read-all', async (req, res) => {
    await prisma.notification.updateMany({
        where: { userId: req.user!.id, isRead: false },
        data: { isRead: true },
    })
    res.json({ message: 'All notifications marked as read.' })
})

router.post('/:id/read', async (req, res) => {
    const id = idSchema.parse(req.params.id)
    await prisma.notification.updateMany({
        where: { id, userId: req.user!.id },
        data: { isRead: true },
    })
    res.json({ message: 'Marked as read.' })
})

export default router

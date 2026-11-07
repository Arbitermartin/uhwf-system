import { Router } from 'express'
import path from 'node:path'
import rateLimit from 'express-rate-limit'
import { z } from 'zod'
import { prisma } from '../prisma'
import { HttpError } from '../utils/httpError'
import { resolveUpload } from '../services/files'
import { makeExcerpt, newsImageUrl, splitEventDate, startOfTodayTz } from '../services/content'

const router = Router()

// Open to everyone, so it is limited: a visitor (or a bot) cannot load it thousands of times a minute.
router.use(
    rateLimit({
        windowMs: 60 * 1000,
        limit: 120,
        standardHeaders: 'draft-7',
        legacyHeaders: false,
        message: { message: 'Too many requests. Please slow down.' },
    }),
)

const idSchema = z.coerce
    .number({ invalid_type_error: 'Invalid id.' })
    .int('Invalid id.')
    .positive('Invalid id.')

const pageQuery = z.object({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(30).default(9),
})

// Only articles that were published are ever visible here. A draft does not exist for the public.
const visible = () => ({ publishedAt: { lte: new Date() } })

const newsCard = (n: { id: number; title: string; content: string; imageUrl: string | null; publishedAt: Date | null }) => ({
    id: n.id,
    title: n.title,
    excerpt: makeExcerpt(n.content),
    publishedAt: n.publishedAt,
    image: newsImageUrl(n.id, n.imageUrl, 'public'),
})

const eventCard = (e: { id: number; title: string; location: string; description: string | null; eventDate: Date }) => ({
    id: e.id,
    title: e.title,
    location: e.location,
    description: e.description,
    eventDate: e.eventDate,
    ...splitEventDate(e.eventDate), // time 00:00 = all day
})

// ---------- The home page: the newest news and the next events ----------
router.get('/home', async (_req, res) => {
    const [news, events] = await Promise.all([
        prisma.newsPost.findMany({
            where: visible(),
            orderBy: [{ publishedAt: 'desc' }, { id: 'desc' }],
            take: 3,
            select: { id: true, title: true, content: true, imageUrl: true, publishedAt: true },
        }),
        prisma.event.findMany({
            where: { eventDate: { gte: startOfTodayTz() } },
            orderBy: [{ eventDate: 'asc' }, { id: 'asc' }],
            take: 3,
            select: { id: true, title: true, location: true, description: true, eventDate: true },
        }),
    ])
    res.json({ news: news.map(newsCard), events: events.map(eventCard) })
})

// ---------- News ----------
router.get('/news', async (req, res) => {
    const q = pageQuery.parse(req.query)
    const [rows, total] = await Promise.all([
        prisma.newsPost.findMany({
            where: visible(),
            orderBy: [{ publishedAt: 'desc' }, { id: 'desc' }],
            skip: (q.page - 1) * q.pageSize,
            take: q.pageSize,
            select: { id: true, title: true, content: true, imageUrl: true, publishedAt: true },
        }),
        prisma.newsPost.count({ where: visible() }),
    ])
    res.json({ news: rows.map(newsCard), total, page: q.page, pageSize: q.pageSize })
})

router.get('/news/:id', async (req, res) => {
    const post = await prisma.newsPost.findFirst({
        where: { id: idSchema.parse(req.params.id), ...visible() },
        select: { id: true, title: true, content: true, imageUrl: true, publishedAt: true },
    })
    if (!post) throw new HttpError(404, 'This article was not found.')
    res.json({ news: { ...newsCard(post), content: post.content } })
})

router.get('/news/:id/image', async (req, res) => {
    const post = await prisma.newsPost.findFirst({
        where: { id: idSchema.parse(req.params.id), ...visible() },
        select: { imageUrl: true },
    })
    if (!post?.imageUrl) throw new HttpError(404, 'Picture not found.')

    const file = resolveUpload(post.imageUrl)
    // the link carries a version (?v=), so the picture can be kept for a day without ever being stale
    res.setHeader('Cache-Control', 'public, max-age=86400')
    res.type(path.extname(file))
    res.sendFile(file, (err) => {
        if (err && !res.headersSent) res.status(404).json({ message: 'Picture not found.' })
    })
})

// ---------- Events ----------
router.get('/events', async (req, res) => {
    const q = pageQuery.extend({ scope: z.enum(['upcoming', 'past']).default('upcoming') }).parse(req.query)
    const today = startOfTodayTz()
    const where = q.scope === 'upcoming' ? { eventDate: { gte: today } } : { eventDate: { lt: today } }

    const [rows, total] = await Promise.all([
        prisma.event.findMany({
            where,
            orderBy: [{ eventDate: q.scope === 'upcoming' ? 'asc' : 'desc' }, { id: 'desc' }],
            skip: (q.page - 1) * q.pageSize,
            take: q.pageSize,
            select: { id: true, title: true, location: true, description: true, eventDate: true },
        }),
        prisma.event.count({ where }),
    ])
    res.json({ events: rows.map(eventCard), total, page: q.page, pageSize: q.pageSize })
})

export default router

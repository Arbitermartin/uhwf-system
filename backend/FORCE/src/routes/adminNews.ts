import { Router } from 'express'
import multer from 'multer'
import path from 'node:path'
import { z } from 'zod'
import type { Prisma } from '@prisma/client'
import { prisma } from '../prisma'
import { requireAuth, requireRole } from '../middleware/auth'
import { HttpError } from '../utils/httpError'
import { detectFileType, removeUpload, resolveUpload, saveUpload } from '../services/files'
import { makeExcerpt, newsImageUrl } from '../services/content'

const router = Router()

// The administrator writes the news. Checked on the server.
router.use(requireAuth, requireRole('admin'))

const IMAGE_MAX_BYTES = 5 * 1024 * 1024
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: IMAGE_MAX_BYTES, files: 1 } })

const idSchema = z.coerce
    .number({ invalid_type_error: 'Invalid id.' })
    .int('Invalid id.')
    .positive('Invalid id.')

const listQuery = z.object({
    status: z.enum(['published', 'draft']).optional(),
    search: z.string().trim().max(100).optional(),
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(50).default(10),
})

// Plain text only: paragraphs are separated by a blank line. No HTML, so nothing can run on the public site.
const newsSchema = z.object({
    title: z.string().trim().min(3, 'Enter a title (at least 3 characters).').max(150, 'The title is too long.'),
    content: z.string().trim().min(20, 'Write at least 20 characters.').max(20000, 'The article is too long.'),
    publish: z.boolean(),
})

const select = {
    id: true,
    title: true,
    content: true,
    imageUrl: true,
    publishedAt: true,
    createdAt: true,
    author: { select: { fullName: true } },
} satisfies Prisma.NewsPostSelect

type Row = Prisma.NewsPostGetPayload<{ select: typeof select }>

const toRow = (n: Row) => ({
    id: n.id,
    title: n.title,
    excerpt: makeExcerpt(n.content),
    published: n.publishedAt !== null,
    publishedAt: n.publishedAt,
    createdAt: n.createdAt,
    author: n.author.fullName,
    image: newsImageUrl(n.id, n.imageUrl, 'admin'),
})

const toFull = (n: Row) => ({ ...toRow(n), content: n.content })

// ---------- List ----------
router.get('/', async (req, res) => {
    const q = listQuery.parse(req.query)

    const where: Prisma.NewsPostWhereInput = {
        ...(q.status === 'published' && { publishedAt: { not: null } }),
        ...(q.status === 'draft' && { publishedAt: null }),
        ...(q.search && { title: { contains: q.search, mode: 'insensitive' } }),
    }

    const [rows, total, published, all] = await Promise.all([
        prisma.newsPost.findMany({
            where,
            orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
            skip: (q.page - 1) * q.pageSize,
            take: q.pageSize,
            select,
        }),
        prisma.newsPost.count({ where }),
        prisma.newsPost.count({ where: { publishedAt: { not: null } } }),
        prisma.newsPost.count(),
    ])

    res.json({
        news: rows.map(toRow),
        total,
        page: q.page,
        pageSize: q.pageSize,
        counts: { all, published, draft: all - published },
    })
})

router.get('/:id', async (req, res) => {
    const post = await prisma.newsPost.findUnique({ where: { id: idSchema.parse(req.params.id) }, select })
    if (!post) throw new HttpError(404, 'News post not found.')
    res.json({ news: toFull(post) })
})

// ---------- Create ----------
router.post('/', async (req, res) => {
    const body = newsSchema.parse(req.body)
    const created = await prisma.newsPost.create({
        data: {
            authorId: req.user!.id,
            title: body.title,
            content: body.content,
            publishedAt: body.publish ? new Date() : null,
        },
        select,
    })
    await prisma.activityLog.create({
        data: { userId: req.user!.id, level: 'info', message: `News "${created.title.slice(0, 60)}" created (${body.publish ? 'published' : 'draft'})` },
    })
    res.status(201).json({ news: toFull(created) })
})

// ---------- Edit, publish and unpublish ----------
router.patch('/:id', async (req, res) => {
    const id = idSchema.parse(req.params.id)
    const body = newsSchema.parse(req.body)

    const existing = await prisma.newsPost.findUnique({ where: { id }, select: { publishedAt: true } })
    if (!existing) throw new HttpError(404, 'News post not found.')

    // An article that is already published keeps its original date when it is edited
    const publishedAt = body.publish ? (existing.publishedAt ?? new Date()) : null

    const updated = await prisma.newsPost.update({
        where: { id },
        data: { title: body.title, content: body.content, publishedAt },
        select,
    })
    await prisma.activityLog.create({
        data: { userId: req.user!.id, level: 'info', message: `News #${id} updated (${body.publish ? 'published' : 'draft'})` },
    })
    res.json({ news: toFull(updated) })
})

// ---------- Delete ----------
router.delete('/:id', async (req, res) => {
    const id = idSchema.parse(req.params.id)
    const post = await prisma.newsPost.findUnique({ where: { id }, select: { title: true, imageUrl: true } })
    if (!post) throw new HttpError(404, 'News post not found.')

    await prisma.newsPost.delete({ where: { id } })
    if (post.imageUrl) await removeUpload(post.imageUrl)
    await prisma.activityLog.create({
        data: { userId: req.user!.id, level: 'warning', message: `News "${post.title.slice(0, 60)}" deleted` },
    })
    res.json({ message: 'News post deleted.' })
})

// ---------- Picture ----------
router.post('/:id/image', upload.single('file'), async (req, res) => {
    const id = idSchema.parse(req.params.id)
    const file = req.file
    if (!file) throw new HttpError(400, 'Choose a picture to upload.')

    // the real file contents are checked, not its name. Only JPG and PNG: never PDF or SVG.
    const detected = detectFileType(file.buffer)
    if (!detected || detected.ext === 'pdf') throw new HttpError(400, 'Use a JPG or PNG picture.')

    const post = await prisma.newsPost.findUnique({ where: { id }, select: { imageUrl: true } })
    if (!post) throw new HttpError(404, 'News post not found.')

    const stored = await saveUpload('news', 'news', file.buffer, detected.ext)
    try {
        await prisma.newsPost.update({ where: { id }, data: { imageUrl: stored } })
    } catch (err) {
        await removeUpload(stored)
        throw err
    }
    if (post.imageUrl) await removeUpload(post.imageUrl)

    const updated = await prisma.newsPost.findUniqueOrThrow({ where: { id }, select })
    res.json({ news: toFull(updated) })
})

router.delete('/:id/image', async (req, res) => {
    const id = idSchema.parse(req.params.id)
    const post = await prisma.newsPost.findUnique({ where: { id }, select: { imageUrl: true } })
    if (!post) throw new HttpError(404, 'News post not found.')

    await prisma.newsPost.update({ where: { id }, data: { imageUrl: null } })
    if (post.imageUrl) await removeUpload(post.imageUrl)

    const updated = await prisma.newsPost.findUniqueOrThrow({ where: { id }, select })
    res.json({ news: toFull(updated) })
})

// The picture of any article (also a draft), for the admin preview
router.get('/:id/image', async (req, res) => {
    const post = await prisma.newsPost.findUnique({ where: { id: idSchema.parse(req.params.id) }, select: { imageUrl: true } })
    if (!post?.imageUrl) throw new HttpError(404, 'Picture not found.')

    const file = resolveUpload(post.imageUrl)
    res.setHeader('Cache-Control', 'private, max-age=3600')
    res.type(path.extname(file))
    res.sendFile(file, (err) => {
        if (err && !res.headersSent) res.status(404).json({ message: 'Picture not found.' })
    })
})

export default router

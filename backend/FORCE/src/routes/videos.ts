import { Router } from 'express'
import { z } from 'zod'
import type { Prisma } from '@prisma/client'
import { prisma } from '../prisma'
import { requireAuth } from '../middleware/auth'
import { HttpError } from '../utils/httpError'

const CATEGORIES = ['Conservation', 'Community', 'Research', 'Events'] as const
const YT_ID = /^[A-Za-z0-9_-]{11}$/
const TZ = 'Africa/Dar_es_Salaam'

// Accepts a full link (watch, youtu.be, embed, shorts) or the 11-character id itself.
const extractYoutubeId = (input: string): string | null => {
    const v = input.trim()
    if (YT_ID.test(v)) return v
    let url: URL
    try {
        url = new URL(/^https?:\/\//i.test(v) ? v : `https://${v}`)
    } catch {
        return null
    }
    const host = url.hostname.replace(/^(www|m)\./, '')
    let id: string | null = null
    if (host === 'youtu.be') {
        id = url.pathname.split('/')[1] ?? null
    } else if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
        if (url.pathname === '/watch') id = url.searchParams.get('v')
        else id = url.pathname.match(/^\/(?:embed|shorts|live|v)\/([^/?]+)/)?.[1] ?? null
    }
    return id && YT_ID.test(id) ? id : null
}

const schema = z.object({
    link: z.string().trim().min(1, 'Paste the YouTube link.').max(300, 'The link is too long.'),
    title: z.string().trim().min(3, 'Enter a title (at least 3 characters).').max(150, 'The title is too long.'),
    description: z.string().trim().max(1000, 'The description is too long.').optional().default(''),
    category: z.enum(CATEGORIES, { errorMap: () => ({ message: 'Choose a category.' }) }),
    duration: z
        .string()
        .trim()
        .regex(/^((\d{1,2}:)?[0-5]?\d:[0-5]\d)?$/, 'Use the format 5:42 or 1:05:30.')
        .optional()
        .default(''),
    date: z
        .string()
        .trim()
        .regex(/^(\d{4}-\d{2}-\d{2})?$/, 'Choose a valid date.')
        .optional()
        .default(''),
    featured: z.boolean().optional().default(false),
})

type Row = Prisma.VideoGetPayload<{ include: { uploadedBy: { select: { fullName: true } } } }>
const withUser = { uploadedBy: { select: { fullName: true } } } as const

const dateOf = (d: Date) => d.toLocaleDateString('en-CA', { timeZone: TZ }) // yyyy-mm-dd

const adminRow = (v: Row) => ({
    id: v.id,
    title: v.title,
    description: v.description ?? '',
    category: v.category,
    youtubeId: v.youtubeId ?? '',
    duration: v.duration ?? '',
    featured: v.featured,
    date: dateOf(v.publishedAt),
    uploadedBy: v.uploadedBy.fullName,
})

const idOf = (value: string) => {
    const id = Number(value)
    if (!Number.isInteger(id) || id < 1) throw new HttpError(404, 'Video not found.')
    return id
}

const fail = (res: import('express').Response, errors: Record<string, string>) =>
    res.status(400).json({ message: 'Please correct the highlighted fields.', errors })

const parse = (body: unknown) => {
    const r = schema.safeParse(body)
    if (!r.success) {
        const errors: Record<string, string> = {}
        for (const i of r.error.issues) {
            const key = String(i.path[0] ?? 'form')
            if (!errors[key]) errors[key] = i.message
        }
        return { errors }
    }
    const youtubeId = extractYoutubeId(r.data.link)
    if (!youtubeId) return { errors: { link: 'This is not a valid YouTube link.' } }
    let publishedAt: Date | undefined
    if (r.data.date) {
        publishedAt = new Date(`${r.data.date}T12:00:00+03:00`) // Tanzania time
        if (Number.isNaN(publishedAt.getTime())) return { errors: { date: 'Choose a valid date.' } }
    }
    return { data: { ...r.data, youtubeId, publishedAt } }
}

/* ============================ Admin ============================ */

export const adminVideosRouter = Router()

adminVideosRouter.use(requireAuth, (req, res, next) => {
    if (req.user!.role !== 'admin') return res.status(403).json({ message: 'You do not have access to this page.' })
    next()
})

adminVideosRouter.get('/', async (req, res) => {
    const page = Math.max(1, parseInt(String(req.query.page ?? '1'), 10) || 1)
    const pageSize = 10
    const search = String(req.query.search ?? '').trim()
    const where: Prisma.VideoWhereInput = search ? { title: { contains: search, mode: 'insensitive' } } : {}

    const [rows, total] = await Promise.all([
        prisma.video.findMany({
            where,
            include: withUser,
            orderBy: { publishedAt: 'desc' },
            skip: (page - 1) * pageSize,
            take: pageSize,
        }),
        prisma.video.count({ where }),
    ])
    res.json({ videos: rows.map(adminRow), total, page, pageSize })
})

adminVideosRouter.post('/', async (req, res) => {
    const p = parse(req.body)
    if (!p.data) return fail(res, p.errors!)
    const d = p.data

    if (await prisma.video.findFirst({ where: { youtubeId: d.youtubeId }, select: { id: true } })) {
        return fail(res, { link: 'This video is already in the gallery.' })
    }

    const row = await prisma.$transaction(async (tx) => {
        if (d.featured) await tx.video.updateMany({ where: { featured: true }, data: { featured: false } })
        return tx.video.create({
            data: {
                uploadedById: req.user!.id,
                title: d.title,
                description: d.description || null,
                category: d.category,
                youtubeId: d.youtubeId,
                duration: d.duration || null,
                featured: d.featured,
                ...(d.publishedAt ? { publishedAt: d.publishedAt } : {}),
            },
            include: withUser,
        })
    })
    res.status(201).json({ video: adminRow(row) })
})

adminVideosRouter.patch('/:id', async (req, res) => {
    const id = idOf(req.params.id)
    const p = parse(req.body)
    if (!p.data) return fail(res, p.errors!)
    const d = p.data

    if (!(await prisma.video.findUnique({ where: { id }, select: { id: true } }))) {
        throw new HttpError(404, 'Video not found.')
    }
    if (await prisma.video.findFirst({ where: { youtubeId: d.youtubeId, NOT: { id } }, select: { id: true } })) {
        return fail(res, { link: 'This video is already in the gallery.' })
    }

    const row = await prisma.$transaction(async (tx) => {
        if (d.featured) await tx.video.updateMany({ where: { featured: true, NOT: { id } }, data: { featured: false } })
        return tx.video.update({
            where: { id },
            data: {
                title: d.title,
                description: d.description || null,
                category: d.category,
                youtubeId: d.youtubeId,
                duration: d.duration || null,
                featured: d.featured,
                ...(d.publishedAt ? { publishedAt: d.publishedAt } : {}),
            },
            include: withUser,
        })
    })
    res.json({ video: adminRow(row) })
})

adminVideosRouter.delete('/:id', async (req, res) => {
    const id = idOf(req.params.id)
    const found = await prisma.video.findUnique({ where: { id }, select: { id: true } })
    if (!found) throw new HttpError(404, 'Video not found.')
    await prisma.video.delete({ where: { id } })
    res.status(204).end()
})

/* ============================ Public (no login) ============================ */

export const publicVideosRouter = Router()

publicVideosRouter.get('/', async (_req, res) => {
    const rows = await prisma.video.findMany({
        where: { youtubeId: { not: null } },
        orderBy: { publishedAt: 'desc' },
        take: 200,
    })
    res.json({
        videos: rows.map((v) => ({
            id: v.id,
            title: v.title,
            description: v.description ?? '',
            category: v.category,
            date: dateOf(v.publishedAt),
            duration: v.duration ?? '',
            youtubeId: v.youtubeId as string,
            featured: v.featured,
        })),
    })
})
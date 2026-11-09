import { Router } from 'express'
import { z } from 'zod'
import rateLimit from 'express-rate-limit'
import { prisma } from '../prisma'

const router = Router()

const CATEGORIES = ['climate', 'waste', 'trees', 'land', 'wildlife', 'community', 'technology', 'other'] as const
const STAGES = ['idea', 'prototype', 'running'] as const
const PHONE = /^[+\d\s-]{9,16}$/

// 5 ideas per hour from one address is plenty for a real person and slows down spam.
const limiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 5,
    message: { message: 'You have sent several ideas already. Please try again later.' },
})

const schema = z.object({
    fullName: z.string().trim().min(2, 'Enter your full name.').max(100, 'The name is too long.'),
    email: z.string().trim().toLowerCase().email('Enter a valid email address.').max(150),
    phone: z.string().trim().regex(PHONE, 'Enter a valid phone number.').or(z.literal('')).optional().default(''),
    region: z.string().trim().min(2, 'Choose your region.').max(60),
    category: z.enum(CATEGORIES, { errorMap: () => ({ message: 'Choose a category.' }) }),
    title: z.string().trim().min(5, 'Give your idea a title (at least 5 characters).').max(120, 'The title is too long.'),
    description: z.string().trim().min(50, 'Describe your idea in at least 50 characters.').max(2000, 'The description is too long.'),
    stage: z.enum(STAGES, { errorMap: () => ({ message: 'Choose the stage.' }) }),
    beneficiaries: z.string().trim().max(300).optional().default(''),
    link: z
        .string()
        .trim()
        .max(300)
        .refine((v) => v === '' || /^https?:\/\/\S+$/i.test(v), 'The link must start with http:// or https://')
        .optional()
        .default(''),
    consent: z.literal(true, { errorMap: () => ({ message: 'Please agree so we can contact you.' }) }),
    website: z.string().optional().default(''), // hidden trap field: real people leave it empty
})

router.post('/', limiter, async (req, res) => {
    const parsed = schema.safeParse(req.body)
    if (!parsed.success) {
        const errors: Record<string, string> = {}
        for (const issue of parsed.error.issues) {
            const key = String(issue.path[0] ?? 'form')
            if (!errors[key]) errors[key] = issue.message
        }
        return res.status(400).json({ message: 'Please correct the highlighted fields.', errors })
    }

    const d = parsed.data

    // A bot filled the hidden field. Pretend it worked, save nothing.
    if (d.website) return res.status(201).json({ id: 0, message: 'Thank you. Your idea was received.' })

    const idea = await prisma.innovationIdea.create({
        data: {
            fullName: d.fullName,
            email: d.email,
            phone: d.phone || null,
            region: d.region,
            category: d.category,
            title: d.title,
            description: d.description,
            stage: d.stage,
            beneficiaries: d.beneficiaries || null,
            link: d.link || null,
        },
        select: { id: true },
    })

    res.status(201).json({ id: idea.id, message: 'Thank you. Your idea was received.' })
})

export default router
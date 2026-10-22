import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { z } from 'zod'
import { prisma } from '../prisma'

const router = Router()

// Public: anyone can send a message, so this route is protected against floods.
const limiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    limit: 5,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { message: 'You have sent several messages already. Please try again in an hour, or email us directly.' },
})

const PHONE = /^[+\d\s-]{9,16}$/

export const contactSchema = z.object({
    name: z.string().trim().min(2, 'Enter your name.').max(100, 'The name is too long.'),
    email: z.string().trim().toLowerCase().email('Enter a valid email address.').max(254, 'The email is too long.'),
    phone: z
        .string()
        .trim()
        .regex(PHONE, 'Enter a valid phone number.')
        .or(z.literal(''))
        .transform((v) => v || null),
    subject: z.string().trim().min(3, 'Add a subject.').max(150, 'The subject is too long.'),
    message: z.string().trim().min(10, 'Write at least 10 characters.').max(3000, 'The message is too long.'),
    // A hidden field that real visitors never see or fill in. Bots fill in every field.
    website: z.string().max(200).optional(),
})

router.post('/', limiter, async (req, res) => {
    const body = contactSchema.parse(req.body)
    const thanks = { message: 'Thank you. Your message was sent, and we will reply as soon as possible.' }

    // A bot filled the hidden field. Pretend it worked, and store nothing.
    if (body.website && body.website.trim() !== '') {
        res.status(201).json(thanks)
        return
    }

    await prisma.contactMessage.create({
        data: {
            name: body.name,
            email: body.email,
            phone: body.phone,
            subject: body.subject,
            message: body.message,
        },
    })

    // Tell every active administrator (the bell in the top bar)
    const admins = await prisma.user.findMany({ where: { role: 'admin', status: 'active' }, select: { id: true } })
    await prisma.notification.createMany({
        data: admins.map((a) => ({
            userId: a.id,
            type: 'contact_message',
            title: 'New contact message',
            body: `${body.name}: ${body.subject}`,
            linkUrl: '/admin/messages',
        })),
    })

    res.status(201).json(thanks)
})

export default router

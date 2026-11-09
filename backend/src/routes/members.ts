import { Router } from 'express'
import bcrypt from 'bcryptjs'
import rateLimit from 'express-rate-limit'
import { Prisma } from '@prisma/client'
import { prisma } from '../prisma'
import { requireAuth, requireRole } from '../middleware/auth'
import { HttpError } from '../utils/httpError'
import { isMailConfigured, sendMail } from '../services/mailer'
import { isMaintenanceOn } from '../services/system'
import {
    daysLeft,
    memberNumberFrom,
    memberSchema,
    memberWelcomeEmail,
    membershipEnd,
    membershipStatus,
    nextMemberSeq,
} from '../services/members'

const router = Router()

const BCRYPT_ROUNDS = 12

// Open to everyone, so it is limited: nobody can create hundreds of accounts from one place.
const registerLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    limit: 5,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { message: 'Too many sign-ups from this connection. Please try again in an hour.' },
})

// ---------- Register as a member (public) ----------
router.post('/register', registerLimiter, async (req, res) => {
    const body = memberSchema.parse(req.body)

    if (await isMaintenanceOn()) {
        res.status(503).json({ message: 'The system is under maintenance. Please try again later.' })
        return
    }

    // A bot filled the hidden field. Pretend it worked, and create nothing.
    if (body.website && body.website.trim() !== '') {
        res.status(201).json({ message: 'Your membership is registered.', memberNumber: null, welcomeEmail: false })
        return
    }

    const existing = await prisma.user.findUnique({ where: { email: body.email }, select: { id: true } })
    if (existing) {
        throw new HttpError(409, 'An account with this email already exists. Try signing in, or use "Forgot password?".')
    }

    const passwordHash = await bcrypt.hash(body.password, BCRYPT_ROUNDS)
    const joinedAt = new Date()
    const validUntil = membershipEnd(joinedAt)

    let memberNumber: string
    try {
        // The number and the account are made together or not at all
        memberNumber = await prisma.$transaction(async (tx) => {
            const number = memberNumberFrom(await nextMemberSeq(tx))
            await tx.user.create({
                data: {
                    fullName: body.fullName,
                    email: body.email,
                    phone: body.phone,
                    gender: body.gender,
                    passwordHash,
                    role: 'member',
                    status: 'active',
                    memberProfile: {
                        create: {
                            memberNumber: number,
                            region: body.region,
                            interests: body.interests,
                            newsletter: body.newsletter,
                            joinedAt,
                            validUntil,
                        },
                    },
                },
            })
            return number
        })
    } catch (err) {
        // two people used the same email at the same moment
        if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
            throw new HttpError(409, 'An account with this email already exists. Try signing in, or use "Forgot password?".')
        }
        throw err
    }

    // tell the administrators (the bell in the top bar)
    const admins = await prisma.user.findMany({ where: { role: 'admin', status: 'active' }, select: { id: true } })
    await prisma.notification.createMany({
        data: admins.map((a) => ({
            userId: a.id,
            type: 'member_registered',
            title: 'New member registered',
            body: `${body.fullName} (${memberNumber})`,
            linkUrl: '/admin/users',
        })),
    })
    await prisma.activityLog.create({
        data: { level: 'info', message: `New member registered: ${body.email} (${memberNumber})` },
    })

    // The welcome email goes out in the background. If it fails, the sign-up still worked.
    const welcomeEmail = isMailConfigured()
    if (welcomeEmail) {
        void sendMail({ to: body.email, ...memberWelcomeEmail(body.fullName, memberNumber, validUntil) }).catch(async (err: unknown) => {
            const reason = err instanceof Error ? err.message.slice(0, 200) : 'unknown error'
            await prisma.activityLog
                .create({ data: { level: 'error', message: `Welcome email could not be sent to ${body.email}: ${reason}` } })
                .catch(() => undefined)
        })
    }

    res.status(201).json({ message: 'Your membership is registered.', memberNumber, welcomeEmail })
})

// ---------- The signed-in member's own membership ----------
router.get('/me', requireAuth, requireRole('member'), async (req, res) => {
    const profile = await prisma.memberProfile.findUnique({
        where: { userId: req.user!.id },
        select: {
            memberNumber: true,
            region: true,
            interests: true,
            newsletter: true,
            joinedAt: true,
            validUntil: true,
        },
    })
    if (!profile) throw new HttpError(403, 'Your account has no membership record. Ask the administrator.')

    res.json({
        member: {
            name: req.user!.fullName,
            memberNumber: profile.memberNumber,
            region: profile.region,
            interests: profile.interests,
            newsletter: profile.newsletter,
            joinedAt: profile.joinedAt,
            validUntil: profile.validUntil,
            status: membershipStatus(profile.validUntil),
            daysLeft: daysLeft(profile.validUntil),
        },
    })
})

export default router

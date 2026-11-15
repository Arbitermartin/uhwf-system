
import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { randomBytes } from 'node:crypto'
import { Prisma } from '@prisma/client'
import { z } from 'zod'
import { prisma } from '../prisma'
import { env } from '../config'
import { requireAuth, requireRole } from '../middleware/auth'
import { HttpError } from '../utils/httpError'
import { isMailConfigured, sendMail } from '../services/mailer'
import { RESET_VALID_MINUTES, generateToken, hashToken, resetLink } from '../services/passwordReset'
import { INVITE_ROLES, inviteRoleLabel, inviteSchema, invitationEmail } from '../services/invitations'
import type { InviteRole } from '../services/invitations'

const router = Router()

// Only administrators invite staff, checked on the server.
router.use(requireAuth, requireRole('admin'))

const idSchema = z.coerce
    .number({ invalid_type_error: 'Invalid user id.' })
    .int('Invalid user id.')
    .positive('Invalid user id.')

const isInviteRole = (role: string): role is InviteRole => (INVITE_ROLES as readonly string[]).includes(role)

// The same shape the Users page already knows, so the screen can show the new account straight away.
async function getUserDetail(id: number) {
    const u = await prisma.user.findUnique({
        where: { id },
        select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            role: true,
            status: true,
            createdAt: true,
            lastLoginAt: true,
            gender: true,
            photoUrl: true,
            studentProfile: { select: { regNumber: true, programme: true, yearOfStudy: true, admittedAt: true } },
            lecturerProfile: {
                select: {
                    staffId: true,
                    qualification: true,
                    department: { select: { id: true, name: true } },
                    _count: { select: { courses: true } },
                },
            },
            employeeProfile: {
                select: {
                    staffId: true,
                    position: true,
                    department: { select: { id: true, name: true } },
                    supervisor: { select: { fullName: true } },
                },
            },
            application: { select: { status: true, intake: true, submittedAt: true } },
        },
    })
    if (!u) return null

    const { studentProfile, lecturerProfile, employeeProfile, application, ...rest } = u
    return {
        ...rest,
        student: studentProfile,
        lecturer: lecturerProfile
            ? {
                staffId: lecturerProfile.staffId,
                qualification: lecturerProfile.qualification,
                department: lecturerProfile.department,
                courses: lecturerProfile._count.courses,
            }
            : null,
        employee: employeeProfile
            ? {
                staffId: employeeProfile.staffId,
                position: employeeProfile.position,
                department: employeeProfile.department,
                supervisor: employeeProfile.supervisor?.fullName ?? null,
            }
            : null,
        application,
    }
}

type Delivery = { sent: boolean; message: string }

// Sends the invitation email and says honestly what happened, so the administrator knows
// whether the person has really been told.
async function deliverInvitation(userId: number, token: string): Promise<Delivery> {
    const u = await prisma.user.findUniqueOrThrow({
        where: { id: userId },
        select: {
            fullName: true,
            email: true,
            role: true,
            lecturerProfile: { select: { department: { select: { name: true } } } },
            employeeProfile: { select: { position: true, department: { select: { name: true } } } },
        },
    })
    const link = resetLink(token)

    if (!isMailConfigured()) {
        if (env.NODE_ENV !== 'production') {
            // While developing without email, the link is printed here so you can still test the flow
            console.log(`[development] Activation link for ${u.email}: ${link}`)
        }
        return {
            sent: false,
            message:
                'Email is not set up on the server, so no invitation was sent. Ask ICT to add the email settings, then use "Resend invitation".',
        }
    }

    try {
        await sendMail({
            to: u.email,
            ...invitationEmail({
                name: u.fullName,
                email: u.email,
                role: isInviteRole(u.role) ? inviteRoleLabel[u.role] : u.role,
                department: u.lecturerProfile?.department.name ?? u.employeeProfile?.department.name ?? null,
                position: u.employeeProfile?.position ?? null,
                link,
            }),
        })
        return { sent: true, message: `An invitation was sent to ${u.email}. The link works for ${RESET_VALID_MINUTES} minutes.` }
    } catch (err) {
        const reason = err instanceof Error ? err.message.slice(0, 200) : 'unknown error'
        await prisma.activityLog
            .create({ data: { level: 'error', message: `Invitation email could not be sent to ${u.email}: ${reason}` } })
            .catch(() => undefined)
        return {
            sent: false,
            message: `The invitation could not be emailed (${reason}). Fix the email settings, then use "Resend invitation".`,
        }
    }
}

// A new activation link replaces any older one
async function issueToken(userId: number) {
    const token = generateToken()
    await prisma.$transaction([
        prisma.passwordReset.deleteMany({ where: { userId } }),
        prisma.passwordReset.create({
            data: { userId, tokenHash: hashToken(token), expiresAt: new Date(Date.now() + RESET_VALID_MINUTES * 60_000) },
        }),
    ])
    return token
}

// ---------- Create an account and send the invitation ----------
router.post('/', async (req, res) => {
    const body = inviteSchema.parse(req.body)

    // Nobody knows this password, not even the administrator. It only fills the required column.
    // The person chooses their own password when they open the link.
    const passwordHash = await bcrypt.hash(randomBytes(32).toString('hex'), 12)
    const token = generateToken()

    let userId: number
    try {
        userId = await prisma.$transaction(async (tx) => {
            const created = await tx.user.create({
                data: {
                    fullName: body.fullName,
                    email: body.email,
                    phone: body.phone,
                    gender: body.gender,
                    passwordHash,
                    role: body.role,
                    status: 'pending', // cannot sign in until the invitation is accepted
                    ...(body.role === 'lecturer' && {
                        lecturerProfile: {
                            create: {
                                staffId: body.staffId,
                                qualification: body.qualification || null,
                                department: { connect: { id: body.departmentId } },
                            },
                        },
                    }),
                    ...(body.role === 'employee' && {
                        employeeProfile: {
                            create: {
                                staffId: body.staffId,
                                position: body.position,
                                department: { connect: { id: body.departmentId } },
                            },
                        },
                    }),
                },
                select: { id: true },
            })
            await tx.passwordReset.create({
                data: {
                    userId: created.id,
                    tokenHash: hashToken(token),
                    expiresAt: new Date(Date.now() + RESET_VALID_MINUTES * 60_000),
                },
            })
            return created.id
        })
    } catch (err) {
        if (err instanceof Prisma.PrismaClientKnownRequestError) {
            if (err.code === 'P2002') throw new HttpError(409, 'That email or staff ID is already used by another user.')
            if (err.code === 'P2025') throw new HttpError(400, 'The selected department does not exist.')
        }
        throw err
    }

    await prisma.activityLog.create({
        data: {
            userId: req.user!.id,
            level: body.role === 'admin' ? 'warning' : 'info',
            message: `Invited ${body.role} ${body.email} (account #${userId}, pending activation)`,
        },
    })

    const invitation = await deliverInvitation(userId, token)
    res.status(201).json({ user: await getUserDetail(userId), invitation })
})

// ---------- Send a new invitation (the old one expired, or the email never arrived) ----------
router.post('/:id/resend', async (req, res) => {
    const id = idSchema.parse(req.params.id)

    const user = await prisma.user.findUnique({ where: { id }, select: { id: true, email: true, status: true, role: true } })
    if (!user) throw new HttpError(404, 'User not found.')
    if (user.status !== 'pending') {
        throw new HttpError(409, 'This account is already active. If the person forgot the password, use "Reset password" instead.')
    }
    if (!isInviteRole(user.role)) throw new HttpError(409, 'Only staff accounts are invited.')

    const token = await issueToken(id)
    const invitation = await deliverInvitation(id, token)

    await prisma.activityLog.create({
        data: { userId: req.user!.id, level: 'info', message: `Invitation sent again to ${user.email}` },
    })
    res.json({ invitation })
})

export default router

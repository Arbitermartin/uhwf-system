// import { Router } from 'express'
// import bcrypt from 'bcryptjs'
// import rateLimit from 'express-rate-limit'
// import { Prisma } from '@prisma/client'
// import { z } from 'zod'
// import { prisma } from '../prisma'
// import { requireAuthAllowTemp } from '../middleware/auth'
// import { newPasswordSchema } from '../services/password'
// import { toPublicUser } from '../services/publicUser'
// import { getAdmission } from '../services/admission'
// import { isMaintenanceOn } from '../services/system'
// import { COOKIE_NAME, cookieMaxAgeMs, cookieOptions, signToken } from '../services/token'

// const router = Router()

// const BCRYPT_ROUNDS = 12
// // Compared against when the email does not exist, so a wrong email and a wrong
// // password take about the same time and cannot be told apart.
// const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', BCRYPT_ROUNDS)

// const limiter = rateLimit({
//   windowMs: 15 * 60 * 1000,
//   limit: 20,
//   standardHeaders: 'draft-7',
//   legacyHeaders: false,
//   message: { message: 'Too many attempts. Please try again in a few minutes.' },
// })

// const registerSchema = z.object({
//   fullName: z.string().trim().min(2, 'Enter your full name.').max(100, 'Name is too long.'),
//   email: z
//     .string()
//     .trim()
//     .toLowerCase()
//     .email('Enter a valid email address.')
//     .max(254, 'Email is too long.'),
//   phone: z.string().trim().regex(/^[+\d\s-]{9,16}$/, 'Enter a valid phone number.'),
//   // bcrypt only reads the first 72 bytes, so longer passwords are refused
//   password: z
//     .string()
//     .min(8, 'Use at least 8 characters.')
//     .max(72, 'Password is too long (72 characters at most).'),
// })

// const loginSchema = z.object({
//   identifier: z.string().trim().min(1, 'Enter your email.').max(254),
//   password: z.string().min(1, 'Enter your password.').max(200),
// })

// // Stricter than the login limiter: guessing the current password is the attack here.
// const passwordLimiter = rateLimit({
//   windowMs: 15 * 60 * 1000,
//   limit: 10,
//   standardHeaders: 'draft-7',
//   legacyHeaders: false,
//   message: { message: 'Too many attempts. Please try again in a few minutes.' },
// })

// const changePasswordSchema = z.object({
//   currentPassword: z.string().min(1, 'Enter your current password.').max(200),
//   newPassword: newPasswordSchema,
// })

// // Students only. The role is set here on the server and is never read from the request.
// router.post('/register-student', limiter, async (req, res) => {
//   const body = registerSchema.parse(req.body)

//   if (await isMaintenanceOn()) {
//     res.status(503).json({ message: 'The system is under maintenance. Please try again later.' })
//     return
//   }

//   const admission = await getAdmission()
//   if (admission.status !== 'open') {
//     res.status(403).json({
//       message:
//         admission.status === 'upcoming'
//           ? 'Registration has not opened yet.'
//           : 'Registration is closed.',
//     })
//     return
//   }

//   const passwordHash = await bcrypt.hash(body.password, BCRYPT_ROUNDS)

//   try {
//     await prisma.user.create({
//       data: {
//         fullName: body.fullName,
//         email: body.email,
//         phone: body.phone,
//         passwordHash,
//         role: 'student',
//         status: 'active',
//         application: { create: { intake: admission.intake } },
//       },
//     })
//   } catch (err) {
//     if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
//       res.status(409).json({ message: 'An account with this email already exists.' })
//       return
//     }
//     throw err
//   }

//   res.status(201).json({ message: 'Account created. You can now log in.' })
// })

// router.post('/login', limiter, async (req, res) => {
//   const body = loginSchema.parse(req.body)

//   const user = await prisma.user.findUnique({
//     where: { email: body.identifier.toLowerCase() },
//   })
//   const passwordOk = await bcrypt.compare(body.password, user?.passwordHash ?? DUMMY_HASH)

//   if (!user || !passwordOk) {
//     // Written to the system log, so ICT can see attacks. Only text that looks like an email is
//     // kept, because people sometimes type their password in the email box by mistake.
//     const looksLikeEmail = body.identifier.length <= 100 && /^\S+@\S+\.\S+$/.test(body.identifier)
//     await prisma.activityLog.create({
//       data: {
//         userId: user?.id ?? null,
//         level: 'warning',
//         message: `Failed login for ${looksLikeEmail ? body.identifier.toLowerCase() : 'an invalid email'}`,
//       },
//     })
//     res.status(401).json({ message: 'Invalid email or password.' })
//     return
//   }
//   if (user.status !== 'active') {
//     res.status(403).json({ message: 'Your account is not active. Contact the administrator.' })
//     return
//   }

//   // While ICT has maintenance mode on, only administrators and ICT can sign in
//   if (user.role !== 'admin' && user.role !== 'ict' && (await isMaintenanceOn())) {
//     res.status(503).json({ message: 'The system is under maintenance. Please try again later.' })
//     return
//   }

//   await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } })

//   res.cookie(COOKIE_NAME, signToken(user.id, user.tokenVersion), { ...cookieOptions, maxAge: cookieMaxAgeMs })
//   res.json({ user: toPublicUser(user) })
// })

// router.post('/logout', (_req, res) => {
//   res.clearCookie(COOKIE_NAME, cookieOptions)
//   res.json({ message: 'Signed out.' })
// })

// router.get('/me', requireAuthAllowTemp, async (req, res) => {
//   const user = await prisma.user.findUniqueOrThrow({ where: { id: req.user!.id } })
//   res.json({ user: toPublicUser(user) })
// })

// // Works for everyone who is signed in, including someone who must replace a temporary password.
// router.post('/change-password', passwordLimiter, requireAuthAllowTemp, async (req, res) => {
//   const body = changePasswordSchema.parse(req.body)

//   const user = await prisma.user.findUniqueOrThrow({ where: { id: req.user!.id } })

//   const currentOk = await bcrypt.compare(body.currentPassword, user.passwordHash)
//   if (!currentOk) {
//     const message = 'Your current password is not correct.'
//     res.status(400).json({ message, errors: { currentPassword: message } })
//     return
//   }
//   if (body.newPassword === body.currentPassword) {
//     const message = 'Choose a password that is different from the current one.'
//     res.status(400).json({ message, errors: { newPassword: message } })
//     return
//   }

//   const passwordHash = await bcrypt.hash(body.newPassword, BCRYPT_ROUNDS)
//   const updated = await prisma.user.update({
//     where: { id: user.id },
//     data: {
//       passwordHash,
//       mustChangePassword: false,
//       passwordChangedAt: new Date(),
//       // signs this user out on every other device and browser
//       tokenVersion: { increment: 1 },
//     },
//   })

//   await prisma.activityLog.create({
//     data: { userId: user.id, level: 'info', message: `Password changed by ${user.email}` },
//   })

//   // Keep THIS browser signed in with a fresh cookie
//   res.cookie(COOKIE_NAME, signToken(updated.id, updated.tokenVersion), {
//     ...cookieOptions,
//     maxAge: cookieMaxAgeMs,
//   })
//   res.json({ message: 'Password changed.', user: toPublicUser(updated) })
// })

// export default router
import { Router } from 'express'
import bcrypt from 'bcryptjs'
import rateLimit from 'express-rate-limit'
import { Prisma } from '@prisma/client'
import { z } from 'zod'
import { env } from '../config'
import { prisma } from '../prisma'
import { HttpError } from '../utils/httpError'
import { requireAuthAllowTemp } from '../middleware/auth'
import { newPasswordSchema } from '../services/password'
import { toPublicUser } from '../services/publicUser'
import { getAdmission } from '../services/admission'
import { isMaintenanceOn } from '../services/system'
import { isMailConfigured, sendMail } from '../services/mailer'
import {
  RESET_COOLDOWN_MINUTES,
  RESET_VALID_MINUTES,
  generateToken,
  hashToken,
  passwordChangedEmail,
  resetEmail,
  resetLink,
} from '../services/passwordReset'
import { COOKIE_NAME, cookieMaxAgeMs, cookieOptions, signToken } from '../services/token'

const router = Router()

const BCRYPT_ROUNDS = 12
// Compared against when the email does not exist, so a wrong email and a wrong
// password take about the same time and cannot be told apart.
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', BCRYPT_ROUNDS)

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { message: 'Too many attempts. Please try again in a few minutes.' },
})

const registerSchema = z.object({
  fullName: z.string().trim().min(2, 'Enter your full name.').max(100, 'Name is too long.'),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email('Enter a valid email address.')
    .max(254, 'Email is too long.'),
  phone: z.string().trim().regex(/^[+\d\s-]{9,16}$/, 'Enter a valid phone number.'),
  // bcrypt only reads the first 72 bytes, so longer passwords are refused
  password: z
    .string()
    .min(8, 'Use at least 8 characters.')
    .max(72, 'Password is too long (72 characters at most).'),
})

const loginSchema = z.object({
  identifier: z.string().trim().min(1, 'Enter your email.').max(254),
  password: z.string().min(1, 'Enter your password.').max(200),
})

// Stricter than the login limiter: guessing the current password is the attack here.
const passwordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { message: 'Too many attempts. Please try again in a few minutes.' },
})

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Enter your current password.').max(200),
  newPassword: newPasswordSchema,
})

// Students only. The role is set here on the server and is never read from the request.
router.post('/register-student', limiter, async (req, res) => {
  const body = registerSchema.parse(req.body)

  if (await isMaintenanceOn()) {
    res.status(503).json({ message: 'The system is under maintenance. Please try again later.' })
    return
  }

  const admission = await getAdmission()
  if (admission.status !== 'open') {
    res.status(403).json({
      message:
        admission.status === 'upcoming'
          ? 'Registration has not opened yet.'
          : 'Registration is closed.',
    })
    return
  }

  const passwordHash = await bcrypt.hash(body.password, BCRYPT_ROUNDS)

  try {
    await prisma.user.create({
      data: {
        fullName: body.fullName,
        email: body.email,
        phone: body.phone,
        passwordHash,
        role: 'student',
        status: 'active',
        application: { create: { intake: admission.intake } },
      },
    })
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      res.status(409).json({ message: 'An account with this email already exists.' })
      return
    }
    throw err
  }

  res.status(201).json({ message: 'Account created. You can now log in.' })
})

router.post('/login', limiter, async (req, res) => {
  const body = loginSchema.parse(req.body)

  const user = await prisma.user.findUnique({
    where: { email: body.identifier.toLowerCase() },
  })
  const passwordOk = await bcrypt.compare(body.password, user?.passwordHash ?? DUMMY_HASH)

  if (!user || !passwordOk) {
    // Written to the system log, so ICT can see attacks. Only text that looks like an email is
    // kept, because people sometimes type their password in the email box by mistake.
    const looksLikeEmail = body.identifier.length <= 100 && /^\S+@\S+\.\S+$/.test(body.identifier)
    await prisma.activityLog.create({
      data: {
        userId: user?.id ?? null,
        level: 'warning',
        message: `Failed login for ${looksLikeEmail ? body.identifier.toLowerCase() : 'an invalid email'}`,
      },
    })
    res.status(401).json({ message: 'Invalid email or password.' })
    return
  }
  if (user.status !== 'active') {
    res.status(403).json({ message: 'Your account is not active. Contact the administrator.' })
    return
  }

  // While ICT has maintenance mode on, only administrators and ICT can sign in
  if (user.role !== 'admin' && user.role !== 'ict' && (await isMaintenanceOn())) {
    res.status(503).json({ message: 'The system is under maintenance. Please try again later.' })
    return
  }

  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } })

  res.cookie(COOKIE_NAME, signToken(user.id, user.tokenVersion), { ...cookieOptions, maxAge: cookieMaxAgeMs })
  res.json({ user: toPublicUser(user) })
})

router.post('/logout', (_req, res) => {
  res.clearCookie(COOKIE_NAME, cookieOptions)
  res.json({ message: 'Signed out.' })
})

router.get('/me', requireAuthAllowTemp, async (req, res) => {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: req.user!.id } })
  res.json({ user: toPublicUser(user) })
})

// Works for everyone who is signed in, including someone who must replace a temporary password.
router.post('/change-password', passwordLimiter, requireAuthAllowTemp, async (req, res) => {
  const body = changePasswordSchema.parse(req.body)

  const user = await prisma.user.findUniqueOrThrow({ where: { id: req.user!.id } })

  const currentOk = await bcrypt.compare(body.currentPassword, user.passwordHash)
  if (!currentOk) {
    const message = 'Your current password is not correct.'
    res.status(400).json({ message, errors: { currentPassword: message } })
    return
  }
  if (body.newPassword === body.currentPassword) {
    const message = 'Choose a password that is different from the current one.'
    res.status(400).json({ message, errors: { newPassword: message } })
    return
  }

  const passwordHash = await bcrypt.hash(body.newPassword, BCRYPT_ROUNDS)
  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      mustChangePassword: false,
      passwordChangedAt: new Date(),
      // signs this user out on every other device and browser
      tokenVersion: { increment: 1 },
    },
  })

  await prisma.activityLog.create({
    data: { userId: user.id, level: 'info', message: `Password changed by ${user.email}` },
  })

  // Keep THIS browser signed in with a fresh cookie
  res.cookie(COOKIE_NAME, signToken(updated.id, updated.tokenVersion), {
    ...cookieOptions,
    maxAge: cookieMaxAgeMs,
  })
  res.json({ message: 'Password changed.', user: toPublicUser(updated) })
})

// ============================ Forgot password ============================

// Asking for a link and using a link are both limited, so nobody can flood an inbox or guess links.
const forgotLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { message: 'Too many requests. Please try again in a few minutes.' },
})

const resetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { message: 'Too many attempts. Please try again in a few minutes.' },
})

const INVALID_LINK = 'This reset link is invalid or has expired. Please ask for a new one.'
const tokenSchema = z.string().regex(/^[a-f0-9]{64}$/, INVALID_LINK)

// Sends an email in the background. A failure is written to the system log (ICT can see it)
// and is never shown to the visitor, so the page cannot be used to find out who has an account.
async function sendQuietly(
  label: string,
  userId: number | null,
  message: { to: string; subject: string; text: string; html: string },
) {
  try {
    await sendMail(message)
  } catch (err) {
    const reason = err instanceof Error ? err.message.slice(0, 200) : 'unknown error'
    await prisma.activityLog
      .create({ data: { userId, level: 'error', message: `${label} email could not be sent: ${reason}` } })
      .catch(() => undefined)
  }
}

async function deliverResetEmail(user: { id: number; email: string; fullName: string }, token: string) {
  const link = resetLink(token)

  if (!isMailConfigured()) {
    if (env.NODE_ENV !== 'production') {
      // While developing without email, the link is printed here so you can still test the flow
      console.log(`[development] Password reset link for ${user.email}: ${link}`)
    } else {
      await prisma.activityLog
        .create({ data: { userId: user.id, level: 'error', message: 'A password reset was requested but email is not set up on the server' } })
        .catch(() => undefined)
    }
    return
  }
  await sendQuietly('Password reset', user.id, { to: user.email, ...resetEmail(user.fullName, link) })
}

// Step 1: the person types their email. The answer is always the same, whether or not an
// account exists, so this page cannot be used to find out who has an account.
router.post('/forgot-password', forgotLimiter, async (req, res) => {
  const { email } = z
    .object({ email: z.string().trim().toLowerCase().email('Enter a valid email address.').max(254) })
    .parse(req.body)

  const answer = { message: 'If an account exists for that email, we have sent a link to reset the password.' }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, fullName: true, status: true },
  })

  if (user && user.status === 'active') {
    const recent = await prisma.passwordReset.findFirst({
      where: { userId: user.id, createdAt: { gte: new Date(Date.now() - RESET_COOLDOWN_MINUTES * 60_000) } },
      select: { id: true },
    })

    if (!recent) {
      // a new link replaces any older ones
      await prisma.passwordReset.deleteMany({ where: { userId: user.id } })

      const token = generateToken()
      await prisma.passwordReset.create({
        data: {
          userId: user.id,
          tokenHash: hashToken(token),
          expiresAt: new Date(Date.now() + RESET_VALID_MINUTES * 60_000),
        },
      })
      await prisma.activityLog.create({
        data: { userId: user.id, level: 'info', message: `Password reset requested for ${user.email}` },
      })

      // not awaited: the visitor does not wait for the mail server, and the answer is just as fast either way
      void deliverResetEmail(user, token)
    }
  }

  // clean up old, unused links now and then
  await prisma.passwordReset.deleteMany({ where: { expiresAt: { lt: new Date(Date.now() - 24 * 60 * 60_000) } } })

  res.json(answer)
})

// The reset page asks this first, so it can say "expired" before the person types a password.
router.post('/reset-token/check', resetLimiter, async (req, res) => {
  const parsed = tokenSchema.safeParse(req.body?.token)
  if (!parsed.success) {
    res.json({ valid: false })
    return
  }

  const record = await prisma.passwordReset.findUnique({
    where: { tokenHash: hashToken(parsed.data) },
    select: { usedAt: true, expiresAt: true, user: { select: { status: true } } },
  })
  res.json({
    valid: !!record && !record.usedAt && record.expiresAt > new Date() && record.user.status === 'active',
  })
})

// Step 2: the person opens the link and chooses a new password.
router.post('/reset-password', resetLimiter, async (req, res) => {
  const body = z.object({ token: tokenSchema, password: newPasswordSchema }).parse(req.body)

  const record = await prisma.passwordReset.findUnique({
    where: { tokenHash: hashToken(body.token) },
    select: {
      id: true,
      userId: true,
      usedAt: true,
      expiresAt: true,
      user: { select: { email: true, fullName: true, status: true } },
    },
  })
  if (!record || record.usedAt || record.expiresAt <= new Date() || record.user.status !== 'active') {
    throw new HttpError(400, INVALID_LINK)
  }

  const passwordHash = await bcrypt.hash(body.password, BCRYPT_ROUNDS)

  await prisma.$transaction(async (tx) => {
    // The link is used up first. If it is clicked twice at the same moment, only one of them gets through.
    const claimed = await tx.passwordReset.updateMany({ where: { id: record.id, usedAt: null }, data: { usedAt: new Date() } })
    if (claimed.count === 0) throw new HttpError(400, INVALID_LINK)

    await tx.user.update({
      where: { id: record.userId },
      data: {
        passwordHash,
        mustChangePassword: false,
        passwordChangedAt: new Date(),
        tokenVersion: { increment: 1 }, // signs the person out everywhere, including anyone who had the old password
      },
    })
    await tx.passwordReset.deleteMany({ where: { userId: record.userId } })
  })

  await prisma.activityLog.create({
    data: { userId: record.userId, level: 'info', message: `Password reset completed for ${record.user.email}` },
  })

  // tell the owner, so a reset they did not make is noticed
  if (isMailConfigured()) {
    void sendQuietly('Password changed', record.userId, {
      to: record.user.email,
      ...passwordChangedEmail(record.user.fullName),
    })
  }

  res.json({ message: 'Your password was changed. You can now sign in.' })
})

export default router


// // // // import { Router } from 'express'
// // // // import bcrypt from 'bcryptjs'
// // // // import rateLimit from 'express-rate-limit'
// // // // import { Prisma } from '@prisma/client'
// // // // import type { User } from '@prisma/client'
// // // // import { z } from 'zod'
// // // // import { prisma } from '../prisma'
// // // // import { requireAuth } from '../middleware/auth'
// // // // import { getAdmission } from '../services/admission'
// // // // import { COOKIE_NAME, cookieMaxAgeMs, cookieOptions, signToken } from '../services/token'

// // // // const router = Router()

// // // // const BCRYPT_ROUNDS = 12
// // // // // Compared against when the email does not exist, so a wrong email and a wrong
// // // // // password take about the same time and cannot be told apart.
// // // // const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', BCRYPT_ROUNDS)

// // // // const limiter = rateLimit({
// // // //   windowMs: 15 * 60 * 1000,
// // // //   limit: 20,
// // // //   standardHeaders: 'draft-7',
// // // //   legacyHeaders: false,
// // // //   message: { message: 'Too many attempts. Please try again in a few minutes.' },
// // // // })

// // // // const registerSchema = z.object({
// // // //   fullName: z.string().trim().min(2, 'Enter your full name.').max(100, 'Name is too long.'),
// // // //   email: z
// // // //     .string()
// // // //     .trim()
// // // //     .toLowerCase()
// // // //     .email('Enter a valid email address.')
// // // //     .max(254, 'Email is too long.'),
// // // //   phone: z.string().trim().regex(/^[+\d\s-]{9,16}$/, 'Enter a valid phone number.'),
// // // //   // bcrypt only reads the first 72 bytes, so longer passwords are refused
// // // //   password: z
// // // //     .string()
// // // //     .min(8, 'Use at least 8 characters.')
// // // //     .max(72, 'Password is too long (72 characters at most).'),
// // // // })

// // // // const loginSchema = z.object({
// // // //   identifier: z.string().trim().min(1, 'Enter your email.').max(254),
// // // //   password: z.string().min(1, 'Enter your password.').max(200),
// // // // })

// // // // const toPublicUser = (u: Pick<User, 'id' | 'fullName' | 'email' | 'role' | 'photoUrl'>) => ({
// // // //   id: u.id,
// // // //   name: u.fullName,
// // // //   email: u.email,
// // // //   role: u.role,
// // // //   photo: u.photoUrl ?? undefined,
// // // // })

// // // // // Students only. The role is set here on the server and is never read from the request.
// // // // router.post('/register-student', limiter, async (req, res) => {
// // // //   const body = registerSchema.parse(req.body)

// // // //   const admission = await getAdmission()
// // // //   if (admission.status !== 'open') {
// // // //     res.status(403).json({
// // // //       message:
// // // //         admission.status === 'upcoming'
// // // //           ? 'Registration has not opened yet.'
// // // //           : 'Registration is closed.',
// // // //     })
// // // //     return
// // // //   }

// // // //   const passwordHash = await bcrypt.hash(body.password, BCRYPT_ROUNDS)

// // // //   try {
// // // //     await prisma.user.create({
// // // //       data: {
// // // //         fullName: body.fullName,
// // // //         email: body.email,
// // // //         phone: body.phone,
// // // //         passwordHash,
// // // //         role: 'student',
// // // //         status: 'active',
// // // //         application: { create: { intake: admission.intake } },
// // // //       },
// // // //     })
// // // //   } catch (err) {
// // // //     if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
// // // //       res.status(409).json({ message: 'An account with this email already exists.' })
// // // //       return
// // // //     }
// // // //     throw err
// // // //   }

// // // //   res.status(201).json({ message: 'Account created. You can now log in.' })
// // // // })

// // // // router.post('/login', limiter, async (req, res) => {
// // // //   const body = loginSchema.parse(req.body)

// // // //   const user = await prisma.user.findUnique({
// // // //     where: { email: body.identifier.toLowerCase() },
// // // //   })
// // // //   const passwordOk = await bcrypt.compare(body.password, user?.passwordHash ?? DUMMY_HASH)

// // // //   if (!user || !passwordOk) {
// // // //     res.status(401).json({ message: 'Invalid email or password.' })
// // // //     return
// // // //   }
// // // //   if (user.status !== 'active') {
// // // //     res.status(403).json({ message: 'Your account is not active. Contact the administrator.' })
// // // //     return
// // // //   }

// // // //   await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } })

// // // //   res.cookie(COOKIE_NAME, signToken(user.id), { ...cookieOptions, maxAge: cookieMaxAgeMs })
// // // //   res.json({ user: toPublicUser(user) })
// // // // })

// // // // router.post('/logout', (_req, res) => {
// // // //   res.clearCookie(COOKIE_NAME, cookieOptions)
// // // //   res.json({ message: 'Signed out.' })
// // // // })

// // // // router.get('/me', requireAuth, async (req, res) => {
// // // //   const user = await prisma.user.findUniqueOrThrow({ where: { id: req.user!.id } })
// // // //   res.json({ user: toPublicUser(user) })
// // // // })

// // // // export default router
// // // import { Router } from 'express'
// // // import bcrypt from 'bcryptjs'
// // // import rateLimit from 'express-rate-limit'
// // // import { Prisma } from '@prisma/client'
// // // import type { User } from '@prisma/client'
// // // import { z } from 'zod'
// // // import { prisma } from '../prisma'
// // // import { requireAuthAllowTemp } from '../middleware/auth'
// // // import { newPasswordSchema } from '../services/password'
// // // import { getAdmission } from '../services/admission'
// // // import { COOKIE_NAME, cookieMaxAgeMs, cookieOptions, signToken } from '../services/token'

// // // const router = Router()

// // // const BCRYPT_ROUNDS = 12
// // // // Compared against when the email does not exist, so a wrong email and a wrong
// // // // password take about the same time and cannot be told apart.
// // // const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', BCRYPT_ROUNDS)

// // // const limiter = rateLimit({
// // //   windowMs: 15 * 60 * 1000,
// // //   limit: 20,
// // //   standardHeaders: 'draft-7',
// // //   legacyHeaders: false,
// // //   message: { message: 'Too many attempts. Please try again in a few minutes.' },
// // // })

// // // const registerSchema = z.object({
// // //   fullName: z.string().trim().min(2, 'Enter your full name.').max(100, 'Name is too long.'),
// // //   email: z
// // //     .string()
// // //     .trim()
// // //     .toLowerCase()
// // //     .email('Enter a valid email address.')
// // //     .max(254, 'Email is too long.'),
// // //   phone: z.string().trim().regex(/^[+\d\s-]{9,16}$/, 'Enter a valid phone number.'),
// // //   // bcrypt only reads the first 72 bytes, so longer passwords are refused
// // //   password: z
// // //     .string()
// // //     .min(8, 'Use at least 8 characters.')
// // //     .max(72, 'Password is too long (72 characters at most).'),
// // // })

// // // const loginSchema = z.object({
// // //   identifier: z.string().trim().min(1, 'Enter your email.').max(254),
// // //   password: z.string().min(1, 'Enter your password.').max(200),
// // // })

// // // const toPublicUser = (
// // //   u: Pick<User, 'id' | 'fullName' | 'email' | 'role' | 'photoUrl' | 'mustChangePassword'>,
// // // ) => ({
// // //   id: u.id,
// // //   name: u.fullName,
// // //   email: u.email,
// // //   role: u.role,
// // //   photo: u.photoUrl ?? undefined,
// // //   mustChangePassword: u.mustChangePassword,
// // // })

// // // // Stricter than the login limiter: guessing the current password is the attack here.
// // // const passwordLimiter = rateLimit({
// // //   windowMs: 15 * 60 * 1000,
// // //   limit: 10,
// // //   standardHeaders: 'draft-7',
// // //   legacyHeaders: false,
// // //   message: { message: 'Too many attempts. Please try again in a few minutes.' },
// // // })

// // // const changePasswordSchema = z.object({
// // //   currentPassword: z.string().min(1, 'Enter your current password.').max(200),
// // //   newPassword: newPasswordSchema,
// // // })

// // // // Students only. The role is set here on the server and is never read from the request.
// // // router.post('/register-student', limiter, async (req, res) => {
// // //   const body = registerSchema.parse(req.body)

// // //   const admission = await getAdmission()
// // //   if (admission.status !== 'open') {
// // //     res.status(403).json({
// // //       message:
// // //         admission.status === 'upcoming'
// // //           ? 'Registration has not opened yet.'
// // //           : 'Registration is closed.',
// // //     })
// // //     return
// // //   }

// // //   const passwordHash = await bcrypt.hash(body.password, BCRYPT_ROUNDS)

// // //   try {
// // //     await prisma.user.create({
// // //       data: {
// // //         fullName: body.fullName,
// // //         email: body.email,
// // //         phone: body.phone,
// // //         passwordHash,
// // //         role: 'student',
// // //         status: 'active',
// // //         mustChangePassword: true, // the new user chooses their own password at first sign-in
// // //         application: { create: { intake: admission.intake } },
// // //       },
// // //     })
// // //   } catch (err) {
// // //     if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
// // //       res.status(409).json({ message: 'An account with this email already exists.' })
// // //       return
// // //     }
// // //     throw err
// // //   }

// // //   res.status(201).json({ message: 'Account created. You can now log in.' })
// // // })

// // // router.post('/login', limiter, async (req, res) => {
// // //   const body = loginSchema.parse(req.body)

// // //   const user = await prisma.user.findUnique({
// // //     where: { email: body.identifier.toLowerCase() },
// // //   })
// // //   const passwordOk = await bcrypt.compare(body.password, user?.passwordHash ?? DUMMY_HASH)

// // //   if (!user || !passwordOk) {
// // //     res.status(401).json({ message: 'Invalid email or password.' })
// // //     return
// // //   }
// // //   if (user.status !== 'active') {
// // //     res.status(403).json({ message: 'Your account is not active. Contact the administrator.' })
// // //     return
// // //   }

// // //   await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } })

// // //   res.cookie(COOKIE_NAME, signToken(user.id, user.tokenVersion), { ...cookieOptions, maxAge: cookieMaxAgeMs })
// // //   res.json({ user: toPublicUser(user) })
// // // })

// // // router.post('/logout', (_req, res) => {
// // //   res.clearCookie(COOKIE_NAME, cookieOptions)
// // //   res.json({ message: 'Signed out.' })
// // // })

// // // router.get('/me', requireAuthAllowTemp, async (req, res) => {
// // //   const user = await prisma.user.findUniqueOrThrow({ where: { id: req.user!.id } })
// // //   res.json({ user: toPublicUser(user) })
// // // })

// // // // Works for everyone who is signed in, including someone who must replace a temporary password.
// // // router.post('/change-password', passwordLimiter, requireAuthAllowTemp, async (req, res) => {
// // //   const body = changePasswordSchema.parse(req.body)

// // //   const user = await prisma.user.findUniqueOrThrow({ where: { id: req.user!.id } })

// // //   const currentOk = await bcrypt.compare(body.currentPassword, user.passwordHash)
// // //   if (!currentOk) {
// // //     const message = 'Your current password is not correct.'
// // //     res.status(400).json({ message, errors: { currentPassword: message } })
// // //     return
// // //   }
// // //   if (body.newPassword === body.currentPassword) {
// // //     const message = 'Choose a password that is different from the current one.'
// // //     res.status(400).json({ message, errors: { newPassword: message } })
// // //     return
// // //   }

// // //   const passwordHash = await bcrypt.hash(body.newPassword, BCRYPT_ROUNDS)
// // //   const updated = await prisma.user.update({
// // //     where: { id: user.id },
// // //     data: {
// // //       passwordHash,
// // //       mustChangePassword: false,
// // //       passwordChangedAt: new Date(),
// // //       // signs this user out on every other device and browser
// // //       tokenVersion: { increment: 1 },
// // //     },
// // //   })

// // //   await prisma.activityLog.create({
// // //     data: { userId: user.id, level: 'info', message: `Password changed by ${user.email}` },
// // //   })

// // //   // Keep THIS browser signed in with a fresh cookie
// // //   res.cookie(COOKIE_NAME, signToken(updated.id, updated.tokenVersion), {
// // //     ...cookieOptions,
// // //     maxAge: cookieMaxAgeMs,
// // //   })
// // //   res.json({ message: 'Password changed.', user: toPublicUser(updated) })
// // // })

// // // export default router
// // import { Router } from 'express'
// // import bcrypt from 'bcryptjs'
// // import rateLimit from 'express-rate-limit'
// // import { Prisma } from '@prisma/client'
// // import type { User } from '@prisma/client'
// // import { z } from 'zod'
// // import { prisma } from '../prisma'
// // import { requireAuthAllowTemp } from '../middleware/auth'
// // import { newPasswordSchema } from '../services/password'
// // import { getAdmission } from '../services/admission'
// // import { COOKIE_NAME, cookieMaxAgeMs, cookieOptions, signToken } from '../services/token'

// // const router = Router()

// // const BCRYPT_ROUNDS = 12
// // // Compared against when the email does not exist, so a wrong email and a wrong
// // // password take about the same time and cannot be told apart.
// // const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', BCRYPT_ROUNDS)

// // const limiter = rateLimit({
// //   windowMs: 15 * 60 * 1000,
// //   limit: 20,
// //   standardHeaders: 'draft-7',
// //   legacyHeaders: false,
// //   message: { message: 'Too many attempts. Please try again in a few minutes.' },
// // })

// // const registerSchema = z.object({
// //   fullName: z.string().trim().min(2, 'Enter your full name.').max(100, 'Name is too long.'),
// //   email: z
// //     .string()
// //     .trim()
// //     .toLowerCase()
// //     .email('Enter a valid email address.')
// //     .max(254, 'Email is too long.'),
// //   phone: z.string().trim().regex(/^[+\d\s-]{9,16}$/, 'Enter a valid phone number.'),
// //   // bcrypt only reads the first 72 bytes, so longer passwords are refused
// //   password: z
// //     .string()
// //     .min(8, 'Use at least 8 characters.')
// //     .max(72, 'Password is too long (72 characters at most).'),
// // })

// // const loginSchema = z.object({
// //   identifier: z.string().trim().min(1, 'Enter your email.').max(254),
// //   password: z.string().min(1, 'Enter your password.').max(200),
// // })

// // const toPublicUser = (
// //   u: Pick<User, 'id' | 'fullName' | 'email' | 'role' | 'photoUrl' | 'mustChangePassword'>,
// // ) => ({
// //   id: u.id,
// //   name: u.fullName,
// //   email: u.email,
// //   role: u.role,
// //   photo: u.photoUrl ?? undefined,
// //   mustChangePassword: u.mustChangePassword,
// // })

// // // Stricter than the login limiter: guessing the current password is the attack here.
// // const passwordLimiter = rateLimit({
// //   windowMs: 15 * 60 * 1000,
// //   limit: 10,
// //   standardHeaders: 'draft-7',
// //   legacyHeaders: false,
// //   message: { message: 'Too many attempts. Please try again in a few minutes.' },
// // })

// // const changePasswordSchema = z.object({
// //   currentPassword: z.string().min(1, 'Enter your current password.').max(200),
// //   newPassword: newPasswordSchema,
// // })

// // // Students only. The role is set here on the server and is never read from the request.
// // router.post('/register-student', limiter, async (req, res) => {
// //   const body = registerSchema.parse(req.body)

// //   const admission = await getAdmission()
// //   if (admission.status !== 'open') {
// //     res.status(403).json({
// //       message:
// //         admission.status === 'upcoming'
// //           ? 'Registration has not opened yet.'
// //           : 'Registration is closed.',
// //     })
// //     return
// //   }

// //   const passwordHash = await bcrypt.hash(body.password, BCRYPT_ROUNDS)

// //   try {
// //     await prisma.user.create({
// //       data: {
// //         fullName: body.fullName,
// //         email: body.email,
// //         phone: body.phone,
// //         passwordHash,
// //         role: 'student',
// //         status: 'active',
// //         application: { create: { intake: admission.intake } },
// //       },
// //     })
// //   } catch (err) {
// //     if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
// //       res.status(409).json({ message: 'An account with this email already exists.' })
// //       return
// //     }
// //     throw err
// //   }

// //   res.status(201).json({ message: 'Account created. You can now log in.' })
// // })

// // router.post('/login', limiter, async (req, res) => {
// //   const body = loginSchema.parse(req.body)

// //   const user = await prisma.user.findUnique({
// //     where: { email: body.identifier.toLowerCase() },
// //   })
// //   const passwordOk = await bcrypt.compare(body.password, user?.passwordHash ?? DUMMY_HASH)

// //   if (!user || !passwordOk) {
// //     res.status(401).json({ message: 'Invalid email or password.' })
// //     return
// //   }
// //   if (user.status !== 'active') {
// //     res.status(403).json({ message: 'Your account is not active. Contact the administrator.' })
// //     return
// //   }

// //   await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } })

// //   res.cookie(COOKIE_NAME, signToken(user.id, user.tokenVersion), { ...cookieOptions, maxAge: cookieMaxAgeMs })
// //   res.json({ user: toPublicUser(user) })
// // })

// // router.post('/logout', (_req, res) => {
// //   res.clearCookie(COOKIE_NAME, cookieOptions)
// //   res.json({ message: 'Signed out.' })
// // })

// // router.get('/me', requireAuthAllowTemp, async (req, res) => {
// //   const user = await prisma.user.findUniqueOrThrow({ where: { id: req.user!.id } })
// //   res.json({ user: toPublicUser(user) })
// // })

// // // Works for everyone who is signed in, including someone who must replace a temporary password.
// // router.post('/change-password', passwordLimiter, requireAuthAllowTemp, async (req, res) => {
// //   const body = changePasswordSchema.parse(req.body)

// //   const user = await prisma.user.findUniqueOrThrow({ where: { id: req.user!.id } })

// //   const currentOk = await bcrypt.compare(body.currentPassword, user.passwordHash)
// //   if (!currentOk) {
// //     const message = 'Your current password is not correct.'
// //     res.status(400).json({ message, errors: { currentPassword: message } })
// //     return
// //   }
// //   if (body.newPassword === body.currentPassword) {
// //     const message = 'Choose a password that is different from the current one.'
// //     res.status(400).json({ message, errors: { newPassword: message } })
// //     return
// //   }

// //   const passwordHash = await bcrypt.hash(body.newPassword, BCRYPT_ROUNDS)
// //   const updated = await prisma.user.update({
// //     where: { id: user.id },
// //     data: {
// //       passwordHash,
// //       mustChangePassword: false,
// //       passwordChangedAt: new Date(),
// //       // signs this user out on every other device and browser
// //       tokenVersion: { increment: 1 },
// //     },
// //   })

// //   await prisma.activityLog.create({
// //     data: { userId: user.id, level: 'info', message: `Password changed by ${user.email}` },
// //   })

// //   // Keep THIS browser signed in with a fresh cookie
// //   res.cookie(COOKIE_NAME, signToken(updated.id, updated.tokenVersion), {
// //     ...cookieOptions,
// //     maxAge: cookieMaxAgeMs,
// //   })
// //   res.json({ message: 'Password changed.', user: toPublicUser(updated) })
// // })

// // export default router
// import { Router } from 'express'
// import bcrypt from 'bcryptjs'
// import rateLimit from 'express-rate-limit'
// import { Prisma } from '@prisma/client'
// import type { User } from '@prisma/client'
// import { z } from 'zod'
// import { prisma } from '../prisma'
// import { requireAuthAllowTemp } from '../middleware/auth'
// import { newPasswordSchema } from '../services/password'
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

// const toPublicUser = (
//   u: Pick<User, 'id' | 'fullName' | 'email' | 'role' | 'photoUrl' | 'mustChangePassword'>,
// ) => ({
//   id: u.id,
//   name: u.fullName,
//   email: u.email,
//   role: u.role,
//   photo: u.photoUrl ?? undefined,
//   mustChangePassword: u.mustChangePassword,
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
import { prisma } from '../prisma'
import { requireAuthAllowTemp } from '../middleware/auth'
import { newPasswordSchema } from '../services/password'
import { toPublicUser } from '../services/publicUser'
import { getAdmission } from '../services/admission'
import { isMaintenanceOn } from '../services/system'
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

export default router

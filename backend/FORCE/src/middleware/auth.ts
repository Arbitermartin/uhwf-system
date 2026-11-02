// import type { RequestHandler } from 'express'
// import type { Role } from '@prisma/client'
// import { prisma } from '../prisma'
// import { COOKIE_NAME, verifyToken } from '../services/token'

// export const requireAuth: RequestHandler = async (req, res, next) => {
//   const token = req.cookies?.[COOKIE_NAME]
//   const userId = typeof token === 'string' ? verifyToken(token) : null
//   if (!userId) {
//     res.status(401).json({ message: 'Please sign in.' })
//     return
//   }

//   // Load the user on every request so a suspended account or a changed role
//   // takes effect immediately, not when the token expires.
//   const user = await prisma.user.findUnique({
//     where: { id: userId },
//     select: { id: true, fullName: true, email: true, role: true, status: true },
//   })
//   if (!user || user.status !== 'active') {
//     res.status(401).json({ message: 'Please sign in.' })
//     return
//   }

//   req.user = { id: user.id, fullName: user.fullName, email: user.email, role: user.role }
//   next()
// }

// export const requireRole =
//   (...roles: Role[]): RequestHandler =>
//   (req, res, next) => {
//     if (!req.user || !roles.includes(req.user.role)) {
//       res.status(403).json({ message: 'You do not have permission to do this.' })
//       return
//     }
//     next()
//   }
import type { RequestHandler } from 'express'
import type { Role } from '@prisma/client'
import { prisma } from '../prisma'
import { COOKIE_NAME, verifyToken } from '../services/token'

const authenticate =
  (allowTemporaryPassword: boolean): RequestHandler =>
    async (req, res, next) => {
      const token = req.cookies?.[COOKIE_NAME]
      const payload = typeof token === 'string' ? verifyToken(token) : null
      if (!payload) {
        res.status(401).json({ message: 'Please sign in.' })
        return
      }

      // Load the user on every request so a suspended account, a changed role or a
      // password change takes effect immediately, not when the cookie expires.
      const user = await prisma.user.findUnique({
        where: { id: payload.id },
        select: {
          id: true,
          fullName: true,
          email: true,
          role: true,
          status: true,
          tokenVersion: true,
          mustChangePassword: true,
        },
      })
      if (!user || user.status !== 'active' || user.tokenVersion !== payload.ver) {
        res.status(401).json({ message: 'Please sign in.' })
        return
      }

      // Someone still using a temporary password may do nothing except change it.
      if (user.mustChangePassword && !allowTemporaryPassword) {
        res.status(403).json({
          code: 'PASSWORD_CHANGE_REQUIRED',
          message: 'You must change your temporary password first.',
        })
        return
      }

      req.user = { id: user.id, fullName: user.fullName, email: user.email, role: user.role }
      next()
    }

// For every normal route
export const requireAuth = authenticate(false)
// Only for /auth/me and /auth/change-password
export const requireAuthAllowTemp = authenticate(true)

export const requireRole =
  (...roles: Role[]): RequestHandler =>
    (req, res, next) => {
      if (!req.user || !roles.includes(req.user.role)) {
        res.status(403).json({ message: 'You do not have permission to do this.' })
        return
      }
      next()
    }
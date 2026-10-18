// import jwt from 'jsonwebtoken'
// import type { CookieOptions } from 'express'
// import { env } from '../config'

// export const COOKIE_NAME = 'uhwf_token'
// const SEVEN_DAYS_SECONDS = 7 * 24 * 60 * 60

// export const cookieOptions: CookieOptions = {
//   httpOnly: true, // JavaScript in the browser can never read this cookie
//   sameSite: 'lax',
//   secure: env.NODE_ENV === 'production', // HTTPS only in production
//   path: '/',
// }

// export const signToken = (userId: number) =>
//   jwt.sign({ sub: String(userId) }, env.JWT_SECRET, {
//     algorithm: 'HS256',
//     expiresIn: SEVEN_DAYS_SECONDS,
//   })

// export const verifyToken = (token: string): number | null => {
//   try {
//     const payload = jwt.verify(token, env.JWT_SECRET, { algorithms: ['HS256'] })
//     if (typeof payload === 'string' || !payload.sub) return null
//     const id = Number(payload.sub)
//     return Number.isInteger(id) ? id : null
//   } catch {
//     return null
//   }
// }

// export const cookieMaxAgeMs = SEVEN_DAYS_SECONDS * 1000
import jwt from 'jsonwebtoken'
import type { CookieOptions } from 'express'
import { env } from '../config'

export const COOKIE_NAME = 'uhwf_token'
const SEVEN_DAYS_SECONDS = 7 * 24 * 60 * 60

export const cookieOptions: CookieOptions = {
  httpOnly: true, // JavaScript in the browser can never read this cookie
  sameSite: 'lax',
  secure: env.NODE_ENV === 'production', // HTTPS only in production
  path: '/',
}

// `version` must match users.tokenVersion. Changing a password raises that number,
// which makes every older cookie invalid.
export const signToken = (userId: number, version: number) =>
  jwt.sign({ sub: String(userId), ver: version }, env.JWT_SECRET, {
    algorithm: 'HS256',
    expiresIn: SEVEN_DAYS_SECONDS,
  })

export const verifyToken = (token: string): { id: number; ver: number } | null => {
  try {
    const payload = jwt.verify(token, env.JWT_SECRET, { algorithms: ['HS256'] })
    if (typeof payload === 'string' || !payload.sub) return null
    const id = Number(payload.sub)
    const ver = Number(payload.ver)
    return Number.isInteger(id) && Number.isInteger(ver) ? { id, ver } : null
  } catch {
    return null
  }
}

export const cookieMaxAgeMs = SEVEN_DAYS_SECONDS * 1000
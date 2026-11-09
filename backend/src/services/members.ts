import type { Prisma } from '@prisma/client'
import { z } from 'zod'
import { newPasswordSchema } from './password'

// Rules for UHWF members. Nothing here needs a request, so most of it can be tested alone.

export const MEMBER_INTERESTS = ['events', 'volunteering', 'donating', 'research', 'community'] as const

export const memberNumberFrom = (n: number) => `UHWF-M-${String(n).padStart(4, '0')}`

// Next member number. One atomic statement, so two people registering at the same moment
// can never receive the same number. If the sign-up fails, the transaction rolls the number back.
export async function nextMemberSeq(tx: Prisma.TransactionClient) {
    const rows = await tx.$queryRaw<{ value: string }[]>`
    INSERT INTO settings ("key", "value", "updatedAt")
    VALUES ('memberseq', '1', now())
    ON CONFLICT ("key") DO UPDATE
      SET "value" = ((settings."value")::int + 1)::text, "updatedAt" = now()
    RETURNING "value"`
    return Number(rows[0].value)
}

// Membership lasts one year. Joining on 29 February ends on 28 February, not on 1 March.
export function membershipEnd(from: Date) {
    const d = new Date(from.getTime())
    const month = d.getUTCMonth()
    d.setUTCFullYear(d.getUTCFullYear() + 1)
    if (d.getUTCMonth() !== month) d.setUTCDate(0)
    return d
}

export const membershipStatus = (validUntil: Date, now: Date = new Date()) => (validUntil >= now ? 'active' : 'expired')

export const daysLeft = (validUntil: Date, now: Date = new Date()) =>
    Math.max(0, Math.ceil((validUntil.getTime() - now.getTime()) / 86_400_000))

const PHONE = /^[+\d\s-]{9,16}$/

export const memberSchema = z.object({
    fullName: z.string().trim().min(2, 'Enter your full name.').max(100, 'The name is too long.'),
    email: z.string().trim().toLowerCase().email('Enter a valid email address.').max(254, 'The email is too long.'),
    phone: z
        .string()
        .trim()
        .regex(PHONE, 'Enter a valid phone number.')
        .or(z.literal(''))
        .transform((v) => v || null),
    gender: z
        .enum(['female', 'male'])
        .or(z.literal(''))
        .transform((v) => v || null),
    region: z
        .string()
        .trim()
        .max(80, 'The place name is too long.')
        .transform((v) => v || null),
    interests: z
        .array(z.enum(MEMBER_INTERESTS))
        .max(MEMBER_INTERESTS.length)
        .default([])
        .transform((list) => [...new Set(list)]), // each interest only once
    newsletter: z.boolean(),
    password: newPasswordSchema,
    agree: z.literal(true, { errorMap: () => ({ message: 'Please confirm this to continue.' }) }),
    // A hidden field that real visitors never see or fill in. Bots fill in every field.
    website: z.string().max(200).optional(),
})

const escapeHtml = (v: string) =>
    v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')

export function memberWelcomeEmail(name: string, memberNumber: string, validUntil: Date) {
    const until = validUntil.toISOString().slice(0, 10)
    const text = `Hello ${name},

Welcome to the Universal Human-Wildlife Foundation. Your membership is registered.

Your member number: ${memberNumber}
Valid until: ${until}

You can sign in at any time with your email address and the password you chose.

UHWF Tanzania`

    const html = `<div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;color:#1f2d1f">
<h2 style="color:#0b3d1e">Welcome to UHWF</h2>
<p>Hello ${escapeHtml(name)},</p>
<p>Welcome to the Universal Human-Wildlife Foundation. Your membership is registered.</p>
<p style="background:#f0f7f1;border-radius:8px;padding:12px 16px">Member number: <strong>${escapeHtml(memberNumber)}</strong><br>Valid until: <strong>${until}</strong></p>
<p>You can sign in at any time with your email address and the password you chose.</p>
<p style="font-size:13px;color:#555">UHWF Tanzania</p></div>`

    return { subject: 'Welcome to UHWF', text, html }
}

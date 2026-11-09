import { z } from 'zod'
import { isRealDay } from './content'

// Rules for jobs and job applications. Nothing here touches the database, so it can be tested alone.

export const JOB_TYPES = ['full_time', 'part_time', 'contract', 'internship'] as const
export const APPLICATION_STATUSES = ['received', 'reviewing', 'shortlisted', 'rejected', 'hired'] as const

const TZ_OFFSET_MS = 3 * 60 * 60 * 1000 // Tanzania: UTC+3, no daylight saving

// "Closes on 20 Nov" means the whole of 20 Nov, until 23:59 Tanzania time
export const deadlineFromDay = (day: string) => new Date(`${day}T23:59:59+03:00`)

export const dayFromDeadline = (d: Date) => new Date(d.getTime() + TZ_OFFSET_MS).toISOString().slice(0, 10)

// A job is shown to the public only while it is open AND its closing date has not passed
export const isJobOpen = (status: 'open' | 'closed', deadline: Date | null, now: Date = new Date()) =>
    status === 'open' && (deadline === null || deadline >= now)

export const jobSchema = z.object({
    title: z.string().trim().min(3, 'Enter the job title (at least 3 characters).').max(120, 'The title is too long.'),
    location: z.string().trim().min(2, 'Enter the location.').max(120, 'The location is too long.'),
    jobType: z.enum(JOB_TYPES, { errorMap: () => ({ message: 'Choose the type of job.' }) }),
    // Plain text. Requirements can be written inside it, one per line.
    description: z.string().trim().min(20, 'Describe the job (at least 20 characters).').max(8000, 'The description is too long.'),
    // empty = no closing date
    deadline: z.string().refine((v) => v === '' || isRealDay(v), 'Choose a real date.'),
    // true = visible on the Career page now. false = saved but hidden (a draft).
    open: z.boolean(),
})

const PHONE = /^[+\d\s-]{9,16}$/

// What a visitor sends with the CV. Plain text only.
export const applicationSchema = z.object({
    fullName: z.string().trim().min(2, 'Enter your full name.').max(100, 'The name is too long.'),
    email: z.string().trim().toLowerCase().email('Enter a valid email address.').max(254, 'The email is too long.'),
    phone: z
        .string()
        .trim()
        .regex(PHONE, 'Enter a valid phone number.')
        .or(z.literal(''))
        .transform((v) => v || null),
    coverNote: z
        .string()
        .trim()
        .max(2000, 'The cover note is too long (2000 characters at most).')
        .transform((v) => v || null),
    // A hidden field that real visitors never see or fill in. Bots fill in every field.
    website: z.string().max(200).optional(),
})

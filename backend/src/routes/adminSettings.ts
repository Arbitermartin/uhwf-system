import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../prisma'
import { requireAuth, requireRole } from '../middleware/auth'
import { getAdmission } from '../services/admission'

const router = Router()

// Administrators only, checked on the server.
router.use(requireAuth, requireRole('admin'))

const isRealDate = (v: string) => {
    const d = new Date(`${v}T00:00:00Z`)
    return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === v
}

const dateField = (label: string) =>
    z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, `Choose the ${label} date.`)
        .refine(isRealDate, 'Enter a real date.')

const admissionSchema = z
    .object({
        enabled: z.boolean(),
        intake: z
            .string()
            .trim()
            .regex(/^\d{4}\/\d{4}$/, 'Use the format 2026/2027.')
            .refine((v) => Number(v.slice(5)) === Number(v.slice(0, 4)) + 1, 'The second year must follow the first, for example 2026/2027.'),
        opensOn: dateField('opening'),
        closesOn: dateField('closing'),
        fee: z
            .number({ invalid_type_error: 'Enter the fee as a number.' })
            .int('The fee must be a whole number.')
            .min(1, 'The fee must be at least 1.')
            .max(100_000_000, 'The fee is too large.'),
        maxCourses: z
            .number({ invalid_type_error: 'Enter a number.' })
            .int('Use a whole number.')
            .min(1, 'At least 1 course.')
            .max(10, 'At most 10 courses.'),
    })
    .refine((v) => v.closesOn >= v.opensOn, {
        message: 'The closing date cannot be before the opening date.',
        path: ['closesOn'],
    })

router.get('/', async (_req, res) => {
    res.json({ settings: await getAdmission() })
})

router.put('/', async (req, res) => {
    const body = admissionSchema.parse(req.body)

    const values: Record<string, string> = {
        'admission.enabled': String(body.enabled),
        'admission.intake': body.intake,
        'admission.opensOn': body.opensOn,
        'admission.closesOn': body.closesOn,
        'admission.fee': String(body.fee),
        'admission.maxCourses': String(body.maxCourses),
    }

    // all six settings are saved together or not at all
    await prisma.$transaction(
        Object.entries(values).map(([key, value]) =>
            prisma.setting.upsert({ where: { key }, update: { value }, create: { key, value } }),
        ),
    )

    await prisma.activityLog.create({
        data: {
            userId: req.user!.id,
            level: 'info',
            message:
                `Admission settings updated: ${body.enabled ? 'accepting' : 'NOT accepting'} applications, ` +
                `intake ${body.intake}, ${body.opensOn} to ${body.closesOn}, fee TZS ${body.fee}, up to ${body.maxCourses} courses`,
        },
    })

    res.json({ settings: await getAdmission() })
})

export default router

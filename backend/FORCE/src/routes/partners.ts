// import { Router } from 'express'
// import type { NextFunction, Request, Response } from 'express'
// import multer from 'multer'
// import { z } from 'zod'
// import { prisma } from '../prisma'
// import { requireAuth, requireRole } from '../middleware/auth'
// import { HttpError } from '../utils/httpError'

// const LOGO_MAX_BYTES = 1024 * 1024

// const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: LOGO_MAX_BYTES, files: 1 } })

// // Reads a possible "logo" file and answers with a clear message when it is too big.
// const logoUpload = (req: Request, res: Response, next: NextFunction) => {
//     upload.single('logo')(req, res, (err: unknown) => {
//         if (err) {
//             const code = (err as { code?: string }).code
//             return res.status(400).json({
//                 message: code === 'LIMIT_FILE_SIZE' ? 'The logo is larger than 1 MB.' : 'The logo could not be read.',
//                 errors: { logo: code === 'LIMIT_FILE_SIZE' ? 'The logo is larger than 1 MB.' : 'The logo could not be read.' },
//             })
//         }
//         next()
//     })
// }

// // The file's real contents are checked, not its name. SVG is refused because it can carry scripts.
// function detectLogo(buf: Buffer): string | null {
//     if (buf.length > 12 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return 'image/png'
//     if (buf.length > 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'image/jpeg'
//     if (buf.length > 12 && buf.subarray(0, 4).toString('latin1') === 'RIFF' && buf.subarray(8, 12).toString('latin1') === 'WEBP') {
//         return 'image/webp'
//     }
//     return null
// }

// const fieldsSchema = z.object({
//     name: z.string().trim().min(2, 'Enter the partner name (at least 2 characters).').max(100, 'The name is too long.'),
//     description: z
//         .string()
//         .trim()
//         .min(10, 'Write a short paragraph (at least 10 characters).')
//         .max(600, 'The paragraph is too long (600 characters at most).'),
//     website: z
//         .string()
//         .trim()
//         .max(200, 'The website address is too long.')
//         .refine((v) => v === '' || /^https?:\/\/\S+\.\S+$/i.test(v), 'The website must start with http:// or https://')
//         .optional()
//         .default(''),
//     active: z.enum(['true', 'false']).optional().default('true'),
//     removeLogo: z.enum(['true', 'false']).optional().default('false'),
// })

// const idSchema = z.coerce
//     .number({ invalid_type_error: 'Partner not found.' })
//     .int('Partner not found.')
//     .positive('Partner not found.')

// const sendLogo = (res: Response, p: { logoData: Uint8Array | null; logoType: string | null }, cache: string) => {
//     if (!p.logoData || !p.logoType) throw new HttpError(404, 'Not found.')
//     res.set({ 'Content-Type': p.logoType, 'Cache-Control': cache, 'X-Content-Type-Options': 'nosniff' })
//     res.send(Buffer.from(p.logoData))
// }

// // The list never reads the logo bytes, only whether there is a logo.
// const listSelect = {
//     id: true,
//     name: true,
//     description: true,
//     website: true,
//     active: true,
//     sortOrder: true,
//     logoType: true,
//     logoVersion: true,
// } as const

// type Row = {
//     id: number
//     name: string
//     description: string
//     website: string | null
//     active: boolean
//     sortOrder: number
//     logoType: string | null
//     logoVersion: number
// }

// const adminRow = (p: Row) => ({
//     id: p.id,
//     name: p.name,
//     description: p.description,
//     website: p.website ?? '',
//     active: p.active,
//     sortOrder: p.sortOrder,
//     logoUrl: p.logoType ? `/api/admin/partners/${p.id}/logo?v=${p.logoVersion}` : null,
// })

// /* ============================ Admin ============================ */

// export const adminPartnersRouter = Router()
// adminPartnersRouter.use(requireAuth, requireRole('admin'))

// adminPartnersRouter.get('/', async (_req, res) => {
//     const rows = await prisma.partner.findMany({ orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }], select: listSelect })
//     res.json({ partners: rows.map(adminRow) })
// })

// adminPartnersRouter.get('/:id/logo', async (req, res) => {
//     const id = idSchema.parse(req.params.id)
//     const p = await prisma.partner.findUnique({ where: { id }, select: { logoData: true, logoType: true } })
//     if (!p) throw new HttpError(404, 'Not found.')
//     sendLogo(res, p, 'private, max-age=31536000, immutable')
// })

// adminPartnersRouter.post('/', logoUpload, async (req, res) => {
//     const body = fieldsSchema.parse(req.body)

//     let logoData: Buffer | null = null
//     let logoType: string | null = null
//     if (req.file) {
//         logoType = detectLogo(req.file.buffer)
//         if (!logoType) throw new HttpError(400, 'The logo must be a PNG, JPG or WebP picture.')
//         logoData = req.file.buffer
//     }

//     const last = await prisma.partner.aggregate({ _max: { sortOrder: true } })
//     const created = await prisma.partner.create({
//         data: {
//             name: body.name,
//             description: body.description,
//             website: body.website || null,
//             active: body.active === 'true',
//             sortOrder: (last._max.sortOrder ?? -1) + 1,
//             ...(logoData && logoType ? { logoData, logoType, logoVersion: 1 } : {}),
//         },
//         select: listSelect,
//     })

//     await prisma.activityLog.create({
//         data: { userId: req.user!.id, level: 'info', message: `Added partner "${created.name}" (#${created.id})` },
//     })
//     res.status(201).json({ partner: adminRow(created) })
// })

// // Update (sent as POST because the form carries a file)
// adminPartnersRouter.post('/:id', logoUpload, async (req, res) => {
//     const id = idSchema.parse(req.params.id)
//     const body = fieldsSchema.parse(req.body)

//     const current = await prisma.partner.findUnique({ where: { id }, select: { id: true, logoVersion: true } })
//     if (!current) throw new HttpError(404, 'Partner not found.')

//     let logo: { logoData: Buffer | null; logoType: string | null; logoVersion: number } | null = null
//     if (req.file) {
//         const type = detectLogo(req.file.buffer)
//         if (!type) throw new HttpError(400, 'The logo must be a PNG, JPG or WebP picture.')
//         logo = { logoData: req.file.buffer, logoType: type, logoVersion: current.logoVersion + 1 }
//     } else if (body.removeLogo === 'true') {
//         logo = { logoData: null, logoType: null, logoVersion: current.logoVersion + 1 }
//     }

//     const updated = await prisma.partner.update({
//         where: { id },
//         data: {
//             name: body.name,
//             description: body.description,
//             website: body.website || null,
//             active: body.active === 'true',
//             ...(logo ?? {}),
//         },
//         select: listSelect,
//     })

//     await prisma.activityLog.create({
//         data: { userId: req.user!.id, level: 'info', message: `Updated partner "${updated.name}" (#${id})` },
//     })
//     res.json({ partner: adminRow(updated) })
// })

// adminPartnersRouter.post('/:id/move', async (req, res) => {
//     const id = idSchema.parse(req.params.id)
//     const direction = z.enum(['up', 'down']).parse(req.body?.direction)

//     const all = await prisma.partner.findMany({ orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }], select: { id: true } })
//     const i = all.findIndex((p) => p.id === id)
//     if (i < 0) throw new HttpError(404, 'Partner not found.')
//     const j = direction === 'up' ? i - 1 : i + 1
//     if (j < 0 || j >= all.length) return res.json({ ok: true })

//     const order = all.map((p) => p.id)
//         ;[order[i], order[j]] = [order[j], order[i]]
//     await prisma.$transaction(order.map((pid, idx) => prisma.partner.update({ where: { id: pid }, data: { sortOrder: idx } })))
//     res.json({ ok: true })
// })

// // Delete (sent as POST, so hosts that block DELETE still work)
// adminPartnersRouter.post('/:id/delete', async (req, res) => {
//     const id = idSchema.parse(req.params.id)
//     const found = await prisma.partner.findUnique({ where: { id }, select: { name: true } })
//     if (!found) throw new HttpError(404, 'Partner not found.')
//     await prisma.partner.delete({ where: { id } })
//     await prisma.activityLog.create({
//         data: { userId: req.user!.id, level: 'warning', message: `Deleted partner "${found.name}" (#${id})` },
//     })
//     res.json({ ok: true })
// })

// /* ============================ Public (no login) ============================ */

// export const publicPartnersRouter = Router()

// publicPartnersRouter.get('/', async (_req, res) => {
//     const rows = await prisma.partner.findMany({
//         where: { active: true },
//         orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
//         select: listSelect,
//     })
//     res.json({
//         partners: rows.map((p) => ({
//             id: p.id,
//             name: p.name,
//             description: p.description,
//             website: p.website,
//             logoUrl: p.logoType ? `/api/public/partners/${p.id}/logo?v=${p.logoVersion}` : null,
//         })),
//     })
// })

// // The address contains the logo's version number, so the browser can keep it for a year
// // and still show the new one right after the admin changes it.
// publicPartnersRouter.get('/:id/logo', async (req, res) => {
//     const id = idSchema.parse(req.params.id)
//     const p = await prisma.partner.findFirst({ where: { id, active: true }, select: { logoData: true, logoType: true } })
//     if (!p) throw new HttpError(404, 'Not found.')
//     sendLogo(res, p, 'public, max-age=31536000, immutable')
// })

import { Router } from 'express'
import type { NextFunction, Request, Response } from 'express'
import multer from 'multer'
import { z } from 'zod'
import { prisma } from '../prisma'
import { requireAuth, requireRole } from '../middleware/auth'
import { HttpError } from '../utils/httpError'

const LOGO_MAX_BYTES = 1024 * 1024

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: LOGO_MAX_BYTES,
        files: 1,
    },
})

// Convert Node.js Buffer into a Prisma-compatible Uint8Array.
const toPrismaBytes = (buffer: Buffer): Uint8Array<ArrayBuffer> => {
    const copy = new Uint8Array(new ArrayBuffer(buffer.length))
    copy.set(buffer)
    return copy
}

// Reads a possible "logo" file and answers with a clear message when it is too big.
const logoUpload = (req: Request, res: Response, next: NextFunction) => {
    upload.single('logo')(req, res, (err: unknown) => {
        if (err) {
            const code = (err as { code?: string }).code

            return res.status(400).json({
                message:
                    code === 'LIMIT_FILE_SIZE'
                        ? 'The logo is larger than 1 MB.'
                        : 'The logo could not be read.',
                errors: {
                    logo:
                        code === 'LIMIT_FILE_SIZE'
                            ? 'The logo is larger than 1 MB.'
                            : 'The logo could not be read.',
                },
            })
        }

        next()
    })
}

// The file's real contents are checked, not its name.
// SVG is refused because it can carry scripts.
function detectLogo(buf: Buffer): string | null {
    if (
        buf.length > 12 &&
        buf[0] === 0x89 &&
        buf[1] === 0x50 &&
        buf[2] === 0x4e &&
        buf[3] === 0x47
    ) {
        return 'image/png'
    }

    if (
        buf.length > 3 &&
        buf[0] === 0xff &&
        buf[1] === 0xd8 &&
        buf[2] === 0xff
    ) {
        return 'image/jpeg'
    }

    if (
        buf.length > 12 &&
        buf.subarray(0, 4).toString('latin1') === 'RIFF' &&
        buf.subarray(8, 12).toString('latin1') === 'WEBP'
    ) {
        return 'image/webp'
    }

    return null
}

const fieldsSchema = z.object({
    name: z
        .string()
        .trim()
        .min(2, 'Enter the partner name (at least 2 characters).')
        .max(100, 'The name is too long.'),

    description: z
        .string()
        .trim()
        .min(10, 'Write a short paragraph (at least 10 characters).')
        .max(600, 'The paragraph is too long (600 characters at most).'),

    website: z
        .string()
        .trim()
        .max(200, 'The website address is too long.')
        .refine(
            (v) => v === '' || /^https?:\/\/\S+\.\S+$/i.test(v),
            'The website must start with http:// or https://'
        )
        .optional()
        .default(''),

    active: z.enum(['true', 'false']).optional().default('true'),

    removeLogo: z.enum(['true', 'false']).optional().default('false'),
})

const idSchema = z.coerce
    .number({ invalid_type_error: 'Partner not found.' })
    .int('Partner not found.')
    .positive('Partner not found.')

const sendLogo = (
    res: Response,
    p: { logoData: Uint8Array | null; logoType: string | null },
    cache: string
) => {
    if (!p.logoData || !p.logoType) {
        throw new HttpError(404, 'Not found.')
    }

    res.set({
        'Content-Type': p.logoType,
        'Cache-Control': cache,
        'X-Content-Type-Options': 'nosniff',
    })

    res.send(Buffer.from(p.logoData))
}

// The list never reads the logo bytes, only whether there is a logo.
const listSelect = {
    id: true,
    name: true,
    description: true,
    website: true,
    active: true,
    sortOrder: true,
    logoType: true,
    logoVersion: true,
} as const

type Row = {
    id: number
    name: string
    description: string
    website: string | null
    active: boolean
    sortOrder: number
    logoType: string | null
    logoVersion: number
}

const adminRow = (p: Row) => ({
    id: p.id,
    name: p.name,
    description: p.description,
    website: p.website ?? '',
    active: p.active,
    sortOrder: p.sortOrder,
    logoUrl: p.logoType
        ? `/api/admin/partners/${p.id}/logo?v=${p.logoVersion}`
        : null,
})

/* ============================ Admin ============================ */

export const adminPartnersRouter = Router()

adminPartnersRouter.use(requireAuth, requireRole('admin'))

// List all partners
adminPartnersRouter.get('/', async (_req, res) => {
    const rows = await prisma.partner.findMany({
        orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
        select: listSelect,
    })

    res.json({
        partners: rows.map(adminRow),
    })
})

// Get partner logo
adminPartnersRouter.get('/:id/logo', async (req, res) => {
    const id = idSchema.parse(req.params.id)

    const p = await prisma.partner.findUnique({
        where: { id },
        select: {
            logoData: true,
            logoType: true,
        },
    })

    if (!p) {
        throw new HttpError(404, 'Not found.')
    }

    sendLogo(res, p, 'private, max-age=31536000, immutable')
})

// Create partner
adminPartnersRouter.post('/', logoUpload, async (req, res) => {
    const body = fieldsSchema.parse(req.body)

    let logoData: Uint8Array<ArrayBuffer> | null = null
    let logoType: string | null = null

    if (req.file) {
        logoType = detectLogo(req.file.buffer)

        if (!logoType) {
            throw new HttpError(
                400,
                'The logo must be a PNG, JPG or WebP picture.'
            )
        }

        logoData = toPrismaBytes(req.file.buffer)
    }

    const last = await prisma.partner.aggregate({
        _max: {
            sortOrder: true,
        },
    })

    const created = await prisma.partner.create({
        data: {
            name: body.name,
            description: body.description,
            website: body.website || null,
            active: body.active === 'true',
            sortOrder: (last._max.sortOrder ?? -1) + 1,

            ...(logoData && logoType
                ? {
                    logoData,
                    logoType,
                    logoVersion: 1,
                }
                : {}),
        },
        select: listSelect,
    })

    await prisma.activityLog.create({
        data: {
            userId: req.user!.id,
            level: 'info',
            message: `Added partner "${created.name}" (#${created.id})`,
        },
    })

    res.status(201).json({
        partner: adminRow(created),
    })
})

// Update partner (POST because the form carries a file)
adminPartnersRouter.post('/:id', logoUpload, async (req, res) => {
    const id = idSchema.parse(req.params.id)
    const body = fieldsSchema.parse(req.body)

    const current = await prisma.partner.findUnique({
        where: { id },
        select: {
            id: true,
            logoVersion: true,
        },
    })

    if (!current) {
        throw new HttpError(404, 'Partner not found.')
    }

    let logo: {
        logoData: Uint8Array<ArrayBuffer> | null
        logoType: string | null
        logoVersion: number
    } | null = null

    if (req.file) {
        const type = detectLogo(req.file.buffer)

        if (!type) {
            throw new HttpError(
                400,
                'The logo must be a PNG, JPG or WebP picture.'
            )
        }

        logo = {
            logoData: toPrismaBytes(req.file.buffer),
            logoType: type,
            logoVersion: current.logoVersion + 1,
        }
    } else if (body.removeLogo === 'true') {
        logo = {
            logoData: null,
            logoType: null,
            logoVersion: current.logoVersion + 1,
        }
    }

    const updated = await prisma.partner.update({
        where: { id },
        data: {
            name: body.name,
            description: body.description,
            website: body.website || null,
            active: body.active === 'true',

            ...(logo ?? {}),
        },
        select: listSelect,
    })

    await prisma.activityLog.create({
        data: {
            userId: req.user!.id,
            level: 'info',
            message: `Updated partner "${updated.name}" (#${id})`,
        },
    })

    res.json({
        partner: adminRow(updated),
    })
})

// Move partner up or down
adminPartnersRouter.post('/:id/move', async (req, res) => {
    const id = idSchema.parse(req.params.id)

    const direction = z
        .enum(['up', 'down'])
        .parse(req.body?.direction)

    const all = await prisma.partner.findMany({
        orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
        select: {
            id: true,
        },
    })

    const i = all.findIndex((p) => p.id === id)

    if (i < 0) {
        throw new HttpError(404, 'Partner not found.')
    }

    const j = direction === 'up' ? i - 1 : i + 1

    if (j < 0 || j >= all.length) {
        return res.json({ ok: true })
    }

    const order = all.map((p) => p.id)

        ;[order[i], order[j]] = [order[j], order[i]]

    await prisma.$transaction(
        order.map((pid, idx) =>
            prisma.partner.update({
                where: { id: pid },
                data: { sortOrder: idx },
            })
        )
    )

    res.json({ ok: true })
})

// Delete partner
adminPartnersRouter.post('/:id/delete', async (req, res) => {
    const id = idSchema.parse(req.params.id)

    const found = await prisma.partner.findUnique({
        where: { id },
        select: {
            name: true,
        },
    })

    if (!found) {
        throw new HttpError(404, 'Partner not found.')
    }

    await prisma.partner.delete({
        where: { id },
    })

    await prisma.activityLog.create({
        data: {
            userId: req.user!.id,
            level: 'warning',
            message: `Deleted partner "${found.name}" (#${id})`,
        },
    })

    res.json({ ok: true })
})

/* ============================ Public (no login) ============================ */

export const publicPartnersRouter = Router()

// List active partners
publicPartnersRouter.get('/', async (_req, res) => {
    const rows = await prisma.partner.findMany({
        where: { active: true },
        orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
        select: listSelect,
    })

    res.json({
        partners: rows.map((p) => ({
            id: p.id,
            name: p.name,
            description: p.description,
            website: p.website,
            logoUrl: p.logoType
                ? `/api/public/partners/${p.id}/logo?v=${p.logoVersion}`
                : null,
        })),
    })
})

// Get public partner logo
publicPartnersRouter.get('/:id/logo', async (req, res) => {
    const id = idSchema.parse(req.params.id)

    const p = await prisma.partner.findFirst({
        where: {
            id,
            active: true,
        },
        select: {
            logoData: true,
            logoType: true,
        },
    })

    if (!p) {
        throw new HttpError(404, 'Not found.')
    }

    sendLogo(res, p, 'public, max-age=31536000, immutable')
})

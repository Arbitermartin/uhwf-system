import { Router } from 'express'
import multer from 'multer'
import { z } from 'zod'
import { prisma } from '../prisma'
import { requireAuth } from '../middleware/auth'
import { HttpError } from '../utils/httpError'
import { detectFileType, removeUpload, saveUpload } from '../services/files'
import { toPublicUser } from '../services/publicUser'

const router = Router()

// Every signed-in person manages their own profile. Nothing here takes a user id from the
// request: it always means "the person who is signed in".
router.use(requireAuth)

const PHOTO_MAX_BYTES = 2 * 1024 * 1024

const photoUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: PHOTO_MAX_BYTES, files: 1 },
})

const PHONE = /^[+\d\s-]{9,16}$/

// Email, role and status are not here: only an administrator can change those.
const updateSchema = z.object({
    fullName: z.string().trim().min(2, 'Enter your full name.').max(100, 'The name is too long.'),
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
})

async function loadProfile(userId: number) {
    const u = await prisma.user.findUniqueOrThrow({
        where: { id: userId },
        include: {
            studentProfile: { select: { regNumber: true, programme: true, yearOfStudy: true, admittedAt: true } },
            lecturerProfile: { select: { staffId: true, qualification: true, department: { select: { name: true } } } },
            employeeProfile: {
                select: {
                    staffId: true,
                    position: true,
                    department: { select: { name: true } },
                    supervisor: { select: { fullName: true } },
                },
            },
        },
    })

    const pub = toPublicUser(u)
    return {
        user: pub,
        profile: {
            id: u.id,
            fullName: u.fullName,
            email: u.email,
            phone: u.phone,
            gender: u.gender,
            role: u.role,
            status: u.status,
            photo: pub.photo,
            createdAt: u.createdAt,
            lastLoginAt: u.lastLoginAt,
            student: u.studentProfile,
            lecturer: u.lecturerProfile
                ? {
                    staffId: u.lecturerProfile.staffId,
                    qualification: u.lecturerProfile.qualification,
                    department: u.lecturerProfile.department.name,
                }
                : null,
            employee: u.employeeProfile
                ? {
                    staffId: u.employeeProfile.staffId,
                    position: u.employeeProfile.position,
                    department: u.employeeProfile.department.name,
                    supervisor: u.employeeProfile.supervisor?.fullName ?? null,
                }
                : null,
        },
    }
}

router.get('/', async (req, res) => {
    res.json(await loadProfile(req.user!.id))
})

router.patch('/', async (req, res) => {
    const body = updateSchema.parse(req.body)
    await prisma.user.update({
        where: { id: req.user!.id },
        data: { fullName: body.fullName, phone: body.phone, gender: body.gender },
    })
    res.json(await loadProfile(req.user!.id))
})

// Only JPG and PNG pictures, up to 2 MB. The file's real contents are checked, not its name.
router.post('/photo', photoUpload.single('file'), async (req, res) => {
    const file = req.file
    if (!file) throw new HttpError(400, 'Choose a picture to upload.')

    const detected = detectFileType(file.buffer)
    if (!detected || detected.ext === 'pdf') throw new HttpError(400, 'Use a JPG or PNG picture.')

    const userId = req.user!.id
    const previous = await prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { photoUrl: true } })

    const stored = await saveUpload('profile', `user${userId}`, file.buffer, detected.ext)
    try {
        await prisma.user.update({ where: { id: userId }, data: { photoUrl: stored } })
    } catch (err) {
        await removeUpload(stored) // do not leave a file nobody points to
        throw err
    }
    if (previous.photoUrl) await removeUpload(previous.photoUrl)

    res.json(await loadProfile(userId))
})

router.delete('/photo', async (req, res) => {
    const userId = req.user!.id
    const current = await prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { photoUrl: true } })

    await prisma.user.update({ where: { id: userId }, data: { photoUrl: null } })
    if (current.photoUrl) await removeUpload(current.photoUrl)

    res.json(await loadProfile(userId))
})

export default router

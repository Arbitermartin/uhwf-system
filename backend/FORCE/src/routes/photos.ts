import { Router } from 'express'
import path from 'node:path'
import { z } from 'zod'
import { prisma } from '../prisma'
import { requireAuth } from '../middleware/auth'
import { HttpError } from '../utils/httpError'
import { resolveUpload } from '../services/files'

const router = Router()

router.use(requireAuth)

const idSchema = z.coerce
    .number({ invalid_type_error: 'Invalid user id.' })
    .int('Invalid user id.')
    .positive('Invalid user id.')

// A profile picture can be seen by its owner and by administrators. Everyone else gets "not found",
// so nobody can tell whether another person has a picture.
router.get('/:userId', async (req, res) => {
    const userId = idSchema.parse(req.params.userId)
    const viewer = req.user!

    if (viewer.id !== userId && viewer.role !== 'admin') throw new HttpError(404, 'Photo not found.')

    const user = await prisma.user.findUnique({ where: { id: userId }, select: { photoUrl: true } })
    if (!user?.photoUrl) throw new HttpError(404, 'Photo not found.')

    const file = resolveUpload(user.photoUrl)
    res.setHeader('Cache-Control', 'private, max-age=3600')
    res.type(path.extname(file))
    res.sendFile(file, (err) => {
        if (err && !res.headersSent) res.status(404).json({ message: 'Photo not found.' })
    })
})

export default router

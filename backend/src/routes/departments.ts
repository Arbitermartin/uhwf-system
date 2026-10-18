import { Router } from 'express'
import { prisma } from '../prisma'
import { requireAuth, requireRole } from '../middleware/auth'

const router = Router()
router.use(requireAuth, requireRole('admin'))

// Used by the admin Edit User form to fill the department dropdown.
router.get('/', async (_req, res) => {
    const departments = await prisma.department.findMany({
        orderBy: { name: 'asc' },
        select: { id: true, name: true },
    })
    res.json({ departments })
})

export default router
import { Router } from 'express'
import { isMaintenanceOn } from '../services/system'

const router = Router()

// Public: the website reads this to show a notice while ICT is working on the system.
router.get('/', async (_req, res) => {
    res.json({ on: await isMaintenanceOn() })
})

export default router

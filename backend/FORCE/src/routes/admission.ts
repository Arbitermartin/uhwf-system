import { Router } from 'express'
import { getAdmission } from '../services/admission'

const router = Router()

// Public: the Admission page reads this to show "open", "opens soon" or "closed".
router.get('/', async (_req, res) => {
  res.json(await getAdmission())
})

export default router

import { Router } from 'express'

import { matchJobs, getMatchedJobs } from '../controllers/job.controller.js'
import { authenticate } from '../middleware/auth.js'

const router = Router()

router.use(authenticate)

router.post('/match', matchJobs)
router.get('/matched', getMatchedJobs)

export default router

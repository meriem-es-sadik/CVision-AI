import { Router } from 'express'

import {
  analyzeResume,
  getAnalysisHistory,
  getResumeAnalysis,
} from '../controllers/analysis.controller.js'
import { authenticate } from '../middleware/auth.js'

const router = Router()

router.use(authenticate)

// Declared before `/:resumeId` so "history" is never treated as a resume id.
router.get('/history', getAnalysisHistory)
router.get('/:resumeId', getResumeAnalysis)
router.post('/:resumeId', analyzeResume)

export default router

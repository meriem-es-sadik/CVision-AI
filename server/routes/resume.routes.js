import { Router } from 'express'

import {
  uploadResume,
  getResumes,
  getResumeById,
  deleteResume,
} from '../controllers/resume.controller.js'
import { authenticate } from '../middleware/auth.js'
import { uploadLimiter } from '../middleware/rateLimiter.js'
import { uploadResume as uploadMiddleware } from '../middleware/multer.js'

const router = Router()

router.use(authenticate)

router.post('/upload', uploadLimiter, uploadMiddleware.single('resume'), uploadResume)
router.get('/', getResumes)
router.get('/:id', getResumeById)
router.delete('/:id', deleteResume)

// AI analysis lives under /api/analysis/:resumeId.

export default router

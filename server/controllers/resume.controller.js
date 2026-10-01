// Resume controllers - upload, listing, detail and delete with ownership checks.
import fs from 'node:fs/promises'
import mongoose from 'mongoose'

import { Analysis } from '../models/Analysis.js'
import { Resume, EXTRACTION_STATUS } from '../models/Resume.js'
import { extractDocumentText } from '../services/documentService.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { sendSuccess } from '../utils/ApiResponse.js'
import { ApiError } from '../utils/ApiError.js'
import { logger } from '../utils/logger.js'

const TEXT_PREVIEW_LENGTH = 500

function toValidObjectId(value) {
  return mongoose.isValidObjectId(value) ? value : null
}

async function findOwnedResume(id, userId) {
  const objectId = toValidObjectId(id)
  if (!objectId) return null
  return Resume.findOne({ _id: objectId, user: userId })
}

export const uploadResume = asyncHandler(async (req, res) => {
  const file = req.file

  if (!file) {
    throw ApiError.badRequest(
      'No resume file was received. Attach a PDF or DOCX file to the "resume" field.',
      { code: 'NO_FILE_UPLOADED' },
    )
  }

  const resume = await Resume.create({
    user: req.user._id,
    originalName: file.originalname,
    fileName: file.filename,
    filePath: file.path,
    mimeType: file.mimetype,
    sizeBytes: file.size,
    extractionStatus: EXTRACTION_STATUS.PROCESSING,
    extractedText: '',
  })

  try {
    const result = await extractDocumentText(file.path, file.mimetype)

    resume.extractedText = result.text
    resume.extractionStatus = EXTRACTION_STATUS.COMPLETED
    resume.extractionError = ''
  } catch (err) {
    logger.warn(`[resume] extraction failed for ${resume._id}: ${err?.message}`)
    resume.extractionStatus = EXTRACTION_STATUS.FAILED
    resume.extractionError = err?.message || 'The resume could not be parsed.'
  }

  await resume.save()

  const completed = resume.extractionStatus === EXTRACTION_STATUS.COMPLETED

  return sendSuccess(res, {
    statusCode: 201,
    message: completed
      ? 'Resume uploaded and parsed successfully'
      : 'Resume uploaded, but text extraction failed',
    data: {
      resume: {
        ...resume.toResumeSummary(),
        textPreview: resume.extractedText.slice(0, TEXT_PREVIEW_LENGTH),
      },
    },
  })
})

export const getResumes = asyncHandler(async (req, res) => {
  const resumes = await Resume.find({ user: req.user._id })
    .sort({ createdAt: -1 })
    .select('-extractedText -matchedJobs')

  return sendSuccess(res, {
    message: 'Fetched resumes',
    data: resumes.map((resume) => resume.toResumeSummary()),
  })
})

export const getResumeById = asyncHandler(async (req, res) => {
  const resume = await findOwnedResume(req.params.id, req.user._id)

  if (!resume) {
    throw ApiError.notFound('Resume not found', { code: 'RESUME_NOT_FOUND' })
  }

  return sendSuccess(res, {
    message: 'Fetched resume',
    data: { resume: resume.toResumeDetail() },
  })
})

export const deleteResume = asyncHandler(async (req, res) => {
  const resume = await findOwnedResume(req.params.id, req.user._id)

  if (!resume) {
    throw ApiError.notFound('Resume not found', { code: 'RESUME_NOT_FOUND' })
  }

  await Resume.deleteOne({ _id: resume._id })
  // Analyses belong to the resume, so they must not outlive it.
  await Analysis.deleteMany({ resume: resume._id, user: req.user._id })

  // Best-effort file removal. A missing file is not an error worth surfacing.
  if (resume.filePath) {
    try {
      await fs.unlink(resume.filePath)
    } catch (err) {
      if (err?.code !== 'ENOENT') {
        logger.warn(`[resume] could not remove stored file for ${resume._id}: ${err?.message}`)
      }
    }
  }

  return sendSuccess(res, {
    message: 'Resume deleted',
    data: { id: resume._id.toString() },
  })
})
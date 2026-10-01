// Analysis controllers - run and read AI CV analyses.
//
// Ownership is enforced on every read and write: a resume is only ever looked up
// by `_id` AND the authenticated user's id, so an id belonging to somebody else
// is indistinguishable from one that does not exist.
import mongoose from 'mongoose'

import { analyzeResume as runAiAnalysis } from '../services/ai.service.js'
import { buildScoreResult } from '../services/scoreService.js'
import { Analysis } from '../models/Analysis.js'
import { EXTRACTION_STATUS, Resume } from '../models/Resume.js'
import { ApiError } from '../utils/ApiError.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { sendSuccess } from '../utils/ApiResponse.js'
import { logger } from '../utils/logger.js'

const HISTORY_LIMIT = 50

/**
 * In-flight guard. Analysis costs a paid provider call and takes seconds, so a
 * double click (or a retried request) must not start a second run for the same
 * resume. This is per-process: a multi-instance deployment would additionally
 * want a shared lock, which is out of scope for the current architecture.
 */
const inFlightAnalyses = new Set()

function lockKey(userId, resumeId) {
  return `${userId}:${resumeId}`
}

function findOwnedResume(resumeId, userId) {
  if (!mongoose.isValidObjectId(resumeId)) return null
  return Resume.findOne({ _id: resumeId, user: userId })
}

/**
 * POST /api/analysis/:resumeId
 *
 * Runs the AI review, derives the deterministic overall score from the section
 * scores and stores the result. A new Analysis document is only created after a
 * successful, validated provider response - a failed run never persists partial
 * data.
 */
export const analyzeResume = asyncHandler(async (req, res) => {
  const { resumeId } = req.params
  const resume = await findOwnedResume(resumeId, req.user._id)

  if (!resume) {
    throw ApiError.notFound('Resume not found', { code: 'RESUME_NOT_FOUND' })
  }

  if (resume.extractionStatus !== EXTRACTION_STATUS.COMPLETED) {
    throw ApiError.conflict(
      'This resume has not finished text extraction yet, so it cannot be analysed.',
      { code: 'RESUME_NOT_READY' },
    )
  }

  if (!resume.extractedText?.trim()) {
    throw ApiError.conflict('No text could be extracted from this resume, so it cannot be analysed.', {
      code: 'RESUME_TEXT_MISSING',
    })
  }

  const key = lockKey(req.user._id, resume._id)

  if (inFlightAnalyses.has(key)) {
    throw ApiError.conflict('An analysis for this resume is already running. Please wait for it to finish.', {
      code: 'ANALYSIS_IN_PROGRESS',
    })
  }

  inFlightAnalyses.add(key)

  let analysisResult

  try {
    analysisResult = await runAiAnalysis(resume.extractedText)
  } catch (err) {
    // Nothing is written on failure; the resume keeps its previous analysis.
    logger.warn(`[analysis] analysis failed for resume ${resume._id}: ${err?.code ?? err?.message}`)
    throw err
  } finally {
    inFlightAnalyses.delete(key)
  }

  // The overall score is computed here, never read from the provider.
  const { sectionScores, overallScore } = buildScoreResult(analysisResult.analysis.sectionScores)

  const analysis = await Analysis.create({
    user: req.user._id,
    resume: resume._id,
    overallScore,
    sectionScores,
    skills: analysisResult.analysis.skills,
    strengths: analysisResult.analysis.strengths,
    weaknesses: analysisResult.analysis.weaknesses,
    recommendations: analysisResult.analysis.recommendations,
    summaryFeedback: analysisResult.analysis.summaryFeedback,
    atsFeedback: analysisResult.analysis.atsFeedback,
    model: analysisResult.model,
    analyzedChars: analysisResult.analyzedChars,
  })

  // Lightweight pointer on the resume so list views can show "analysed" and the
  // latest score without joining the analyses collection.
  resume.analysis = {
    analysisId: analysis._id.toString(),
    overallScore,
    analyzedAt: analysis.createdAt,
  }
  await resume.save()

  logger.info(`[analysis] stored analysis ${analysis._id} for resume ${resume._id}`)

  // Denormalise the filename so the response matches the GET/history shape.
  await analysis.populate('resume', 'originalName')

  return sendSuccess(res, {
    statusCode: 201,
    message: 'CV analysis completed',
    data: { analysis: analysis.toAnalysisJSON() },
  })
})

/**
 * GET /api/analysis/:resumeId
 *
 * Returns the most recent analysis for a resume owned by the caller.
 */
export const getResumeAnalysis = asyncHandler(async (req, res) => {
  const { resumeId } = req.params

  if (!mongoose.isValidObjectId(resumeId)) {
    throw ApiError.notFound('Resume not found', { code: 'RESUME_NOT_FOUND' })
  }

  const analysis = await Analysis.findOne({ resume: resumeId, user: req.user._id })
    .sort({ createdAt: -1 })
    .populate('resume', 'originalName')

  if (!analysis) {
    throw ApiError.notFound('No analysis exists for this resume yet', {
      code: 'ANALYSIS_NOT_FOUND',
    })
  }

  return sendSuccess(res, {
    message: 'Fetched resume analysis',
    data: { analysis: analysis.toAnalysisJSON() },
  })
})

/**
 * GET /api/analysis/history
 *
 * The caller's analysis history, newest first, with the resume filename
 * denormalised by the populate above.
 */
export const getAnalysisHistory = asyncHandler(async (req, res) => {
  const analyses = await Analysis.find({ user: req.user._id })
    .sort({ createdAt: -1 })
    .limit(HISTORY_LIMIT)
    .populate('resume', 'originalName')

  return sendSuccess(res, {
    message: 'Fetched analysis history',
    data: analyses.map((analysis) => analysis.toAnalysisJSON()),
  })
})

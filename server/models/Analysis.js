import mongoose from 'mongoose'

import { SECTION_WEIGHTS } from '../services/scoreService.js'

/**
 * Section scores are always stored on the same 0-100 scale. The keys are derived
 * from the weight map so the model and the scorer can never drift apart.
 */
const sectionScoresSchema = new mongoose.Schema(
  Object.fromEntries(Object.keys(SECTION_WEIGHTS).map((key) => [key, { type: Number, default: 0 }])),
  { _id: false },
)

const skillsSchema = new mongoose.Schema(
  {
    technical: { type: [String], default: [] },
    soft: { type: [String], default: [] },
    languages: { type: [String], default: [] },
    tools: { type: [String], default: [] },
  },
  { _id: false },
)

const titledItemSchema = new mongoose.Schema(
  {
    title: { type: String, default: '' },
    description: { type: String, default: '' },
  },
  { _id: false },
)

const prioritizedItemSchema = new mongoose.Schema(
  {
    title: { type: String, default: '' },
    description: { type: String, default: '' },
    priority: { type: String, enum: ['high', 'medium', 'low'], default: 'medium' },
  },
  { _id: false },
)

const summaryFeedbackSchema = new mongoose.Schema(
  {
    currentAssessment: { type: String, default: '' },
    suggestedImprovement: { type: String, default: '' },
  },
  { _id: false },
)

const atsFeedbackSchema = new mongoose.Schema(
  {
    readability: { type: String, default: '' },
    keywordUsage: { type: String, default: '' },
    formatting: { type: String, default: '' },
    issues: { type: [String], default: [] },
  },
  { _id: false },
)

const analysisSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    resume: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Resume',
      required: true,
      index: true,
    },
    // Deterministic, backend-calculated. Never sourced from the AI response.
    overallScore: { type: Number, required: true, min: 0, max: 100 },
    sectionScores: { type: sectionScoresSchema, required: true },
    skills: { type: skillsSchema, default: () => ({}) },
    strengths: { type: [titledItemSchema], default: [] },
    weaknesses: { type: [prioritizedItemSchema], default: [] },
    recommendations: { type: [prioritizedItemSchema], default: [] },
    summaryFeedback: { type: summaryFeedbackSchema, default: () => ({}) },
    atsFeedback: { type: atsFeedbackSchema, default: () => ({}) },
    // Provenance for debugging. Never contains prompt or CV text.
    model: { type: String, default: '' },
    analyzedChars: { type: Number, default: 0 },
  },
  { timestamps: true },
)

analysisSchema.index({ user: 1, createdAt: -1 })
analysisSchema.index({ user: 1, resume: 1, createdAt: -1 })

analysisSchema.set('toJSON', {
  virtuals: true,
  transform(_doc, ret) {
    ret.id = ret._id?.toString()
    delete ret._id
    delete ret.__v
    return ret
  },
})

/**
 * API shape. `resumeId` and `resumeName` are denormalised here (when the
 * resume was populated) so the history list needs a single query.
 */
analysisSchema.methods.toAnalysisJSON = function toAnalysisJSON() {
  const resumeName = this.resume?.originalName ?? null

  return {
    id: this._id.toString(),
    resumeId: (this.resume?._id ?? this.resume)?.toString?.() ?? null,
    resumeName,
    overallScore: this.overallScore,
    sectionScores: this.sectionScores,
    skills: this.skills,
    strengths: this.strengths,
    weaknesses: this.weaknesses,
    recommendations: this.recommendations,
    summaryFeedback: this.summaryFeedback,
    atsFeedback: this.atsFeedback,
    model: this.model,
    analyzedChars: this.analyzedChars,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  }
}

export const Analysis = mongoose.model('Analysis', analysisSchema)

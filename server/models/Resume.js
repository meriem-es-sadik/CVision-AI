import mongoose from 'mongoose'

export const EXTRACTION_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
}

export const EXTRACTION_STATUS_VALUES = Object.values(EXTRACTION_STATUS)

const resumeSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    originalName: { type: String, required: true },
    fileName: { type: String, required: true },
    // Absolute path on the server filesystem. Never exposed to API clients.
    filePath: { type: String, required: true },
    mimeType: { type: String, required: true },
    sizeBytes: { type: Number, required: true },
    extractedText: { type: String, default: '' },
    extractionStatus: {
      type: String,
      enum: EXTRACTION_STATUS_VALUES,
      default: EXTRACTION_STATUS.PENDING,
      index: true,
    },
    extractionError: { type: String, default: '' },
    /**
     * Lightweight pointer to the most recent Analysis, written after a
     * successful AI run so list views can show "analysed" and the latest score
     * without joining the analyses collection. The full analysis lives in its
     * own document.
     */
    analysis: { type: mongoose.Schema.Types.Mixed, default: null },
    matchedJobs: [{ type: mongoose.Schema.Types.Mixed }],
    uploadedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
)

/**
 * Public summary shape for list views. Keeps filesystem details and the full
 * extracted payload out of API responses.
 */
resumeSchema.methods.toResumeSummary = function toResumeSummary() {
  // Only real, stored values are exposed: no score is invented for a resume
  // that has never been analysed.
  const analysisId = this.analysis?.analysisId ?? null
  const analyzedAt = this.analysis?.analyzedAt ?? null
  const overallScore =
    typeof this.analysis?.overallScore === 'number' ? this.analysis.overallScore : null

  return {
    id: this._id.toString(),
    originalName: this.originalName,
    mimeType: this.mimeType,
    sizeBytes: this.sizeBytes,
    extractionStatus: this.extractionStatus,
    extractionError: this.extractionError || null,
    hasAnalysis: Boolean(analysisId),
    analysisId,
    overallScore,
    analyzedAt,
    uploadedAt: this.uploadedAt,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  }
}

/**
 * Public detail shape for the resume detail endpoint. Includes a bounded text
 * preview rather than the full extracted document.
 */
resumeSchema.methods.toResumeDetail = function toResumeDetail() {
  const text = this.extractedText || ''
  return {
    ...this.toResumeSummary(),
    textPreview: text.slice(0, 4000),
    textLength: text.length,
  }
}

export const Resume = mongoose.model('Resume', resumeSchema)
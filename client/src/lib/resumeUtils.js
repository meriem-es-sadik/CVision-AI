import { CheckCircle2, Clock3, LoaderCircle, XCircle } from 'lucide-react'

export const MAX_RESUME_SIZE = 5 * 1024 * 1024 // 5 MB
export const ACCEPTED_EXTENSIONS = ['.pdf', '.docx']
export const ACCEPT_MIME_HINTS =
  'application/pdf,.pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.docx'

/** Validates a resume file on the client before it is uploaded. Returns an error message or ''. */
export function validateResumeFile(file) {
  if (!file) return 'Please choose a file to upload'

  const name = String(file.name ?? '')
  const ext = name.toLowerCase().slice(name.lastIndexOf('.'))

  if (!ACCEPTED_EXTENSIONS.includes(ext)) {
    return 'Unsupported file type. Upload a PDF or DOCX resume.'
  }

  if (!Number.isFinite(file.size) || file.size > MAX_RESUME_SIZE) {
    return 'File is too large. The maximum allowed size is 5 MB.'
  }

  if (file.size <= 0) {
    return 'The selected file appears to be empty.'
  }

  return ''
}

export const EXTRACTION_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
}

export function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes < 0) return '0 B'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

export function formatUploadDate(value) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

/** Maps an extraction status to a friendly label, icon and Badge/UI tone. */
export function getExtractionStatusMeta(status) {
  switch (status) {
    case EXTRACTION_STATUS.PROCESSING:
    case EXTRACTION_STATUS.PENDING:
      return {
        label: status === EXTRACTION_STATUS.PROCESSING ? 'Processing' : 'Waiting',
        icon: LoaderCircle,
        tone: 'warning',
        spinner: true,
      }
    case EXTRACTION_STATUS.COMPLETED:
      return { label: 'Extracted', icon: CheckCircle2, tone: 'success', spinner: false }
    case EXTRACTION_STATUS.FAILED:
      return { label: 'Extraction failed', icon: XCircle, tone: 'destructive', spinner: false }
    default:
      return { label: 'Unknown', icon: Clock3, tone: 'muted', spinner: false }
  }
}

export function getMimeTypeLabel(mimeType) {
  if (!mimeType) return 'Document'
  if (mimeType.includes('pdf')) return 'PDF'
  if (mimeType.includes('word') || mimeType.includes('officedocument')) return 'DOCX'
  return mimeType
}
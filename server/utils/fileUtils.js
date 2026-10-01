// Only PDF and DOCX are accepted for resume uploads.
const SUPPORTED_EXTENSIONS = new Set(['.pdf', '.docx'])

export function getFileExtension(filename = '') {
  const dotIndex = filename.lastIndexOf('.')
  if (dotIndex === -1) return ''
  return filename.slice(dotIndex).toLowerCase()
}

export function isSupportedResumeFile(filename = '', mimetype = '') {
  const ext = getFileExtension(filename)
  if (SUPPORTED_EXTENSIONS.has(ext)) return true

  if (mimetype) {
    return (
      mimetype.includes('pdf') ||
      mimetype.includes('word') ||
      mimetype.includes('msword') ||
      mimetype.includes('officedocument')
    )
  }

  return false
}

export function sanitizeFilename(filename = '') {
  return filename
    .normalize('NFKD')
    .replace(/[^\w.\- ]/g, '')
    .trim()
    .replace(/\s+/g, ' ')
}

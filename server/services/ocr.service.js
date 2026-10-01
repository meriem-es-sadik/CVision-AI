// OCR service - lightweight abstraction.
//
// Normal text-based PDF/DOCX resumes are handled entirely by the document
// extraction service (pdf-parse / mammoth). OCR is deliberately NOT wired to a
// heavy external dependency for this stage. This module exists so the pipeline
// has a single, honest place to report image-only documents and to grow an OCR
// implementation later without touching the controller.

export const OCR_AVAILABLE = false

/** Whether the current deployment can fall back to OCR. */
export function isOcrEnabled() {
  return OCR_AVAILABLE
}

/** True when a document has text a downstream consumer can actually use. */
export function hasExtractableText(text) {
  return typeof text === 'string' && text.trim().length > 0
}

/**
 * Message returned when a document yields no extractable text. States plainly
 * that OCR is not enabled instead of pretending recognition succeeded.
 */
export function describeMissingText(format, { pageCount = null, ocrAvailable = OCR_AVAILABLE } = {}) {
  const pages = pageCount ? ` It reports ${pageCount} page${pageCount === 1 ? '' : 's'}.` : ''
  const hint = ocrAvailable
    ? 'Try re-uploading a text-based version of the file.'
    : 'It may be a scanned or image-only file, and OCR is not enabled on this deployment yet.'

  return `No text could be extracted from this ${format} document.${pages} ${hint}`
}
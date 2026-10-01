// Resume text extraction - thin facade over the document service so any code
// that already imported `extractResumeText` keeps working.
import { extractDocumentText } from './documentService.js'

export { extractDocumentText }

/**
 * Back-compat wrapper: extracts text only (discards metadata) from a resume.
 */
export async function extractResumeText(filePath, mimeType = '') {
  const result = await extractDocumentText(filePath, mimeType)
  return { ext: result.format === 'pdf' ? '.pdf' : '.docx', text: result.text }
}
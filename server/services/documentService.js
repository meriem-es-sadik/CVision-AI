// Document text extraction for uploaded resumes.
//
// Supports:
//  - PDF  -> pdf-parse
//  - DOCX -> mammoth
//
// This is intentionally a pure extraction layer: it reads a file that multer
// already validated and stored, and returns normalized text plus metadata. Any
// scanner-only / image-only PDFs are reported through `noExtractableText`.
import fs from 'node:fs/promises'
import path from 'node:path'

import pdfParse from 'pdf-parse'
import mammoth from 'mammoth'

import { OCR_AVAILABLE, describeMissingText } from './ocr.service.js'

export const PDF_FORMAT = 'pdf'
export const DOCX_FORMAT = 'docx'

const PDF_MIMETYPE = 'application/pdf'
const DOCX_MIMETYPE = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'

export function detectDocumentFormat(mimeType, filePath) {
  const type = String(mimeType || '').toLowerCase()
  const extension = path.extname(String(filePath || '')).toLowerCase()

  if (type === PDF_MIMETYPE || type.includes('pdf') || extension === '.pdf') return PDF_FORMAT
  if (type === DOCX_MIMETYPE || type.includes('word') || type.includes('officedocument') || extension === '.docx') {
    return DOCX_FORMAT
  }

  throw new Error('Unsupported document type. Only PDF and DOCX are supported.')
}

/**
 * Collapses excessive whitespace while preserving paragraph structure, so the
 * extracted text stays readable and cheap to analyze.
 */
function normalizeText(text) {
  return String(text ?? '')
    .replace(/\u0000/g, '')
    .split('\n')
    .map((line) => line.replace(/[ \t]+/g, ' ').trim())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

async function extractPdf(filePath) {
  const buffer = await fs.readFile(filePath)
  // pdf-parse (pdf.js v1.10.100) rejects a raw Node Buffer with "bad XRef
  // entry"; a fresh plain Uint8Array copy parses fine.
  const parsed = await pdfParse(new Uint8Array(buffer))

  return {
    text: parsed.text ?? '',
    pageCount: parsed.numpages ?? null,
  }
}

async function extractDocx(filePath) {
  const result = await mammoth.extractRawText({ path: filePath })

  return {
    text: result.value ?? '',
    messages: (result.messages ?? []).map((entry) => entry.message).filter(Boolean),
  }
}

/**
 * Extracts and normalizes the text from an uploaded resume file.
 *
 * @param {string} filePath  Absolute path to the stored file.
 * @param {string} mimeType  Declared mimetype of the file.
 * @returns {Promise<{ format: string, text: string, pageCount: number|null, wordCount: number, charCount: number, messages: string[], method: string }>}
 * @throws {Error} when the type is unsupported or parsing fails.
 */
export async function extractDocumentText(filePath, mimeType) {
  const format = detectDocumentFormat(mimeType, filePath)

  let pageCount = null
  let messages = []
  let rawText = ''

  if (format === PDF_FORMAT) {
    const result = await extractPdf(filePath)
    pageCount = result.pageCount
    rawText = result.text
  } else {
    const result = await extractDocx(filePath)
    rawText = result.text
    messages = result.messages
  }

  const text = normalizeText(rawText)

  if (!text) {
    // No extractable text: the file is almost certainly a scanned/image-only
    // PDF and OCR is not enabled in this deployment. Never pretend success.
    throw new Error(describeMissingText(format, { pageCount, ocrAvailable: OCR_AVAILABLE }))
  }

  return {
    format,
    text,
    pageCount,
    wordCount: text.split(/\s+/).length,
    charCount: text.length,
    messages,
    method: 'text-extraction',
  }
}
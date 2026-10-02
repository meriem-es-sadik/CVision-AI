import multer from 'multer'
import path from 'node:path'
import { randomUUID } from 'node:crypto'
import fs from 'node:fs/promises'

import { env } from '../config/env.js'
import { ApiError } from '../utils/ApiError.js'
import { logger } from '../utils/logger.js'

// Only PDF and DOCX are accepted. The stored extension is derived from the
// declared mimetype, never from the client-supplied filename.
const MIME_EXTENSION_MAP = {
  'application/pdf': '.pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
}

const ALLOWED_MIMETYPES = new Set(Object.keys(MIME_EXTENSION_MAP))

// Fallback directory for serverless environments where the configured
// upload directory might be on a read-only filesystem.
const FALLBACK_UPLOAD_DIR = '/tmp/uploads'

// Lazily ensure the upload directory exists. This avoids top-level await that
// crashes on Vercel's read-only filesystem during module import.
// If the configured directory fails (e.g., read-only on Vercel), fall back to /tmp.
let uploadDirReady = false
let activeUploadDir = ''
async function ensureUploadDir() {
  if (uploadDirReady) return activeUploadDir

  const tryDir = async (dir) => {
    await fs.mkdir(dir, { recursive: true })
    await fs.access(dir, fs.constants.W_OK)
    return dir
  }

  try {
    activeUploadDir = await tryDir(env.uploads.dir)
  } catch (err) {
    logger.warn(`[multer] Cannot use upload dir ${env.uploads.dir}: ${err.message}. Falling back to ${FALLBACK_UPLOAD_DIR}`)
    try {
      activeUploadDir = await tryDir(FALLBACK_UPLOAD_DIR)
    } catch (fallbackErr) {
      throw new Error(`No writable upload directory available: ${fallbackErr.message}`)
    }
  }

  uploadDirReady = true
  return activeUploadDir
}

const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    try {
      const dir = await ensureUploadDir()
      cb(null, dir)
    } catch (err) {
      cb(err)
    }
  },
  filename(req, file, cb) {
    const extension = MIME_EXTENSION_MAP[file.mimetype]
    // UUID-based name guarantees uniqueness and can never be influenced by the
    // original filename, blocking traversal attacks and collisions.
    cb(null, `resume-${randomUUID()}${extension}`)
  },
})

const fileFilter = (req, file, cb) => {
  const mimetype = String(file.mimetype || '').toLowerCase()

  if (!ALLOWED_MIMETYPES.has(mimetype)) {
    return cb(
      ApiError.badRequest('Only PDF and DOCX resume files are allowed', {
        code: 'UNSUPPORTED_FILE_TYPE',
      }),
    )
  }

  const extension = path.extname(file.originalname || '').toLowerCase()
  if (extension !== MIME_EXTENSION_MAP[mimetype]) {
    return cb(
      ApiError.badRequest('The file extension does not match a supported resume type', {
        code: 'INVALID_FILE_EXTENSION',
      }),
    )
  }

  return cb(null, true)
}

export const uploadResume = multer({
  storage,
  limits: {
    fileSize: env.uploads.maxFileSizeBytes,
    files: 1,
  },
  fileFilter,
})
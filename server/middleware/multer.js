import multer from 'multer'
import path from 'node:path'
import { randomUUID } from 'node:crypto'
import fs from 'node:fs/promises'

import { env } from '../config/env.js'
import { ApiError } from '../utils/ApiError.js'

const uploadRoot = env.uploads.dir

// Ensure the upload directory exists before any request can reach multer.
await fs.mkdir(uploadRoot, { recursive: true })

// Only PDF and DOCX are accepted. The stored extension is derived from the
// declared mimetype, never from the client-supplied filename.
const MIME_EXTENSION_MAP = {
  'application/pdf': '.pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
}

const ALLOWED_MIMETYPES = new Set(Object.keys(MIME_EXTENSION_MAP))

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, uploadRoot)
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
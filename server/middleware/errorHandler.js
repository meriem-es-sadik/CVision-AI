import multer from 'multer'

import { ApiError } from '../utils/ApiError.js'

export function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err)
  }

  // Multer rejects oversized uploads with LIMIT_FILE_SIZE (-> 413) and any
  // other malformed upload with a plain MulterError (-> 400).
  if (err instanceof multer.MulterError && err?.code) {
    const fileTooLarge = err.code === 'LIMIT_FILE_SIZE'
    return res.status(fileTooLarge ? 413 : 400).json({
      success: false,
      message: fileTooLarge
        ? 'File is too large. The maximum allowed size is 5 MB.'
        : 'The upload was rejected. Ensure a single resume file is attached.',
      code: err.code,
    })
  }

  const isOperational = err?.isOperational === true
  const statusCode = Number(err?.statusCode) || 500
  const message = isOperational ? err.message : 'Internal server error'

  const responseBody = {
    success: false,
    message,
  }

  if (err?.code) responseBody.code = err.code
  if (err?.details && process.env.NODE_ENV === 'development') {
    responseBody.details = err.details
  }

  if (process.env.NODE_ENV === 'development' && !isOperational && err?.stack) {
    responseBody.stack = err.stack
  }

  res.status(statusCode).json(responseBody)
}

export function notFoundHandler(req, res, next) {
  next(ApiError.notFound(`Route ${req.method} ${req.originalUrl} not found`))
}

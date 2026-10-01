export class ApiError extends Error {
  constructor(statusCode, message, { code, details } = {}) {
    super(message)
    this.name = 'ApiError'
    this.statusCode = statusCode
    this.code = code
    this.details = details
    this.isOperational = true
    Error.captureStackTrace(this, this.constructor)
  }

  static badRequest(message = 'Bad request', options) {
    return new ApiError(400, message, options)
  }

  static unauthorized(message = 'Unauthorized', options) {
    return new ApiError(401, message, options)
  }

  static forbidden(message = 'Forbidden', options) {
    return new ApiError(403, message, options)
  }

  static notFound(message = 'Not found', options) {
    return new ApiError(404, message, options)
  }

  static conflict(message = 'Conflict', options) {
    return new ApiError(409, message, options)
  }

  static tooManyRequests(message = 'Too many requests', options) {
    return new ApiError(429, message, options)
  }

  static internal(message = 'Internal server error', options) {
    return new ApiError(500, message, options)
  }

  static serviceUnavailable(message = 'Service unavailable', options) {
    return new ApiError(503, message, options)
  }

  static gatewayTimeout(message = 'Upstream service timed out', options) {
    return new ApiError(504, message, options)
  }

  static external(message = 'Upstream service error', options) {
    return new ApiError(502, message, options)
  }
}

import jwt from 'jsonwebtoken'

import { env } from '../config/env.js'
import { ApiError } from './ApiError.js'

function getSecret() {
  if (!env.jwtSecret) {
    // Server misconfiguration, not a client error: surface a clear 500 instead of
    // letting it escape as an opaque failure.
    throw ApiError.internal(
      'JWT_SECRET is not set. Copy server/.env.example to server/.env and set a long random JWT_SECRET.',
      { code: 'JWT_SECRET_MISSING' },
    )
  }
  return env.jwtSecret
}

/**
 * Signs a payload with JWT_SECRET and honours JWT_EXPIRES_IN.
 */
export function signToken(payload, options = {}) {
  if (!payload || typeof payload !== 'object') {
    throw new TypeError('signToken requires a payload object')
  }
  return jwt.sign(payload, getSecret(), { expiresIn: env.jwtExpiresIn, ...options })
}

/**
 * Signs an access token for a user document. The user id is stored in both
 * `sub` (standard claim) and `id` for convenience.
 */
export function signUserToken(user) {
  const userId = user?._id?.toString?.() ?? user?.id ?? user?.sub
  if (!userId) {
    throw new TypeError('signUserToken requires a user with an id')
  }
  return signToken({ sub: userId, id: userId })
}

/**
 * Verifies a token and returns its payload. Throws a 401 ApiError with a
 * distinct code for expired vs. invalid tokens.
 */
export function verifyToken(token) {
  if (typeof token !== 'string' || !token.trim()) {
    throw ApiError.unauthorized('Authentication token is missing', { code: 'TOKEN_MISSING' })
  }

  let decoded
  try {
    decoded = jwt.verify(token.trim(), getSecret())
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      throw ApiError.unauthorized('Authentication token has expired', { code: 'TOKEN_EXPIRED' })
    }
    if (err instanceof jwt.JsonWebTokenError) {
      throw ApiError.unauthorized('Authentication token is invalid', { code: 'TOKEN_INVALID' })
    }
    throw err
  }

  if (!decoded.sub && !decoded.id) {
    throw ApiError.unauthorized('Authentication token has no user id', { code: 'TOKEN_INVALID' })
  }

  return decoded
}

/**
 * Reads the user id out of a verified token payload.
 */
export function getUserIdFromToken(decoded) {
  return decoded?.sub ?? decoded?.id ?? null
}

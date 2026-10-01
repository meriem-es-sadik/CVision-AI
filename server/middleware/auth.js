import { User } from '../models/User.js'
import { ApiError } from '../utils/ApiError.js'
import { getUserIdFromToken, verifyToken } from '../utils/jwt.js'

const BEARER_SCHEME = /^bearer$/i
const COOKIE_TOKEN_NAME = 'accessToken'

/**
 * Pulls the token out of `Authorization: Bearer <token>`, falling back to the
 * `accessToken` cookie. Throws a 401 ApiError for a malformed header.
 */
export function extractToken(req) {
  const authHeader = req.headers?.authorization

  if (authHeader && authHeader.trim()) {
    const [scheme, ...rest] = authHeader.trim().split(/\s+/)
    const token = rest.join(' ').trim()

    if (!BEARER_SCHEME.test(scheme)) {
      throw ApiError.unauthorized('Authorization header must use the Bearer scheme', {
        code: 'TOKEN_MALFORMED',
      })
    }
    if (!token) {
      throw ApiError.unauthorized('Bearer token is empty', { code: 'TOKEN_MISSING' })
    }
    return token
  }

  const cookieToken = req.cookies?.[COOKIE_TOKEN_NAME]
  if (typeof cookieToken === 'string' && cookieToken.trim()) {
    return cookieToken.trim()
  }

  return null
}

/**
 * Verifies the request token, loads the matching user and attaches it to
 * `req.user`. `req.auth` keeps the token and decoded payload for later use.
 * Every failure mode results in a 401 ApiError.
 */
export async function authenticate(req, res, next) {
  try {
    const token = extractToken(req)

    if (!token) {
      throw ApiError.unauthorized(
        'Authentication required: send an "Authorization: Bearer <token>" header',
        { code: 'TOKEN_MISSING' },
      )
    }

    const decoded = verifyToken(token)
    const userId = getUserIdFromToken(decoded)

    const user = await User.findById(userId)
    if (!user) {
      throw ApiError.unauthorized('The account linked to this token no longer exists', {
        code: 'USER_NOT_FOUND',
      })
    }

    req.user = user
    req.auth = { token, decoded }

    return next()
  } catch (err) {
    if (err instanceof ApiError) return next(err)

    if (err?.name === 'CastError') {
      return next(
        ApiError.unauthorized('Authentication token is invalid', { code: 'TOKEN_INVALID' }),
      )
    }

    return next(err)
  }
}

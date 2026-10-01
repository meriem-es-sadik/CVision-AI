import { User } from '../models/User.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { sendSuccess } from '../utils/ApiResponse.js'
import { ApiError } from '../utils/ApiError.js'
import { signUserToken } from '../utils/jwt.js'
import { assertNoValidationErrors, validateLoginInput, validateRegisterInput } from '../utils/validators.js'
import { logger } from '../utils/logger.js'

const DUPLICATE_KEY_ERROR = 11000

function isDuplicateKeyError(err) {
  return err?.code === DUPLICATE_KEY_ERROR || err?.code === DUPLICATE_KEY_ERROR + ''
}

export const register = asyncHandler(async (req, res) => {
  const { value, errors } = validateRegisterInput(req.body)
  assertNoValidationErrors(errors)

  const existingUser = await User.exists({ email: value.email })
  if (existingUser) {
    throw ApiError.conflict('An account with this email already exists', { code: 'EMAIL_ALREADY_EXISTS' })
  }

  let user
  try {
    // The password is hashed by the User pre-save hook.
    user = await User.create(value)
  } catch (err) {
    // Guards the race where two registrations for the same email arrive together.
    if (isDuplicateKeyError(err)) {
      throw ApiError.conflict('An account with this email already exists', {
        code: 'EMAIL_ALREADY_EXISTS',
      })
    }
    throw err
  }

  const token = signUserToken(user)
  logger.info(`[auth] User registered: ${user._id}`)

  return sendSuccess(res, {
    statusCode: 201,
    message: 'Account created successfully',
    data: { token, user: user.toSafeObject() },
  })
})

export const login = asyncHandler(async (req, res) => {
  const { value, errors } = validateLoginInput(req.body)
  assertNoValidationErrors(errors)

  const user = await User.findOne({ email: value.email }).select('+password')

  // Same response for unknown email and wrong password so the endpoint does not
  // reveal which emails have accounts.
  const invalidCredentials = () =>
    ApiError.unauthorized('Invalid email or password', { code: 'INVALID_CREDENTIALS' })

  if (!user) throw invalidCredentials()

  const passwordMatches = await user.comparePassword(value.password)
  if (!passwordMatches) throw invalidCredentials()

  const token = signUserToken(user)
  logger.info(`[auth] User logged in: ${user._id}`)

  return sendSuccess(res, {
    message: 'Login successful',
    data: { token, user: user.toSafeObject() },
  })
})

/**
 * Tokens are stateless, so there is no server-side session to destroy. The
 * client discards the token; this endpoint exists so the client has a
 * symmetric logout call.
 */
export const logout = asyncHandler(async (req, res) => {
  return sendSuccess(res, { message: 'Logged out successfully', data: { token: null } })
})

export const getMe = asyncHandler(async (req, res) => {
  const user = req.user
  if (!user) {
    throw ApiError.unauthorized('Authentication required', { code: 'TOKEN_MISSING' })
  }

  return sendSuccess(res, {
    message: 'Authenticated user',
    data: { user: user.toSafeObject() },
  })
})

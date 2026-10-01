import { ApiError } from './ApiError.js'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PASSWORD_MIN_LENGTH = 8
const PASSWORD_MAX_LENGTH = 72
const NAME_MIN_LENGTH = 2
const NAME_MAX_LENGTH = 80

function isPlainObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function asString(value) {
  return typeof value === 'string' ? value : ''
}

export function normalizeEmail(value) {
  return asString(value).trim().toLowerCase()
}

/**
 * @returns {Array<{ field: string, message: string }>}
 */
export function validateName(value) {
  const name = asString(value).trim()
  if (!name) return [{ field: 'name', message: 'Name is required' }]
  if (name.length < NAME_MIN_LENGTH) {
    return [{ field: 'name', message: `Name must be at least ${NAME_MIN_LENGTH} characters` }]
  }
  if (name.length > NAME_MAX_LENGTH) {
    return [{ field: 'name', message: `Name must be at most ${NAME_MAX_LENGTH} characters` }]
  }
  return []
}

/**
 * @returns {Array<{ field: string, message: string }>}
 */
export function validateEmail(value) {
  const email = normalizeEmail(value)
  if (!email) return [{ field: 'email', message: 'Email is required' }]
  if (email.length > 254) {
    return [{ field: 'email', message: 'Email must be at most 254 characters' }]
  }
  if (!EMAIL_PATTERN.test(email)) {
    return [{ field: 'email', message: 'Email is not a valid email address' }]
  }
  return []
}

/**
 * @returns {Array<{ field: string, message: string }>}
 */
export function validatePassword(value) {
  const password = asString(value)
  if (!password) return [{ field: 'password', message: 'Password is required' }]
  if (password.length < PASSWORD_MIN_LENGTH) {
    return [
      { field: 'password', message: `Password must be at least ${PASSWORD_MIN_LENGTH} characters` },
    ]
  }
  if (password.length > PASSWORD_MAX_LENGTH) {
    return [
      { field: 'password', message: `Password must be at most ${PASSWORD_MAX_LENGTH} characters` },
    ]
  }
  if (!/[a-zA-Z]/.test(password) || !/\d/.test(password)) {
    return [
      { field: 'password', message: 'Password must contain at least one letter and one number' },
    ]
  }
  return []
}

/**
 * Validates a registration payload and returns trimmed values ready for the model.
 * @returns {{ value: { name: string, email: string, password: string }, errors: Array, isValid: boolean }}
 */
export function validateRegisterInput(payload) {
  const body = isPlainObject(payload) ? payload : {}

  const value = {
    name: asString(body.name).trim(),
    email: normalizeEmail(body.email),
    password: asString(body.password),
  }

  const errors = [...validateName(value.name), ...validateEmail(value.email), ...validatePassword(value.password)]

  return { value, errors, isValid: errors.length === 0 }
}

/**
 * Validates a login payload. Login only requires a well-formed email and a
 * non-empty password; length rules do not apply to an existing account.
 * @returns {{ value: { email: string, password: string }, errors: Array, isValid: boolean }}
 */
export function validateLoginInput(payload) {
  const body = isPlainObject(payload) ? payload : {}

  const value = {
    email: normalizeEmail(body.email),
    password: asString(body.password),
  }

  const errors = [...validateEmail(value.email)]

  if (!value.password) {
    errors.push({ field: 'password', message: 'Password is required' })
  }

  return { value, errors, isValid: errors.length === 0 }
}

/**
 * Throws a 400 ApiError listing every field problem, or returns the result
 * unchanged when `errors` is empty.
 */
export function assertNoValidationErrors(errors) {
  if (!Array.isArray(errors) || errors.length === 0) return

  const summary = errors.map((e) => e.message).join('; ')

  throw ApiError.badRequest(`Validation failed: ${summary}`, {
    code: 'VALIDATION_ERROR',
    details: errors,
  })
}

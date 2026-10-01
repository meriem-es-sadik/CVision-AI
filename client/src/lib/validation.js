// Mirrors server/utils/validators.js so the UI can validate before submitting.
// The server remains the authority; these rules only avoid a wasted round trip.

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
export const PASSWORD_MIN_LENGTH = 8
export const PASSWORD_MAX_LENGTH = 72
export const NAME_MIN_LENGTH = 2
export const NAME_MAX_LENGTH = 80

export function normalizeEmail(value) {
  return typeof value === 'string' ? value.trim().toLowerCase() : ''
}

export function validateEmail(value) {
  const email = normalizeEmail(value)

  if (!email) return 'Email is required'
  if (email.length > 254) return 'Email must be at most 254 characters'
  if (!EMAIL_PATTERN.test(email)) return 'Enter a valid email address'
  return ''
}

export function validatePassword(value) {
  const password = typeof value === 'string' ? value : ''

  if (!password) return 'Password is required'
  if (password.length < PASSWORD_MIN_LENGTH) {
    return `Password must be at least ${PASSWORD_MIN_LENGTH} characters`
  }
  if (password.length > PASSWORD_MAX_LENGTH) {
    return `Password must be at most ${PASSWORD_MAX_LENGTH} characters`
  }
  if (!/[a-zA-Z]/.test(password) || !/\d/.test(password)) {
    return 'Password must contain at least one letter and one number'
  }
  return ''
}

export function getPasswordRequirements(value) {
  const password = typeof value === 'string' ? value : ''

  return [
    { id: 'length', label: `${PASSWORD_MIN_LENGTH}+ characters`, met: password.length >= PASSWORD_MIN_LENGTH },
    { id: 'letter', label: 'One letter', met: /[a-zA-Z]/.test(password) },
    { id: 'number', label: 'One number', met: /\d/.test(password) },
  ]
}

export function validateName(value) {
  const name = typeof value === 'string' ? value.trim() : ''

  if (!name) return 'Name is required'
  if (name.length < NAME_MIN_LENGTH) return `Name must be at least ${NAME_MIN_LENGTH} characters`
  if (name.length > NAME_MAX_LENGTH) return `Name must be at most ${NAME_MAX_LENGTH} characters`
  return ''
}

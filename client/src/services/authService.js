import api from '@/services/api'

function unwrap(payload) {
  return payload?.data
}

export async function registerRequest({ name, email, password }) {
  const response = await api.post('/auth/register', { name, email, password })
  return unwrap(response.data)
}

export async function loginRequest({ email, password }) {
  const response = await api.post('/auth/login', { email, password })
  return unwrap(response.data)
}

export async function logoutRequest() {
  await api.post('/auth/logout')
}

export async function fetchMeRequest() {
  const response = await api.get('/auth/me')
  return unwrap(response.data)?.user ?? null
}

/**
 * Maps an Axios error onto `{ message, fieldErrors, code }` so forms can render
 * server-side validation feedback without touching transport details.
 */
export function getAuthError(error) {
  const response = error?.response
  const data = response?.data
  const status = response?.status

  if (!response) {
    return {
      code: 'NETWORK_ERROR',
      message: 'Cannot reach the CVision AI API. Check that the server is running and try again.',
      fieldErrors: {},
    }
  }

  const fieldErrors = Array.isArray(data?.details)
    ? Object.fromEntries(data.details.filter((d) => d?.field).map((d) => [d.field, d.message]))
    : {}

  return {
    code: data?.code ?? `HTTP_${status}`,
    message:
      data?.message ??
      (status === 429
        ? 'Too many attempts. Please wait a moment before trying again.'
        : 'Something went wrong. Please try again.'),
    fieldErrors,
  }
}

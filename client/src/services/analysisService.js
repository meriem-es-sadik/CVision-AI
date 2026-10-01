import api from '@/services/api'

/**
 * Client helpers for the AI CV analysis endpoints.
 *
 * The OpenRouter credentials stay on the server: this module only ever talks to
 * CVision AI REST API and relies on the shared auth interceptor in `api.js` for
 * the JWT. No provider configuration is ever read from `import.meta.env`.
 */

const ANALYSIS_TIMEOUT_MS = 120_000

function unwrap(payload) {
  return payload?.data
}

function toList(payload) {
  if (Array.isArray(payload)) return payload
  if (payload && Array.isArray(payload.items)) return payload.items
  return []
}

/**
 * Runs (or re-runs) the AI analysis for a resume.
 * @returns {Promise<object>} the stored analysis
 */
export async function analyzeResumeRequest(resumeId) {
  // The endpoint reads everything from the path and the JWT, so the request is
  // sent without a payload. It must not be `null`: axios serialises that to the
  // literal text "null" and, because the shared instance declares
  // `Content-Type: application/json`, body-parser's strict JSON parser rejects
  // it with `Unexpected token 'n', "null" is not valid JSON` (HTTP 400).
  // Leaving the payload `undefined` keeps the request body-less, and axios
  // drops the JSON content type for body-less requests, so the parser never
  // sees a body at all.
  const response = await api.post(`/analysis/${resumeId}`, undefined, {
    timeout: ANALYSIS_TIMEOUT_MS,
  })

  return unwrap(response.data)?.analysis ?? null
}

/**
 * Fetches the most recent analysis for a resume.
 * @returns {Promise<object|null>} null when the resume has not been analysed
 */
export async function getResumeAnalysisRequest(resumeId) {
  const response = await api.get(`/analysis/${resumeId}`)

  return unwrap(response.data)?.analysis ?? null
}

/** The authenticated user's analysis history, newest first. */
export async function getAnalysisHistoryRequest() {
  const response = await api.get('/analysis/history')
  return toList(response.data?.data)
}

/**
 * Maps an Axios error onto `{ message, code, status }` with wording a user can
 * act on. The server has already sanitized every message; the fallbacks here
 * only cover transport-level problems.
 */
export function getAnalysisError(error) {
  const response = error?.response
  const status = response?.status
  const code = response?.data?.code ?? (status ? `HTTP_${status}` : 'NETWORK_ERROR')

  if (!response) {
    return {
      code,
      status: null,
      message:
        'We could not reach the CVision AI API. Check that the server is running, then try again.',
    }
  }

  if (!error.response?.data?.message) {
    const fallbacks = {
      400: 'That request could not be processed. Please try again.',
      401: 'Your session has expired. Please sign in again.',
      403: 'You do not have permission to do that.',
      404: 'That resume could not be found.',
      409: 'This resume is not ready to be analysed yet.',
      429: 'Too many requests. Please wait a moment before trying again.',
    }

    return {
      code,
      status,
      message: fallbacks[status] ?? 'Something went wrong. Please try again.',
    }
  }

  return { code, status, message: response.data.message }
}

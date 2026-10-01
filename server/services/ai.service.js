// AI service - the only place in the app that talks to the AI provider (OpenRouter).
//
// Responsibilities of `analyzeResume`:
//   validate input -> build prompt -> call OpenRouter -> parse JSON -> normalise it.
//
// Every failure mode is translated into a sanitized ApiError so the controller
// can return something a user can act on, without ever leaking the provider
// payload, the API key, the Authorization header or the CV text.
import { env } from '../config/env.js'
import { isOpenRouterConfigured, openRouterClient, withOpenRouterAuth } from '../config/openrouter.js'
import { ApiError } from '../utils/ApiError.js'
import { logger } from '../utils/logger.js'
import { normalizeAnalysisPayload, parseJsonPayload } from '../utils/analysisNormalizer.js'
import { buildCvAnalysisUserPrompt, CV_ANALYSIS_SYSTEM_PROMPT } from '../utils/promptTemplates.js'

/** A resume shorter than this carries too little signal to review honestly. */
export const MIN_ANALYZABLE_CHARS = 200

/** Upper bound on the text sent to the provider, keeping prompts bounded. */
export const MAX_ANALYZABLE_CHARS = 12_000

const CHAT_COMPLETIONS_PATH = '/chat/completions'

/**
 * OpenRouter routes one model string to many backends, so the exact set of
 * optional parameters a request may carry is not ours to assume. Only these
 * universal fields are ever sent; everything else is added on demand and can be
 * stripped again by the compatibility fallback below.
 */
const REQUIRED_FIELDS = ['model', 'messages']

/** Parameters that individual routed models are known to reject. */
const OPTIONAL_PARAM_HINTS = [
  'response_format',
  'json_object',
  'json_schema',
  'json mode',
  'structured output',
  'temperature',
  'max_tokens',
  'max_completion_tokens',
  'top_p',
  'top_k',
  'seed',
  'logit_bias',
  'reasoning',
]

const CONFIG_ERROR =
  'AI analysis is not configured on the server yet. Set OPENROUTER_API_KEY in server/.env to enable CV analysis.'

function configurationError() {
  return ApiError.serviceUnavailable(CONFIG_ERROR, { code: 'AI_NOT_CONFIGURED' })
}

function providerMessage(status) {
  switch (status) {
    case 400:
      return 'The AI provider rejected the analysis request. Please try again.'
    case 401:
    case 403:
      return 'The server could not authenticate with the AI provider. Please try again later.'
    case 404:
      return `The configured AI model "${env.openrouter.model}" is not available for this account.`
    case 402:
      return 'The AI provider could not serve this request for the configured account. Please try again later.'
    case 408:
      return 'The AI provider took too long to respond. Please try again.'
    case 413:
      return 'This CV is too long for the AI provider to process. Please shorten it and try again.'
    case 429:
      return 'The AI provider is rate limiting requests right now. Please wait a moment and try again.'
    default:
      return 'The AI provider is currently unavailable. Please try again shortly.'
  }
}

/**
 * Maps a provider HTTP status onto a sanitized ApiError. The code is derived
 * from the status so the client can distinguish a rate limit from a bad key
 * without the provider body ever reaching it.
 */
function providerError(status) {
  const message = providerMessage(status)

  if (status === 429) return ApiError.tooManyRequests(message, { code: 'AI_RATE_LIMITED' })
  if (status === 408) return ApiError.gatewayTimeout(message, { code: 'AI_TIMEOUT' })

  return ApiError.external(message, { code: 'AI_PROVIDER_ERROR' })
}

/**
 * True when the provider complained about one of the optional parameters we sent
 * (JSON mode, temperature, token limit, ...). This is the expected failure mode
 * for a routed/free model and is always safe to retry without those parameters.
 */
function isUnsupportedParameterError(status, data) {
  if (status !== 400 && status !== 422) return false

  const text = `${data?.error?.message ?? ''} ${data?.message ?? ''} ${data?.error?.code ?? ''}`.toLowerCase()
  if (!text) return false

  return OPTIONAL_PARAM_HINTS.some((hint) => text.includes(hint))
}

/**
 * Translates an axios failure into a sanitized ApiError.
 * The raw provider body is logged for debugging but never returned to a client
 * and never contains the key or the resume text.
 */
function toApiError(err) {
  if (err?.isOperational) return err

  const status = err?.response?.status

  if (status) {
    logger.error('[ai] provider request failed', {
      status,
      providerCode: err.response?.data?.error?.code ?? null,
    })
    return providerError(status)
  }

  if (err?.code === 'ECONNABORTED' || err?.code === 'ETIMEDOUT') {
    logger.warn('[ai] provider request timed out')
    return ApiError.gatewayTimeout(
      'The AI analysis timed out. The CV may be very long - please try a shorter version.',
      { code: 'AI_TIMEOUT' },
    )
  }

  const networkCodes = ['ECONNREFUSED', 'ENOTFOUND', 'EAI_AGAIN', 'ECONNRESET', 'EHOSTUNREACH']
  if (networkCodes.includes(err?.code)) {
    logger.error('[ai] could not reach the AI provider', { code: err.code })
    return ApiError.external('The AI provider could not be reached. Please try again shortly.', {
      code: 'AI_UNAVAILABLE',
    })
  }

  logger.error('[ai] unexpected failure while calling the AI provider', { message: err?.message })
  return ApiError.external('The AI analysis could not be completed. Please try again.', {
    code: 'AI_REQUEST_FAILED',
  })
}

function readContent(response) {
  const choice = response?.data?.choices?.[0]
  const content = choice?.message?.content

  if (typeof content === 'string' && content.trim()) return content

  // Some OpenAI-compatible gateways return an array of content parts.
  if (Array.isArray(content)) {
    const joined = content
      .map((part) => (typeof part === 'string' ? part : (part?.text ?? '')))
      .join('')
      .trim()

    if (joined) return joined
  }

  return ''
}

/**
 * Sends one chat completion request. Errors are left raw for the caller to map.
 * Note the argument order: axios takes `(url, data, config)`, so the auth
 * config must be the third argument or the Authorization header is never sent.
 */
function postChatCompletion(body) {
  return openRouterClient.post(CHAT_COMPLETIONS_PATH, body, withOpenRouterAuth())
}

/**
 * Sends a chat completion to OpenRouter and returns the raw assistant message.
 *
 * @param {Array<{role: string, content: string}>} messages
 * @param {{ json?: boolean, temperature?: number }} [options]
 * @returns {Promise<string>} the assistant's message content
 */
export async function completeChat(messages, options = {}) {
  if (!isOpenRouterConfigured()) throw configurationError()

  const { json = false, temperature = 0.2 } = options

  const body = {
    model: env.openrouter.model,
    messages,
    temperature,
    max_tokens: env.openrouter.maxTokens,
  }

  // Structured output is requested when the model supports it, but never relied
  // upon: the prompt itself already demands JSON and the normalizer tolerates
  // fenced or prose-wrapped output.
  if (json) body.response_format = { type: 'json_object' }

  try {
    const response = await postChatCompletion(body)

    return readContent(response)
  } catch (err) {
    // A routed model may reject any of the optional parameters. Retry once with
    // the universally supported subset before giving up.
    if (isUnsupportedParameterError(err?.response?.status, err?.response?.data)) {
      const minimalBody = Object.fromEntries(
        REQUIRED_FIELDS.map((field) => [field, body[field]]),
      )

      logger.warn('[ai] provider rejected optional parameters, retrying with the minimal payload')

      try {
        const response = await postChatCompletion(minimalBody)

        return readContent(response)
      } catch (retryErr) {
        throw toApiError(retryErr)
      }
    }

    throw toApiError(err)
  }
}

/**
 * Reviews a resume with the configured model and returns a validated, normalised
 * analysis object ready to be scored and persisted.
 *
 * @param {string} extractedText Text previously extracted from the uploaded CV.
 * @returns {Promise<{ analysis: object, model: string, analyzedChars: number }>}
 * @throws {ApiError} on bad input, provider failure, or unusable output.
 */
export async function analyzeResume(extractedText) {
  if (typeof extractedText !== 'string' || !extractedText.trim()) {
    throw ApiError.badRequest('This resume has no extracted text to analyse.', {
      code: 'RESUME_TEXT_MISSING',
    })
  }

  const source = extractedText.trim()

  if (source.length < MIN_ANALYZABLE_CHARS) {
    throw ApiError.badRequest(
      `This resume only has ${source.length} characters of text, which is not enough to review. Upload a complete CV.`,
      { code: 'RESUME_TEXT_TOO_SHORT' },
    )
  }

  // Bounded prompt: long CVs are truncated rather than sent whole.
  const analyzedText =
    source.length > MAX_ANALYZABLE_CHARS
      ? `${source.slice(0, MAX_ANALYZABLE_CHARS)}\n\n[Content truncated]`
      : source

  const content = await completeChat(
    [
      { role: 'system', content: CV_ANALYSIS_SYSTEM_PROMPT },
      { role: 'user', content: buildCvAnalysisUserPrompt(analyzedText) },
    ],
    { json: true },
  )

  if (!content) {
    throw ApiError.external('The AI reviewer returned an empty response. Please try again.', {
      code: 'AI_EMPTY_RESPONSE',
    })
  }

  const parsed = parseJsonPayload(content)
  if (!parsed) {
    logger.warn('[ai] provider response was not parseable JSON')
    throw ApiError.external(
      'The AI reviewer returned a response that could not be read. Please try again.',
      { code: 'AI_MALFORMED_RESPONSE' },
    )
  }

  return {
    analysis: normalizeAnalysisPayload(parsed),
    model: env.openrouter.model,
    analyzedChars: analyzedText.length,
  }
}

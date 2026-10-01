import axios from 'axios'

import { env } from './env.js'

/**
 * Values that ship in server/.env.example. Treating them as "configured" would
 * turn a clear configuration error into an opaque 401 from the provider, so they
 * are rejected up front.
 */
const PLACEHOLDER_KEYS = new Set([
  '',
  'your_openrouter_api_key_here',
  'your_openrouter_api_key',
  'openrouter_api_key_here',
  'changeme',
  'replace_me',
  'replace_with_your_openrouter_api_key',
  'placeholder',
])

/**
 * True when OPENROUTER_API_KEY is present and is not an example/placeholder
 * value. The key itself is never returned, logged or compared to anything but
 * the placeholder list.
 */
export function isOpenRouterConfigured() {
  const key = env.openrouter.apiKey
  if (typeof key !== 'string') return false
  return !PLACEHOLDER_KEYS.has(key.trim().toLowerCase())
}

/**
 * Pre-configured HTTP client for the OpenRouter REST API.
 * The API key is only ever used server-side.
 */
export const openRouterClient = axios.create({
  baseURL: env.openrouter.baseUrl,
  timeout: env.openrouter.timeoutMs,
  headers: {
    'Content-Type': 'application/json',
  },
})

/**
 * Attaches the bearer token to a single request. Done per request rather than
 * on the instance so a missing key can never be baked into a shared header and
 * so the value is never echoed back in an error dump.
 */
export function withOpenRouterAuth(config = {}) {
  const headers = {
    ...config.headers,
    Authorization: `Bearer ${env.openrouter.apiKey}`,
  }

  // Optional OpenRouter attribution headers. Only sent when configured.
  if (env.openrouter.siteUrl) headers['HTTP-Referer'] = env.openrouter.siteUrl
  if (env.openrouter.appName) headers['X-Title'] = env.openrouter.appName

  return { ...config, headers }
}

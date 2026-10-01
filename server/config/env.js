import path from 'node:path'
import { fileURLToPath } from 'node:url'

import dotenv from 'dotenv'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const serverRoot = path.resolve(__dirname, '..')

// Load server/.env by absolute path so the server works the same whether it is
// started from the repo root or from the server workspace. Existing process env
// vars always win, and cwd is used as a secondary source.
dotenv.config({ path: path.resolve(serverRoot, '.env') })
dotenv.config()

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 5000,
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',

  mongoUri: process.env.MONGODB_URI,

  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  bcryptSaltRounds: Number(process.env.BCRYPT_SALT_ROUNDS) || 12,

  rateLimit: {
    authMax: Number(process.env.AUTH_RATE_LIMIT_MAX) || 10,
    authWindowMs: Number(process.env.AUTH_RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
    apiMax: Number(process.env.API_RATE_LIMIT_MAX) || 100,
    apiWindowMs: Number(process.env.API_RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
    uploadMax: Number(process.env.UPLOAD_RATE_LIMIT_MAX) || 10,
    uploadWindowMs: Number(process.env.UPLOAD_RATE_LIMIT_WINDOW_MS) || 60 * 1000,
  },

  // OpenRouter exposes an OpenAI-compatible API, so only the base URL, the
  // bearer key and the routed model differ from a plain OpenAI client.
  openrouter: {
    apiKey: process.env.OPENROUTER_API_KEY,
    baseUrl: process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1',
    // `openrouter/free` is OpenRouter's free model router: it picks a currently
    // available free model, so the app never needs paid credits in development.
    model: process.env.OPENROUTER_MODEL || 'openrouter/free',
    // Analysis is a single blocking request, so keep the ceiling well below the
    // axios default and let a slow provider fail fast with a clear message.
    timeoutMs: Number(process.env.OPENROUTER_TIMEOUT_MS) || 60_000,
    maxTokens: Number(process.env.OPENROUTER_MAX_TOKENS) || 6000,
    // Optional attribution headers recommended by OpenRouter. Both are omitted
    // entirely when not configured, so a proxied deployment that has no public
    // URL still works.
    siteUrl: process.env.OPENROUTER_SITE_URL || '',
    appName: process.env.OPENROUTER_APP_NAME || 'CVision AI',
  },

  uploads: {
    dir: path.resolve(serverRoot, process.env.UPLOAD_DIR || 'uploads'),
    maxFileSizeBytes: (Number(process.env.MAX_FILE_SIZE_MB) || 5) * 1024 * 1024,
  },
}

export const isProduction = env.nodeEnv === 'production'

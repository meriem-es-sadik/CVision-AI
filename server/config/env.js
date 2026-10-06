import path from 'node:path'
import { fileURLToPath } from 'node:url'

import dotenv from 'dotenv'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const serverRoot = path.resolve(__dirname, '..')

// Load server/.env by absolute path so the server works the same whether it is
// started from the repo root or from the server workspace. Existing process env
// vars always win, and cwd is used as a secondary source. `quiet` suppresses
// the "injecting env (0) from ..." lines on Vercel, where these .env files do
// not exist and Vercel injects the variables itself.
dotenv.config({ path: path.resolve(serverRoot, '.env'), quiet: true })
dotenv.config({ quiet: true })

// Detect Vercel serverless environment. Vercel sets multiple indicators:
const isVercel = process.env.VERCEL === '1' || !!process.env.VERCEL_ENV || !!process.env.AWS_REGION

const nodeEnv = process.env.NODE_ENV || 'development'

export const isProduction = nodeEnv === 'production'

// The strict database rules must apply on Vercel even if NODE_ENV was
// overridden, so a localhost connection string can never slip through there.
const isStrictEnv = isProduction || isVercel

// Development-only fallback so `npm run dev` works with a local mongod without
// any configuration. This value is NEVER used in production or on Vercel,
// where mongodb://127.0.0.1:27017 can only fail with ECONNREFUSED.
const LOCAL_DEV_MONGO_URI = 'mongodb://127.0.0.1:27017/cvision-ai'

const configuredMongoUri = (process.env.MONGODB_URI || '').trim()
const mongoUri = isStrictEnv ? configuredMongoUri : configuredMongoUri || LOCAL_DEV_MONGO_URI

// On Vercel, use /tmp for writable temporary file storage. The /var/task
// application directory is read-only. For local development, use the server/uploads
// directory so files persist across restarts for debugging.
const uploadDir = isVercel
  ? '/tmp/uploads'
  : path.resolve(serverRoot, process.env.UPLOAD_DIR || 'uploads')

export const env = {
  nodeEnv,
  port: Number(process.env.PORT) || 5000,
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',

  mongoUri,

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
    dir: uploadDir,
    maxFileSizeBytes: (Number(process.env.MAX_FILE_SIZE_MB) || 5) * 1024 * 1024,
  },

  isVercel,
}

export { isVercel }

/**
 * Thrown when production has no usable MongoDB configuration. Marked as an
 * operational error with a status code so the Express error handler returns
 * the message to the caller instead of a generic "Internal server error".
 */
export class MongoConfigError extends Error {
  constructor(message) {
    super(message)
    this.name = 'MongoConfigError'
    this.code = 'MONGODB_CONFIG_ERROR'
    this.statusCode = 500
    this.isOperational = true
  }
}

const LOOPBACK_HOSTS = new Set(['localhost', '127.0.0.1', '::1', '[::1]', '0.0.0.0'])

/**
 * Extracts the hosts from a MongoDB connection string without using URL(),
 * because standard mongodb:// URIs may list several comma-separated hosts
 * (host1:27017,host2:27017) which WHATWG URL parsing rejects.
 * Returns null when the string is not a mongodb://(srv) URI.
 */
function parseMongoHosts(uri) {
  const match = /^mongodb(\+srv)?:\/\/(.*)$/i.exec(uri)
  if (!match) return null

  const authority = match[2].split(/[/?#]/, 1)[0]
  const hostList = authority.slice(authority.lastIndexOf('@') + 1)

  const hosts = hostList
    .split(',')
    .map((entry) => {
      let host = entry.trim()
      if (host.startsWith('[')) {
        const end = host.indexOf(']')
        host = end === -1 ? host : host.slice(0, end + 1)
      } else {
        const colon = host.lastIndexOf(':')
        if (colon !== -1) host = host.slice(0, colon)
      }
      return host.toLowerCase()
    })
    .filter(Boolean)

  return hosts.length > 0 ? hosts : null
}

/**
 * Validates the MongoDB configuration before any connection attempt.
 *
 * Development always passes: MONGODB_URI may be unset there, in which case the
 * localhost fallback applies. Production and Vercel throw a MongoConfigError
 * when MONGODB_URI is missing, is not a valid mongodb://(srv) string, or
 * points at a local MongoDB server that does not exist in the cloud.
 */
export function assertMongoConfig() {
  if (!isStrictEnv) return

  if (!mongoUri) {
    throw new MongoConfigError(
      'MONGODB_URI is not set. The API cannot run without a database. Set MONGODB_URI ' +
        '(your MongoDB Atlas connection string, mongodb+srv://...) in Vercel under ' +
        'Project Settings > Environment Variables for Production, Preview and Development, ' +
        'then redeploy. Never commit or hardcode the value.',
    )
  }

  const hosts = parseMongoHosts(mongoUri)
  if (!hosts) {
    throw new MongoConfigError(
      'MONGODB_URI is not a valid MongoDB connection string. Expected ' +
        'mongodb+srv://user:password@cluster.mongodb.net/database (MongoDB Atlas) or ' +
        'mongodb://host:port/database.',
    )
  }

  const loopback = hosts.filter((host) => LOOPBACK_HOSTS.has(host))
  if (loopback.length > 0) {
    throw new MongoConfigError(
      `MONGODB_URI points to "${loopback[0]}", a local MongoDB server. There is no local ` +
        'MongoDB on Vercel, so every request fails with ECONNREFUSED 127.0.0.1:27017. ' +
        'Replace MONGODB_URI with your MongoDB Atlas connection string (mongodb+srv://...) ' +
        'in Vercel under Project Settings > Environment Variables, then redeploy.',
    )
  }
}

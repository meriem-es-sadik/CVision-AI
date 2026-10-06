import mongoose from 'mongoose'

import { env, isVercel, assertMongoConfig } from './env.js'
import { logger } from '../utils/logger.js'

// A Vercel function invocation is short-lived, so Atlas gets less time to
// respond there. A clear error inside the function's budget beats a platform
// timeout that hides the cause.
const SERVER_SELECTION_TIMEOUT_MS = isVercel ? 5_000 : 10_000

mongoose.set('strictQuery', true)

let listenersRegistered = false

// The single in-flight connection attempt, shared by concurrent requests so a
// cold start opens exactly one connection. Cleared on failure and on
// disconnect so the next request starts a fresh attempt instead of reusing a
// rejected or stale promise.
let pendingConnection = null

/**
 * The driver can include the full connection string in error messages, which would
 * leak database credentials into the logs. Strip anything before the '@'.
 */
function redactCredentials(message) {
  return String(message).replace(/(mongodb(\+srv)?:\/\/)[^@\s]+@/gi, '$1***:***@')
}

function registerConnectionListeners() {
  if (listenersRegistered) return
  listenersRegistered = true

  mongoose.connection.on('error', (err) => {
    logger.error('[db] MongoDB connection error', { message: redactCredentials(err?.message) })
  })
  mongoose.connection.on('disconnected', () => {
    pendingConnection = null
    logger.warn('[db] MongoDB disconnected')
  })
  mongoose.connection.on('reconnected', () => {
    logger.info('[db] MongoDB reconnected')
  })
}

const READY_STATES = {
  0: 'disconnected',
  1: 'connected',
  2: 'connecting',
  3: 'disconnecting',
  99: 'uninitialized',
  default: 'unknown',
}

export function getDbStatus() {
  return READY_STATES[mongoose.connection.readyState] ?? 'unknown'
}

export function isDbConnected() {
  return mongoose.connection.readyState === 1
}

/**
 * Opens the shared Mongoose connection using MONGODB_URI.
 *
 * Throws a MongoConfigError (a clear configuration error) when production has
 * no usable URI — this is checked before any connection attempt, so production
 * can never fall back to 127.0.0.1. Transient connection failures are logged,
 * not cached, and are retried on the next call.
 */
export async function connectDB() {
  assertMongoConfig()

  if (isDbConnected()) return mongoose.connection

  registerConnectionListeners()

  if (!pendingConnection) {
    pendingConnection = mongoose
      .connect(env.mongoUri, {
        serverSelectionTimeoutMS: SERVER_SELECTION_TIMEOUT_MS,
      })
      .then((connection) => {
        const { host, name } = connection.connection
        logger.info(`[db] MongoDB connected: ${host}/${name}`)
        return connection
      })
      .catch((err) => {
        pendingConnection = null
        logger.error('[db] Could not connect to MongoDB', { message: redactCredentials(err?.message) })
        throw err
      })
  }

  return pendingConnection
}

export async function disconnectDB() {
  if (mongoose.connection.readyState === 0) return
  await mongoose.connection.close()
  pendingConnection = null
  logger.info('[db] MongoDB connection closed')
}

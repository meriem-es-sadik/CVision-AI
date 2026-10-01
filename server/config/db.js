import mongoose from 'mongoose'

import { env } from './env.js'
import { logger } from '../utils/logger.js'

const SERVER_SELECTION_TIMEOUT_MS = 10_000

mongoose.set('strictQuery', true)

let listenersRegistered = false

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
 * Opens the shared Mongoose connection using MONGODB_URI from server/.env.
 * Throws a descriptive error when the URI is missing or the server is unreachable.
 */
export async function connectDB() {
  if (!env.mongoUri) {
    const error = new Error(
      'MONGODB_URI is not set. Copy server/.env.example to server/.env and fill in your MongoDB connection string.',
    )
    error.code = 'MONGODB_URI_MISSING'
    throw error
  }

  if (isDbConnected()) {
    logger.info('[db] MongoDB already connected')
    return mongoose.connection
  }

  registerConnectionListeners()

  try {
    const connection = await mongoose.connect(env.mongoUri, {
      serverSelectionTimeoutMS: SERVER_SELECTION_TIMEOUT_MS,
    })

    const { host, name } = connection.connection
    logger.info(`[db] MongoDB connected: ${host}/${name}`)

    return connection
  } catch (err) {
    logger.error('[db] Could not connect to MongoDB', { message: redactCredentials(err?.message) })
    throw err
  }
}

export async function disconnectDB() {
  if (mongoose.connection.readyState === 0) return
  await mongoose.connection.close()
  logger.info('[db] MongoDB connection closed')
}

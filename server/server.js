// CVision AI - Express API entry point
import express from 'express'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'

import { corsOptions } from './middleware/cors.js'
import { notFoundHandler, errorHandler } from './middleware/errorHandler.js'
import { apiLimiter } from './middleware/rateLimiter.js'

import authRoutes from './routes/auth.routes.js'
import analysisRoutes from './routes/analysis.routes.js'
import resumeRoutes from './routes/resume.routes.js'
import jobRoutes from './routes/job.routes.js'

import { connectDB, disconnectDB, getDbStatus } from './config/db.js'
import { env, isProduction, isVercel } from './config/env.js'
import { logger } from './utils/logger.js'

const app = express()

app.set('trust proxy', 1)

app.use(helmet())
app.use(cors(corsOptions))
app.use(express.json({ limit: '1mb' }))
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())
app.use(morgan('dev'))
app.use('/api', apiLimiter)

app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'CVision AI API is running',
    data: { uptime: process.uptime(), env: env.nodeEnv, database: getDbStatus() },
  })
})

app.use('/api/auth', authRoutes)
app.use('/api/resumes', resumeRoutes)
app.use('/api/analysis', analysisRoutes)
app.use('/api/jobs', jobRoutes)

app.use(notFoundHandler)
app.use(errorHandler)

let server

async function start() {
  try {
    await connectDB()
  } catch (err) {
    // In production the API is useless without a database, so fail fast.
    // In development the process still boots so /api/health and the frontend
    // remain reachable while the connection string is being configured.
    logger.error(`[server] Database unavailable: ${err.message}`)
    if (isProduction) process.exit(1)
    logger.warn('[server] Starting without a database connection. Auth requests will fail until MONGODB_URI is set.')
  }

  if (!isVercel) {
    server = app.listen(env.port, () => {
      logger.info(`[server] CVision AI API listening on http://localhost:${env.port}`)
    })
  }
}

async function shutdown(signal) {
  logger.info(`[server] ${signal} received, shutting down`)
  try {
    if (server) await new Promise((resolve) => server.close(resolve))
    await disconnectDB()
    if (!isVercel) process.exit(0)
  } catch (err) {
    logger.error('[server] Error during shutdown', { message: err.message })
    if (!isVercel) process.exit(1)
  }
}

if (!isVercel) {
  process.on('SIGINT', () => shutdown('SIGINT'))
  process.on('SIGTERM', () => shutdown('SIGTERM'))

  process.on('unhandledRejection', (reason) => {
    logger.error('[server] Unhandled promise rejection', { message: reason?.message ?? String(reason) })
  })

  process.on('uncaughtException', (err) => {
    logger.error('[server] Uncaught exception', { message: err.message })
    shutdown('uncaughtException')
  })

  start()
}

export default app

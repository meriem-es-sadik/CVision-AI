import rateLimit from 'express-rate-limit'

import { env } from '../config/env.js'

// Limits are configurable so local development and the auth test suite can be
// exercised without loosening the production defaults shipped in .env.example.
export const apiLimiter = rateLimit({
  windowMs: env.rateLimit.apiWindowMs,
  limit: env.rateLimit.apiMax,
  standardHeaders: true,
  legacyHeaders: false,
})

export const authLimiter = rateLimit({
  windowMs: env.rateLimit.authWindowMs,
  limit: env.rateLimit.authMax,
  standardHeaders: true,
  legacyHeaders: false,
  // A rejected login must not consume the quota of the retry that follows it.
  skipSuccessfulRequests: true,
})

export const uploadLimiter = rateLimit({
  windowMs: env.rateLimit.uploadWindowMs,
  limit: env.rateLimit.uploadMax,
  standardHeaders: true,
  legacyHeaders: false,
})

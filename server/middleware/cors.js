import cors from 'cors'
import { env } from '../config/env.js'

// Lowercase, trim and strip any trailing slash/path so a CLIENT_URL like
// "https://app.vercel.app/" or "HTTPS://App.Vercel.App" still matches the
// exact Origin header browsers send. Invalid values simply never match
// (secure default).
function normalizeOrigin(value) {
  const raw = String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/\/+$/, '')

  try {
    return new URL(raw).origin
  } catch {
    return raw
  }
}

// CORS allowlist:
// - http://localhost:5173 is ALWAYS allowed so local development keeps
//   working even when CLIENT_URL points at the deployed frontend.
// - The production frontend origin comes from the CLIENT_URL env var,
//   e.g. CLIENT_URL=https://c-vision-ai-aa6q.vercel.app
const allowedOrigins = new Set([
  normalizeOrigin('http://localhost:5173'),
  normalizeOrigin(env.clientUrl),
])

export const corsOptions = {
  // Requests without an Origin header (curl, server-to-server, same-origin)
  // are not subject to CORS and pass through untouched.
  origin(origin, callback) {
    if (!origin) return callback(null, true)
    callback(null, allowedOrigins.has(normalizeOrigin(origin)))
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}

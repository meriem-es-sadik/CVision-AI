import bcrypt from 'bcryptjs'

import { env } from '../config/env.js'

export async function hashPassword(plainPassword) {
  if (plainPassword == null) throw new Error('plainPassword is required')
  return bcrypt.hash(plainPassword, env.bcryptSaltRounds)
}

export async function comparePassword(plainPassword, hashedPassword) {
  if (plainPassword == null || hashedPassword == null) return false
  return bcrypt.compare(plainPassword, hashedPassword)
}

import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'

import { env } from '../config/env.js'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PASSWORD_MIN_LENGTH = 8
const PASSWORD_MAX_LENGTH = 72
const NAME_MIN_LENGTH = 2
const NAME_MAX_LENGTH = 80

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [NAME_MIN_LENGTH, `Name must be at least ${NAME_MIN_LENGTH} characters`],
      maxlength: [NAME_MAX_LENGTH, `Name must be at most ${NAME_MAX_LENGTH} characters`],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      // `unique: true` creates a unique index, which also rejects duplicate
      // registrations at the database level.
      unique: true,
      lowercase: true,
      trim: true,
      match: [EMAIL_PATTERN, 'Email is not valid'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [PASSWORD_MIN_LENGTH, `Password must be at least ${PASSWORD_MIN_LENGTH} characters`],
      maxlength: [PASSWORD_MAX_LENGTH, `Password must be at most ${PASSWORD_MAX_LENGTH} characters`],
      // Never returned unless explicitly selected with .select('+password')
      select: false,
    },
  },
  { timestamps: true },
)

/**
 * Hash the password whenever it is set or changed, so plaintext never reaches
 * the database. Runs before insert and before updates of the password field.
 *
 * Must stay an async function taking no arguments: Mongoose only awaits a
 * returned promise, and treats a hook that declares a `next` parameter as
 * synchronous.
 */
userSchema.pre('save', async function hashPasswordBeforeSave() {
  if (!this.isModified('password')) return

  this.password = await bcrypt.hash(this.password, env.bcryptSaltRounds)
})

/**
 * Constant-time comparison of a plaintext password against the stored hash.
 * Resolves false when either side is missing instead of throwing.
 */
userSchema.methods.comparePassword = function comparePassword(plainPassword) {
  if (typeof plainPassword !== 'string' || !plainPassword || !this.password) {
    return Promise.resolve(false)
  }
  return bcrypt.compare(plainPassword, this.password)
}

/**
 * Shape returned to API clients. Strip password and internal revision key so a
 * plain `res.json(user)` can never leak credentials.
 */
userSchema.set('toJSON', {
  virtuals: true,
  transform(_doc, ret) {
    ret.id = ret._id?.toString()
    delete ret._id
    delete ret.password
    delete ret.__v
    return ret
  },
})

userSchema.methods.toSafeObject = function toSafeObject() {
  return this.toJSON()
}

export const User = mongoose.model('User', userSchema)
export { EMAIL_PATTERN, PASSWORD_MIN_LENGTH, PASSWORD_MAX_LENGTH, NAME_MIN_LENGTH, NAME_MAX_LENGTH }

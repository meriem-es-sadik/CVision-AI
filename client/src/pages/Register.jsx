import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, Check, LoaderCircle, UserPlus } from 'lucide-react'

import { AuthLayout } from '@/components/auth/AuthLayout'
import { FormAlert } from '@/components/auth/FormAlert'
import { FormField } from '@/components/auth/FormField'
import { PasswordInput } from '@/components/auth/PasswordInput'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AUTH_HOME, LOGIN_PATH } from '@/context/auth-context'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'
import {
  getPasswordRequirements,
  validateEmail,
  validateName,
  validatePassword,
} from '@/lib/validation'
import { getAuthError } from '@/services/authService'

const INITIAL_VALUES = { name: '', email: '', password: '', confirmPassword: '' }

export function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()

  const [values, setValues] = useState(INITIAL_VALUES)
  const [fieldErrors, setFieldErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const requirements = useMemo(() => getPasswordRequirements(values.password), [values.password])

  const handleChange = (field) => (event) => {
    const { value } = event.target
    setValues((current) => ({ ...current, [field]: value }))
    setFieldErrors((current) => ({ ...current, [field]: '' }))
    setFormError('')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (submitting) return

    const nextErrors = {
      name: validateName(values.name),
      email: validateEmail(values.email),
      password: validatePassword(values.password),
      confirmPassword: values.confirmPassword
        ? values.confirmPassword === values.password
          ? ''
          : 'Passwords do not match'
        : 'Please confirm your password',
    }

    setFieldErrors(nextErrors)
    setFormError('')

    if (Object.values(nextErrors).some(Boolean)) return

    setSubmitting(true)

    try {
      await register({
        name: values.name.trim(),
        email: values.email.trim(),
        password: values.password,
      })
      navigate(AUTH_HOME, { replace: true })
    } catch (error) {
      const { message, fieldErrors: serverFieldErrors } = getAuthError(error)
      setFormError(message)
      setFieldErrors(serverFieldErrors)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout
      eyebrow="Create account"
      title="Create your CVision AI account"
      description="Start analysing your CV, tracking your score and matching your skills to real roles. It takes less than a minute."
      footer={
        <span className="text-muted-foreground">
          Already have an account?{' '}
          <Link
            to={LOGIN_PATH}
            className="text-brand-700 dark:text-brand-300 font-medium underline-offset-4 hover:underline"
          >
            Sign in instead
          </Link>
        </span>
      }
    >
      {formError && (
        <FormAlert tone="error" title="Registration failed" message={formError} className="mb-5" />
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        <FormField id="register-name" label="Full name" error={fieldErrors.name}>
          <Input
            id="register-name"
            name="name"
            type="text"
            autoComplete="name"
            placeholder="Ada Lovelace"
            value={values.name}
            onChange={handleChange('name')}
            disabled={submitting}
            aria-invalid={fieldErrors.name ? 'true' : undefined}
            aria-describedby={fieldErrors.name ? 'register-name-error' : undefined}
          />
        </FormField>

        <FormField id="register-email" label="Email address" error={fieldErrors.email}>
          <Input
            id="register-email"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={values.email}
            onChange={handleChange('email')}
            disabled={submitting}
            aria-invalid={fieldErrors.email ? 'true' : undefined}
            aria-describedby={fieldErrors.email ? 'register-email-error' : undefined}
          />
        </FormField>

        <FormField id="register-password" label="Password" error={fieldErrors.password}>
          <PasswordInput
            id="register-password"
            name="password"
            value={values.password}
            onChange={handleChange('password')}
            disabled={submitting}
            error={fieldErrors.password}
            autoComplete="new-password"
            placeholder="At least 8 characters"
          />
        </FormField>

        <div>
          <ul className="flex flex-wrap gap-x-4 gap-y-1.5" aria-live="polite">
            {requirements.map((requirement) => (
              <li
                key={requirement.id}
                className={cn(
                  'flex items-center gap-1.5 text-xs transition-colors',
                  requirement.met ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground',
                )}
              >
                <Check
                  className={cn('size-3.5', !requirement.met && 'opacity-30')}
                  aria-hidden="true"
                />
                {requirement.label}
              </li>
            ))}
          </ul>
        </div>

        <FormField id="register-confirm" label="Confirm password" error={fieldErrors.confirmPassword}>
          <PasswordInput
            id="register-confirm"
            name="confirmPassword"
            value={values.confirmPassword}
            onChange={handleChange('confirmPassword')}
            disabled={submitting}
            error={fieldErrors.confirmPassword}
            autoComplete="new-password"
            placeholder="Re-enter your password"
          />
        </FormField>

        <Button type="submit" variant="brand" size="lg" disabled={submitting} className="w-full">
          {submitting ? (
            <>
              <LoaderCircle className="size-4 animate-spin" />
              Creating your account…
            </>
          ) : (
            <>
              <UserPlus className="size-4" />
              Create account
              <ArrowRight className="size-4" />
            </>
          )}
        </Button>

        <p className="text-muted-foreground text-center text-xs">
          By creating an account you agree to the CVision AI{' '}
          <Link to="/terms" className="underline underline-offset-4 hover:text-foreground">
            Terms
          </Link>{' '}
          and{' '}
          <Link to="/privacy" className="underline underline-offset-4 hover:text-foreground">
            Privacy Policy
          </Link>
          .
        </p>
      </form>

      <div className="mt-6 text-center">
        <Link
          to="/"
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 rounded text-sm transition-colors"
        >
          Back to CVision AI home
        </Link>
      </div>
    </AuthLayout>
  )
}

export default Register

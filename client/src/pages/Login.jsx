import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ArrowRight, LoaderCircle, LogIn } from 'lucide-react'

import { AuthLayout } from '@/components/auth/AuthLayout'
import { FormAlert } from '@/components/auth/FormAlert'
import { FormField } from '@/components/auth/FormField'
import { PasswordInput } from '@/components/auth/PasswordInput'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AUTH_HOME, REGISTER_PATH } from '@/context/auth-context'
import { useAuth } from '@/hooks/useAuth'
import { validateEmail } from '@/lib/validation'
import { getAuthError } from '@/services/authService'

const INITIAL_VALUES = { email: '', password: '' }

export function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [values, setValues] = useState(INITIAL_VALUES)
  const [fieldErrors, setFieldErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const redirectTo = location.state?.from?.pathname || AUTH_HOME

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
      email: validateEmail(values.email),
      password: values.password ? '' : 'Password is required',
    }

    setFieldErrors(nextErrors)
    setFormError('')

    if (nextErrors.email || nextErrors.password) return

    setSubmitting(true)

    try {
      await login({ email: values.email.trim(), password: values.password })
      navigate(redirectTo, { replace: true })
    } catch (error) {
      const { message, fieldErrors: serverFieldErrors } = getAuthError(error)
      setFormError(message)
      setFieldErrors(serverFieldErrors)
      setValues((current) => ({ ...current, password: '' }))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout
      eyebrow="Sign in"
      title="Welcome back"
      description="Sign in to continue to your CVision AI dashboard and track your CV improvements."
      footer={
        <span className="text-muted-foreground">
          New to CVision AI?{' '}
          <Link
            to={REGISTER_PATH}
            className="text-brand-700 dark:text-brand-300 font-medium underline-offset-4 hover:underline"
          >
            Create a free account
          </Link>
        </span>
      }
    >
      {formError && (
        <FormAlert tone="error" title="Sign-in failed" message={formError} className="mb-5" />
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        <FormField id="login-email" label="Email address" error={fieldErrors.email}>
          <Input
            id="login-email"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={values.email}
            onChange={handleChange('email')}
            disabled={submitting}
            aria-invalid={fieldErrors.email ? 'true' : undefined}
            aria-describedby={fieldErrors.email ? 'login-email-error' : undefined}
            className="h-11"
          />
        </FormField>

        <FormField id="login-password" label="Password" error={fieldErrors.password}>
          <PasswordInput
            id="login-password"
            name="password"
            value={values.password}
            onChange={handleChange('password')}
            disabled={submitting}
            error={fieldErrors.password}
            autoComplete="current-password"
            placeholder="Your password"
          />
        </FormField>

        <Button type="submit" variant="brand" size="lg" disabled={submitting} className="w-full">
          {submitting ? (
            <>
              <LoaderCircle className="size-4 animate-spin" />
              Signing in…
            </>
          ) : (
            <>
              <LogIn className="size-4" />
              Sign in
              <ArrowRight className="size-4" />
            </>
          )}
        </Button>

        <p className="text-muted-foreground text-center text-xs">
          Protected by rate limiting and bcrypt-hashed credentials. We never store your password.
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

export default Login

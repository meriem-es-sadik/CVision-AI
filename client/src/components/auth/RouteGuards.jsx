import { Navigate, useLocation } from 'react-router-dom'

import { AuthLoadingScreen } from '@/components/auth/AuthLoadingScreen'
import { AUTH_HOME, LOGIN_PATH } from '@/context/auth-context'
import { useAuth } from '@/hooks/useAuth'

export function RequireAuth({ children }) {
  const { isAuthenticated, loading } = useAuth()
  const location = useLocation()

  if (loading) return <AuthLoadingScreen />
  if (!isAuthenticated) {
    return <Navigate to={LOGIN_PATH} state={{ from: location }} replace />
  }

  return children
}

export function RedirectIfAuthenticated({ children }) {
  const { isAuthenticated, loading } = useAuth()

  if (loading) return <AuthLoadingScreen />
  if (isAuthenticated) return <Navigate to={AUTH_HOME} replace />

  return children
}

export default RequireAuth

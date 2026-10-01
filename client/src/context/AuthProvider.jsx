import { useCallback, useEffect, useMemo, useState } from 'react'

import { AuthContext } from '@/context/auth-context'
import {
  fetchMeRequest,
  loginRequest,
  logoutRequest,
  registerRequest,
} from '@/services/authService'
import { clearToken, getToken, onUnauthorized, setToken } from '@/services/tokenStore'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setTokenState] = useState(() => getToken())
  const [loading, setLoading] = useState(() => Boolean(getToken()))

  const startSession = useCallback(({ token: nextToken, user: nextUser }) => {
    setToken(nextToken)
    setTokenState(nextToken)
    setUser(nextUser)
  }, [])

  const endSession = useCallback(() => {
    clearToken()
    setTokenState(null)
    setUser(null)
  }, [])

  const login = useCallback(
    async (credentials) => {
      const result = await loginRequest(credentials)
      startSession(result)
      return result?.user ?? null
    },
    [startSession],
  )

  const register = useCallback(
    async (payload) => {
      const result = await registerRequest(payload)
      startSession(result)
      return result?.user ?? null
    },
    [startSession],
  )

  const logout = useCallback(async () => {
    try {
      await logoutRequest()
    } catch {
      // The endpoint is stateless; the local session must be cleared regardless.
    } finally {
      endSession()
    }
  }, [endSession])

  const refreshUser = useCallback(async () => {
    if (!getToken()) {
      endSession()
      return null
    }

    try {
      const currentUser = await fetchMeRequest()
      setUser(currentUser)
      return currentUser
    } catch {
      endSession()
      return null
    }
  }, [endSession])

  // Re-hydrate the session from the persisted token on first mount. When no token
  // is stored the initial state is already correct, so nothing has to be reset.
  useEffect(() => {
    if (!getToken()) return undefined

    let cancelled = false

    fetchMeRequest()
      .then((currentUser) => {
        if (!cancelled) setUser(currentUser)
      })
      .catch(() => {
        if (cancelled) return
        clearToken()
        setTokenState(null)
        setUser(null)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  // A 401 from any protected request means the token is no longer usable.
  useEffect(() => onUnauthorized(() => {
    endSession()
    setLoading(false)
  }), [endSession])

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      isAuthenticated: Boolean(token && user),
      login,
      register,
      logout,
      refreshUser,
    }),
    [user, token, loading, login, register, logout, refreshUser],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export default AuthProvider

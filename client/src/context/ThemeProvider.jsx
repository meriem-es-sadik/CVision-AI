import { useCallback, useEffect, useMemo, useState } from 'react'

import { ThemeContext, THEME_STORAGE_KEY } from '@/context/theme-context'

const VALID_THEMES = ['light', 'dark', 'system']

function getSystemTheme() {
  if (typeof window === 'undefined') return 'light'

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function getStoredTheme() {
  if (typeof window === 'undefined') return null

  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY)
    return VALID_THEMES.includes(stored) ? stored : null
  } catch {
    return null
  }
}

export function ThemeProvider({ children, defaultTheme = 'system', storageKey = THEME_STORAGE_KEY }) {
  const [theme, setThemeState] = useState(() => getStoredTheme() ?? defaultTheme)
  const [systemTheme, setSystemTheme] = useState(() => getSystemTheme())

  const resolvedTheme = theme === 'system' ? systemTheme : theme

  const setTheme = useCallback(
    (preference) => {
      const next = VALID_THEMES.includes(preference) ? preference : 'system'

      setThemeState(next)

      try {
        window.localStorage.setItem(storageKey, next)
      } catch {
        /* storage unavailable - the theme still applies for this session */
      }
    },
    [storageKey],
  )

  const toggleTheme = useCallback(() => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')
  }, [resolvedTheme, setTheme])

  useEffect(() => {
    if (theme !== 'system') return undefined

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = (event) => setSystemTheme(event.matches ? 'dark' : 'light')

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [theme])

  useEffect(() => {
    const root = document.documentElement

    root.classList.toggle('dark', resolvedTheme === 'dark')
    root.style.colorScheme = resolvedTheme
  }, [resolvedTheme])

  const value = useMemo(
    () => ({ theme, resolvedTheme, setTheme, toggleTheme }),
    [theme, resolvedTheme, setTheme, toggleTheme],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

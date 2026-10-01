const TOKEN_STORAGE_KEY = 'cvision-ai.auth.token'

const unauthorizedListeners = new Set()

function getStorage() {
  try {
    return window.localStorage
  } catch {
    // Private mode / disabled storage: auth still works for the current page load.
    return null
  }
}

export function getToken() {
  const storage = getStorage()
  if (!storage) return null

  try {
    const stored = storage.getItem(TOKEN_STORAGE_KEY)
    return stored && stored.trim() ? stored : null
  } catch {
    return null
  }
}

export function setToken(token) {
  const storage = getStorage()
  if (!storage) return

  try {
    if (typeof token === 'string' && token.trim()) {
      storage.setItem(TOKEN_STORAGE_KEY, token)
    } else {
      storage.removeItem(TOKEN_STORAGE_KEY)
    }
  } catch {
    /* storage unavailable - the token stays in memory for this page load */
  }
}

export function clearToken() {
  setToken(null)
}

export function onUnauthorized(listener) {
  unauthorizedListeners.add(listener)
  return () => unauthorizedListeners.delete(listener)
}

export function notifyUnauthorized() {
  for (const listener of unauthorizedListeners) listener()
}

export { TOKEN_STORAGE_KEY }

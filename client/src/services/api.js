import axios from 'axios'

import { getToken, notifyUnauthorized } from '@/services/tokenStore'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Login and register report their own 401/409 to the form, so they are excluded
// from the global handler to avoid wiping state or redirecting mid-submit.
const PUBLIC_AUTH_PATHS = ['/auth/login', '/auth/register']

function isPublicAuthPath(url = '') {
  return PUBLIC_AUTH_PATHS.some((path) => url.endsWith(path))
}

api.interceptors.request.use((config) => {
  const token = getToken()

  if (token) {
    config.headers = config.headers ?? {}
    config.headers.Authorization = `Bearer ${token}`
  }

  // For multipart uploads let the browser set the multipart boundary itself.
  // Axios sets the correct header automatically; an explicit JSON content type
  // would produce a broken/incorrect Content-Type for FormData.
  if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
    delete config.headers['Content-Type']
    delete config.headers['content-type']
  }

  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status
    const url = error?.config?.url

    if (status === 401 && !isPublicAuthPath(url)) {
      notifyUnauthorized()
    }

    return Promise.reject(error)
  },
)

export default api

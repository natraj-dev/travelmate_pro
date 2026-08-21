import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

function getTokens() {
  return {
    access: localStorage.getItem('tmp_access_token'),
    refresh: localStorage.getItem('tmp_refresh_token'),
  }
}

export function setTokens(access, refresh) {
  if (access) localStorage.setItem('tmp_access_token', access)
  if (refresh) localStorage.setItem('tmp_refresh_token', refresh)
}

export function clearTokens() {
  localStorage.removeItem('tmp_access_token')
  localStorage.removeItem('tmp_refresh_token')
}

apiClient.interceptors.request.use((config) => {
  const { access } = getTokens()
  if (access) config.headers.Authorization = `Bearer ${access}`
  return config
})

let refreshPromise = null

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config
    const status = error.response?.status

    if (status === 401 && !original._retry && !original.url?.includes('/auth/')) {
      original._retry = true
      const { refresh } = getTokens()
      if (!refresh) {
        clearTokens()
        window.location.href = '/login'
        return Promise.reject(error)
      }

      try {
        if (!refreshPromise) {
          refreshPromise = axios
            .post(`${API_BASE_URL}/auth/refresh`, { refresh_token: refresh })
            .finally(() => {
              refreshPromise = null
            })
        }
        const { data } = await refreshPromise
        setTokens(data.access_token, data.refresh_token)
        original.headers.Authorization = `Bearer ${data.access_token}`
        return apiClient(original)
      } catch (refreshError) {
        clearTokens()
        window.location.href = '/login'
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  }
)

export function apiErrorMessage(error, fallback = 'Something went wrong. Please try again.') {
  const detail = error?.response?.data?.detail
  if (typeof detail === 'string') return detail
  if (Array.isArray(error?.response?.data?.errors) && error.response.data.errors.length) {
    return error.response.data.errors.map((e) => e.message).join(', ')
  }
  return fallback
}

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { authApi } from '../api/auth'
import { setTokens, clearTokens } from '../api/axiosClient'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const loadUser = useCallback(async () => {
    const hasToken = localStorage.getItem('tmp_access_token')
    if (!hasToken) {
      setLoading(false)
      return
    }
    try {
      const me = await authApi.me()
      setUser(me)
    } catch {
      clearTokens()
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadUser()
  }, [loadUser])

  const login = async (email, password) => {
    const data = await authApi.login({ email, password })
    setTokens(data.access_token, data.refresh_token)
    setUser(data.user)
    return data.user
  }

  const register = async (payload) => {
    const data = await authApi.register(payload)
    setTokens(data.access_token, data.refresh_token)
    setUser(data.user)
    return data.user
  }

  const logout = async () => {
    const refresh = localStorage.getItem('tmp_refresh_token')
    try {
      if (refresh) await authApi.logout(refresh)
    } catch {
      // best-effort — clear locally regardless
    }
    clearTokens()
    setUser(null)
  }

  const refreshUser = async () => {
    const me = await authApi.me()
    setUser(me)
    return me
  }

  return (
    <AuthContext.Provider value={{ user, setUser, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

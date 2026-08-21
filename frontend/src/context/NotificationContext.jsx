import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { notificationApi } from '../api/communication'
import { useAuth } from './AuthContext'

const NotificationContext = createContext(null)

export function NotificationProvider({ children }) {
  const { user } = useAuth()
  const [unreadCount, setUnreadCount] = useState(0)

  const refresh = useCallback(async () => {
    if (!user) {
      setUnreadCount(0)
      return
    }
    try {
      const { unread_count } = await notificationApi.unreadCount()
      setUnreadCount(unread_count)
    } catch {
      // silent — notifications are non-critical
    }
  }, [user])

  useEffect(() => {
    refresh()
    if (!user) return
    const interval = setInterval(refresh, 30000)
    return () => clearInterval(interval)
  }, [user, refresh])

  return (
    <NotificationContext.Provider value={{ unreadCount, refresh }}>
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  const ctx = useContext(NotificationContext)
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider')
  return ctx
}

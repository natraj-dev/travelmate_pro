import { useEffect, useState } from 'react'
import { Bell, CheckCheck, Trash2 } from 'lucide-react'
import { notificationApi } from '../../api/communication'
import { useNotifications } from '../../context/NotificationContext'
import PageHeader from '../../components/common/PageHeader'
import Loader from '../../components/common/Loader'
import EmptyState from '../../components/common/EmptyState'
import { timeAgo } from '../../utils/format'

const ICON_TONE = {
  BOOKING_CONFIRMATION: 'bg-success/10 text-success',
  PAYMENT_SUCCESS: 'bg-success/10 text-success',
  PAYMENT_FAILURE: 'bg-danger/10 text-danger',
  REFUND_UPDATE: 'bg-info/10 text-info',
  MESSAGE: 'bg-ink/8 text-ink',
  SYSTEM: 'bg-gold/15 text-gold-dark',
}

export default function Notifications() {
  const { refresh } = useNotifications()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  const load = () => {
    setLoading(true)
    notificationApi.list({ page_size: 30 }).then((res) => {
      setItems(res.items)
      setLoading(false)
    })
  }
  useEffect(load, [])

  const handleMarkAllRead = async () => {
    await notificationApi.markAllRead()
    load()
    refresh()
  }

  const handleMarkRead = async (id) => {
    await notificationApi.markRead(id)
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)))
    refresh()
  }

  const handleDelete = async (id) => {
    await notificationApi.remove(id)
    setItems((prev) => prev.filter((n) => n.id !== id))
  }

  return (
    <div>
      <PageHeader
        title="Notifications"
        subtitle="Booking updates, payments, and system alerts."
        action={<button onClick={handleMarkAllRead} className="btn-outline btn-sm"><CheckCheck size={14} /> Mark all read</button>}
      />

      {loading ? (
        <Loader />
      ) : items.length === 0 ? (
        <EmptyState icon={Bell} title="You're all caught up" description="No notifications right now." />
      ) : (
        <div className="space-y-2">
          {items.map((n) => (
            <div
              key={n.id}
              onClick={() => !n.is_read && handleMarkRead(n.id)}
              className={`card p-4 flex items-start gap-3 cursor-pointer ${!n.is_read ? 'border-l-4 border-l-gold' : ''}`}
            >
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${ICON_TONE[n.type] || 'bg-ink/8 text-ink'}`}>
                <Bell size={15} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-charcoal">{n.title}</p>
                <p className="text-sm text-slate mt-0.5">{n.message}</p>
                <p className="text-xs text-slate/70 mt-1">{timeAgo(n.created_at)}</p>
              </div>
              <button onClick={(e) => { e.stopPropagation(); handleDelete(n.id) }} className="text-slate hover:text-danger shrink-0">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

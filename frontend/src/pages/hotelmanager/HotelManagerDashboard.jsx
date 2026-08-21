import { useEffect, useState } from 'react'
import { Hotel, CalendarCheck, BedDouble, Star } from 'lucide-react'
import { dashboardApi } from '../../api/business'
import StatCard from '../../components/common/StatCard'
import Loader from '../../components/common/Loader'
import StatusBadge from '../../components/common/StatusBadge'
import { formatCurrency, formatDate } from '../../utils/format'

export default function HotelManagerDashboard() {
  const [data, setData] = useState(null)

  useEffect(() => { dashboardApi.hotelManager().then(setData) }, [])

  if (!data) return <Loader full />

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-2xl sm:text-3xl text-ink">Hotel Manager Dashboard</h1>
        <p className="text-slate text-sm mt-1">Overview of your properties and bookings.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="My hotels" value={data.total_hotels} icon={Hotel} accent="ink" />
        <StatCard label="Total bookings" value={data.total_bookings} icon={CalendarCheck} accent="gold" />
        <StatCard label="Occupied today" value={data.occupied_rooms_today} icon={BedDouble} accent="info" />
        <StatCard label="Total revenue" value={formatCurrency(data.total_revenue)} icon={Star} accent="success" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <h3 className="font-display text-lg text-ink mb-4">Recent bookings</h3>
          {data.recent_bookings.length === 0 ? (
            <p className="text-sm text-slate">No bookings yet.</p>
          ) : (
            <div className="space-y-3">
              {data.recent_bookings.map((b) => (
                <div key={b.id} className="flex items-center justify-between border-b border-ink/8 pb-3 last:border-0">
                  <div>
                    <p className="font-mono text-sm text-charcoal">{b.reference}</p>
                    <p className="text-xs text-slate">{formatDate(b.check_in)} → {formatDate(b.check_out)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-charcoal">{formatCurrency(b.amount)}</p>
                    <StatusBadge status={b.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card p-6">
          <h3 className="font-display text-lg text-ink mb-4">Recent reviews</h3>
          {data.recent_reviews.length === 0 ? (
            <p className="text-sm text-slate">No reviews yet.</p>
          ) : (
            <div className="space-y-3">
              {data.recent_reviews.map((r) => (
                <div key={r.id} className="border-b border-ink/8 pb-3 last:border-0">
                  <p className="text-sm font-semibold text-gold-dark">{'★'.repeat(r.rating)}</p>
                  <p className="text-sm text-slate mt-1">{r.comment}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

import { useEffect, useState } from 'react'
import { MapPinned, CalendarCheck, Users, DollarSign } from 'lucide-react'
import { dashboardApi } from '../../api/business'
import StatCard from '../../components/common/StatCard'
import Loader from '../../components/common/Loader'
import { formatCurrency } from '../../utils/format'

export default function TourOperatorDashboard() {
  const [data, setData] = useState(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    dashboardApi.tourOperator().then(setData).catch(() => setError(true))
  }, [])

  if (error) {
    return (
      <div className="card p-10 text-center">
        <MapPinned className="mx-auto text-ink/20 mb-3" size={32} />
        <p className="text-slate text-sm">Register as a tour operator first to see your dashboard.</p>
      </div>
    )
  }

  if (!data) return <Loader full />

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-2xl sm:text-3xl text-ink">Tour Operator Dashboard</h1>
        <p className="text-slate text-sm mt-1">Overview of your tour packages and bookings.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Active tours" value={data.active_tours} icon={MapPinned} accent="ink" />
        <StatCard label="Total bookings" value={data.total_bookings} icon={CalendarCheck} accent="gold" />
        <StatCard label="Unique customers" value={data.unique_customers} icon={Users} accent="info" />
        <StatCard label="Total revenue" value={formatCurrency(data.total_revenue)} icon={DollarSign} accent="success" />
      </div>

      <div className="card p-6">
        <h3 className="font-display text-lg text-ink mb-4">Top packages</h3>
        {data.top_packages.length === 0 ? (
          <p className="text-sm text-slate">No packages yet.</p>
        ) : (
          <div className="space-y-3">
            {data.top_packages.map((p) => (
              <div key={p.id} className="flex items-center justify-between border-b border-ink/8 pb-3 last:border-0">
                <p className="text-sm font-semibold text-charcoal">{p.title}</p>
                <div className="text-right text-xs text-slate">{p.bookings} bookings · {p.rating.toFixed(1)}★</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

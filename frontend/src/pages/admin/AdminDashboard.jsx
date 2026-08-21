import { useEffect, useState } from 'react'
import { Users, Hotel, MapPinned, CalendarCheck, DollarSign, ShieldAlert, LifeBuoy, Undo2 } from 'lucide-react'
import RevenueLineChart from '../../components/charts/RevenueLineChart'
import { analyticsApi } from '../../api/admin'
import StatCard from '../../components/common/StatCard'
import Loader from '../../components/common/Loader'
import { formatCurrency } from '../../utils/format'

export default function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [trend, setTrend] = useState([])
  const [popular, setPopular] = useState([])

  useEffect(() => {
    analyticsApi.admin().then(setStats)
    analyticsApi.revenueTrend(30).then(setTrend)
    analyticsApi.popularDestinations(6).then(setPopular)
  }, [])

  if (!stats) return <Loader full />

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-2xl sm:text-3xl text-ink">Platform Overview</h1>
        <p className="text-slate text-sm mt-1">Real-time snapshot of TravelMate Pro.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total customers" value={stats.total_customers} icon={Users} accent="ink" />
        <StatCard label="Total bookings" value={stats.total_bookings} icon={CalendarCheck} accent="gold" />
        <StatCard label="Total revenue" value={formatCurrency(stats.total_revenue)} icon={DollarSign} accent="success" />
        <StatCard label="Total refunds" value={formatCurrency(stats.total_refunds)} icon={Undo2} accent="info" />
        <StatCard label="Hotels listed" value={stats.total_hotels} icon={Hotel} accent="ink" />
        <StatCard label="Tour packages" value={stats.total_tours} icon={MapPinned} accent="gold" />
        <StatCard label="Pending verifications" value={stats.pending_verifications} icon={ShieldAlert} accent="info" />
        <StatCard label="Open support tickets" value={stats.open_support_tickets} icon={LifeBuoy} accent="success" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card p-6">
          <h3 className="font-display text-lg text-ink mb-4">Revenue — last 30 days</h3>
          {trend.length === 0 ? (
            <p className="text-sm text-slate py-12 text-center">No revenue data yet.</p>
          ) : (
            <RevenueLineChart data={trend} height={260} />
          )}
        </div>

        <div className="card p-6">
          <h3 className="font-display text-lg text-ink mb-4">Popular destinations</h3>
          {popular.length === 0 ? (
            <p className="text-sm text-slate">No booking data yet.</p>
          ) : (
            <div className="space-y-3">
              {popular.map((d, idx) => (
                <div key={d.destination_id} className="flex items-center justify-between">
                  <span className="text-sm text-charcoal flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-ink/8 text-ink text-xs font-semibold flex items-center justify-center">{idx + 1}</span>
                    {d.name}
                  </span>
                  <span className="text-xs font-mono text-slate">{d.booking_count} bookings</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

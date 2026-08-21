import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { CalendarCheck, Heart, Route, Wallet, ArrowRight, Sparkles } from 'lucide-react'
import { dashboardApi } from '../../api/business'
import { aiRecommendationApi } from '../../api/ai'
import { useAuth } from '../../context/AuthContext'
import StatCard from '../../components/common/StatCard'
import Loader from '../../components/common/Loader'
import { formatCurrency, formatDate } from '../../utils/format'

export default function CustomerDashboard() {
  const { user } = useAuth()
  const [data, setData] = useState(null)
  const [recs, setRecs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      dashboardApi.customer(),
      aiRecommendationApi.get({ limit: 4 }).catch(() => []),
    ]).then(([d, r]) => {
      setData(d)
      setRecs(r)
      setLoading(false)
    })
  }, [])

  if (loading) return <Loader full />

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-2xl sm:text-3xl text-ink">Welcome back, {user?.first_name}</h1>
        <p className="text-slate text-sm mt-1">Here's what's happening with your trips.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Wishlist items" value={data.wishlist_count} icon={Heart} accent="ink" />
        <StatCard label="Saved itineraries" value={data.saved_itineraries} icon={Route} accent="gold" />
        <StatCard label="Upcoming stays" value={data.upcoming_hotel_bookings.length} icon={CalendarCheck} accent="success" />
        <StatCard label="Total spent" value={formatCurrency(data.total_spent)} icon={Wallet} accent="info" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-lg text-ink">Upcoming hotel stays</h3>
            <Link to="/app/bookings" className="text-xs font-semibold text-ink hover:text-gold-dark flex items-center gap-1">View all <ArrowRight size={13} /></Link>
          </div>
          {data.upcoming_hotel_bookings.length === 0 ? (
            <p className="text-sm text-slate py-6 text-center">No upcoming stays booked yet.</p>
          ) : (
            <div className="space-y-3">
              {data.upcoming_hotel_bookings.map((b) => (
                <div key={b.id} className="flex items-center justify-between border border-ink/8 rounded-xl px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold text-charcoal font-mono">{b.reference}</p>
                    <p className="text-xs text-slate">Check-in {formatDate(b.check_in)}</p>
                  </div>
                  <Link to="/app/bookings" className="text-xs font-semibold text-gold-dark">Details</Link>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-lg text-ink">Upcoming tours</h3>
            <Link to="/app/bookings" className="text-xs font-semibold text-ink hover:text-gold-dark flex items-center gap-1">View all <ArrowRight size={13} /></Link>
          </div>
          {data.upcoming_tour_bookings.length === 0 ? (
            <p className="text-sm text-slate py-6 text-center">No upcoming tours booked yet.</p>
          ) : (
            <div className="space-y-3">
              {data.upcoming_tour_bookings.map((b) => (
                <div key={b.id} className="flex items-center justify-between border border-ink/8 rounded-xl px-4 py-3">
                  <p className="text-sm font-semibold text-charcoal font-mono">{b.reference}</p>
                  <Link to="/app/bookings" className="text-xs font-semibold text-gold-dark">Details</Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {recs.length > 0 && (
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles size={18} className="text-gold-dark" />
            <h3 className="font-display text-lg text-ink">Picked for you</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {recs.map((r) => (
              <div key={r.id} className="border border-ink/8 rounded-xl p-4">
                <span className="badge-neutral mb-2">{r.recommendation_type}</span>
                <p className="text-sm text-charcoal/80">{r.reason}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

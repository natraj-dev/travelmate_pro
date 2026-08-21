import { useEffect, useState } from 'react'
import { CalendarCheck } from 'lucide-react'
import { hotelBookingApi } from '../../api/hotels'
import PageHeader from '../../components/common/PageHeader'
import Loader from '../../components/common/Loader'
import EmptyState from '../../components/common/EmptyState'
import StatusBadge from '../../components/common/StatusBadge'
import Pagination from '../../components/common/Pagination'
import { formatCurrency, formatDate } from '../../utils/format'

export default function HotelBookings() {
  const [result, setResult] = useState({ items: [], page: 1, total_pages: 0 })
  const [loading, setLoading] = useState(true)

  const load = (page = 1) => {
    setLoading(true)
    hotelBookingApi.list({ page, page_size: 15 }).then((res) => { setResult(res); setLoading(false) })
  }
  useEffect(() => load(1), [])

  return (
    <div>
      <PageHeader title="Hotel Bookings" subtitle="All bookings across your properties." />
      {loading ? <Loader /> : result.items.length === 0 ? (
        <EmptyState icon={CalendarCheck} title="No bookings yet" />
      ) : (
        <>
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-sand text-left text-xs uppercase tracking-wide text-slate">
                <tr>
                  <th className="px-4 py-3">Reference</th>
                  <th className="px-4 py-3">Dates</th>
                  <th className="px-4 py-3">Guests</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {result.items.map((b) => (
                  <tr key={b.id} className="border-t border-ink/6">
                    <td className="px-4 py-3 font-mono text-xs">{b.booking_reference}</td>
                    <td className="px-4 py-3 text-xs text-slate">{formatDate(b.check_in_date)} → {formatDate(b.check_out_date)}</td>
                    <td className="px-4 py-3 text-xs">{b.guests_adults + b.guests_children}</td>
                    <td className="px-4 py-3 font-semibold">{formatCurrency(b.total_amount)}</td>
                    <td className="px-4 py-3"><StatusBadge status={b.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={result.page} totalPages={result.total_pages} onChange={load} />
        </>
      )}
    </div>
  )
}

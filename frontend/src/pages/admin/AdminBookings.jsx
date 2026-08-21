import { useEffect, useState } from 'react'
import { CalendarCheck } from 'lucide-react'
import { adminApi } from '../../api/admin'
import PageHeader from '../../components/common/PageHeader'
import Tabs from '../../components/common/Tabs'
import Loader from '../../components/common/Loader'
import EmptyState from '../../components/common/EmptyState'
import StatusBadge from '../../components/common/StatusBadge'
import Pagination from '../../components/common/Pagination'
import { formatCurrency, formatDate } from '../../utils/format'

export default function AdminBookings() {
  const [tab, setTab] = useState('hotel')
  const [result, setResult] = useState({ items: [], page: 1, total_pages: 0 })
  const [loading, setLoading] = useState(true)

  const load = (page = 1) => {
    setLoading(true)
    const fn = tab === 'hotel' ? adminApi.hotelBookings : adminApi.tourBookings
    fn({ page, page_size: 15 }).then((res) => { setResult(res); setLoading(false) })
  }
  useEffect(() => load(1), [tab]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div>
      <PageHeader title="Bookings" subtitle="Monitor all hotel and tour bookings platform-wide." />
      <Tabs tabs={[{ value: 'hotel', label: 'Hotel Bookings' }, { value: 'tour', label: 'Tour Bookings' }]} active={tab} onChange={setTab} />

      {loading ? <Loader /> : result.items.length === 0 ? (
        <EmptyState icon={CalendarCheck} title="No bookings found" />
      ) : (
        <>
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-sand text-left text-xs uppercase tracking-wide text-slate">
                <tr>
                  <th className="px-4 py-3">Reference</th>
                  <th className="px-4 py-3">Customer ID</th>
                  <th className="px-4 py-3">{tab === 'hotel' ? 'Dates' : 'Travelers'}</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {result.items.map((b) => (
                  <tr key={b.id} className="border-t border-ink/6">
                    <td className="px-4 py-3 font-mono text-xs">{b.booking_reference}</td>
                    <td className="px-4 py-3 text-xs">#{b.customer_id}</td>
                    <td className="px-4 py-3 text-xs text-slate">
                      {tab === 'hotel' ? `${formatDate(b.check_in_date)} → ${formatDate(b.check_out_date)}` : b.traveler_count}
                    </td>
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

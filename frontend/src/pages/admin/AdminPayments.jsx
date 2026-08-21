import { useEffect, useState } from 'react'
import { ReceiptText } from 'lucide-react'
import { adminApi } from '../../api/admin'
import PageHeader from '../../components/common/PageHeader'
import Loader from '../../components/common/Loader'
import EmptyState from '../../components/common/EmptyState'
import StatusBadge from '../../components/common/StatusBadge'
import Pagination from '../../components/common/Pagination'
import { formatCurrency, formatDateTime } from '../../utils/format'

export default function AdminPayments() {
  const [result, setResult] = useState({ items: [], page: 1, total_pages: 0 })
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')

  const load = (page = 1) => {
    setLoading(true)
    const params = { page, page_size: 15 }
    if (statusFilter) params.status_filter = statusFilter
    adminApi.payments(params).then((res) => { setResult(res); setLoading(false) })
  }
  useEffect(() => load(1), [statusFilter]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div>
      <PageHeader title="Payments" subtitle="All payment transactions across the platform." />

      <div className="mb-5">
        <select className="select w-52" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All statuses</option>
          {['PENDING', 'SUCCEEDED', 'FAILED', 'REFUNDED', 'PARTIALLY_REFUNDED'].map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {loading ? <Loader /> : result.items.length === 0 ? (
        <EmptyState icon={ReceiptText} title="No payments found" />
      ) : (
        <>
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-sand text-left text-xs uppercase tracking-wide text-slate">
                <tr>
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Paid at</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {result.items.map((p) => (
                  <tr key={p.id} className="border-t border-ink/6">
                    <td className="px-4 py-3 font-mono text-xs">#{p.id}</td>
                    <td className="px-4 py-3 text-xs">#{p.customer_id}</td>
                    <td className="px-4 py-3 font-semibold">{formatCurrency(p.amount, p.currency?.toUpperCase())}</td>
                    <td className="px-4 py-3 text-xs text-slate">{p.paid_at ? formatDateTime(p.paid_at) : '—'}</td>
                    <td className="px-4 py-3"><StatusBadge status={p.status} /></td>
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

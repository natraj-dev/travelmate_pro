import { useEffect, useState } from 'react'
import { Undo2, Check, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { refundApi } from '../../api/payments'
import PageHeader from '../../components/common/PageHeader'
import Loader from '../../components/common/Loader'
import EmptyState from '../../components/common/EmptyState'
import StatusBadge from '../../components/common/StatusBadge'
import { formatCurrency, formatDate } from '../../utils/format'
import { apiErrorMessage } from '../../api/axiosClient'

export default function AdminRefunds() {
  const [refunds, setRefunds] = useState([])
  const [loading, setLoading] = useState(true)

  const load = () => {
    setLoading(true)
    refundApi.list({ page_size: 50 }).then((res) => { setRefunds(res.items); setLoading(false) })
  }
  useEffect(load, [])

  const handleReview = async (id, approve) => {
    try {
      await refundApi.review(id, { approve })
      toast.success(approve ? 'Refund approved and processed' : 'Refund rejected')
      load()
    } catch (err) {
      toast.error(apiErrorMessage(err))
    }
  }

  return (
    <div>
      <PageHeader title="Refunds" subtitle="Review and process customer refund requests." />

      {loading ? <Loader /> : refunds.length === 0 ? (
        <EmptyState icon={Undo2} title="No refund requests" />
      ) : (
        <div className="space-y-3">
          {refunds.map((r) => (
            <div key={r.id} className="card p-5 flex items-center justify-between gap-4 flex-wrap">
              <div>
                <p className="font-semibold text-sm text-charcoal">Payment #{r.payment_id} — {formatCurrency(r.amount)}</p>
                <p className="text-xs text-slate mt-1">{r.reason || 'No reason provided'}</p>
                <p className="text-xs text-slate/70 mt-0.5">{formatDate(r.created_at)}</p>
              </div>
              <div className="flex items-center gap-3">
                <StatusBadge status={r.status} />
                {r.status === 'REQUESTED' && (
                  <div className="flex gap-2">
                    <button onClick={() => handleReview(r.id, false)} className="btn-outline btn-sm text-danger border-danger/20"><X size={13} /> Reject</button>
                    <button onClick={() => handleReview(r.id, true)} className="btn-gold btn-sm"><Check size={13} /> Approve</button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

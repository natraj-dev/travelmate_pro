import { useEffect, useState } from 'react'
import { TicketPercent, Plus, Ban } from 'lucide-react'
import toast from 'react-hot-toast'
import { couponApi } from '../../api/payments'
import PageHeader from '../../components/common/PageHeader'
import Loader from '../../components/common/Loader'
import EmptyState from '../../components/common/EmptyState'
import Modal from '../../components/common/Modal'
import { formatCurrency } from '../../utils/format'
import { apiErrorMessage } from '../../api/axiosClient'

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState([])
  const [loading, setLoading] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)

  const load = () => {
    setLoading(true)
    couponApi.list().then((c) => { setCoupons(c); setLoading(false) })
  }
  useEffect(load, [])

  const handleDeactivate = async (id) => {
    try {
      await couponApi.deactivate(id)
      load()
    } catch (err) {
      toast.error(apiErrorMessage(err))
    }
  }

  return (
    <div>
      <PageHeader
        title="Coupons & Discounts"
        subtitle="Create promotional codes and manage active offers."
        action={<button onClick={() => setCreateOpen(true)} className="btn-gold"><Plus size={16} /> New coupon</button>}
      />

      {loading ? <Loader /> : coupons.length === 0 ? (
        <EmptyState icon={TicketPercent} title="No coupons yet" />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {coupons.map((c) => (
            <div key={c.id} className="ticket p-5">
              <div className="flex items-start justify-between mb-2">
                <p className="font-mono font-bold text-lg text-ink">{c.code}</p>
                <span className={c.is_active ? 'badge-success' : 'badge-neutral'}>{c.is_active ? 'Active' : 'Inactive'}</span>
              </div>
              <p className="text-sm text-charcoal/80 mb-2">{c.description}</p>
              <p className="text-sm font-semibold text-gold-dark mb-3">
                {c.discount_type === 'PERCENTAGE' ? `${c.discount_value}% off` : `${formatCurrency(c.discount_value)} off`}
              </p>
              <p className="text-xs text-slate">{c.usage_count}{c.usage_limit ? `/${c.usage_limit}` : ''} redeemed</p>
              {c.is_active && (
                <button onClick={() => handleDeactivate(c.id)} className="btn-outline btn-sm w-full mt-3"><Ban size={13} /> Deactivate</button>
              )}
            </div>
          ))}
        </div>
      )}

      <CreateCouponModal open={createOpen} onClose={() => setCreateOpen(false)} onCreated={load} />
    </div>
  )
}

function CreateCouponModal({ open, onClose, onCreated }) {
  const [form, setForm] = useState({ code: '', description: '', discount_type: 'PERCENTAGE', discount_value: '', min_order_amount: 0, usage_limit: '', per_user_limit: 1 })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await couponApi.create({
        ...form, discount_value: Number(form.discount_value), min_order_amount: Number(form.min_order_amount || 0),
        usage_limit: form.usage_limit ? Number(form.usage_limit) : undefined, per_user_limit: Number(form.per_user_limit),
      })
      toast.success('Coupon created')
      onCreated()
      onClose()
      setForm({ code: '', description: '', discount_type: 'PERCENTAGE', discount_value: '', min_order_amount: 0, usage_limit: '', per_user_limit: 1 })
    } catch (err) {
      toast.error(apiErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Create coupon">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="field-label">Code</label>
          <input required className="input font-mono" placeholder="SUMMER25" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} />
        </div>
        <div>
          <label className="field-label">Description</label>
          <input className="input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="field-label">Discount type</label>
            <select className="select" value={form.discount_type} onChange={(e) => setForm({ ...form, discount_type: e.target.value })}>
              <option value="PERCENTAGE">Percentage</option>
              <option value="FIXED">Fixed amount</option>
            </select>
          </div>
          <div>
            <label className="field-label">Discount value</label>
            <input required type="number" className="input" value={form.discount_value} onChange={(e) => setForm({ ...form, discount_value: e.target.value })} />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="field-label">Min order</label>
            <input type="number" className="input" value={form.min_order_amount} onChange={(e) => setForm({ ...form, min_order_amount: e.target.value })} />
          </div>
          <div>
            <label className="field-label">Usage limit</label>
            <input type="number" className="input" placeholder="Unlimited" value={form.usage_limit} onChange={(e) => setForm({ ...form, usage_limit: e.target.value })} />
          </div>
          <div>
            <label className="field-label">Per-user limit</label>
            <input type="number" className="input" value={form.per_user_limit} onChange={(e) => setForm({ ...form, per_user_limit: e.target.value })} />
          </div>
        </div>
        <button type="submit" disabled={loading} className="btn-primary w-full">{loading ? 'Creating…' : 'Create coupon'}</button>
      </form>
    </Modal>
  )
}

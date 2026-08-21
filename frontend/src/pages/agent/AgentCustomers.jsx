import { useEffect, useState } from 'react'
import { Users, Plus } from 'lucide-react'
import toast from 'react-hot-toast'
import { agentApi } from '../../api/business'
import PageHeader from '../../components/common/PageHeader'
import Loader from '../../components/common/Loader'
import EmptyState from '../../components/common/EmptyState'
import Avatar from '../../components/common/Avatar'
import Modal from '../../components/common/Modal'
import { apiErrorMessage } from '../../api/axiosClient'

export default function AgentCustomers() {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [linkOpen, setLinkOpen] = useState(false)

  const load = () => {
    setLoading(true)
    agentApi.myCustomers().then(setCustomers).catch(() => {}).finally(() => setLoading(false))
  }
  useEffect(load, [])

  return (
    <div>
      <PageHeader
        title="My Customers"
        subtitle="Customers you manage on behalf of."
        action={<button onClick={() => setLinkOpen(true)} className="btn-gold"><Plus size={16} /> Link customer</button>}
      />

      {loading ? <Loader /> : customers.length === 0 ? (
        <EmptyState icon={Users} title="No linked customers yet" description="Link a customer by their account ID to manage their trips." />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {customers.map((c) => (
            <div key={c.id} className="card p-4 flex items-center gap-3">
              <Avatar name={`${c.first_name} ${c.last_name}`} src={c.profile_picture_url} size={40} />
              <div className="min-w-0">
                <p className="font-semibold text-sm text-charcoal truncate">{c.first_name} {c.last_name}</p>
                <p className="text-xs text-slate truncate">{c.email}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <LinkCustomerModal open={linkOpen} onClose={() => setLinkOpen(false)} onLinked={load} />
    </div>
  )
}

function LinkCustomerModal({ open, onClose, onLinked }) {
  const [customerId, setCustomerId] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await agentApi.linkCustomer(Number(customerId), notes)
      toast.success('Customer linked')
      onLinked()
      onClose()
      setCustomerId('')
      setNotes('')
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Could not link customer — check the ID is correct'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Link a customer">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="field-label">Customer account ID</label>
          <input required type="number" className="input" value={customerId} onChange={(e) => setCustomerId(e.target.value)} />
          <p className="text-xs text-slate mt-1.5">Ask your customer for their account ID, found on their profile page.</p>
        </div>
        <div>
          <label className="field-label">Notes (optional)</label>
          <textarea rows={2} className="textarea" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
        <button type="submit" disabled={loading} className="btn-primary w-full">{loading ? 'Linking…' : 'Link customer'}</button>
      </form>
    </Modal>
  )
}

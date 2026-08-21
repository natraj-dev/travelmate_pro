import { useEffect, useState } from 'react'
import { ClipboardList, Plus } from 'lucide-react'
import toast from 'react-hot-toast'
import { leadApi, agentApi } from '../../api/business'
import PageHeader from '../../components/common/PageHeader'
import Loader from '../../components/common/Loader'
import EmptyState from '../../components/common/EmptyState'
import Modal from '../../components/common/Modal'
import StatusBadge from '../../components/common/StatusBadge'
import { apiErrorMessage } from '../../api/axiosClient'

const STATUSES = ['NEW', 'CONTACTED', 'QUALIFIED', 'CONVERTED', 'LOST']

export default function Leads() {
  const [agent, setAgent] = useState(null)
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)

  const load = () => {
    setLoading(true)
    agentApi.me()
      .then((a) => { setAgent(a); return leadApi.list() })
      .then(setLeads)
      .catch(() => setAgent(null))
      .finally(() => setLoading(false))
  }
  useEffect(load, [])

  const handleStatusChange = async (id, status) => {
    try {
      await leadApi.update(id, { status })
      setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, status } : l)))
    } catch (err) {
      toast.error(apiErrorMessage(err))
    }
  }

  if (loading) return <Loader full />

  if (!agent) return <AgentRegisterCard onRegistered={load} />

  return (
    <div>
      <PageHeader
        title="Leads"
        subtitle="Track prospective customers through your pipeline."
        action={<button onClick={() => setCreateOpen(true)} className="btn-gold"><Plus size={16} /> New lead</button>}
      />

      {leads.length === 0 ? (
        <EmptyState icon={ClipboardList} title="No leads yet" />
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-sand text-left text-xs uppercase tracking-wide text-slate">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Destination</th>
                <th className="px-4 py-3">Budget</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((l) => (
                <tr key={l.id} className="border-t border-ink/6">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-charcoal">{l.full_name}</p>
                    <p className="text-xs text-slate">{l.email}</p>
                  </td>
                  <td className="px-4 py-3 text-xs">{l.interested_destination || '—'}</td>
                  <td className="px-4 py-3 text-xs">{l.budget ? `$${l.budget}` : '—'}</td>
                  <td className="px-4 py-3">
                    <select
                      className="select py-1 text-xs w-36"
                      value={l.status}
                      onChange={(e) => handleStatusChange(l.id, e.target.value)}
                    >
                      {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <CreateLeadModal open={createOpen} onClose={() => setCreateOpen(false)} onCreated={load} />
    </div>
  )
}

function AgentRegisterCard({ onRegistered }) {
  const [form, setForm] = useState({ agency_name: '', bio: '' })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await agentApi.register(form)
      toast.success('Agent profile created — pending admin verification')
      onRegistered()
    } catch (err) {
      toast.error(apiErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto card p-8 text-center mt-10">
      <ClipboardList className="mx-auto text-ink/30 mb-4" size={32} />
      <h2 className="font-display text-xl text-ink mb-2">Set up your agent profile</h2>
      <p className="text-sm text-slate mb-6">Complete this once to start managing leads and customers.</p>
      <form onSubmit={handleSubmit} className="space-y-4 text-left">
        <div>
          <label className="field-label">Agency name</label>
          <input className="input" value={form.agency_name} onChange={(e) => setForm({ ...form, agency_name: e.target.value })} />
        </div>
        <div>
          <label className="field-label">Bio</label>
          <textarea rows={3} className="textarea" value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
        </div>
        <button type="submit" disabled={loading} className="btn-primary w-full">{loading ? 'Setting up…' : 'Create agent profile'}</button>
      </form>
    </div>
  )
}

function CreateLeadModal({ open, onClose, onCreated }) {
  const [form, setForm] = useState({ full_name: '', email: '', phone: '', interested_destination: '', budget: '', notes: '' })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await leadApi.create({ ...form, budget: form.budget ? Number(form.budget) : undefined })
      toast.success('Lead added')
      onCreated()
      onClose()
      setForm({ full_name: '', email: '', phone: '', interested_destination: '', budget: '', notes: '' })
    } catch (err) {
      toast.error(apiErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Add a lead">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="field-label">Full name</label>
          <input required className="input" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="field-label">Email</label>
            <input type="email" className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div>
            <label className="field-label">Phone</label>
            <input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="field-label">Interested destination</label>
            <input className="input" value={form.interested_destination} onChange={(e) => setForm({ ...form, interested_destination: e.target.value })} />
          </div>
          <div>
            <label className="field-label">Budget ($)</label>
            <input type="number" className="input" value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })} />
          </div>
        </div>
        <div>
          <label className="field-label">Notes</label>
          <textarea rows={3} className="textarea" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        </div>
        <button type="submit" disabled={loading} className="btn-primary w-full">{loading ? 'Adding…' : 'Add lead'}</button>
      </form>
    </Modal>
  )
}

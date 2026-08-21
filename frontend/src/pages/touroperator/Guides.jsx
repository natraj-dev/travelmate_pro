import { useEffect, useState } from 'react'
import { Users, Plus, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { operatorApi } from '../../api/tours'
import PageHeader from '../../components/common/PageHeader'
import Loader from '../../components/common/Loader'
import EmptyState from '../../components/common/EmptyState'
import Modal from '../../components/common/Modal'
import Avatar from '../../components/common/Avatar'
import { apiErrorMessage } from '../../api/axiosClient'

export default function Guides() {
  const [operator, setOperator] = useState(null)
  const [guides, setGuides] = useState([])
  const [loading, setLoading] = useState(true)
  const [addOpen, setAddOpen] = useState(false)

  const load = () => {
    setLoading(true)
    operatorApi.me()
      .then((op) => { setOperator(op); return operatorApi.guides(op.id) })
      .then(setGuides)
      .catch(() => setOperator(null))
      .finally(() => setLoading(false))
  }
  useEffect(load, [])

  const handleRemove = async (id) => {
    try {
      await operatorApi.removeGuide(id)
      setGuides((prev) => prev.filter((g) => g.id !== id))
    } catch (err) {
      toast.error(apiErrorMessage(err))
    }
  }

  if (loading) return <Loader full />
  if (!operator) return <div className="card p-10 text-center text-sm text-slate">Register as a tour operator first.</div>

  return (
    <div>
      <PageHeader
        title="Tour Guides"
        subtitle="Manage the guides on your team."
        action={<button onClick={() => setAddOpen(true)} className="btn-gold"><Plus size={16} /> Add guide</button>}
      />

      {guides.length === 0 ? (
        <EmptyState icon={Users} title="No guides added yet" />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {guides.map((g) => (
            <div key={g.id} className="card p-4 flex items-center gap-3">
              <Avatar name={g.full_name} src={g.photo_url} size={44} />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-charcoal truncate">{g.full_name}</p>
                {g.languages && <p className="text-xs text-slate truncate">{g.languages}</p>}
              </div>
              <button onClick={() => handleRemove(g.id)} className="text-slate hover:text-danger shrink-0"><Trash2 size={15} /></button>
            </div>
          ))}
        </div>
      )}

      <AddGuideModal open={addOpen} onClose={() => setAddOpen(false)} onAdded={load} />
    </div>
  )
}

function AddGuideModal({ open, onClose, onAdded }) {
  const [form, setForm] = useState({ full_name: '', languages: '', phone: '', bio: '' })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await operatorApi.addGuide(form)
      toast.success('Guide added')
      onAdded()
      onClose()
      setForm({ full_name: '', languages: '', phone: '', bio: '' })
    } catch (err) {
      toast.error(apiErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Add a guide">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="field-label">Full name</label>
          <input required className="input" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
        </div>
        <div>
          <label className="field-label">Languages</label>
          <input className="input" placeholder="e.g. English, Spanish" value={form.languages} onChange={(e) => setForm({ ...form, languages: e.target.value })} />
        </div>
        <div>
          <label className="field-label">Phone</label>
          <input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        </div>
        <div>
          <label className="field-label">Bio</label>
          <textarea rows={3} className="textarea" value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
        </div>
        <button type="submit" disabled={loading} className="btn-primary w-full">{loading ? 'Adding…' : 'Add guide'}</button>
      </form>
    </Modal>
  )
}

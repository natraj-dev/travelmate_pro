import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Route, Sparkles, Plus, Trash2, Calendar } from 'lucide-react'
import toast from 'react-hot-toast'
import { itineraryApi } from '../../api/bookings'
import { aiItineraryApi } from '../../api/ai'
import PageHeader from '../../components/common/PageHeader'
import Loader from '../../components/common/Loader'
import EmptyState from '../../components/common/EmptyState'
import Modal from '../../components/common/Modal'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import { formatDate, formatCurrency } from '../../utils/format'
import { apiErrorMessage } from '../../api/axiosClient'

export default function Itineraries() {
  const navigate = useNavigate()
  const [itineraries, setItineraries] = useState([])
  const [loading, setLoading] = useState(true)
  const [aiOpen, setAiOpen] = useState(false)
  const [manualOpen, setManualOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const load = () => {
    setLoading(true)
    itineraryApi.list().then(setItineraries).finally(() => setLoading(false))
  }
  useEffect(load, [])

  const handleDelete = async () => {
    try {
      await itineraryApi.remove(deleteTarget)
      toast.success('Itinerary deleted')
      setDeleteTarget(null)
      load()
    } catch (err) {
      toast.error(apiErrorMessage(err))
    }
  }

  return (
    <div>
      <PageHeader
        title="Itineraries"
        subtitle="Plan your trips day by day, or let AI draft one for you."
        action={
          <div className="flex gap-2">
            <button onClick={() => setManualOpen(true)} className="btn-outline"><Plus size={16} /> New</button>
            <button onClick={() => setAiOpen(true)} className="btn-gold"><Sparkles size={16} /> Generate with AI</button>
          </div>
        }
      />

      {loading ? (
        <Loader />
      ) : itineraries.length === 0 ? (
        <EmptyState icon={Route} title="No itineraries yet" description="Create one manually or generate a plan with AI." />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {itineraries.map((it) => (
            <div key={it.id} className="ticket p-5 relative">
              <button
                onClick={(e) => { e.preventDefault(); setDeleteTarget(it.id) }}
                className="absolute top-4 right-4 text-slate hover:text-danger transition-colors"
              >
                <Trash2 size={15} />
              </button>
              <Link to={`/app/itineraries/${it.id}`} className="block">
                {it.is_ai_generated && <span className="badge-warning mb-2 inline-flex items-center gap-1"><Sparkles size={11} /> AI-generated</span>}
                <p className="font-display text-lg text-ink pr-6">{it.title}</p>
                {(it.start_date || it.end_date) && (
                  <p className="text-xs text-slate mt-1.5 flex items-center gap-1.5">
                    <Calendar size={12} /> {formatDate(it.start_date)} → {formatDate(it.end_date)}
                  </p>
                )}
                {it.budget && <p className="text-sm font-semibold text-charcoal mt-2">{formatCurrency(it.budget)} budget</p>}
                <p className="text-xs text-slate mt-2">{it.days?.length || 0} day(s) planned</p>
              </Link>
            </div>
          ))}
        </div>
      )}

      <AIGenerateModal open={aiOpen} onClose={() => setAiOpen(false)} onSaved={load} />
      <ManualCreateModal open={manualOpen} onClose={() => setManualOpen(false)} onCreated={load} />

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete this itinerary?"
        description="This will permanently remove the itinerary and all its planned days."
        confirmLabel="Delete"
        danger
      />
    </div>
  )
}

function AIGenerateModal({ open, onClose, onSaved }) {
  const [form, setForm] = useState({ destination: '', duration_days: 3, budget: '', interests: '', travelers: 1 })
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  const handleGenerate = async (e) => {
    e.preventDefault()
    setLoading(true)
    setResult(null)
    try {
      const res = await aiItineraryApi.generate({
        ...form,
        duration_days: Number(form.duration_days),
        budget: form.budget ? Number(form.budget) : undefined,
        travelers: Number(form.travelers),
      })
      setResult(res)
    } catch (err) {
      toast.error(apiErrorMessage(err, 'AI itinerary generation failed. Is Ollama running?'))
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await aiItineraryApi.save({ ai_itinerary_id: result.id, title: `${form.destination} — ${form.duration_days} days` })
      toast.success('Itinerary saved!')
      setResult(null)
      onClose()
      onSaved()
    } catch (err) {
      toast.error(apiErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Generate an itinerary with AI" maxWidth="max-w-2xl">
      {!result ? (
        <form onSubmit={handleGenerate} className="space-y-4">
          <div>
            <label className="field-label">Destination</label>
            <input required className="input" placeholder="e.g. Bali, Indonesia" value={form.destination} onChange={(e) => setForm({ ...form, destination: e.target.value })} />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="field-label">Days</label>
              <input type="number" min={1} max={14} className="input" value={form.duration_days} onChange={(e) => setForm({ ...form, duration_days: e.target.value })} />
            </div>
            <div>
              <label className="field-label">Travelers</label>
              <input type="number" min={1} className="input" value={form.travelers} onChange={(e) => setForm({ ...form, travelers: e.target.value })} />
            </div>
            <div>
              <label className="field-label">Budget ($)</label>
              <input type="number" className="input" placeholder="Optional" value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="field-label">Interests</label>
            <input className="input" placeholder="e.g. food, hiking, museums" value={form.interests} onChange={(e) => setForm({ ...form, interests: e.target.value })} />
          </div>
          <button type="submit" disabled={loading} className="btn-gold w-full">
            <Sparkles size={16} /> {loading ? 'Generating…' : 'Generate itinerary'}
          </button>
        </form>
      ) : (
        <div>
          <div className="max-h-96 overflow-y-auto scrollbar-thin space-y-4 mb-5">
            {(result.plan?.days || []).map((day) => (
              <div key={day.day_number} className="border border-ink/10 rounded-xl p-4">
                <p className="font-semibold text-sm text-ink mb-2">Day {day.day_number} {day.theme ? `— ${day.theme}` : ''}</p>
                <ul className="space-y-1.5">
                  {(day.items || []).map((item, idx) => (
                    <li key={idx} className="text-sm text-charcoal/80 flex gap-2">
                      <span className="font-mono text-xs text-gold-dark shrink-0 w-16">{item.time_slot}</span>
                      <span>{item.title}{item.location ? ` — ${item.location}` : ''}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            {(!result.plan?.days || result.plan.days.length === 0) && (
              <p className="text-sm text-slate">{result.plan?.raw_text || 'No structured plan returned.'}</p>
            )}
          </div>
          <div className="flex gap-3">
            <button onClick={() => setResult(null)} className="btn-outline flex-1">Regenerate</button>
            <button onClick={handleSave} disabled={saving} className="btn-gold flex-1">{saving ? 'Saving…' : 'Save itinerary'}</button>
          </div>
        </div>
      )}
    </Modal>
  )
}

function ManualCreateModal({ open, onClose, onCreated }) {
  const navigate = useNavigate()
  const [form, setForm] = useState({ title: '', start_date: '', end_date: '', budget: '' })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const it = await itineraryApi.create({
        ...form, budget: form.budget ? Number(form.budget) : undefined, days: [],
      })
      toast.success('Itinerary created')
      onClose()
      onCreated()
      navigate(`/app/itineraries/${it.id}`)
    } catch (err) {
      toast.error(apiErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Create a new itinerary">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="field-label">Title</label>
          <input required className="input" placeholder="e.g. Summer in Kyoto" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="field-label">Start date</label>
            <input type="date" className="input" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
          </div>
          <div>
            <label className="field-label">End date</label>
            <input type="date" className="input" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
          </div>
        </div>
        <div>
          <label className="field-label">Budget ($)</label>
          <input type="number" className="input" value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })} />
        </div>
        <button type="submit" disabled={loading} className="btn-primary w-full">{loading ? 'Creating…' : 'Create itinerary'}</button>
      </form>
    </Modal>
  )
}

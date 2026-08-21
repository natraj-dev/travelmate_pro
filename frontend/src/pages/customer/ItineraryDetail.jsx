import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Plus, Download, Trash2, Clock, MapPin } from 'lucide-react'
import toast from 'react-hot-toast'
import { itineraryApi } from '../../api/bookings'
import Loader from '../../components/common/Loader'
import Modal from '../../components/common/Modal'
import { formatDate, formatCurrency } from '../../utils/format'
import { apiErrorMessage } from '../../api/axiosClient'
import { apiClient } from '../../api/axiosClient'

export default function ItineraryDetail() {
  const { id } = useParams()
  const [itinerary, setItinerary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [dayModalOpen, setDayModalOpen] = useState(false)
  const [itemModal, setItemModal] = useState(null) // dayId or null

  const load = () => {
    setLoading(true)
    itineraryApi.get(id).then(setItinerary).finally(() => setLoading(false))
  }
  useEffect(load, [id])

  const handleDeleteItem = async (itemId) => {
    try {
      await itineraryApi.deleteItem(itemId)
      load()
    } catch (err) {
      toast.error(apiErrorMessage(err))
    }
  }

  const handleDownload = async () => {
    try {
      const res = await apiClient.get(`/itineraries/${id}/download`, { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `itinerary_${id}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch (err) {
      toast.error('Could not download PDF')
    }
  }

  if (loading) return <Loader full />
  if (!itinerary) return <div className="py-20 text-center text-slate">Itinerary not found.</div>

  return (
    <div>
      <Link to="/app/itineraries" className="inline-flex items-center gap-1.5 text-sm text-slate hover:text-ink mb-4"><ArrowLeft size={15} /> Back to itineraries</Link>

      <div className="flex items-start justify-between gap-4 mb-8 flex-wrap">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl text-ink">{itinerary.title}</h1>
          {(itinerary.start_date || itinerary.end_date) && (
            <p className="text-slate text-sm mt-1">{formatDate(itinerary.start_date)} → {formatDate(itinerary.end_date)}</p>
          )}
          {itinerary.budget && <p className="text-sm font-semibold text-charcoal mt-1">Budget: {formatCurrency(itinerary.budget)}</p>}
        </div>
        <div className="flex gap-2">
          <button onClick={handleDownload} className="btn-outline"><Download size={16} /> Download PDF</button>
          <button onClick={() => setDayModalOpen(true)} className="btn-gold"><Plus size={16} /> Add day</button>
        </div>
      </div>

      <div className="space-y-6">
        {itinerary.days.map((day) => (
          <div key={day.id} className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-display text-lg text-ink">Day {day.day_number}{day.summary ? ` — ${day.summary}` : ''}</h3>
                {day.date && <p className="text-xs text-slate">{formatDate(day.date)}</p>}
              </div>
              <button onClick={() => setItemModal(day.id)} className="btn-outline btn-sm"><Plus size={14} /> Add item</button>
            </div>
            {day.items.length === 0 ? (
              <p className="text-sm text-slate">No items yet for this day.</p>
            ) : (
              <div className="space-y-3">
                {day.items.map((item) => (
                  <div key={item.id} className="flex items-start justify-between gap-3 border-b border-ink/8 pb-3 last:border-0 last:pb-0">
                    <div className="flex gap-3">
                      {item.time_slot && (
                        <span className="font-mono text-xs text-gold-dark shrink-0 flex items-center gap-1 pt-0.5"><Clock size={11} /> {item.time_slot}</span>
                      )}
                      <div>
                        <p className="text-sm font-semibold text-charcoal">{item.title}</p>
                        {item.location && <p className="text-xs text-slate flex items-center gap-1 mt-0.5"><MapPin size={11} /> {item.location}</p>}
                        {item.notes && <p className="text-xs text-slate mt-0.5">{item.notes}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {item.estimated_cost != null && <span className="font-mono text-xs text-charcoal">{formatCurrency(item.estimated_cost)}</span>}
                      <button onClick={() => handleDeleteItem(item.id)} className="text-slate hover:text-danger"><Trash2 size={14} /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
        {itinerary.days.length === 0 && (
          <div className="card p-10 text-center text-sm text-slate">No days planned yet — add your first day above.</div>
        )}
      </div>

      <AddDayModal open={dayModalOpen} onClose={() => setDayModalOpen(false)} itineraryId={id} onAdded={load} nextDayNumber={itinerary.days.length + 1} />
      <AddItemModal open={!!itemModal} onClose={() => setItemModal(null)} dayId={itemModal} onAdded={load} />
    </div>
  )
}

function AddDayModal({ open, onClose, itineraryId, onAdded, nextDayNumber }) {
  const [form, setForm] = useState({ date: '', summary: '' })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await itineraryApi.addDay(itineraryId, { day_number: nextDayNumber, date: form.date || undefined, summary: form.summary, items: [] })
      onClose()
      onAdded()
      setForm({ date: '', summary: '' })
    } catch (err) {
      toast.error(apiErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={`Add Day ${nextDayNumber}`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="field-label">Date (optional)</label>
          <input type="date" className="input" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
        </div>
        <div>
          <label className="field-label">Theme / summary</label>
          <input className="input" placeholder="e.g. Temple hopping" value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} />
        </div>
        <button type="submit" disabled={loading} className="btn-primary w-full">{loading ? 'Adding…' : 'Add day'}</button>
      </form>
    </Modal>
  )
}

function AddItemModal({ open, onClose, dayId, onAdded }) {
  const [form, setForm] = useState({ title: '', time_slot: '', location: '', notes: '', estimated_cost: '' })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await itineraryApi.addItem(dayId, {
        item_type: 'CUSTOM', title: form.title, time_slot: form.time_slot || undefined,
        location: form.location || undefined, notes: form.notes || undefined,
        estimated_cost: form.estimated_cost ? Number(form.estimated_cost) : undefined,
      })
      onClose()
      onAdded()
      setForm({ title: '', time_slot: '', location: '', notes: '', estimated_cost: '' })
    } catch (err) {
      toast.error(apiErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Add itinerary item">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="field-label">Title</label>
          <input required className="input" placeholder="e.g. Visit Fushimi Inari" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="field-label">Time</label>
            <input className="input" placeholder="9:00 AM" value={form.time_slot} onChange={(e) => setForm({ ...form, time_slot: e.target.value })} />
          </div>
          <div>
            <label className="field-label">Est. cost ($)</label>
            <input type="number" className="input" value={form.estimated_cost} onChange={(e) => setForm({ ...form, estimated_cost: e.target.value })} />
          </div>
        </div>
        <div>
          <label className="field-label">Location</label>
          <input className="input" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
        </div>
        <div>
          <label className="field-label">Notes</label>
          <textarea rows={2} className="textarea" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        </div>
        <button type="submit" disabled={loading} className="btn-primary w-full">{loading ? 'Adding…' : 'Add item'}</button>
      </form>
    </Modal>
  )
}

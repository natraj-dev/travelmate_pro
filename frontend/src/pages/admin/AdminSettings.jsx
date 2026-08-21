import { useEffect, useState } from 'react'
import { SlidersHorizontal, Plus, Trash2, CheckCircle2, XCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { settingsApi } from '../../api/admin'
import PageHeader from '../../components/common/PageHeader'
import Loader from '../../components/common/Loader'
import Modal from '../../components/common/Modal'
import { apiErrorMessage } from '../../api/axiosClient'

export default function AdminSettings() {
  const [settings, setSettings] = useState([])
  const [platformInfo, setPlatformInfo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [addOpen, setAddOpen] = useState(false)

  const load = () => {
    setLoading(true)
    Promise.all([settingsApi.list(), settingsApi.platformInfo()]).then(([s, info]) => {
      setSettings(s)
      setPlatformInfo(info)
      setLoading(false)
    })
  }
  useEffect(load, [])

  const handleDelete = async (id) => {
    try {
      await settingsApi.remove(id)
      load()
    } catch (err) {
      toast.error(apiErrorMessage(err))
    }
  }

  if (loading) return <Loader full />

  return (
    <div>
      <PageHeader
        title="Platform Settings"
        subtitle="Configuration status and custom platform settings."
        action={<button onClick={() => setAddOpen(true)} className="btn-gold"><Plus size={16} /> Add setting</button>}
      />

      {platformInfo && (
        <div className="card p-6 mb-6">
          <h3 className="font-display text-lg text-ink mb-4">Configuration status</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <ConfigStatus label="Stripe" ok={platformInfo.stripe_configured} />
            <ConfigStatus label="Google Maps" ok={platformInfo.google_maps_configured} />
            <ConfigStatus label="SMTP Email" ok={platformInfo.smtp_configured} />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-5 pt-5 border-t border-ink/8 text-sm">
            <div><p className="text-xs text-slate uppercase mb-1">AI Engine</p><p className="font-semibold text-charcoal">{platformInfo.ai_engine}</p></div>
            <div><p className="text-xs text-slate uppercase mb-1">AI Model</p><p className="font-semibold text-charcoal">{platformInfo.ai_model}</p></div>
            <div><p className="text-xs text-slate uppercase mb-1">Default Commission</p><p className="font-semibold text-charcoal">{platformInfo.default_commission_percent}%</p></div>
            <div><p className="text-xs text-slate uppercase mb-1">Default Tax</p><p className="font-semibold text-charcoal">{platformInfo.default_tax_percent}%</p></div>
          </div>
        </div>
      )}

      <div className="card p-6">
        <h3 className="font-display text-lg text-ink mb-4">Custom settings</h3>
        {settings.length === 0 ? (
          <p className="text-sm text-slate">No custom settings configured yet.</p>
        ) : (
          <div className="space-y-2">
            {settings.map((s) => (
              <div key={s.id} className="flex items-center justify-between border border-ink/8 rounded-xl px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-charcoal">{s.category} / {s.key}</p>
                  <p className="text-xs text-slate">{s.is_secret ? '••••••••' : s.value}</p>
                </div>
                <button onClick={() => handleDelete(s.id)} className="text-slate hover:text-danger"><Trash2 size={15} /></button>
              </div>
            ))}
          </div>
        )}
      </div>

      <AddSettingModal open={addOpen} onClose={() => setAddOpen(false)} onSaved={load} />
    </div>
  )
}

function ConfigStatus({ label, ok }) {
  return (
    <div className="flex items-center gap-2">
      {ok ? <CheckCircle2 size={16} className="text-success" /> : <XCircle size={16} className="text-danger" />}
      <span className="text-sm text-charcoal">{label}</span>
    </div>
  )
}

function AddSettingModal({ open, onClose, onSaved }) {
  const [form, setForm] = useState({ category: 'GENERAL', key: '', value: '', is_secret: false })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await settingsApi.upsert(form)
      toast.success('Setting saved')
      onSaved()
      onClose()
      setForm({ category: 'GENERAL', key: '', value: '', is_secret: false })
    } catch (err) {
      toast.error(apiErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Add platform setting">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="field-label">Category</label>
          <input required className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
        </div>
        <div>
          <label className="field-label">Key</label>
          <input required className="input" value={form.key} onChange={(e) => setForm({ ...form, key: e.target.value })} />
        </div>
        <div>
          <label className="field-label">Value</label>
          <input required className="input" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} />
        </div>
        <label className="flex items-center gap-2 text-sm text-charcoal">
          <input type="checkbox" checked={form.is_secret} onChange={(e) => setForm({ ...form, is_secret: e.target.checked })} /> Mark as secret
        </label>
        <button type="submit" disabled={loading} className="btn-primary w-full">{loading ? 'Saving…' : 'Save setting'}</button>
      </form>
    </Modal>
  )
}

import { useEffect, useRef, useState } from 'react'
import { Camera, MapPin, Plus, Trash2, Star } from 'lucide-react'
import toast from 'react-hot-toast'
import { profileApi, addressApi } from '../../api/auth'
import { useAuth } from '../../context/AuthContext'
import PageHeader from '../../components/common/PageHeader'
import Avatar from '../../components/common/Avatar'
import Modal from '../../components/common/Modal'
import { apiErrorMessage } from '../../api/axiosClient'

export default function Profile() {
  const { user, setUser } = useAuth()
  const fileRef = useRef(null)
  const [form, setForm] = useState({
    first_name: user?.first_name || '', last_name: user?.last_name || '',
    phone: user?.phone || '', emergency_contact_name: user?.emergency_contact_name || '',
    emergency_contact_phone: user?.emergency_contact_phone || '',
  })
  const [saving, setSaving] = useState(false)
  const [addresses, setAddresses] = useState([])
  const [addressModal, setAddressModal] = useState(false)

  useEffect(() => {
    addressApi.list().then(setAddresses).catch(() => {})
  }, [])

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const updated = await profileApi.update(form)
      setUser(updated)
      toast.success('Profile updated')
    } catch (err) {
      toast.error(apiErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const handleUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const updated = await profileApi.uploadPicture(file)
      setUser(updated)
      toast.success('Profile picture updated')
    } catch (err) {
      toast.error(apiErrorMessage(err))
    }
  }

  const handleDeleteAddress = async (id) => {
    try {
      await addressApi.remove(id)
      setAddresses((prev) => prev.filter((a) => a.id !== id))
    } catch (err) {
      toast.error(apiErrorMessage(err))
    }
  }

  const handleSetPrimary = async (id) => {
    try {
      await addressApi.setPrimary(id)
      const list = await addressApi.list()
      setAddresses(list)
    } catch (err) {
      toast.error(apiErrorMessage(err))
    }
  }

  return (
    <div>
      <PageHeader title="My Profile" subtitle="Manage your personal details and saved addresses." />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="panel text-center">
          <div className="relative inline-block">
            <Avatar name={`${user?.first_name} ${user?.last_name}`} src={user?.profile_picture_url} size={88} />
            <button onClick={() => fileRef.current?.click()} className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-ink text-white flex items-center justify-center shadow-soft">
              <Camera size={14} />
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
          </div>
          <p className="font-display text-lg text-ink mt-4">{user?.first_name} {user?.last_name}</p>
          <p className="text-sm text-slate">{user?.email}</p>
          <span className="badge-neutral mt-2 inline-block">{user?.role?.replace('_', ' ')}</span>
          {!user?.is_verified && <p className="text-xs text-gold-dark mt-3">Email not yet verified</p>}
        </div>

        <div className="lg:col-span-2 panel">
          <h3 className="font-display text-lg text-ink mb-4">Personal details</h3>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="field-label">First name</label>
                <input className="input" value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} />
              </div>
              <div>
                <label className="field-label">Last name</label>
                <input className="input" value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="field-label">Phone</label>
              <input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="field-label">Emergency contact name</label>
                <input className="input" value={form.emergency_contact_name} onChange={(e) => setForm({ ...form, emergency_contact_name: e.target.value })} />
              </div>
              <div>
                <label className="field-label">Emergency contact phone</label>
                <input className="input" value={form.emergency_contact_phone} onChange={(e) => setForm({ ...form, emergency_contact_phone: e.target.value })} />
              </div>
            </div>
            <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving…' : 'Save changes'}</button>
          </form>
        </div>
      </div>

      <div className="panel mt-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-lg text-ink">Saved addresses</h3>
          <button onClick={() => setAddressModal(true)} className="btn-outline btn-sm"><Plus size={14} /> Add address</button>
        </div>
        {addresses.length === 0 ? (
          <p className="text-sm text-slate">No saved addresses yet.</p>
        ) : (
          <div className="grid sm:grid-cols-2 gap-3">
            {addresses.map((a) => (
              <div key={a.id} className="border border-ink/10 rounded-xl p-4 flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-charcoal flex items-center gap-1.5">
                    <MapPin size={13} /> {a.label} {a.is_primary && <Star size={12} className="text-gold fill-gold" />}
                  </p>
                  <p className="text-xs text-slate mt-1">{a.line1}, {a.city}, {a.country}</p>
                </div>
                <div className="flex flex-col gap-1 items-end shrink-0">
                  {!a.is_primary && <button onClick={() => handleSetPrimary(a.id)} className="text-xs font-semibold text-gold-dark">Set primary</button>}
                  <button onClick={() => handleDeleteAddress(a.id)} className="text-slate hover:text-danger"><Trash2 size={14} /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <AddressModal open={addressModal} onClose={() => setAddressModal(false)} onSaved={() => addressApi.list().then(setAddresses)} />
    </div>
  )
}

function AddressModal({ open, onClose, onSaved }) {
  const [form, setForm] = useState({ label: 'Home', line1: '', city: '', country: '', is_primary: false })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await addressApi.create(form)
      onSaved()
      onClose()
      setForm({ label: 'Home', line1: '', city: '', country: '', is_primary: false })
    } catch (err) {
      toast.error(apiErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Add address">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="field-label">Label</label>
          <input className="input" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} />
        </div>
        <div>
          <label className="field-label">Address line</label>
          <input required className="input" value={form.line1} onChange={(e) => setForm({ ...form, line1: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="field-label">City</label>
            <input required className="input" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
          </div>
          <div>
            <label className="field-label">Country</label>
            <input required className="input" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} />
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm text-charcoal">
          <input type="checkbox" checked={form.is_primary} onChange={(e) => setForm({ ...form, is_primary: e.target.checked })} /> Set as primary address
        </label>
        <button type="submit" disabled={loading} className="btn-primary w-full">{loading ? 'Saving…' : 'Save address'}</button>
      </form>
    </Modal>
  )
}

import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Plane, ArrowRight, User, Hotel, MapPinned, Briefcase } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'
import { apiErrorMessage } from '../../api/axiosClient'

const ROLES = [
  { value: 'CUSTOMER', label: 'Traveler', icon: User, description: 'Book hotels, tours & activities' },
  { value: 'HOTEL_MANAGER', label: 'Hotel Manager', icon: Hotel, description: 'List and manage hotels' },
  { value: 'TOUR_OPERATOR', label: 'Tour Operator', icon: MapPinned, description: 'Create and sell tour packages' },
  { value: 'TRAVEL_AGENT', label: 'Travel Agent', icon: Briefcase, description: 'Manage clients & itineraries' },
]

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const initialRole = searchParams.get('role') || 'CUSTOMER'

  const [form, setForm] = useState({
    first_name: '', last_name: '', email: '', password: '', phone: '', role: initialRole,
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.password.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }
    setLoading(true)
    try {
      await register(form)
      toast.success('Account created! Welcome to TravelMate Pro.')
      navigate('/app/dashboard', { replace: true })
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Could not create your account'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-sand py-12 px-4">
      <div className="w-full max-w-xl">
        <Link to="/" className="flex items-center justify-center gap-2.5 mb-8">
          <div className="w-9 h-9 rounded-xl bg-gold-gradient flex items-center justify-center">
            <Plane size={18} className="text-ink" />
          </div>
          <span className="font-display font-semibold text-ink text-lg">TravelMate Pro</span>
        </Link>

        <div className="card p-8">
          <h1 className="font-display text-2xl text-ink mb-1 text-center">Create your account</h1>
          <p className="text-sm text-slate text-center mb-7">Join TravelMate Pro in under a minute.</p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-6">
            {ROLES.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                type="button"
                onClick={() => setForm({ ...form, role: value })}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-center transition-all ${
                  form.role === value ? 'border-gold bg-gold/10 text-ink' : 'border-ink/10 text-slate hover:border-ink/20'
                }`}
              >
                <Icon size={18} />
                <span className="text-xs font-semibold">{label}</span>
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="field-label">First name</label>
                <input required className="input" value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} />
              </div>
              <div>
                <label className="field-label">Last name</label>
                <input required className="input" value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="field-label">Email address</label>
              <input type="email" required className="input" placeholder="you@example.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div>
              <label className="field-label">Phone (optional)</label>
              <input className="input" placeholder="+1 555 123 4567" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div>
              <label className="field-label">Password</label>
              <input type="password" required minLength={8} className="input" placeholder="At least 8 characters" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
              {loading ? 'Creating account…' : 'Create account'} <ArrowRight size={16} />
            </button>
          </form>

          <p className="text-sm text-slate text-center mt-6">
            Already have an account? <Link to="/login" className="font-semibold text-ink hover:underline">Log in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

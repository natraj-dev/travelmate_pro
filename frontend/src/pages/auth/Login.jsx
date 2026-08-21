import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Plane, Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'
import { apiErrorMessage } from '../../api/axiosClient'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await login(form.email, form.password)
      const dest = location.state?.from?.pathname || '/app/dashboard'
      navigate(dest, { replace: true })
      toast.success('Welcome back!')
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Could not log you in'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 bg-ink-gradient relative overflow-hidden items-center justify-center p-16">
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: 'radial-gradient(circle at 20% 30%, white 1px, transparent 1px), radial-gradient(circle at 70% 70%, white 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }} />
        <div className="relative text-white max-w-md">
          <div className="w-14 h-14 rounded-2xl bg-gold-gradient flex items-center justify-center mb-8">
            <Plane size={26} className="text-ink" />
          </div>
          <h2 className="font-display text-3xl leading-tight mb-4">Your next journey, planned to perfection.</h2>
          <p className="text-white/70">Book hotels, tours, and activities — then let our AI assistant build the itinerary around them.</p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-sm">
          <Link to="/" className="lg:hidden flex items-center gap-2.5 mb-10">
            <div className="w-9 h-9 rounded-xl bg-gold-gradient flex items-center justify-center">
              <Plane size={18} className="text-ink" />
            </div>
            <span className="font-display font-semibold text-ink">TravelMate Pro</span>
          </Link>

          <h1 className="font-display text-2xl text-ink mb-1">Welcome back</h1>
          <p className="text-sm text-slate mb-8">Log in to manage your bookings and trips.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="field-label">Email address</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate" />
                <input
                  type="email" required className="input pl-10" placeholder="you@example.com"
                  value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="field-label mb-0">Password</label>
                <Link to="/forgot-password" className="text-xs font-semibold text-gold-dark hover:underline">Forgot password?</Link>
              </div>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate" />
                <input
                  type={showPassword ? 'text' : 'password'} required className="input pl-10 pr-10" placeholder="••••••••"
                  value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                />
                <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
              {loading ? 'Logging in…' : 'Log in'} <ArrowRight size={16} />
            </button>
          </form>

          <p className="text-sm text-slate text-center mt-8">
            Don't have an account? <Link to="/register" className="font-semibold text-ink hover:underline">Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

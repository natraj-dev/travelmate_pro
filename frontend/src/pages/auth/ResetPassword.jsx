import { useState } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { Plane, ArrowRight } from 'lucide-react'
import toast from 'react-hot-toast'
import { authApi } from '../../api/auth'
import { apiErrorMessage } from '../../api/axiosClient'

export default function ResetPassword() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token') || ''
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await authApi.resetPassword(token, password)
      toast.success('Password reset successfully — please log in.')
      navigate('/login')
    } catch (err) {
      toast.error(apiErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-sand px-4">
      <div className="w-full max-w-sm">
        <Link to="/" className="flex items-center justify-center gap-2.5 mb-8">
          <div className="w-9 h-9 rounded-xl bg-gold-gradient flex items-center justify-center">
            <Plane size={18} className="text-ink" />
          </div>
          <span className="font-display font-semibold text-ink text-lg">TravelMate Pro</span>
        </Link>
        <div className="card p-8">
          <h1 className="font-display text-xl text-ink mb-1">Set a new password</h1>
          <p className="text-sm text-slate mb-6">Choose a strong password for your account.</p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input type="password" required minLength={8} className="input" placeholder="New password" value={password} onChange={(e) => setPassword(e.target.value)} />
            <button type="submit" disabled={loading || !token} className="btn-primary w-full">
              {loading ? 'Resetting…' : 'Reset password'} <ArrowRight size={16} />
            </button>
            {!token && <p className="text-xs text-danger text-center">Missing or invalid reset link.</p>}
          </form>
        </div>
      </div>
    </div>
  )
}

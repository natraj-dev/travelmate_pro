import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Plane, ArrowRight, CheckCircle2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { authApi } from '../../api/auth'
import { apiErrorMessage } from '../../api/axiosClient'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await authApi.forgotPassword(email)
      setSent(true)
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
          {sent ? (
            <div className="text-center">
              <CheckCircle2 className="mx-auto text-success mb-3" size={36} />
              <h1 className="font-display text-xl text-ink mb-2">Check your email</h1>
              <p className="text-sm text-slate mb-6">If an account exists for {email}, we've sent a password reset link.</p>
              <Link to="/login" className="btn-outline w-full">Back to login</Link>
            </div>
          ) : (
            <>
              <h1 className="font-display text-xl text-ink mb-1">Forgot your password?</h1>
              <p className="text-sm text-slate mb-6">Enter your email and we'll send you a reset link.</p>
              <form onSubmit={handleSubmit} className="space-y-4">
                <input type="email" required className="input" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
                <button type="submit" disabled={loading} className="btn-primary w-full">
                  {loading ? 'Sending…' : 'Send reset link'} <ArrowRight size={16} />
                </button>
              </form>
              <p className="text-sm text-slate text-center mt-6">
                <Link to="/login" className="font-semibold text-ink hover:underline">Back to login</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Plane, CheckCircle2, XCircle } from 'lucide-react'
import { authApi } from '../../api/auth'
import { apiErrorMessage } from '../../api/axiosClient'
import Loader from '../../components/common/Loader'

export default function VerifyEmail() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const [status, setStatus] = useState('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setMessage('Missing verification token.')
      return
    }
    authApi.verifyEmail(token)
      .then(() => setStatus('success'))
      .catch((err) => {
        setStatus('error')
        setMessage(apiErrorMessage(err))
      })
  }, [token])

  return (
    <div className="min-h-screen flex items-center justify-center bg-sand px-4">
      <div className="w-full max-w-sm text-center">
        <Link to="/" className="flex items-center justify-center gap-2.5 mb-8">
          <div className="w-9 h-9 rounded-xl bg-gold-gradient flex items-center justify-center">
            <Plane size={18} className="text-ink" />
          </div>
          <span className="font-display font-semibold text-ink text-lg">TravelMate Pro</span>
        </Link>
        <div className="card p-8">
          {status === 'loading' && <Loader label="Verifying your email…" />}
          {status === 'success' && (
            <>
              <CheckCircle2 className="mx-auto text-success mb-3" size={36} />
              <h1 className="font-display text-xl text-ink mb-2">Email verified</h1>
              <p className="text-sm text-slate mb-6">Your account is now fully verified.</p>
              <Link to="/login" className="btn-primary w-full">Continue to login</Link>
            </>
          )}
          {status === 'error' && (
            <>
              <XCircle className="mx-auto text-danger mb-3" size={36} />
              <h1 className="font-display text-xl text-ink mb-2">Verification failed</h1>
              <p className="text-sm text-slate mb-6">{message}</p>
              <Link to="/login" className="btn-outline w-full">Back to login</Link>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

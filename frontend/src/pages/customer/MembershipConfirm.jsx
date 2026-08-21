import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Crown, CheckCircle2, XCircle } from 'lucide-react'
import { membershipApi } from '../../api/payments'
import { apiErrorMessage } from '../../api/axiosClient'
import Loader from '../../components/common/Loader'

export default function MembershipConfirm() {
  const [searchParams] = useSearchParams()
  const sessionId = searchParams.get('session_id')
  const [status, setStatus] = useState('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!sessionId) {
      setStatus('error')
      setMessage('Missing checkout session.')
      return
    }
    membershipApi.confirm(sessionId)
      .then(() => setStatus('success'))
      .catch((err) => {
        setStatus('error')
        setMessage(apiErrorMessage(err))
      })
  }, [sessionId])

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        {status === 'loading' && <Loader label="Confirming your membership…" />}
        {status === 'success' && (
          <>
            <Crown className="mx-auto text-gold mb-4" size={44} />
            <h1 className="font-display text-2xl text-ink mb-2">Welcome to your new plan</h1>
            <p className="text-sm text-slate mb-8">Your membership is now active.</p>
            <Link to="/app/membership" className="btn-primary w-full">View membership</Link>
          </>
        )}
        {status === 'error' && (
          <>
            <XCircle className="mx-auto text-danger mb-4" size={44} />
            <h1 className="font-display text-2xl text-ink mb-2">Could not confirm</h1>
            <p className="text-sm text-slate mb-8">{message}</p>
            <Link to="/app/membership" className="btn-outline w-full">Back to membership</Link>
          </>
        )}
      </div>
    </div>
  )
}

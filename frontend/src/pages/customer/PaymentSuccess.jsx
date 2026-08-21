import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

import { paymentApi } from '../../api/payments'
import Loader from '../../components/common/Loader'
import { apiErrorMessage } from '../../api/axiosClient'

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams()

  const [status, setStatus] = useState('checking')
  const [payment, setPayment] = useState(null)

  const sessionId = searchParams.get('session_id')

  useEffect(() => {
    let cancelled = false

    const checkPayment = async () => {
      if (!sessionId) {
        setStatus('failed')
        return
      }

      try {
        /*
         * Your backend checkout session stores the payment ID internally,
         * but the success URL currently only returns session_id.
         *
         * We therefore need the backend to resolve the Stripe session
         * and return the corresponding payment.
         */
        const result = await paymentApi.confirmCheckout(sessionId)

        if (cancelled) return

        setPayment(result)

        if (result.status === 'SUCCEEDED') {
          setStatus('success')
        } else if (result.status === 'FAILED') {
          setStatus('failed')
        } else {
          setStatus('pending')
        }
      } catch (err) {
        if (cancelled) return

        console.error('Payment confirmation error:', err)
        toast.error(
          apiErrorMessage(err, 'Could not confirm your payment')
        )
        setStatus('failed')
      }
    }

    checkPayment()

    return () => {
      cancelled = true
    }
  }, [sessionId])

  if (status === 'checking') {
    return <Loader full label="Confirming your payment…" />
  }

  if (status === 'pending') {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <Loader2
            className="mx-auto text-gold mb-4 animate-spin"
            size={48}
          />

          <h1 className="font-display text-2xl text-ink mb-2">
            Payment processing
          </h1>

          <p className="text-sm text-slate mb-8">
            Your payment was received, but confirmation is still being
            processed. Please check My Bookings in a moment.
          </p>

          <Link
            to="/app/bookings"
            className="btn-primary w-full"
          >
            View my bookings
          </Link>
        </div>
      </div>
    )
  }

  if (status === 'failed') {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <XCircle
            className="mx-auto text-danger mb-4"
            size={48}
          />

          <h1 className="font-display text-2xl text-ink mb-2">
            Payment could not be confirmed
          </h1>

          <p className="text-sm text-slate mb-8">
            We couldn't confirm this payment. Please check your bookings
            or try paying again.
          </p>

          <Link
            to="/app/bookings"
            className="btn-primary w-full"
          >
            Go to my bookings
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <CheckCircle2
          className="mx-auto text-success mb-4"
          size={48}
        />

        <h1 className="font-display text-2xl text-ink mb-2">
          Payment successful
        </h1>

        <p className="text-sm text-slate mb-2">
          Your booking has been confirmed successfully.
        </p>

        {payment && (
          <p className="text-sm font-semibold text-charcoal mb-8">
            {payment.currency?.toUpperCase()} {payment.amount?.toFixed(2)}
          </p>
        )}

        <Link
          to="/app/bookings"
          className="btn-primary w-full"
        >
          View my bookings
        </Link>
      </div>
    </div>
  )
}
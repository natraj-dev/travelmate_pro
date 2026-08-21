import { Link } from 'react-router-dom'
import { XCircle } from 'lucide-react'

export default function PaymentCancel() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <XCircle className="mx-auto text-danger mb-4" size={48} />
        <h1 className="font-display text-2xl text-ink mb-2">Payment cancelled</h1>
        <p className="text-sm text-slate mb-8">No charge was made. Your booking is still saved as pending — you can pay anytime from My Bookings.</p>
        <Link to="/app/bookings" className="btn-primary w-full">Go to my bookings</Link>
      </div>
    </div>
  )
}

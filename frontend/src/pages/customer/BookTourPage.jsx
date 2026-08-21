import { useEffect, useState } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import { Tag, CreditCard } from 'lucide-react'
import toast from 'react-hot-toast'
import { tourApi, tourBookingApi } from '../../api/tours'
import { couponApi, paymentApi } from '../../api/payments'
import Loader from '../../components/common/Loader'
import { formatCurrency, formatDate } from '../../utils/format'
import { apiErrorMessage } from '../../api/axiosClient'

export default function BookTourPage() {
  const { id } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const [pkg, setPkg] = useState(null)
  const [schedules, setSchedules] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [couponMsg, setCouponMsg] = useState('')

  const [form, setForm] = useState({
    schedule_id: location.state?.scheduleId || '',
    traveler_count: 1,
    traveler_details: [{ name: '', age: '' }],
    coupon_code: '',
  })

  useEffect(() => {
    Promise.all([tourApi.get(id), tourApi.schedules(id)]).then(([p, s]) => {
      setPkg(p)
      setSchedules(s)
      setLoading(false)
    })
  }, [id])

  const subtotal = pkg ? pkg.price_per_person * form.traveler_count : 0

  const updateTravelerCount = (count) => {
    const details = [...form.traveler_details]
    while (details.length < count) details.push({ name: '', age: '' })
    details.length = count
    setForm({ ...form, traveler_count: count, traveler_details: details })
  }

  const handleValidateCoupon = async () => {
    if (!form.coupon_code) return
    try {
      const res = await couponApi.validate({ code: form.coupon_code, order_amount: subtotal })
      setCouponMsg(res.message + (res.valid ? ` (−${formatCurrency(res.discount_amount)})` : ''))
    } catch (err) {
      setCouponMsg(apiErrorMessage(err))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.schedule_id) {
      toast.error('Please select a departure date')
      return
    }
    setSubmitting(true)
    try {
      const booking = await tourBookingApi.create({
        package_id: Number(id), schedule_id: Number(form.schedule_id),
        traveler_count: form.traveler_count, traveler_details: form.traveler_details,
        coupon_code: form.coupon_code || undefined,
      })
      const checkout = await paymentApi.checkout({ booking_type: 'TOUR', booking_id: booking.id })
      if (checkout.checkout_url) {
        window.location.href = checkout.checkout_url
      } else {
        navigate('/app/bookings')
      }
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Could not complete your booking'))
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <Loader full />

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="font-display text-2xl text-ink mb-1">Complete your booking</h1>
      <p className="text-slate text-sm mb-8">{pkg?.title}</p>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-4">
          <div className="panel space-y-4">
            <div>
              <label className="field-label">Departure date</label>
              <select required className="select" value={form.schedule_id} onChange={(e) => setForm({ ...form, schedule_id: e.target.value })}>
                <option value="">Select a departure</option>
                {schedules.map((s) => (
                  <option key={s.id} value={s.id}>{formatDate(s.departure_date)} → {formatDate(s.return_date)} ({s.seats_available} seats left)</option>
                ))}
              </select>
            </div>
            <div>
              <label className="field-label">Travelers</label>
              <input type="number" min={1} className="input" value={form.traveler_count} onChange={(e) => updateTravelerCount(Number(e.target.value) || 1)} />
            </div>
            <div className="space-y-2">
              {form.traveler_details.map((t, idx) => (
                <div key={idx} className="flex gap-2">
                  <input
                    className="input flex-1" placeholder={`Traveler ${idx + 1} name`}
                    value={t.name}
                    onChange={(e) => {
                      const details = [...form.traveler_details]
                      details[idx] = { ...details[idx], name: e.target.value }
                      setForm({ ...form, traveler_details: details })
                    }}
                  />
                  <input
                    type="number" className="input w-24" placeholder="Age"
                    value={t.age}
                    onChange={(e) => {
                      const details = [...form.traveler_details]
                      details[idx] = { ...details[idx], age: e.target.value }
                      setForm({ ...form, traveler_details: details })
                    }}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="panel">
            <label className="field-label">Coupon code</label>
            <div className="flex gap-2">
              <input className="input" placeholder="e.g. WELCOME10" value={form.coupon_code} onChange={(e) => setForm({ ...form, coupon_code: e.target.value.toUpperCase() })} />
              <button type="button" onClick={handleValidateCoupon} className="btn-outline shrink-0"><Tag size={15} /> Apply</button>
            </div>
            {couponMsg && <p className="text-xs text-slate mt-2">{couponMsg}</p>}
          </div>
        </div>

        <div>
          <div className="ticket p-5 sticky top-24">
            <h3 className="font-display text-base text-ink mb-4">Price summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-slate"><span>{form.traveler_count} traveler(s)</span><span className="font-mono text-charcoal">{formatCurrency(subtotal)}</span></div>
              <div className="flex justify-between text-slate"><span>Estimated tax</span><span className="font-mono text-charcoal">+5%</span></div>
            </div>
            <div className="border-t border-ink/10 mt-3 pt-3 flex justify-between font-semibold text-ink">
              <span>Est. total</span><span className="font-mono">{formatCurrency(subtotal * 1.05)}</span>
            </div>
            <button type="submit" disabled={submitting} className="btn-gold w-full mt-5">
              <CreditCard size={16} /> {submitting ? 'Processing…' : 'Book & Pay'}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}

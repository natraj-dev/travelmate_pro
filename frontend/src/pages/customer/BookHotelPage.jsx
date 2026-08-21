import { useEffect, useState } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import { Calendar, Users as UsersIcon, Tag, CreditCard } from 'lucide-react'
import toast from 'react-hot-toast'
import { hotelApi, hotelBookingApi } from '../../api/hotels'
import { couponApi } from '../../api/payments'
import { paymentApi } from '../../api/payments'
import Loader from '../../components/common/Loader'
import { formatCurrency } from '../../utils/format'
import { apiErrorMessage } from '../../api/axiosClient'

export default function BookHotelPage() {
  const { id } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const [hotel, setHotel] = useState(null)
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [couponMsg, setCouponMsg] = useState('')

  const [form, setForm] = useState({
    room_id: location.state?.roomId || '',
    check_in_date: location.state?.check_in || '',
    check_out_date: location.state?.check_out || '',
    rooms_booked: 1,
    guests_adults: location.state?.guests || 2,
    guests_children: 0,
    special_requests: '',
    coupon_code: '',
  })

  useEffect(() => {
    Promise.all([hotelApi.get(id), hotelApi.rooms(id)]).then(([h, r]) => {
      setHotel(h)
      setRooms(r)
      setLoading(false)
    })
  }, [id])

  const selectedRoom = rooms.find((r) => r.id === Number(form.room_id))
  const nights = form.check_in_date && form.check_out_date
    ? Math.max(1, Math.round((new Date(form.check_out_date) - new Date(form.check_in_date)) / 86400000))
    : 0
  const subtotal = selectedRoom ? selectedRoom.price_per_night * nights * form.rooms_booked : 0

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
    if (!form.room_id || !form.check_in_date || !form.check_out_date) {
      toast.error('Please complete all required fields')
      return
    }
    setSubmitting(true)
    try {
      const booking = await hotelBookingApi.create({ ...form, hotel_id: Number(id), room_id: Number(form.room_id) })
      const checkout = await paymentApi.checkout({ booking_type: 'HOTEL', booking_id: booking.id })
      if (checkout.checkout_url) {
        window.location.href = checkout.checkout_url
      } else {
        navigate('/app/bookings')
        toast.success('Booking created — complete payment from My Bookings')
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
      <p className="text-slate text-sm mb-8">{hotel?.name} — {hotel?.city}, {hotel?.country}</p>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-4">
          <div className="panel space-y-4">
            <div>
              <label className="field-label">Room</label>
              <select required className="select" value={form.room_id} onChange={(e) => setForm({ ...form, room_id: e.target.value })}>
                <option value="">Select a room</option>
                {rooms.map((r) => (
                  <option key={r.id} value={r.id}>{r.name} — {formatCurrency(r.price_per_night)}/night</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="field-label">Check-in</label>
                <input type="date" required className="input" value={form.check_in_date} onChange={(e) => setForm({ ...form, check_in_date: e.target.value })} />
              </div>
              <div>
                <label className="field-label">Check-out</label>
                <input type="date" required className="input" value={form.check_out_date} onChange={(e) => setForm({ ...form, check_out_date: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="field-label">Rooms</label>
                <input type="number" min={1} className="input" value={form.rooms_booked} onChange={(e) => setForm({ ...form, rooms_booked: Number(e.target.value) })} />
              </div>
              <div>
                <label className="field-label">Adults</label>
                <input type="number" min={1} className="input" value={form.guests_adults} onChange={(e) => setForm({ ...form, guests_adults: Number(e.target.value) })} />
              </div>
              <div>
                <label className="field-label">Children</label>
                <input type="number" min={0} className="input" value={form.guests_children} onChange={(e) => setForm({ ...form, guests_children: Number(e.target.value) })} />
              </div>
            </div>
            <div>
              <label className="field-label">Special requests (optional)</label>
              <textarea rows={3} className="textarea" value={form.special_requests} onChange={(e) => setForm({ ...form, special_requests: e.target.value })} />
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
              <div className="flex justify-between text-slate"><span>{nights} night(s) × {form.rooms_booked} room(s)</span><span className="font-mono text-charcoal">{formatCurrency(subtotal)}</span></div>
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

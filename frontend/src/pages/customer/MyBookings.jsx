import { useEffect, useState } from 'react'
import { CalendarCheck, CreditCard, XCircle, RotateCcw } from 'lucide-react'
import toast from 'react-hot-toast'

import { hotelBookingApi } from '../../api/hotels'
import { tourBookingApi } from '../../api/tours'
import { activityApi, transportApi } from '../../api/bookings'
import { paymentApi, refundApi } from '../../api/payments'

import PageHeader from '../../components/common/PageHeader'
import Tabs from '../../components/common/Tabs'
import Loader from '../../components/common/Loader'
import EmptyState from '../../components/common/EmptyState'
import StatusBadge from '../../components/common/StatusBadge'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import Modal from '../../components/common/Modal'

import { formatCurrency, formatDate } from '../../utils/format'
import { apiErrorMessage } from '../../api/axiosClient'


export default function MyBookings() {
  const [tab, setTab] = useState('hotel')

  const [hotelBookings, setHotelBookings] = useState([])
  const [tourBookings, setTourBookings] = useState([])
  const [activityBookings, setActivityBookings] = useState([])
  const [transportBookings, setTransportBookings] = useState([])

  // Payment and refund information
  const [payments, setPayments] = useState([])
  const [refunds, setRefunds] = useState([])

  const [loading, setLoading] = useState(true)

  // Cancel dialog
  const [cancelTarget, setCancelTarget] = useState(null)

  // Refund dialog
  const [refundTarget, setRefundTarget] = useState(null)


  // ---------------------------------------------------------------------------
  // Load bookings + payments + refunds
  // ---------------------------------------------------------------------------

  const loadAll = () => {
    setLoading(true)

    Promise.all([
      hotelBookingApi
        .list({ page_size: 50 })
        .catch(() => ({ items: [] })),

      tourBookingApi
        .list({ page_size: 50 })
        .catch(() => ({ items: [] })),

      activityApi
        .myBookings()
        .catch(() => []),

      transportApi
        .myBookings()
        .catch(() => []),

      // Customer's payments
      paymentApi
        .mine()
        .catch(() => []),

      // Customer's refund requests
      refundApi
        .mine()
        .catch(() => []),
    ])
      .then(
        ([
          hotelResponse,
          tourResponse,
          activityResponse,
          transportResponse,
          paymentResponse,
          refundResponse,
        ]) => {
          setHotelBookings(hotelResponse?.items || [])
          setTourBookings(tourResponse?.items || [])

          setActivityBookings(activityResponse || [])
          setTransportBookings(transportResponse || [])

          /*
           * paymentApi.mine() is expected to return the customer's
           * payment list.
           *
           * This also safely handles APIs that return:
           * { items: [...] }
           */
          setPayments(
            Array.isArray(paymentResponse)
              ? paymentResponse
              : paymentResponse?.items || []
          )

          /*
           * refundApi.mine() returns:
           * [
           *   {
           *     id,
           *     payment_id,
           *     amount,
           *     status,
           *     ...
           *   }
           * ]
           */
          setRefunds(
            Array.isArray(refundResponse)
              ? refundResponse
              : refundResponse?.items || []
          )

          setLoading(false)
        }
      )
      .catch(() => {
        setLoading(false)
        toast.error('Could not load your bookings')
      })
  }


  useEffect(() => {
    loadAll()
  }, [])


  // ---------------------------------------------------------------------------
  // Payment
  // ---------------------------------------------------------------------------

  const handlePay = async (type, bookingId) => {
    try {
      const res = await paymentApi.checkout({
        booking_type: type,
        booking_id: bookingId,
      })

      if (res.checkout_url) {
        window.location.href = res.checkout_url
      }
    } catch (err) {
      toast.error(
        apiErrorMessage(err, 'Could not start checkout')
      )
    }
  }


  // ---------------------------------------------------------------------------
  // Cancel booking
  // ---------------------------------------------------------------------------

  const handleCancel = async () => {
    if (!cancelTarget) return

    const { type, id } = cancelTarget

    try {
      if (type === 'HOTEL') {
        await hotelBookingApi.cancel(id)
      }

      if (type === 'TOUR') {
        await tourBookingApi.cancel(id)
      }

      if (type === 'ACTIVITY') {
        await activityApi.cancel(id)
      }

      if (type === 'TRANSPORT') {
        await transportApi.cancel(id)
      }

      toast.success('Booking cancelled')

      setCancelTarget(null)

      // Reload bookings, payments and refunds
      loadAll()
    } catch (err) {
      toast.error(
        apiErrorMessage(err, 'Could not cancel booking')
      )
    }
  }


  // ---------------------------------------------------------------------------
  // Find payment belonging to a booking
  // ---------------------------------------------------------------------------

  const getPaymentForBooking = (type, bookingId) => {
    const fieldMap = {
      HOTEL: 'hotel_booking_id',
      TOUR: 'tour_booking_id',
      ACTIVITY: 'activity_booking_id',
      TRANSPORT: 'transport_booking_id',
    }

    const paymentField = fieldMap[type]

    if (!paymentField) {
      return null
    }

    return (
      payments.find(
        (payment) =>
          Number(payment[paymentField]) === Number(bookingId) &&
          payment.status === 'SUCCEEDED'
      ) || null
    )
  }


  // ---------------------------------------------------------------------------
  // Find existing refund for payment
  // ---------------------------------------------------------------------------

  const getRefundForPayment = (paymentId) => {
    if (!paymentId) {
      return null
    }

    return (
      refunds.find(
        (refund) =>
          Number(refund.payment_id) === Number(paymentId)
      ) || null
    )
  }


  // ---------------------------------------------------------------------------
  // Submit refund request
  // ---------------------------------------------------------------------------

  const handleRefundRequest = async ({ payment, reason }) => {
    try {
      await refundApi.request({
        payment_id: payment.id,
        amount: payment.amount,
        reason,
      })

      toast.success('Refund request submitted successfully')

      setRefundTarget(null)

      // Reload to show REQUESTED status
      loadAll()
    } catch (err) {
      toast.error(
        apiErrorMessage(
          err,
          'Could not submit refund request'
        )
      )
    }
  }


  // ---------------------------------------------------------------------------
  // Render actions for each booking
  // ---------------------------------------------------------------------------

  const renderActions = (type, booking) => {
    const payment = getPaymentForBooking(
      type,
      booking.id
    )

    const existingRefund = payment
      ? getRefundForPayment(payment.id)
      : null

    return (
      <div className="flex items-center gap-2 shrink-0">

        {/* ---------------------------------------------------------------
            PAY
        --------------------------------------------------------------- */}
        {booking.status === 'PENDING' && (
          <button
            onClick={() =>
              handlePay(type, booking.id)
            }
            className="btn-gold btn-sm"
          >
            <CreditCard size={14} />
            Pay
          </button>
        )}


        {/* ---------------------------------------------------------------
            CANCEL
        --------------------------------------------------------------- */}
        {['PENDING', 'CONFIRMED'].includes(
          booking.status
        ) && (
            <button
              onClick={() =>
                setCancelTarget({
                  type,
                  id: booking.id,
                })
              }
              className="btn-outline btn-sm text-danger border-danger/20 hover:bg-danger/5"
            >
              <XCircle size={14} />
              Cancel
            </button>
          )}


        {/* ---------------------------------------------------------------
            REQUEST REFUND

            Only show when:

            1. Booking is cancelled
            2. Payment exists
            3. Payment succeeded
            4. Refund has not already been requested
        --------------------------------------------------------------- */}
        {booking.status === 'CANCELLED' &&
          payment &&
          !existingRefund && (
            <button
              onClick={() =>
                setRefundTarget({
                  type,
                  booking,
                  payment,
                })
              }
              className="btn-outline btn-sm"
            >
              <RotateCcw size={14} />
              Request Refund
            </button>
          )}


        {/* ---------------------------------------------------------------
            EXISTING REFUND STATUS
        --------------------------------------------------------------- */}
        {booking.status === 'CANCELLED' &&
          existingRefund && (
            <StatusBadge
              status={existingRefund.status}
            />
          )}

      </div>
    )
  }


  // ---------------------------------------------------------------------------
  // Tabs
  // ---------------------------------------------------------------------------

  const tabs = [
    {
      value: 'hotel',
      label: 'Hotels',
      count: hotelBookings.length,
    },
    {
      value: 'tour',
      label: 'Tours',
      count: tourBookings.length,
    },
    {
      value: 'activity',
      label: 'Activities',
      count: activityBookings.length,
    },
    {
      value: 'transport',
      label: 'Transport',
      count: transportBookings.length,
    },
  ]


  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div>

      <PageHeader
        title="My Bookings"
        subtitle="All your hotel, tour, activity, and transport bookings in one place."
      />

      <Tabs
        tabs={tabs}
        active={tab}
        onChange={setTab}
      />


      {/* -------------------------------------------------------------------
          BOOKINGS
      ------------------------------------------------------------------- */}

      {loading ? (
        <Loader />
      ) : (
        <div className="space-y-3">

          {/* ================================================================
              HOTELS
          ================================================================ */}

          {tab === 'hotel' &&
            (hotelBookings.length === 0 ? (
              <EmptyState
                icon={CalendarCheck}
                title="No hotel bookings yet"
              />
            ) : (
              hotelBookings.map((b) => (
                <div
                  key={b.id}
                  className="ticket p-5 flex items-center justify-between gap-4 flex-wrap"
                >
                  <div>
                    <p className="font-mono text-sm font-semibold text-ink">
                      {b.booking_reference}
                    </p>

                    <p className="text-xs text-slate mt-1">
                      {formatDate(b.check_in_date)}
                      {' → '}
                      {formatDate(b.check_out_date)}
                      {' · '}
                      {b.nights} nights
                    </p>

                    <p className="text-sm font-semibold text-charcoal mt-1">
                      {formatCurrency(b.total_amount)}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 flex-wrap">
                    <StatusBadge status={b.status} />

                    {renderActions(
                      'HOTEL',
                      b
                    )}
                  </div>
                </div>
              ))
            ))}


          {/* ================================================================
              TOURS
          ================================================================ */}

          {tab === 'tour' &&
            (tourBookings.length === 0 ? (
              <EmptyState
                icon={CalendarCheck}
                title="No tour bookings yet"
              />
            ) : (
              tourBookings.map((b) => (
                <div
                  key={b.id}
                  className="ticket p-5 flex items-center justify-between gap-4 flex-wrap"
                >
                  <div>
                    <p className="font-mono text-sm font-semibold text-ink">
                      {b.booking_reference}
                    </p>

                    <p className="text-xs text-slate mt-1">
                      {b.traveler_count} traveler(s)
                    </p>

                    <p className="text-sm font-semibold text-charcoal mt-1">
                      {formatCurrency(b.total_amount)}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 flex-wrap">
                    <StatusBadge status={b.status} />

                    {renderActions(
                      'TOUR',
                      b
                    )}
                  </div>
                </div>
              ))
            ))}


          {/* ================================================================
              ACTIVITIES
          ================================================================ */}

          {tab === 'activity' &&
            (activityBookings.length === 0 ? (
              <EmptyState
                icon={CalendarCheck}
                title="No activity bookings yet"
              />
            ) : (
              activityBookings.map((b) => (
                <div
                  key={b.id}
                  className="ticket p-5 flex items-center justify-between gap-4 flex-wrap"
                >
                  <div>
                    <p className="font-mono text-sm font-semibold text-ink">
                      {b.booking_reference}
                    </p>

                    <p className="text-xs text-slate mt-1">
                      {formatDate(b.activity_date)}
                      {' · '}
                      {b.participants} participant(s)
                    </p>

                    <p className="text-sm font-semibold text-charcoal mt-1">
                      {formatCurrency(b.total_amount)}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 flex-wrap">
                    <StatusBadge status={b.status} />

                    {renderActions(
                      'ACTIVITY',
                      b
                    )}
                  </div>
                </div>
              ))
            ))}


          {/* ================================================================
              TRANSPORT
          ================================================================ */}

          {tab === 'transport' &&
            (transportBookings.length === 0 ? (
              <EmptyState
                icon={CalendarCheck}
                title="No transport bookings yet"
              />
            ) : (
              transportBookings.map((b) => (
                <div
                  key={b.id}
                  className="ticket p-5 flex items-center justify-between gap-4 flex-wrap"
                >
                  <div>
                    <p className="font-mono text-sm font-semibold text-ink">
                      {b.booking_reference}
                    </p>

                    <p className="text-xs text-slate mt-1">
                      {b.seats_booked} seat(s)
                    </p>

                    <p className="text-sm font-semibold text-charcoal mt-1">
                      {formatCurrency(b.total_amount)}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 flex-wrap">
                    <StatusBadge status={b.status} />

                    {renderActions(
                      'TRANSPORT',
                      b
                    )}
                  </div>
                </div>
              ))
            ))}

        </div>
      )}


      {/* -------------------------------------------------------------------
          CANCEL CONFIRMATION
      ------------------------------------------------------------------- */}

      <ConfirmDialog
        open={!!cancelTarget}
        onClose={() =>
          setCancelTarget(null)
        }
        onConfirm={handleCancel}
        title="Cancel this booking?"
        description="This action cannot be undone. If already paid, you can request a refund separately."
        confirmLabel="Cancel booking"
        danger
      />


      {/* -------------------------------------------------------------------
          REFUND REQUEST MODAL
      ------------------------------------------------------------------- */}

      <RefundDialog
        target={refundTarget}
        onClose={() =>
          setRefundTarget(null)
        }
        onSubmit={handleRefundRequest}
      />

    </div>
  )
}


// ============================================================================
// REFUND REQUEST MODAL
// ============================================================================

function RefundDialog({
  target,
  onClose,
  onSubmit,
}) {
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)


  useEffect(() => {
    if (target) {
      setReason('')
      setLoading(false)
    }
  }, [target])


  if (!target) {
    return null
  }


  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!reason.trim()) {
      toast.error(
        'Please provide a reason for the refund'
      )
      return
    }

    setLoading(true)

    try {
      await onSubmit({
        payment: target.payment,
        reason: reason.trim(),
      })
    } finally {
      setLoading(false)
    }
  }


  return (
    <Modal
      open={!!target}
      onClose={onClose}
      title="Request refund"
      maxWidth="max-w-lg"
    >
      <form
        onSubmit={handleSubmit}
        className="space-y-5"
      >

        {/* ---------------------------------------------------------------
            BOOKING / PAYMENT INFORMATION
        --------------------------------------------------------------- */}

        <div className="bg-sand rounded-xl p-4">

          <p className="text-xs text-slate">
            Booking
          </p>

          <p className="font-mono font-semibold text-ink mt-1">
            {target.booking.booking_reference}
          </p>

          <div className="flex items-center justify-between mt-3">

            <span className="text-sm text-slate">
              Paid amount
            </span>

            <span className="font-semibold text-charcoal">
              {formatCurrency(
                target.payment.amount
              )}
            </span>

          </div>

        </div>


        {/* ---------------------------------------------------------------
            REFUND REASON
        --------------------------------------------------------------- */}

        <div>

          <label className="field-label">
            Refund reason
          </label>

          <textarea
            required
            rows={4}
            className="textarea"
            placeholder="Please explain why you are requesting a refund..."
            value={reason}
            onChange={(e) =>
              setReason(e.target.value)
            }
          />

        </div>


        {/* ---------------------------------------------------------------
            ACTIONS
        --------------------------------------------------------------- */}

        <div className="flex justify-end gap-2">

          <button
            type="button"
            onClick={onClose}
            className="btn-outline"
            disabled={loading}
          >
            Cancel
          </button>

          <button
            type="submit"
            className="btn-primary"
            disabled={loading}
          >
            {loading
              ? 'Submitting...'
              : 'Submit refund request'}
          </button>

        </div>

      </form>
    </Modal>
  )
}
import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  MapPin,
  Star,
  Check,
  Calendar,
  Users as UsersIcon,
  Heart,
  Image as ImageIcon,
} from 'lucide-react'
import toast from 'react-hot-toast'

import { hotelApi } from '../../api/hotels'
import { reviewApi, wishlistApi } from '../../api/bookings'
import { useAuth } from '../../context/AuthContext'
import Loader from '../../components/common/Loader'
import RatingStars from '../../components/common/RatingStars'
import { formatCurrency } from '../../utils/format'
import { apiErrorMessage } from '../../api/axiosClient'

export default function HotelDetailsPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [hotel, setHotel] = useState(null)
  const [rooms, setRooms] = useState([])
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [dates, setDates] = useState({
    check_in: '',
    check_out: '',
    guests: 2,
  })
  const [availableRooms, setAvailableRooms] = useState(null)

  useEffect(() => {
    const loadHotel = async () => {
      try {
        const [h, r, rv] = await Promise.all([
          hotelApi.get(id),
          hotelApi.rooms(id),
          reviewApi
            .list({
              review_type: 'HOTEL',
              item_id: id,
              page_size: 10,
            })
            .catch(() => ({ items: [] })),
        ])

        setHotel(h)
        setRooms(r || [])
        setReviews(rv?.items || [])
      } catch (err) {
        toast.error(apiErrorMessage(err, 'Could not load hotel'))
      } finally {
        setLoading(false)
      }
    }

    loadHotel()
  }, [id])

  const checkAvailability = async () => {
    if (!dates.check_in || !dates.check_out) {
      toast.error('Select check-in and check-out dates')
      return
    }

    if (dates.check_out <= dates.check_in) {
      toast.error('Check-out date must be after check-in date')
      return
    }

    try {
      const data = await hotelApi.availableRooms(id, {
        ...dates,
        guests: Number(dates.guests),
      })

      setAvailableRooms(data || [])

      if (!data || data.length === 0) {
        toast('No rooms available for these dates', {
          icon: '😕',
        })
      }
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Could not check availability'))
    }
  }

  const handleBookRoom = (roomId) => {
    if (!user) {
      navigate('/login', {
        state: {
          from: {
            pathname: `/book/hotel/${id}`,
          },
        },
      })
      return
    }

    navigate(`/book/hotel/${id}`, {
      state: {
        roomId,
        ...dates,
      },
    })
  }

  const handleWishlist = async () => {
    if (!user) {
      return navigate('/login')
    }

    try {
      await wishlistApi.add({
        item_type: 'HOTEL',
        item_id: Number(id),
      })

      toast.success('Added to wishlist')
    } catch (err) {
      toast.error(
        apiErrorMessage(err, 'Could not add to wishlist')
      )
    }
  }

  if (loading) {
    return <Loader full />
  }

  if (!hotel) {
    return (
      <div className="max-w-4xl mx-auto py-20 text-center text-slate">
        Hotel not found.
      </div>
    )
  }

  // Parse amenities
  let amenities = []

  try {
    amenities = hotel.amenities
      ? JSON.parse(hotel.amenities)
      : []
  } catch {
    amenities = []
  }

  // Parse uploaded hotel images
  let hotelImages = []

  try {
    hotelImages = hotel.images
      ? JSON.parse(hotel.images)
      : []
  } catch {
    hotelImages = []
  }

  // Build unique image list.
  // cover_image_url is shown first.
  const allImages = [
    hotel.cover_image_url,
    ...hotelImages,
  ].filter(Boolean)

  const uniqueImages = [...new Set(allImages)]

  const displayRooms =
    availableRooms !== null ? availableRooms : rooms

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

      {/* =====================================================
          HOTEL IMAGE GALLERY
      ====================================================== */}
      <div className="mb-8">

        {uniqueImages.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">

            {/* Main image */}
            <div className="md:col-span-3 h-72 sm:h-96 rounded-2xl overflow-hidden bg-sand relative">
              <img
                src={uniqueImages[0]}
                alt={hotel.name}
                className="w-full h-full object-cover"
              />

              <button
                onClick={handleWishlist}
                className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/90 flex items-center justify-center shadow-soft hover:bg-white transition-colors"
              >
                <Heart size={18} className="text-danger" />
              </button>
            </div>

            {/* Additional images */}
            <div className="hidden md:grid grid-rows-2 gap-3">

              {uniqueImages.slice(1, 3).map((image, index) => (
                <div
                  key={`${image}-${index}`}
                  className="rounded-2xl overflow-hidden bg-sand"
                >
                  <img
                    src={image}
                    alt={`${hotel.name} ${index + 2}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}

              {uniqueImages.length === 1 && (
                <>
                  <div className="rounded-2xl bg-sand flex items-center justify-center">
                    <ImageIcon
                      size={32}
                      className="text-ink/15"
                    />
                  </div>

                  <div className="rounded-2xl bg-sand flex items-center justify-center">
                    <ImageIcon
                      size={32}
                      className="text-ink/15"
                    />
                  </div>
                </>
              )}

              {uniqueImages.length === 2 && (
                <div className="rounded-2xl bg-sand flex items-center justify-center">
                  <ImageIcon
                    size={32}
                    className="text-ink/15"
                  />
                </div>
              )}

            </div>
          </div>
        ) : (
          <div className="h-72 sm:h-96 rounded-2xl bg-sand overflow-hidden relative flex items-center justify-center">
            <Star
              size={48}
              className="text-ink/15"
            />

            <button
              onClick={handleWishlist}
              className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/90 flex items-center justify-center shadow-soft hover:bg-white transition-colors"
            >
              <Heart size={18} className="text-danger" />
            </button>
          </div>
        )}
      </div>

      {/* =====================================================
          HOTEL CONTENT
      ====================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

        {/* =================================================
            LEFT SIDE
        ================================================== */}
        <div className="lg:col-span-2">

          <div className="flex items-start justify-between gap-3 mb-2">

            <h1 className="font-display text-3xl text-ink">
              {hotel.name}
            </h1>

            <span className="badge-neutral shrink-0">
              {hotel.star_rating}★ Hotel
            </span>

          </div>

          <div className="flex items-center gap-3 text-sm text-slate mb-4">
            <span className="flex items-center gap-1">
              <MapPin size={14} />

              {hotel.address}, {hotel.city}, {hotel.country}
            </span>
          </div>

          <RatingStars
            rating={hotel.rating_avg}
            reviewCount={hotel.review_count}
            size={16}
          />

          {hotel.description && (
            <p className="text-charcoal/80 leading-relaxed mt-6">
              {hotel.description}
            </p>
          )}

          {/* =================================================
              AMENITIES
          ================================================== */}
          {amenities.length > 0 && (
            <div className="mt-8">

              <h3 className="font-display text-lg text-ink mb-3">
                Amenities
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">

                {amenities.map((amenity) => (
                  <div
                    key={amenity}
                    className="flex items-center gap-2 text-sm text-charcoal"
                  >
                    <Check
                      size={14}
                      className="text-success"
                    />

                    {amenity}
                  </div>
                ))}

              </div>
            </div>
          )}

          {/* =================================================
              CHECK IN / CHECK OUT
          ================================================== */}
          <div className="mt-8 flex gap-6 text-sm text-slate">

            <p>
              <span className="font-semibold text-charcoal">
                Check-in:
              </span>{' '}
              {hotel.check_in_time}
            </p>

            <p>
              <span className="font-semibold text-charcoal">
                Check-out:
              </span>{' '}
              {hotel.check_out_time}
            </p>

          </div>

          {/* =================================================
              REVIEWS
          ================================================== */}
          {reviews.length > 0 && (
            <div className="mt-10">

              <h3 className="font-display text-lg text-ink mb-4">
                Guest reviews
              </h3>

              <div className="space-y-4">

                {reviews.map((review) => (
                  <div
                    key={review.id}
                    className="border-b border-ink/8 pb-4"
                  >

                    <RatingStars
                      rating={review.rating}
                      showValue={false}
                      size={14}
                    />

                    {review.title && (
                      <p className="font-semibold text-sm text-charcoal mt-1">
                        {review.title}
                      </p>
                    )}

                    {review.comment && (
                      <p className="text-sm text-slate mt-1">
                        {review.comment}
                      </p>
                    )}

                  </div>
                ))}

              </div>
            </div>
          )}

        </div>

        {/* =================================================
            RIGHT SIDE - BOOKING
        ================================================== */}
        <div>

          <div className="card p-5 sticky top-24">

            <h3 className="font-display text-lg text-ink mb-4">
              Check availability
            </h3>

            <div className="space-y-3">

              <div>
                <label className="field-label">
                  Check-in
                </label>

                <input
                  type="date"
                  className="input"
                  value={dates.check_in}
                  onChange={(e) =>
                    setDates({
                      ...dates,
                      check_in: e.target.value,
                    })
                  }
                />
              </div>

              <div>
                <label className="field-label">
                  Check-out
                </label>

                <input
                  type="date"
                  className="input"
                  value={dates.check_out}
                  onChange={(e) =>
                    setDates({
                      ...dates,
                      check_out: e.target.value,
                    })
                  }
                />
              </div>

              <div>
                <label className="field-label">
                  Guests
                </label>

                <input
                  type="number"
                  min={1}
                  className="input"
                  value={dates.guests}
                  onChange={(e) =>
                    setDates({
                      ...dates,
                      guests: Number(e.target.value),
                    })
                  }
                />
              </div>

              <button
                onClick={checkAvailability}
                className="btn-primary w-full"
              >
                <Calendar size={16} />
                Check availability
              </button>

            </div>

            {/* =================================================
                ROOM LIST
            ================================================== */}
            <div className="mt-6 space-y-3 max-h-96 overflow-y-auto scrollbar-thin">

              {displayRooms.map((room) => (
                <div
                  key={room.id}
                  className="border border-ink/10 rounded-xl p-3.5"
                >

                  <p className="font-semibold text-sm text-charcoal">
                    {room.name}
                  </p>

                  <p className="text-xs text-slate mb-2 flex items-center gap-1">
                    <UsersIcon size={12} />

                    Up to{' '}
                    {room.capacity_adults +
                      room.capacity_children}{' '}
                    guests
                  </p>

                  <div className="flex items-center justify-between">

                    <span className="font-mono font-semibold text-ink">
                      {formatCurrency(
                        room.price_per_night
                      )}

                      <span className="text-xs text-slate font-sans">
                        /night
                      </span>
                    </span>

                    <button
                      onClick={() =>
                        handleBookRoom(room.id)
                      }
                      className="btn-gold btn-sm"
                    >
                      Book
                    </button>

                  </div>
                </div>
              ))}

              {displayRooms.length === 0 && (
                <p className="text-sm text-slate text-center py-4">
                  No rooms to show.
                </p>
              )}

            </div>

          </div>

        </div>

      </div>
    </div>
  )
}
import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  MapPin,
  MapPinned,
  Calendar,
  Users as UsersIcon,
  Check,
  X,
  Heart,
  Image as ImageIcon,
  Building2,
  ShieldCheck,
} from 'lucide-react'
import toast from 'react-hot-toast'

import { tourApi } from '../../api/tours'
import { reviewApi, wishlistApi } from '../../api/bookings'
import { useAuth } from '../../context/AuthContext'

import Loader from '../../components/common/Loader'
import RatingStars from '../../components/common/RatingStars'

import { formatCurrency, formatDate } from '../../utils/format'
import { apiErrorMessage } from '../../api/axiosClient'

export default function TourDetailsPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [pkg, setPkg] = useState(null)
  const [schedules, setSchedules] = useState([])
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState(null)

  useEffect(() => {
    let mounted = true

    const load = async () => {
      setLoading(true)

      try {
        const [packageData, scheduleData, reviewData] = await Promise.all([
          tourApi.get(id),
          tourApi.schedules(id).catch(() => []),
          reviewApi
            .list({
              review_type: 'TOUR',
              item_id: id,
              page_size: 10,
            })
            .catch(() => ({ items: [] })),
        ])

        if (!mounted) return

        setPkg(packageData)
        setSchedules(scheduleData || [])
        setReviews(reviewData?.items || [])

        const gallery = getPackageImages(packageData)

        setSelectedImage(
          packageData?.cover_image_url ||
          gallery[0] ||
          null
        )
      } catch (err) {
        if (mounted) {
          toast.error(apiErrorMessage(err, 'Could not load tour package'))
          setPkg(null)
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    load()

    return () => {
      mounted = false
    }
  }, [id])

  const handleBook = (scheduleId) => {
    if (!user) {
      navigate('/login', {
        state: {
          from: {
            pathname: `/book/tour/${id}`,
          },
        },
      })
      return
    }

    navigate(`/book/tour/${id}`, {
      state: {
        scheduleId,
      },
    })
  }

  const handleWishlist = async () => {
    if (!user) {
      navigate('/login')
      return
    }

    try {
      await wishlistApi.add({
        item_type: 'TOUR',
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

  if (!pkg) {
    return (
      <div className="max-w-4xl mx-auto py-20 text-center">
        <MapPinned
          size={40}
          className="mx-auto text-ink/20 mb-4"
        />
        <p className="text-slate">
          Tour package not found.
        </p>
      </div>
    )
  }

  const included = parseList(pkg.included_services)
  const excluded = parseList(pkg.excluded_services)
  const images = getPackageImages(pkg)

  const mainImage =
    selectedImage ||
    pkg.cover_image_url ||
    images[0] ||
    null

  return (
    <div>
      {/* HERO / IMAGE SECTION */}
      <div className="bg-ink-gradient">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-10">

          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-white/60 mb-5">
            <Link
              to="/tours"
              className="hover:text-white transition-colors"
            >
              Tours
            </Link>

            <span>/</span>

            <span className="text-white/80 truncate">
              {pkg.title}
            </span>
          </div>

          {/* Image gallery */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">

            {/* Main image */}
            <div className="lg:col-span-3">
              <div className="h-72 sm:h-96 lg:h-[470px] rounded-2xl overflow-hidden bg-sand relative">

                {mainImage ? (
                  <img
                    src={mainImage}
                    alt={pkg.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-ink/20">
                    <MapPinned size={56} />
                    <p className="text-sm mt-2">
                      No package image available
                    </p>
                  </div>
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />

                <button
                  onClick={handleWishlist}
                  className="absolute top-4 right-4 w-11 h-11 rounded-full bg-white/90 flex items-center justify-center shadow-soft hover:bg-white transition-colors"
                  aria-label="Add to wishlist"
                >
                  <Heart
                    size={19}
                    className="text-danger"
                  />
                </button>

                {images.length > 0 && (
                  <div className="absolute bottom-4 left-4 flex items-center gap-2 bg-black/50 text-white px-3 py-1.5 rounded-full text-xs">
                    <ImageIcon size={14} />
                    {images.length} photos
                  </div>
                )}
              </div>
            </div>

            {/* Thumbnail images */}
            <div className="hidden lg:grid grid-rows-3 gap-3">

              {images.slice(0, 3).map((image, index) => (
                <button
                  key={`${image}-${index}`}
                  onClick={() => setSelectedImage(image)}
                  className={`rounded-xl overflow-hidden bg-sand border-2 transition-all ${selectedImage === image
                      ? 'border-gold'
                      : 'border-transparent'
                    }`}
                >
                  <img
                    src={image}
                    alt={`${pkg.title} ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}

              {images.length === 0 && (
                <div className="row-span-3 rounded-xl bg-white/10 flex items-center justify-center text-white/30">
                  <MapPinned size={34} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

          {/* LEFT CONTENT */}
          <div className="lg:col-span-2">

            {/* Title */}
            <div className="mb-6">
              <div className="flex flex-wrap items-center gap-2 mb-3">

                {pkg.activity_type && (
                  <span className="badge-neutral">
                    {pkg.activity_type}
                  </span>
                )}

                {pkg.is_published && (
                  <span className="badge-success">
                    Available
                  </span>
                )}
              </div>

              <h1 className="font-display text-3xl sm:text-4xl text-ink">
                {pkg.title}
              </h1>

              <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-slate">

                <span className="flex items-center gap-1.5">
                  <Calendar size={15} />
                  {pkg.duration_days} days
                </span>

                <span>
                  {pkg.duration_nights} nights
                </span>

                <span className="flex items-center gap-1.5">
                  <UsersIcon size={15} />
                  Up to {pkg.max_group_size} people
                </span>
              </div>

              <div className="mt-4">
                <RatingStars
                  rating={pkg.rating_avg}
                  reviewCount={pkg.review_count}
                  size={16}
                />
              </div>
            </div>

            {/* Description */}
            {pkg.description && (
              <div className="mb-10">
                <h2 className="font-display text-2xl text-ink mb-4">
                  About this tour
                </h2>

                <p className="text-charcoal/80 leading-relaxed whitespace-pre-line">
                  {pkg.description}
                </p>
              </div>
            )}

            {/* Included / Excluded */}
            {(included.length > 0 || excluded.length > 0) && (
              <div className="mb-10">

                <h2 className="font-display text-2xl text-ink mb-5">
                  What's included
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

                  {included.length > 0 && (
                    <div className="card p-5">
                      <h3 className="font-semibold text-charcoal mb-4">
                        Included
                      </h3>

                      <ul className="space-y-3">
                        {included.map((item, index) => (
                          <li
                            key={`${item}-${index}`}
                            className="flex items-start gap-2.5 text-sm text-charcoal"
                          >
                            <Check
                              size={16}
                              className="text-success shrink-0 mt-0.5"
                            />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {excluded.length > 0 && (
                    <div className="card p-5">
                      <h3 className="font-semibold text-charcoal mb-4">
                        Not included
                      </h3>

                      <ul className="space-y-3">
                        {excluded.map((item, index) => (
                          <li
                            key={`${item}-${index}`}
                            className="flex items-start gap-2.5 text-sm text-charcoal"
                          >
                            <X
                              size={16}
                              className="text-danger shrink-0 mt-0.5"
                            />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                </div>
              </div>
            )}

            {/* Package information */}
            <div className="mb-10">

              <h2 className="font-display text-2xl text-ink mb-5">
                Tour information
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                <div className="border border-ink/10 rounded-xl p-4">
                  <p className="text-xs text-slate uppercase tracking-wide">
                    Duration
                  </p>
                  <p className="font-semibold text-charcoal mt-1">
                    {pkg.duration_days} days / {pkg.duration_nights} nights
                  </p>
                </div>

                <div className="border border-ink/10 rounded-xl p-4">
                  <p className="text-xs text-slate uppercase tracking-wide">
                    Group size
                  </p>
                  <p className="font-semibold text-charcoal mt-1">
                    Maximum {pkg.max_group_size} travelers
                  </p>
                </div>

                {pkg.activity_type && (
                  <div className="border border-ink/10 rounded-xl p-4">
                    <p className="text-xs text-slate uppercase tracking-wide">
                      Activity
                    </p>
                    <p className="font-semibold text-charcoal mt-1">
                      {pkg.activity_type}
                    </p>
                  </div>
                )}

                <div className="border border-ink/10 rounded-xl p-4">
                  <p className="text-xs text-slate uppercase tracking-wide">
                    Rating
                  </p>
                  <p className="font-semibold text-charcoal mt-1">
                    {Number(pkg.rating_avg || 0).toFixed(1)} / 5
                    {' '}
                    ({pkg.review_count || 0} reviews)
                  </p>
                </div>

              </div>
            </div>

            {/* Reviews */}
            {reviews.length > 0 && (
              <div className="mb-10">

                <h2 className="font-display text-2xl text-ink mb-5">
                  Traveler reviews
                </h2>

                <div className="space-y-5">

                  {reviews.map((review) => (
                    <div
                      key={review.id}
                      className="border-b border-ink/8 pb-5"
                    >
                      <RatingStars
                        rating={review.rating}
                        showValue={false}
                        size={14}
                      />

                      {review.title && (
                        <p className="font-semibold text-sm text-charcoal mt-2">
                          {review.title}
                        </p>
                      )}

                      {review.comment && (
                        <p className="text-sm text-slate mt-1 leading-relaxed">
                          {review.comment}
                        </p>
                      )}
                    </div>
                  ))}

                </div>
              </div>
            )}

            {/* Trust information */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

              <div className="flex gap-3 border border-ink/10 rounded-xl p-4">
                <ShieldCheck
                  size={20}
                  className="text-info shrink-0"
                />

                <div>
                  <p className="font-semibold text-sm text-charcoal">
                    Trusted booking
                  </p>
                  <p className="text-xs text-slate mt-1">
                    Book through TravelMate Pro with secure booking support.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 border border-ink/10 rounded-xl p-4">
                <Building2
                  size={20}
                  className="text-gold-dark shrink-0"
                />

                <div>
                  <p className="font-semibold text-sm text-charcoal">
                    Tour operator
                  </p>
                  <p className="text-xs text-slate mt-1">
                    This package is provided by a registered tour operator.
                  </p>
                </div>
              </div>

            </div>
          </div>

          {/* RIGHT BOOKING CARD */}
          <div>

            <div className="card p-5 sticky top-24">

              <p className="text-xs text-slate mb-1">
                Starting from
              </p>

              <p className="font-mono text-2xl font-semibold text-ink">
                {formatCurrency(pkg.price_per_person)}
              </p>

              <p className="text-xs text-slate mb-6">
                per person
              </p>

              <div className="border-t border-ink/10 pt-5">

                <h2 className="font-display text-xl text-ink mb-4">
                  Upcoming departures
                </h2>

                <div className="space-y-3 max-h-96 overflow-y-auto scrollbar-thin">

                  {schedules.map((schedule) => (
                    <div
                      key={schedule.id}
                      className="border border-ink/10 rounded-xl p-4"
                    >

                      <p className="text-sm font-semibold text-charcoal flex items-center gap-1.5">
                        <Calendar size={14} />
                        {formatDate(schedule.departure_date)}
                        {' → '}
                        {formatDate(schedule.return_date)}
                      </p>

                      <p className="text-xs text-slate mt-2 flex items-center gap-1.5">
                        <MapPin size={12} />
                        {schedule.departure_location}
                      </p>

                      <p className="text-xs text-slate mt-1 flex items-center gap-1.5">
                        <UsersIcon size={12} />
                        {schedule.seats_available} of {schedule.total_seats} seats left
                      </p>

                      <button
                        onClick={() => handleBook(schedule.id)}
                        disabled={
                          !schedule.is_active ||
                          schedule.seats_available === 0
                        }
                        className="btn-gold btn-sm w-full mt-3 disabled:opacity-40"
                      >
                        {schedule.seats_available === 0
                          ? 'Sold out'
                          : !schedule.is_active
                            ? 'Unavailable'
                            : 'Book this date'}
                      </button>

                    </div>
                  ))}

                  {schedules.length === 0 && (
                    <div className="text-center py-6">
                      <Calendar
                        size={28}
                        className="mx-auto text-ink/20 mb-2"
                      />

                      <p className="text-sm text-slate">
                        No upcoming departures.
                      </p>
                    </div>
                  )}

                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  )
}


/*
 * Convert included/excluded services into arrays.
 *
 * Backend currently stores these as JSON strings.
 * This also supports arrays in case the API is changed later.
 */
function parseList(value) {
  if (!value) return []

  if (Array.isArray(value)) {
    return value.filter(Boolean)
  }

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value)

      if (Array.isArray(parsed)) {
        return parsed.filter(Boolean)
      }

      return []
    } catch {
      // Also support a simple comma/newline separated value.
      return value
        .split(/\r?\n|,/)
        .map((item) => item.trim())
        .filter(Boolean)
    }
  }

  return []
}


/*
 * Build the package gallery.
 *
 * cover_image_url is the main image.
 * images contains the additional uploaded images.
 */
function getPackageImages(pkg) {
  const result = []

  if (pkg?.cover_image_url) {
    result.push(pkg.cover_image_url)
  }

  if (pkg?.images) {
    if (Array.isArray(pkg.images)) {
      result.push(...pkg.images)
    } else if (typeof pkg.images === 'string') {
      try {
        const parsed = JSON.parse(pkg.images)

        if (Array.isArray(parsed)) {
          result.push(...parsed)
        }
      } catch {
        // Ignore invalid image JSON.
      }
    }
  }

  return [...new Set(result.filter(Boolean))]
}
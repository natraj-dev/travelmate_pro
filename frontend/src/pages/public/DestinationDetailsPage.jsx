import { useEffect, useMemo, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  MapPin,
  Star,
  MapPinned,
  ShieldCheck,
  Lightbulb,
  CalendarDays,
  Compass,
  Navigation,
  Hotel,
  Camera,
  ArrowRight,
} from 'lucide-react'

import { destinationApi, travelGuideApi } from '../../api/destinations'
import { hotelApi } from '../../api/hotels'
import { tourApi } from '../../api/tours'

import Loader from '../../components/common/Loader'
import RatingStars from '../../components/common/RatingStars'
import { formatCurrency } from '../../utils/format'

export default function DestinationDetailsPage() {
  const { id } = useParams()

  const [destination, setDestination] = useState(null)
  const [guides, setGuides] = useState([])
  const [hotels, setHotels] = useState([])
  const [tours, setTours] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeImage, setActiveImage] = useState(0)

  useEffect(() => {
    let mounted = true

    async function loadDestination() {
      setLoading(true)

      try {
        const [destinationData, guidesData, hotelsData, toursData] =
          await Promise.all([
            destinationApi.get(id),
            travelGuideApi.forDestination(id).catch(() => []),
            hotelApi.search({ page_size: 6 }).catch(() => ({ items: [] })),
            tourApi
              .search({ destination_id: id, page_size: 6 })
              .catch(() => ({ items: [] })),
          ])

        if (!mounted) return

        setDestination(destinationData)
        setGuides(Array.isArray(guidesData) ? guidesData : [])
        setHotels(hotelsData?.items || [])
        setTours(toursData?.items || [])
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    loadDestination()

    return () => {
      mounted = false
    }
  }, [id])

  const galleryImages = useMemo(() => {
    if (!destination) return []

    const images = []

    if (destination.cover_image_url) {
      images.push(destination.cover_image_url)
    }

    let additionalImages = destination.images

    if (typeof additionalImages === 'string') {
      try {
        additionalImages = JSON.parse(additionalImages)
      } catch {
        additionalImages = []
      }
    }

    if (Array.isArray(additionalImages)) {
      additionalImages.forEach((image) => {
        if (image && !images.includes(image)) {
          images.push(image)
        }
      })
    }

    return images
  }, [destination])

  useEffect(() => {
    setActiveImage(0)
  }, [destination])

  if (loading) {
    return <Loader full />
  }

  if (!destination) {
    return (
      <div className="max-w-4xl mx-auto py-20 text-center">
        <h1 className="font-display text-3xl text-ink mb-3">
          Destination not found
        </h1>

        <p className="text-slate mb-6">
          We couldn't find the destination you're looking for.
        </p>

        <Link to="/destinations" className="btn-primary inline-flex">
          Explore destinations
        </Link>
      </div>
    )
  }

  const currentImage = galleryImages[activeImage]

  return (
    <div className="bg-sand min-h-screen">

      {/* =========================================================
          HERO
      ========================================================= */}
      <section className="relative">

        <div className="relative h-[430px] sm:h-[500px] lg:h-[560px] overflow-hidden">

          {currentImage ? (
            <img
              src={currentImage}
              alt={destination.name}
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 bg-ink-gradient flex items-center justify-center">
              <Camera size={60} className="text-white/30" />
            </div>
          )}

          {/* Image overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-black/10" />

          {/* Hero content */}
          <div className="absolute inset-0 flex items-end">
            <div className="max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 pb-10 sm:pb-14">

              <div className="max-w-3xl">

                {/* Category */}
                {destination.category?.name && (
                  <span className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-md border border-white/20 text-white px-3 py-1.5 rounded-full text-xs font-semibold mb-4">
                    <Compass size={14} />
                    {destination.category.name}
                  </span>
                )}

                {/* Location */}
                <div className="flex items-center gap-2 text-white/85 text-sm mb-3">
                  <MapPin size={17} />

                  <span>
                    {destination.country}

                    {destination.region
                      ? `, ${destination.region}`
                      : ''}
                  </span>
                </div>

                {/* Title */}
                <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl text-white leading-tight">
                  {destination.name}
                </h1>

                {/* Popular */}
                {destination.is_popular && (
                  <div className="flex items-center gap-2 mt-4 text-gold">
                    <Star size={18} fill="currentColor" />
                    <span className="text-sm font-semibold">
                      Popular destination
                    </span>
                  </div>
                )}

              </div>
            </div>
          </div>
        </div>

        {/* Gallery thumbnails */}
        {galleryImages.length > 1 && (
          <div className="bg-white border-b border-ink/10">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">

              <div className="flex gap-3 overflow-x-auto">

                {galleryImages.map((image, index) => (
                  <button
                    key={`${image}-${index}`}
                    type="button"
                    onClick={() => setActiveImage(index)}
                    className={`shrink-0 w-20 h-16 rounded-lg overflow-hidden border-2 transition ${activeImage === index
                      ? 'border-gold'
                      : 'border-transparent'
                      }`}
                  >
                    <img
                      src={image}
                      alt={`${destination.name} ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}

              </div>
            </div>
          </div>
        )}
      </section>

      {/* =========================================================
          QUICK INFORMATION
      ========================================================= */}
      <section className="bg-white border-b border-ink/10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-ink/10">

            <InfoBox
              icon={<MapPin size={20} />}
              label="Location"
              value={
                destination.region
                  ? `${destination.region}, ${destination.country}`
                  : destination.country
              }
            />

            <InfoBox
              icon={<CalendarDays size={20} />}
              label="Best time"
              value={destination.best_time_to_visit || 'Anytime'}
            />

            <InfoBox
              icon={<Compass size={20} />}
              label="Category"
              value={destination.category?.name || 'Travel destination'}
            />

            <InfoBox
              icon={<Navigation size={20} />}
              label="Coordinates"
              value={
                destination.latitude && destination.longitude
                  ? `${destination.latitude}, ${destination.longitude}`
                  : 'Not available'
              }
            />

          </div>
        </div>
      </section>

      {/* =========================================================
          MAIN CONTENT
      ========================================================= */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-10">

          {/* LEFT */}
          <div>

            {/* About */}
            <section className="mb-12">

              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-full bg-gold/15 flex items-center justify-center">
                  <MapPinned size={20} className="text-gold-dark" />
                </div>

                <div>
                  <p className="text-xs uppercase tracking-widest text-slate">
                    Discover
                  </p>

                  <h2 className="font-display text-3xl text-ink">
                    About {destination.name}
                  </h2>
                </div>
              </div>

              {destination.description ? (
                <p className="text-charcoal/80 leading-8 text-base">
                  {destination.description}
                </p>
              ) : (
                <p className="text-slate">
                  Discover the highlights and experiences of {destination.name}.
                </p>
              )}

            </section>

            {/* Travel Information */}
            {destination.travel_information && (
              <section className="mb-12">

                <h2 className="font-display text-2xl text-ink mb-5">
                  Travel information
                </h2>

                <div className="bg-white rounded-2xl border border-ink/10 p-6">
                  <p className="text-charcoal/80 leading-7 whitespace-pre-line">
                    {destination.travel_information}
                  </p>
                </div>

              </section>
            )}

            {/* Best time */}
            {destination.best_time_to_visit && (
              <section className="mb-12">

                <div className="bg-ink rounded-2xl p-6 sm:p-8 text-white">

                  <div className="flex items-start gap-4">

                    <div className="w-11 h-11 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                      <CalendarDays size={21} />
                    </div>

                    <div>
                      <p className="text-white/60 text-xs uppercase tracking-widest mb-1">
                        Plan your trip
                      </p>

                      <h2 className="font-display text-2xl mb-2">
                        Best time to visit
                      </h2>

                      <p className="text-white/75 leading-relaxed">
                        {destination.best_time_to_visit}
                      </p>
                    </div>

                  </div>
                </div>

              </section>
            )}

            {/* Travel Guide */}
            {guides.length > 0 && (
              <section className="mb-12">

                <h2 className="font-display text-3xl text-ink mb-6">
                  Travel guide
                </h2>

                <div className="space-y-5">

                  {guides.map((guide) => (
                    <div
                      key={guide.id}
                      className="bg-white rounded-2xl border border-ink/10 p-6 sm:p-7"
                    >

                      <h3 className="font-display text-xl text-ink mb-5">
                        {guide.title}
                      </h3>

                      {guide.local_tips && (
                        <GuideItem
                          icon={<Lightbulb size={18} />}
                          title="Local tips"
                          text={guide.local_tips}
                        />
                      )}

                      {guide.tourist_attractions && (
                        <GuideItem
                          icon={<MapPinned size={18} />}
                          title="Tourist attractions"
                          text={guide.tourist_attractions}
                        />
                      )}

                      {guide.safety_information && (
                        <GuideItem
                          icon={<ShieldCheck size={18} />}
                          title="Safety information"
                          text={guide.safety_information}
                        />
                      )}

                      {guide.recommendations && (
                        <GuideItem
                          icon={<Star size={18} />}
                          title="Recommendations"
                          text={guide.recommendations}
                        />
                      )}

                    </div>
                  ))}

                </div>
              </section>
            )}

            {/* Tours */}
            {tours.length > 0 && (
              <section className="mb-12">

                <SectionHeader
                  title={`Tours in ${destination.name}`}
                  link="/tours"
                  linkText="View all tours"
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">

                  {tours.map((tour) => (
                    <Link
                      key={tour.id}
                      to={`/tours/${tour.id}`}
                      className="bg-white rounded-2xl border border-ink/10 overflow-hidden hover:-translate-y-1 hover:shadow-lg transition"
                    >

                      <div className="h-40 bg-sand overflow-hidden">

                        {tour.cover_image_url ? (
                          <img
                            src={tour.cover_image_url}
                            alt={tour.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <MapPinned
                              size={32}
                              className="text-ink/15"
                            />
                          </div>
                        )}

                      </div>

                      <div className="p-5">

                        <p className="font-semibold text-charcoal line-clamp-2">
                          {tour.title}
                        </p>

                        <div className="flex items-center justify-between mt-4">

                          <RatingStars
                            rating={tour.rating_avg}
                            size={12}
                            showValue={false}
                          />

                          <span className="font-mono font-semibold text-ink">
                            {formatCurrency(tour.price_per_person)}
                          </span>

                        </div>

                      </div>
                    </Link>
                  ))}

                </div>
              </section>
            )}

            {/* Hotels */}
            {hotels.length > 0 && (
              <section>

                <SectionHeader
                  title="Places to stay"
                  link="/hotels"
                  linkText="View all hotels"
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">

                  {hotels.map((hotel) => (
                    <Link
                      key={hotel.id}
                      to={`/hotels/${hotel.id}`}
                      className="bg-white rounded-2xl border border-ink/10 overflow-hidden hover:-translate-y-1 hover:shadow-lg transition"
                    >

                      <div className="h-40 bg-sand overflow-hidden">

                        {hotel.cover_image_url ? (
                          <img
                            src={hotel.cover_image_url}
                            alt={hotel.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Hotel
                              size={32}
                              className="text-ink/15"
                            />
                          </div>
                        )}

                      </div>

                      <div className="p-5">

                        <p className="font-semibold text-charcoal truncate">
                          {hotel.name}
                        </p>

                        {hotel.city && (
                          <p className="text-xs text-slate mt-1 mb-3">
                            {hotel.city}
                          </p>
                        )}

                        <RatingStars
                          rating={hotel.rating_avg}
                          size={12}
                        />

                      </div>
                    </Link>
                  ))}

                </div>
              </section>
            )}

          </div>

          {/* =====================================================
              RIGHT SIDEBAR
          ===================================================== */}
          <aside>

            <div className="lg:sticky lg:top-24 space-y-5">

              {/* Plan card */}
              <div className="bg-ink rounded-2xl p-6 text-white">

                <p className="text-white/60 text-xs uppercase tracking-widest mb-2">
                  Ready to explore?
                </p>

                <h2 className="font-display text-2xl mb-3">
                  Plan your {destination.name} trip
                </h2>

                <p className="text-white/70 text-sm leading-6 mb-6">
                  Explore tours, hotels and experiences available for your
                  journey.
                </p>

                <div className="space-y-3">

                  <Link
                    to={`/tours?destination_id=${destination.id}`}
                    className="w-full bg-gold text-ink rounded-xl px-4 py-3 flex items-center justify-center gap-2 font-semibold hover:opacity-90 transition"
                  >
                    Explore tours
                    <ArrowRight size={17} />
                  </Link>

                  <Link
                    to="/hotels"
                    className="w-full bg-white/10 text-white rounded-xl px-4 py-3 flex items-center justify-center gap-2 font-semibold hover:bg-white/15 transition"
                  >
                    Find hotels
                    <Hotel size={17} />
                  </Link>

                </div>

              </div>

              {/* Location */}
              {(destination.latitude && destination.longitude) && (
                <div className="bg-white rounded-2xl border border-ink/10 p-6">

                  <div className="flex items-center gap-3 mb-4">

                    <div className="w-10 h-10 rounded-full bg-gold/15 flex items-center justify-center">
                      <Navigation
                        size={18}
                        className="text-gold-dark"
                      />
                    </div>

                    <div>
                      <p className="font-semibold text-charcoal">
                        Location
                      </p>

                      <p className="text-xs text-slate">
                        {destination.latitude}, {destination.longitude}
                      </p>
                    </div>

                  </div>

                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${destination.latitude},${destination.longitude}`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full btn-outline flex items-center justify-center gap-2"
                  >
                    Open in Maps
                    <ArrowRight size={16} />
                  </a>

                </div>
              )}

            </div>
          </aside>

        </div>
      </main>
    </div>
  )
}


/* ===============================================================
   SMALL COMPONENTS
================================================================ */

function InfoBox({ icon, label, value }) {
  return (
    <div className="px-4 sm:px-6 py-5 flex items-start gap-3">

      <div className="text-gold-dark shrink-0 mt-0.5">
        {icon}
      </div>

      <div className="min-w-0">

        <p className="text-[11px] uppercase tracking-wider text-slate mb-1">
          {label}
        </p>

        <p className="text-sm font-semibold text-charcoal break-words">
          {value}
        </p>

      </div>

    </div>
  )
}


function GuideItem({ icon, title, text }) {
  return (
    <div className="flex gap-3 mb-5 last:mb-0">

      <div className="text-gold-dark shrink-0 mt-1">
        {icon}
      </div>

      <div>
        <h4 className="font-semibold text-sm text-charcoal mb-1">
          {title}
        </h4>

        <p className="text-sm text-charcoal/75 leading-6 whitespace-pre-line">
          {text}
        </p>
      </div>

    </div>
  )
}


function SectionHeader({ title, link, linkText }) {
  return (
    <div className="flex items-center justify-between gap-4 mb-6">

      <h2 className="font-display text-3xl text-ink">
        {title}
      </h2>

      {link && (
        <Link
          to={link}
          className="text-sm font-semibold text-gold-dark hover:underline shrink-0"
        >
          {linkText}
        </Link>
      )}

    </div>
  )
}
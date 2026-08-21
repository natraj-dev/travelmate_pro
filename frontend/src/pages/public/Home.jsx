import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Search, MapPin, Star, ArrowRight, Sparkles, ShieldCheck, Headset } from 'lucide-react'
import { destinationApi } from '../../api/destinations'
import { hotelApi } from '../../api/hotels'
import { tourApi } from '../../api/tours'
import RatingStars from '../../components/common/RatingStars'
import Loader from '../../components/common/Loader'
import { formatCurrency } from '../../utils/format'

export default function Home() {
  const navigate = useNavigate()
  const [destinations, setDestinations] = useState([])
  const [hotels, setHotels] = useState([])
  const [tours, setTours] = useState([])
  const [loading, setLoading] = useState(true)
  const [city, setCity] = useState('')

  useEffect(() => {
    Promise.all([
      destinationApi.popular(6).catch(() => []),
      hotelApi.search({ page_size: 4 }).catch(() => ({ items: [] })),
      tourApi.search({ page_size: 4 }).catch(() => ({ items: [] })),
    ]).then(([d, h, t]) => {
      setDestinations(d)
      setHotels(h.items || [])
      setTours(t.items || [])
      setLoading(false)
    })
  }, [])

  const handleSearch = (e) => {
    e.preventDefault()
    navigate(`/hotels${city ? `?city=${encodeURIComponent(city)}` : ''}`)
  }

  return (
    <div>
      {/* Hero */}
      <section className="relative bg-ink-gradient overflow-hidden">
        <div className="absolute inset-0 opacity-[0.08]" style={{
          backgroundImage: 'radial-gradient(circle at 15% 25%, white 1.5px, transparent 1.5px), radial-gradient(circle at 85% 60%, white 1.5px, transparent 1.5px)',
          backgroundSize: '56px 56px',
        }} />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-28 text-center">
          <span className="inline-flex items-center gap-1.5 bg-white/10 text-gold-light text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
            <Sparkles size={13} /> AI-powered trip planning included
          </span>
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl text-white leading-[1.1] max-w-3xl mx-auto text-balance">
            Plan less. Travel more.
          </h1>
          <p className="text-white/70 text-lg mt-5 max-w-xl mx-auto text-balance">
            Discover destinations, book hotels and tours, and let TravelMate Pro's AI assistant handle the itinerary.
          </p>

          <form onSubmit={handleSearch} className="mt-10 max-w-xl mx-auto bg-white rounded-2xl shadow-lifted p-2 flex items-center gap-2">
            <MapPin size={18} className="text-slate ml-3" />
            <input
              className="flex-1 py-3 text-sm outline-none text-charcoal placeholder:text-slate/70"
              placeholder="Where do you want to go?"
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
            <button type="submit" className="btn-gold shrink-0">
              <Search size={16} /> Search
            </button>
          </form>
        </div>
      </section>

      {loading ? (
        <Loader full />
      ) : (
        <>
          {/* Popular destinations */}
          {destinations.length > 0 && (
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
              <div className="flex items-end justify-between mb-8">
                <div>
                  <h2 className="font-display text-2xl sm:text-3xl text-ink">Popular destinations</h2>
                  <p className="text-slate text-sm mt-1">Where travelers are heading this season</p>
                </div>
                <Link to="/destinations" className="hidden sm:flex items-center gap-1 text-sm font-semibold text-ink hover:text-gold-dark">
                  View all <ArrowRight size={15} />
                </Link>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
                {destinations.map((d) => (
                  <Link
                    key={d.id}
                    to={`/destinations/${d.id}`}
                    className="card card-hover group overflow-hidden"
                  >
                    <div className="h-40 bg-ink/5 relative overflow-hidden">
                      {d.cover_image_url ? (
                        <img src={d.cover_image_url} alt={d.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-ink/20">
                          <MapPin size={32} />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-ink/60 to-transparent" />
                      <div className="absolute bottom-3 left-4 text-white">
                        <p className="font-display font-semibold">{d.name}</p>
                        <p className="text-xs text-white/75">{d.country}</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Featured hotels */}
          {hotels.length > 0 && (
            <section className="bg-white border-y border-ink/5 py-20">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-end justify-between mb-8">
                  <div>
                    <h2 className="font-display text-2xl sm:text-3xl text-ink">Featured stays</h2>
                    <p className="text-slate text-sm mt-1">Hand-picked hotels loved by our travelers</p>
                  </div>
                  <Link to="/hotels" className="hidden sm:flex items-center gap-1 text-sm font-semibold text-ink hover:text-gold-dark">
                    Browse hotels <ArrowRight size={15} />
                  </Link>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                  {hotels.map((h) => (
                    <Link key={h.id} to={`/hotels/${h.id}`} className="card card-hover overflow-hidden">
                      <div className="h-36 bg-sand flex items-center justify-center overflow-hidden">
                        {h.cover_image_url ? (
                          <img src={h.cover_image_url} alt={h.name} className="w-full h-full object-cover" />
                        ) : (
                          <Star className="text-ink/15" size={28} />
                        )}
                      </div>
                      <div className="p-4">
                        <p className="font-semibold text-sm text-charcoal truncate">{h.name}</p>
                        <p className="text-xs text-slate mb-2">{h.city}, {h.country}</p>
                        <RatingStars rating={h.rating_avg} reviewCount={h.review_count} size={12} />
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Featured tours */}
          {tours.length > 0 && (
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
              <div className="flex items-end justify-between mb-8">
                <div>
                  <h2 className="font-display text-2xl sm:text-3xl text-ink">Popular tours</h2>
                  <p className="text-slate text-sm mt-1">Curated multi-day experiences</p>
                </div>
                <Link to="/tours" className="hidden sm:flex items-center gap-1 text-sm font-semibold text-ink hover:text-gold-dark">
                  Browse tours <ArrowRight size={15} />
                </Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {tours.map((t) => (
                  <Link key={t.id} to={`/tours/${t.id}`} className="card card-hover overflow-hidden">
                    <div className="h-36 bg-sand flex items-center justify-center overflow-hidden">
                      {t.cover_image_url ? (
                        <img src={t.cover_image_url} alt={t.title} className="w-full h-full object-cover" />
                      ) : (
                        <MapPin className="text-ink/15" size={28} />
                      )}
                    </div>
                    <div className="p-4">
                      <p className="font-semibold text-sm text-charcoal truncate">{t.title}</p>
                      <p className="text-xs text-slate mb-2">{t.duration_days} days · {t.duration_nights} nights</p>
                      <div className="flex items-center justify-between">
                        <RatingStars rating={t.rating_avg} size={12} showValue={false} />
                        <span className="font-mono text-sm font-semibold text-ink">{formatCurrency(t.price_per_person)}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </>
      )}

      {/* Trust strip */}
      <section className="bg-ink text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
          <div>
            <Sparkles className="mx-auto text-gold-light mb-3" size={26} />
            <p className="font-display text-lg mb-1">AI Itinerary Planning</p>
            <p className="text-sm text-white/60">Personalized day-by-day plans in seconds</p>
          </div>
          <div>
            <ShieldCheck className="mx-auto text-gold-light mb-3" size={26} />
            <p className="font-display text-lg mb-1">Secure Payments</p>
            <p className="text-sm text-white/60">Stripe-protected checkout, every time</p>
          </div>
          <div>
            <Headset className="mx-auto text-gold-light mb-3" size={26} />
            <p className="font-display text-lg mb-1">Real Support</p>
            <p className="text-sm text-white/60">Ticketed support and in-app messaging</p>
          </div>
        </div>
      </section>
    </div>
  )
}

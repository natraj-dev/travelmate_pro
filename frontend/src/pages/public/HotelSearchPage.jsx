import { useEffect, useState, useCallback } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { MapPin, Star, SlidersHorizontal, Search } from 'lucide-react'
import { hotelApi } from '../../api/hotels'
import RatingStars from '../../components/common/RatingStars'
import Loader from '../../components/common/Loader'
import EmptyState from '../../components/common/EmptyState'
import Pagination from '../../components/common/Pagination'

export default function HotelSearchPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [filters, setFilters] = useState({
    city: searchParams.get('city') || '',
    min_price: '', max_price: '', min_rating: '', star_rating: '',
  })
  const [result, setResult] = useState({ items: [], total: 0, page: 1, total_pages: 0 })
  const [loading, setLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(false)

  const runSearch = useCallback((page = 1) => {
    setLoading(true)
    const params = { page, page_size: 12 }
    Object.entries(filters).forEach(([k, v]) => { if (v) params[k] = v })
    hotelApi.search(params)
      .then(setResult)
      .finally(() => setLoading(false))
  }, [filters])

  useEffect(() => { runSearch(1) }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleFilterSubmit = (e) => {
    e.preventDefault()
    if (filters.city) setSearchParams({ city: filters.city }); else setSearchParams({})
    runSearch(1)
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="font-display text-3xl text-ink mb-2">Find your stay</h1>
        <p className="text-slate text-sm">Search verified hotels by city, price, and rating.</p>
      </div>

      <form onSubmit={handleFilterSubmit} className="card p-4 mb-6 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <MapPin size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate" />
          <input
            className="input pl-10"
            placeholder="City (e.g. Bali, Kyoto)"
            value={filters.city}
            onChange={(e) => setFilters({ ...filters, city: e.target.value })}
          />
        </div>
        <button type="button" onClick={() => setShowFilters((v) => !v)} className="btn-outline">
          <SlidersHorizontal size={16} /> Filters
        </button>
        <button type="submit" className="btn-gold">
          <Search size={16} /> Search
        </button>
      </form>

      {showFilters && (
        <div className="card p-4 mb-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <label className="field-label">Min price/night</label>
            <input type="number" className="input" value={filters.min_price} onChange={(e) => setFilters({ ...filters, min_price: e.target.value })} />
          </div>
          <div>
            <label className="field-label">Max price/night</label>
            <input type="number" className="input" value={filters.max_price} onChange={(e) => setFilters({ ...filters, max_price: e.target.value })} />
          </div>
          <div>
            <label className="field-label">Min rating</label>
            <select className="select" value={filters.min_rating} onChange={(e) => setFilters({ ...filters, min_rating: e.target.value })}>
              <option value="">Any</option>
              {[3, 3.5, 4, 4.5].map((r) => <option key={r} value={r}>{r}+</option>)}
            </select>
          </div>
          <div>
            <label className="field-label">Star rating</label>
            <select className="select" value={filters.star_rating} onChange={(e) => setFilters({ ...filters, star_rating: e.target.value })}>
              <option value="">Any</option>
              {[3, 4, 5].map((r) => <option key={r} value={r}>{r} star</option>)}
            </select>
          </div>
          <div className="col-span-2 sm:col-span-4">
            <button onClick={() => runSearch(1)} type="button" className="btn-primary btn-sm">Apply filters</button>
          </div>
        </div>
      )}

      {loading ? (
        <Loader />
      ) : result.items.length === 0 ? (
        <EmptyState icon={Star} title="No hotels found" description="Try a different city or loosen your filters." />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {result.items.map((h) => (
              <Link key={h.id} to={`/hotels/${h.id}`} className="card card-hover overflow-hidden">
                <div className="h-44 bg-sand flex items-center justify-center overflow-hidden">
                  {h.cover_image_url ? (
                    <img src={h.cover_image_url} alt={h.name} className="w-full h-full object-cover" />
                  ) : (
                    <Star className="text-ink/15" size={32} />
                  )}
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold text-charcoal">{h.name}</p>
                    <span className="badge-neutral shrink-0">{h.star_rating}★</span>
                  </div>
                  <p className="text-xs text-slate mb-2">{h.city}, {h.country}</p>
                  <RatingStars rating={h.rating_avg} reviewCount={h.review_count} size={13} />
                </div>
              </Link>
            ))}
          </div>
          <Pagination page={result.page} totalPages={result.total_pages} onChange={runSearch} />
        </>
      )}
    </div>
  )
}

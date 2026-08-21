import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { MapPinned, SlidersHorizontal, Search } from 'lucide-react'
import { tourApi } from '../../api/tours'
import RatingStars from '../../components/common/RatingStars'
import Loader from '../../components/common/Loader'
import EmptyState from '../../components/common/EmptyState'
import Pagination from '../../components/common/Pagination'
import { formatCurrency } from '../../utils/format'

export default function TourSearchPage() {
  const [filters, setFilters] = useState({ activity_type: '', min_price: '', max_price: '', min_duration: '', max_duration: '' })
  const [result, setResult] = useState({ items: [], total: 0, page: 1, total_pages: 0 })
  const [loading, setLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(false)

  const runSearch = useCallback((page = 1) => {
    setLoading(true)
    const params = { page, page_size: 12 }
    Object.entries(filters).forEach(([k, v]) => { if (v) params[k] = v })
    tourApi.search(params).then(setResult).finally(() => setLoading(false))
  }, [filters])

  useEffect(() => { runSearch(1) }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="font-display text-3xl text-ink mb-2">Discover tours</h1>
        <p className="text-slate text-sm">Multi-day, guided experiences across the world.</p>
      </div>

      <div className="card p-4 mb-6 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <MapPinned size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate" />
          <input
            className="input pl-10"
            placeholder="Activity type (e.g. Adventure, Cultural)"
            value={filters.activity_type}
            onChange={(e) => setFilters({ ...filters, activity_type: e.target.value })}
          />
        </div>
        <button type="button" onClick={() => setShowFilters((v) => !v)} className="btn-outline">
          <SlidersHorizontal size={16} /> Filters
        </button>
        <button type="button" onClick={() => runSearch(1)} className="btn-gold">
          <Search size={16} /> Search
        </button>
      </div>

      {showFilters && (
        <div className="card p-4 mb-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <label className="field-label">Min price</label>
            <input type="number" className="input" value={filters.min_price} onChange={(e) => setFilters({ ...filters, min_price: e.target.value })} />
          </div>
          <div>
            <label className="field-label">Max price</label>
            <input type="number" className="input" value={filters.max_price} onChange={(e) => setFilters({ ...filters, max_price: e.target.value })} />
          </div>
          <div>
            <label className="field-label">Min days</label>
            <input type="number" className="input" value={filters.min_duration} onChange={(e) => setFilters({ ...filters, min_duration: e.target.value })} />
          </div>
          <div>
            <label className="field-label">Max days</label>
            <input type="number" className="input" value={filters.max_duration} onChange={(e) => setFilters({ ...filters, max_duration: e.target.value })} />
          </div>
          <div className="col-span-2 sm:col-span-4">
            <button onClick={() => runSearch(1)} type="button" className="btn-primary btn-sm">Apply filters</button>
          </div>
        </div>
      )}

      {loading ? (
        <Loader />
      ) : result.items.length === 0 ? (
        <EmptyState icon={MapPinned} title="No tours found" description="Try different filters." />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {result.items.map((t) => (
              <Link key={t.id} to={`/tours/${t.id}`} className="card card-hover overflow-hidden">
                <div className="h-44 bg-sand flex items-center justify-center overflow-hidden">
                  {t.cover_image_url ? (
                    <img src={t.cover_image_url} alt={t.title} className="w-full h-full object-cover" />
                  ) : (
                    <MapPinned className="text-ink/15" size={32} />
                  )}
                </div>
                <div className="p-4">
                  <p className="font-semibold text-charcoal mb-1">{t.title}</p>
                  <p className="text-xs text-slate mb-2">{t.duration_days} days · {t.duration_nights} nights {t.activity_type ? `· ${t.activity_type}` : ''}</p>
                  <div className="flex items-center justify-between">
                    <RatingStars rating={t.rating_avg} reviewCount={t.review_count} size={13} />
                    <span className="font-mono font-semibold text-ink text-sm">{formatCurrency(t.price_per_person)}</span>
                  </div>
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

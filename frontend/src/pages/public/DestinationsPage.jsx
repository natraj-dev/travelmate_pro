import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { MapPin } from 'lucide-react'
import { destinationApi } from '../../api/destinations'
import Loader from '../../components/common/Loader'
import Pagination from '../../components/common/Pagination'

export default function DestinationsPage() {
  const [categories, setCategories] = useState([])
  const [categoryId, setCategoryId] = useState('')
  const [result, setResult] = useState({ items: [], page: 1, total_pages: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    destinationApi.categories().then(setCategories)
  }, [])

  useEffect(() => {
    setLoading(true)
    const params = { page_size: 15 }
    if (categoryId) params.category_id = categoryId
    destinationApi.list(params).then(setResult).finally(() => setLoading(false))
  }, [categoryId])

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="font-display text-3xl text-ink mb-2">Explore destinations</h1>
      <p className="text-slate text-sm mb-8">Browse by category, or pick a place that speaks to you.</p>

      <div className="flex flex-wrap gap-2 mb-8">
        <button
          onClick={() => setCategoryId('')}
          className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${!categoryId ? 'bg-ink text-white' : 'bg-white border border-ink/10 text-charcoal'}`}
        >
          All
        </button>
        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => setCategoryId(c.id)}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${categoryId === c.id ? 'bg-ink text-white' : 'bg-white border border-ink/10 text-charcoal'}`}
          >
            {c.name}
          </button>
        ))}
      </div>

      {loading ? (
        <Loader />
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-5">
            {result.items.map((d) => (
              <Link key={d.id} to={`/destinations/${d.id}`} className="card card-hover overflow-hidden group">
                <div className="h-32 bg-ink/5 relative overflow-hidden">
                  {d.cover_image_url ? (
                    <img src={d.cover_image_url} alt={d.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-ink/20"><MapPin size={24} /></div>
                  )}
                </div>
                <div className="p-3">
                  <p className="font-semibold text-sm text-charcoal truncate">{d.name}</p>
                  <p className="text-xs text-slate">{d.country}</p>
                </div>
              </Link>
            ))}
          </div>
          <Pagination page={result.page} totalPages={result.total_pages} onChange={(p) => {
            setLoading(true)
            const params = { page_size: 15, page: p }
            if (categoryId) params.category_id = categoryId
            destinationApi.list(params).then(setResult).finally(() => setLoading(false))
          }} />
        </>
      )}
    </div>
  )
}

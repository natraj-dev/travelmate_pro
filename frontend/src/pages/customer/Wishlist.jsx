import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Heart, Trash2, Hotel, MapPinned, Compass } from 'lucide-react'
import toast from 'react-hot-toast'
import { wishlistApi } from '../../api/bookings'
import { hotelApi } from '../../api/hotels'
import { tourApi } from '../../api/tours'
import { destinationApi } from '../../api/destinations'
import PageHeader from '../../components/common/PageHeader'
import Loader from '../../components/common/Loader'
import EmptyState from '../../components/common/EmptyState'
import { apiErrorMessage } from '../../api/axiosClient'

const ICONS = { HOTEL: Hotel, TOUR: MapPinned, DESTINATION: Compass }

export default function Wishlist() {
  const [items, setItems] = useState([])
  const [details, setDetails] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    wishlistApi.list().then(async (list) => {
      setItems(list)
      const map = {}
      await Promise.all(list.map(async (item) => {
        try {
          if (item.item_type === 'HOTEL') map[item.id] = await hotelApi.get(item.item_id)
          if (item.item_type === 'TOUR') map[item.id] = await tourApi.get(item.item_id)
          if (item.item_type === 'DESTINATION') map[item.id] = await destinationApi.get(item.item_id)
        } catch { /* item may have been removed upstream */ }
      }))
      setDetails(map)
      setLoading(false)
    })
  }, [])

  const handleRemove = async (id) => {
    try {
      await wishlistApi.remove(id)
      setItems((prev) => prev.filter((i) => i.id !== id))
      toast.success('Removed from wishlist')
    } catch (err) {
      toast.error(apiErrorMessage(err))
    }
  }

  const linkFor = (item) => {
    if (item.item_type === 'HOTEL') return `/hotels/${item.item_id}`
    if (item.item_type === 'TOUR') return `/tours/${item.item_id}`
    return `/destinations/${item.item_id}`
  }

  const nameFor = (item) => {
    const d = details[item.id]
    if (!d) return 'Loading…'
    return d.name || d.title
  }

  if (loading) return <Loader full />

  return (
    <div>
      <PageHeader title="Wishlist" subtitle="Hotels, tours, and destinations you've saved for later." />
      {items.length === 0 ? (
        <EmptyState icon={Heart} title="Your wishlist is empty" description="Save hotels and tours you love to find them here later." />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item) => {
            const Icon = ICONS[item.item_type] || Heart
            return (
              <div key={item.id} className="card p-4 flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-ink/5 flex items-center justify-center shrink-0">
                  <Icon size={18} className="text-ink" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="badge-neutral mb-1 inline-block">{item.item_type}</span>
                  <Link to={linkFor(item)} className="block font-semibold text-sm text-charcoal truncate hover:text-ink">
                    {nameFor(item)}
                  </Link>
                </div>
                <button onClick={() => handleRemove(item.id)} className="text-slate hover:text-danger transition-colors shrink-0">
                  <Trash2 size={16} />
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

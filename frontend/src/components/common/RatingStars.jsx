import { Star } from 'lucide-react'

export default function RatingStars({ rating = 0, size = 14, showValue = true, reviewCount }) {
  return (
    <div className="flex items-center gap-1">
      <div className="flex">
        {[1, 2, 3, 4, 5].map((i) => (
          <Star
            key={i}
            size={size}
            className={i <= Math.round(rating) ? 'fill-gold text-gold' : 'fill-ink/10 text-ink/10'}
          />
        ))}
      </div>
      {showValue && <span className="text-xs font-semibold text-charcoal">{rating?.toFixed?.(1) ?? '0.0'}</span>}
      {typeof reviewCount === 'number' && <span className="text-xs text-slate">({reviewCount})</span>}
    </div>
  )
}

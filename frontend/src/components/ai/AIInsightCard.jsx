const INSIGHT_TYPES = [
  'REVENUE_FORECAST',
  'DEMAND_PREDICTION',
  'RETENTION',
  'PACKAGE_PERFORMANCE',
]

export default function AIInsightActions({
  generating,
  onGenerate,
}) {
  return (
    <div className="flex gap-2 flex-wrap">
      {INSIGHT_TYPES.map((type) => (
        <button
          key={type}
          type="button"
          onClick={() => onGenerate(type)}
          disabled={generating === type}
          className="btn-outline btn-sm"
        >
          {generating === type
            ? 'Generating…'
            : type.replace(/_/g, ' ')}
        </button>
      ))}
    </div>
  )
}
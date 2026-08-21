export default function AIInsightActions({ insightTypes, generating, onGenerate }) {
  return (
    <div className="flex gap-2 flex-wrap">
      {insightTypes.map((type) => (
        <button
          key={type}
          type="button"
          onClick={() => onGenerate(type)}
          disabled={generating === type}
          className="btn-outline btn-sm"
        >
          {generating === type ? 'Generating...' : type.replace(/_/g, ' ')}
        </button>
      ))}
    </div>
  )
}

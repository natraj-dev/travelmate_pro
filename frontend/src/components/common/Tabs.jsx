export default function Tabs({ tabs, active, onChange }) {
  return (
    <div className="flex items-center gap-1 border-b border-ink/8 mb-6 overflow-x-auto scrollbar-thin">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          onClick={() => onChange(tab.value)}
          className={`px-4 py-2.5 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors ${
            active === tab.value
              ? 'border-gold text-ink'
              : 'border-transparent text-slate hover:text-ink'
          }`}
        >
          {tab.label}
          {typeof tab.count === 'number' && (
            <span className="ml-1.5 text-xs text-slate">({tab.count})</span>
          )}
        </button>
      ))}
    </div>
  )
}

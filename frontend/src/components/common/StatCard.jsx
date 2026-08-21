export default function StatCard({ label, value, icon: Icon, trend, accent = 'ink' }) {
  const accentClasses = {
    ink: 'bg-ink/8 text-ink',
    gold: 'bg-gold/15 text-gold-dark',
    success: 'bg-success/10 text-success',
    info: 'bg-info/10 text-info',
  }
  return (
    <div className="card p-5 flex items-start justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate mb-2">{label}</p>
        <p className="font-display text-2xl text-ink">{value}</p>
        {trend && <p className="text-xs text-success mt-1">{trend}</p>}
      </div>
      {Icon && (
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${accentClasses[accent]}`}>
          <Icon size={20} />
        </div>
      )}
    </div>
  )
}

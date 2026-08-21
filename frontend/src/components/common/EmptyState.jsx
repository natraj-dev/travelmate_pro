export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6">
      {Icon && (
        <div className="w-14 h-14 rounded-2xl bg-ink/5 flex items-center justify-center mb-4">
          <Icon className="text-ink/40" size={26} />
        </div>
      )}
      <h3 className="font-display text-lg text-ink mb-1">{title}</h3>
      {description && <p className="text-sm text-slate max-w-sm mb-4">{description}</p>}
      {action}
    </div>
  )
}

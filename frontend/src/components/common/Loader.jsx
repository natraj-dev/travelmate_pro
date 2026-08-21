import { Loader2 } from 'lucide-react'

export default function Loader({ label = 'Loading…', full = false }) {
  return (
    <div className={`flex flex-col items-center justify-center gap-3 text-slate ${full ? 'min-h-[50vh]' : 'py-16'}`}>
      <Loader2 className="animate-spin text-gold" size={28} />
      <p className="text-sm">{label}</p>
    </div>
  )
}

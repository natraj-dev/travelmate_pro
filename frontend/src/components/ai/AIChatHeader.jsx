import { Sparkles } from 'lucide-react'

export default function AIChatHeader() {
  return (
    <div className="px-6 py-4 border-b border-ink/8 flex items-center gap-2.5">
      <div className="w-9 h-9 rounded-xl bg-gold-gradient flex items-center justify-center">
        <Sparkles size={17} className="text-ink" />
      </div>

      <div>
        <p className="font-semibold text-sm text-charcoal">
          TravelMate AI Assistant
        </p>

        <p className="text-xs text-slate">
          Ask about destinations, hotels, tours & more
        </p>
      </div>
    </div>
  )
}
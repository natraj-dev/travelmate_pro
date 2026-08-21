export default function AITypingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="bg-sand text-charcoal rounded-2xl rounded-bl-sm px-4 py-2.5 text-sm flex gap-1">
        <span className="w-1.5 h-1.5 rounded-full bg-ink/40 animate-bounce [animation-delay:-0.3s]" />
        <span className="w-1.5 h-1.5 rounded-full bg-ink/40 animate-bounce [animation-delay:-0.15s]" />
        <span className="w-1.5 h-1.5 rounded-full bg-ink/40 animate-bounce" />
      </div>
    </div>
  )
}
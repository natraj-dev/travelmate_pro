import { Send } from 'lucide-react'

export default function AIChatInput({
  input,
  setInput,
  onSubmit,
  sending,
}) {
  return (
    <form
      onSubmit={onSubmit}
      className="p-4 border-t border-ink/8 flex gap-2"
    >
      <input
        className="input flex-1"
        placeholder="Ask about your next trip…"
        value={input}
        onChange={(event) => setInput(event.target.value)}
        disabled={sending}
        autoComplete="off"
      />

      <button
        type="submit"
        disabled={sending || !input.trim()}
        className="btn-gold shrink-0"
        aria-label="Send message"
      >
        <Send size={16} />
      </button>
    </form>
  )
}
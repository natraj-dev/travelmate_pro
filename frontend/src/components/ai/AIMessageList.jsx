import { Sparkles } from 'lucide-react'
import AIMessage from './AIMessage'
import AITypingIndicator from './AITypingIndicator'

export default function AIMessageList({
  messages,
  sending,
  scrollRef,
}) {
  return (
    <div
      ref={scrollRef}
      className="flex-1 overflow-y-auto scrollbar-thin px-6 py-6 space-y-4"
    >
      {messages.length === 0 && !sending && (
        <div className="h-full flex flex-col items-center justify-center text-center text-slate">
          <Sparkles size={32} className="text-ink/15 mb-3" />

          <p className="text-sm max-w-xs">
            Ask me anything about your next trip — destinations,
            hotel picks, or booking help.
          </p>
        </div>
      )}

      {messages.map((message, index) => (
        <AIMessage
          key={message.id || `${message.role}-${index}`}
          message={message}
        />
      ))}

      {sending && <AITypingIndicator />}
    </div>
  )
}
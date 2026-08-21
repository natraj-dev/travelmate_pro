export default function AIMessage({ message }) {
  const isUser = message.role === 'USER'

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap ${isUser
            ? 'bg-ink text-white rounded-br-sm'
            : 'bg-sand text-charcoal rounded-bl-sm'
          }`}
      >
        {message.content}
      </div>
    </div>
  )
}
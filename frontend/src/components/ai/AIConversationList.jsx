import { MessageSquare, Plus, Trash2 } from 'lucide-react'

export default function AIConversationList({
  conversations,
  activeId,
  onSelect,
  onNewChat,
  onDelete,
}) {
  return (
    <div className="w-64 shrink-0 hidden md:flex flex-col card p-3">
      <button
        type="button"
        onClick={onNewChat}
        className="btn-outline w-full mb-3"
      >
        <Plus size={15} />
        New chat
      </button>

      <div className="flex-1 overflow-y-auto scrollbar-thin space-y-1">
        {conversations.map((conversation) => (
          <button
            key={conversation.id}
            type="button"
            onClick={() => onSelect(conversation.id)}
            className={`w-full text-left px-3 py-2.5 rounded-xl text-sm flex items-center justify-between gap-2 group transition-colors ${activeId === conversation.id
                ? 'bg-ink text-white'
                : 'hover:bg-sand text-charcoal'
              }`}
          >
            <span className="truncate flex items-center gap-2 min-w-0">
              <MessageSquare size={14} className="shrink-0" />

              <span className="truncate">
                {conversation.title || 'New conversation'}
              </span>
            </span>

            <Trash2
              size={13}
              onClick={(event) => onDelete(conversation.id, event)}
              className={`shrink-0 opacity-0 group-hover:opacity-100 cursor-pointer ${activeId === conversation.id
                  ? 'text-white/70'
                  : 'text-slate'
                }`}
            />
          </button>
        ))}

        {conversations.length === 0 && (
          <p className="text-xs text-slate text-center py-6">
            No conversations yet
          </p>
        )}
      </div>
    </div>
  )
}
import { useEffect, useRef, useState } from 'react'
import {
  Send,
  MessageSquare,
  Plus,
  Search,
  X,
  UserRound,
} from 'lucide-react'
import toast from 'react-hot-toast'

import { messageApi } from '../../api/communication'
import { useAuth } from '../../context/AuthContext'
import Avatar from '../../components/common/Avatar'
import Loader from '../../components/common/Loader'
import { timeAgo } from '../../utils/format'
import { apiErrorMessage } from '../../api/axiosClient'


export default function Messages() {
  const { user } = useAuth()

  const [conversations, setConversations] = useState([])
  const [contacts, setContacts] = useState([])

  const [activeUserId, setActiveUserId] = useState(null)
  const [thread, setThread] = useState([])

  const [input, setInput] = useState('')

  const [loading, setLoading] = useState(true)
  const [loadingThread, setLoadingThread] = useState(false)
  const [sending, setSending] = useState(false)

  const [showNewMessage, setShowNewMessage] = useState(false)
  const [contactSearch, setContactSearch] = useState('')

  const scrollRef = useRef(null)


  // ============================================================
  // LOAD CONVERSATIONS
  // ============================================================

  const loadConversations = async () => {
    try {
      const list = await messageApi.conversations()

      setConversations(list)

      /*
       * If there is no currently selected user,
       * automatically open the first existing conversation.
       */
      if (!activeUserId && list.length > 0) {
        setActiveUserId(list[0].other_user_id)
      }
    } catch (err) {
      toast.error(
        apiErrorMessage(err, 'Could not load conversations')
      )
    }
  }


  // ============================================================
  // LOAD AVAILABLE CONTACTS
  // ============================================================

  const loadContacts = async () => {
    try {
      const list = await messageApi.contacts()
      setContacts(list)
    } catch (err) {
      toast.error(
        apiErrorMessage(err, 'Could not load available contacts')
      )
    }
  }


  // ============================================================
  // INITIAL LOAD
  // ============================================================

  useEffect(() => {
    const load = async () => {
      try {
        await Promise.all([
          loadConversations(),
          loadContacts(),
        ])
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])


  // ============================================================
  // LOAD THREAD
  // ============================================================

  useEffect(() => {
    if (!activeUserId) {
      setThread([])
      return
    }

    const loadThread = async () => {
      setLoadingThread(true)

      try {
        const messages = await messageApi.thread(activeUserId)
        setThread(messages)
      } catch (err) {
        toast.error(
          apiErrorMessage(err, 'Could not load conversation')
        )
      } finally {
        setLoadingThread(false)
      }
    }

    loadThread()
  }, [activeUserId])


  // ============================================================
  // AUTO SCROLL
  // ============================================================

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: 'smooth',
    })
  }, [thread])


  // ============================================================
  // SELECT CONTACT
  // ============================================================

  const handleSelectContact = (contact) => {
    setActiveUserId(contact.id)
    setShowNewMessage(false)
    setContactSearch('')
  }


  // ============================================================
  // SEND MESSAGE
  // ============================================================

  const handleSend = async (e) => {
    e.preventDefault()

    if (!input.trim() || !activeUserId || sending) {
      return
    }

    const messageText = input.trim()

    setSending(true)

    try {
      const msg = await messageApi.send({
        recipient_id: activeUserId,
        content: messageText,
      })

      setThread((prev) => [...prev, msg])
      setInput('')

      // Refresh conversation list so the new conversation appears.
      await loadConversations()

      // Refresh contacts as well.
      await loadContacts()
    } catch (err) {
      toast.error(
        apiErrorMessage(err, 'Could not send message')
      )
    } finally {
      setSending(false)
    }
  }


  // ============================================================
  // FIND ACTIVE USER
  // ============================================================

  const activeConversation = conversations.find(
    (c) => c.other_user_id === activeUserId
  )

  const activeContact = contacts.find(
    (c) => c.id === activeUserId
  )


  /*
   * The active person's name can come from either:
   *
   * 1. Existing conversation
   * 2. Contacts list when starting a brand-new conversation
   */
  const activeUserName =
    activeConversation?.other_user_name ||
    activeContact?.name ||
    'User'

  const activeUserRole =
    activeConversation?.other_user_role ||
    activeContact?.role ||
    ''


  // ============================================================
  // FILTER CONTACTS
  // ============================================================

  const filteredContacts = contacts.filter((contact) => {
    const search = contactSearch.toLowerCase().trim()

    if (!search) {
      return true
    }

    return (
      contact.name?.toLowerCase().includes(search) ||
      contact.email?.toLowerCase().includes(search) ||
      contact.role?.toLowerCase().includes(search)
    )
  })


  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {
    return <Loader full />
  }


  // ============================================================
  // UI
  // ============================================================

  return (
    <div className="h-[calc(100vh-160px)] flex gap-5 relative">

      {/* ======================================================
          LEFT SIDEBAR
      ====================================================== */}

      <div className="w-72 shrink-0 card overflow-hidden flex flex-col">

        {/* Header */}

        <div className="px-5 py-4 border-b border-ink/8 flex items-center justify-between gap-2">

          <h3 className="font-display text-lg text-ink">
            Messages
          </h3>

          <button
            type="button"
            onClick={() => {
              setShowNewMessage(true)
              setContactSearch('')
            }}
            className="btn-gold btn-sm"
            title="New message"
          >
            <Plus size={15} />
          </button>

        </div>


        {/* Conversations */}

        <div className="flex-1 overflow-y-auto scrollbar-thin">

          {conversations.length === 0 ? (

            <div className="px-5 py-10 text-center">

              <MessageSquare
                size={30}
                className="mx-auto mb-3 text-ink/15"
              />

              <p className="text-sm text-slate">
                No conversations yet.
              </p>

              <button
                type="button"
                onClick={() => setShowNewMessage(true)}
                className="btn-outline btn-sm mt-4"
              >
                <Plus size={14} />
                Start a conversation
              </button>

            </div>

          ) : (

            conversations.map((conversation) => (

              <button
                key={conversation.other_user_id}
                onClick={() =>
                  setActiveUserId(
                    conversation.other_user_id
                  )
                }
                className={`
                  w-full flex items-center gap-3
                  px-4 py-3 text-left
                  transition-colors
                  ${activeUserId === conversation.other_user_id
                    ? 'bg-sand'
                    : 'hover:bg-sand/60'
                  }
                `}
              >

                <Avatar
                  name={conversation.other_user_name}
                  size={38}
                />

                <div className="flex-1 min-w-0">

                  <div className="flex items-center justify-between gap-2">

                    <p className="text-sm font-semibold text-charcoal truncate">
                      {conversation.other_user_name}
                    </p>

                    {conversation.unread_count > 0 && (
                      <span className="w-2 h-2 rounded-full bg-gold shrink-0" />
                    )}

                  </div>

                  <p className="text-[10px] uppercase tracking-wide text-slate mb-0.5">
                    {conversation.other_user_role
                      ? conversation.other_user_role.replace(
                        /_/g,
                        ' '
                      )
                      : ''}
                  </p>

                  <p className="text-xs text-slate truncate">
                    {conversation.last_message}
                  </p>

                </div>

              </button>

            ))

          )}

        </div>

      </div>


      {/* ======================================================
          RIGHT CHAT PANEL
      ====================================================== */}

      <div className="flex-1 card flex flex-col overflow-hidden">

        {activeUserId ? (

          <>

            {/* Chat header */}

            <div className="px-6 py-4 border-b border-ink/8 flex items-center gap-3">

              <Avatar
                name={activeUserName}
                size={34}
              />

              <div className="min-w-0">

                <p className="font-semibold text-sm text-charcoal truncate">
                  {activeUserName}
                </p>

                {activeUserRole && (
                  <p className="text-[10px] uppercase tracking-wide text-slate">
                    {activeUserRole.replace(/_/g, ' ')}
                  </p>
                )}

              </div>

            </div>


            {/* Messages */}

            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto scrollbar-thin px-6 py-6 space-y-3"
            >

              {loadingThread ? (

                <div className="h-full flex items-center justify-center">
                  <Loader />
                </div>

              ) : thread.length === 0 ? (

                <div className="h-full flex flex-col items-center justify-center text-slate">

                  <MessageSquare
                    size={32}
                    className="text-ink/15 mb-3"
                  />

                  <p className="text-sm">
                    Start your conversation with {activeUserName}.
                  </p>

                </div>

              ) : (

                thread.map((message) => (

                  <div
                    key={message.id}
                    className={`
                      flex
                      ${message.sender_id === user?.id
                        ? 'justify-end'
                        : 'justify-start'
                      }
                    `}
                  >

                    <div
                      className={`
                        max-w-[70%]
                        rounded-2xl
                        px-4 py-2.5
                        text-sm
                        ${message.sender_id === user?.id
                          ? 'bg-ink text-white rounded-br-sm'
                          : 'bg-sand text-charcoal rounded-bl-sm'
                        }
                      `}
                    >

                      {message.content}

                      <p
                        className={`
                          text-[10px]
                          mt-1
                          ${message.sender_id === user?.id
                            ? 'text-white/50'
                            : 'text-slate/60'
                          }
                        `}
                      >
                        {timeAgo(message.created_at)}
                      </p>

                    </div>

                  </div>

                ))

              )}

            </div>


            {/* Message input */}

            <form
              onSubmit={handleSend}
              className="p-4 border-t border-ink/8 flex gap-2"
            >

              <input
                className="input flex-1"
                placeholder={`Message ${activeUserName}…`}
                value={input}
                onChange={(e) =>
                  setInput(e.target.value)
                }
                disabled={sending}
              />

              <button
                type="submit"
                disabled={
                  sending ||
                  !input.trim() ||
                  !activeUserId
                }
                className="btn-gold shrink-0 disabled:opacity-50"
              >

                <Send size={16} />

              </button>

            </form>

          </>

        ) : (

          <div className="flex-1 flex flex-col items-center justify-center text-slate">

            <MessageSquare
              size={32}
              className="text-ink/15 mb-3"
            />

            <p className="text-sm">
              Select a conversation or start a new message
            </p>

            <button
              type="button"
              onClick={() => setShowNewMessage(true)}
              className="btn-gold mt-4"
            >
              <Plus size={15} />
              New Message
            </button>

          </div>

        )}

      </div>


      {/* ======================================================
          NEW MESSAGE MODAL
      ====================================================== */}

      {showNewMessage && (

        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">

          {/* Overlay */}

          <div
            className="absolute inset-0 bg-ink/40"
            onClick={() => setShowNewMessage(false)}
          />

          {/* Modal */}

          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden">

            {/* Modal header */}

            <div className="px-5 py-4 border-b border-ink/8 flex items-center justify-between">

              <div>

                <h3 className="font-display text-lg text-ink">
                  New Message
                </h3>

                <p className="text-xs text-slate mt-0.5">
                  Select someone to message
                </p>

              </div>

              <button
                type="button"
                onClick={() => setShowNewMessage(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-sand"
              >
                <X size={17} />
              </button>

            </div>


            {/* Search */}

            <div className="p-4 border-b border-ink/8">

              <div className="relative">

                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate"
                />

                <input
                  autoFocus
                  className="input pl-9 w-full"
                  placeholder="Search by name, email or role…"
                  value={contactSearch}
                  onChange={(e) =>
                    setContactSearch(e.target.value)
                  }
                />

              </div>

            </div>


            {/* Contacts */}

            <div className="max-h-[400px] overflow-y-auto">

              {filteredContacts.length === 0 ? (

                <div className="px-5 py-10 text-center">

                  <UserRound
                    size={30}
                    className="mx-auto mb-3 text-ink/15"
                  />

                  <p className="text-sm text-slate">
                    No users available.
                  </p>

                  <p className="text-xs text-slate/70 mt-1">
                    There are no users matching your search.
                  </p>

                </div>

              ) : (

                filteredContacts.map((contact) => (

                  <button
                    key={contact.id}
                    type="button"
                    onClick={() =>
                      handleSelectContact(contact)
                    }
                    className="w-full flex items-center gap-3 px-5 py-3 text-left hover:bg-sand/60 transition-colors"
                  >

                    <Avatar
                      name={contact.name}
                      size={40}
                    />

                    <div className="flex-1 min-w-0">

                      <p className="text-sm font-semibold text-charcoal truncate">
                        {contact.name}
                      </p>

                      <p className="text-[10px] uppercase tracking-wide text-slate">
                        {contact.role
                          ? contact.role.replace(
                            /_/g,
                            ' '
                          )
                          : ''}
                      </p>

                      {contact.email && (
                        <p className="text-xs text-slate truncate">
                          {contact.email}
                        </p>
                      )}

                    </div>

                  </button>

                ))

              )}

            </div>

          </div>

        </div>

      )}

    </div>
  )
}
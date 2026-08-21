import { useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'

import { aiChatApi } from '../../api/ai'
import Loader from '../../components/common/Loader'
import { apiErrorMessage } from '../../api/axiosClient'

import AIConversationList from '../../components/ai/AIConversationList'
import AIChatHeader from '../../components/ai/AIChatHeader'
import AIMessageList from '../../components/ai/AIMessageList'
import AIChatInput from '../../components/ai/AIChatInput'

export default function AIAssistant() {
  const [conversations, setConversations] = useState([])
  const [activeId, setActiveId] = useState(null)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)

  const scrollRef = useRef(null)

  const loadConversations = async () => {
    try {
      const list = await aiChatApi.conversations()

      setConversations(Array.isArray(list) ? list : [])
    } catch (error) {
      toast.error(
        apiErrorMessage(
          error,
          'Could not load your AI conversations.'
        )
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadConversations()
  }, [])

  useEffect(() => {
    if (activeId) {
      const conversation = conversations.find(
        (item) => item.id === activeId
      )

      setMessages(conversation?.messages || [])
    } else {
      setMessages([])
    }
  }, [activeId, conversations])

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: 'smooth',
    })
  }, [messages, sending])

  const handleNewChat = () => {
    setActiveId(null)
    setMessages([])
    setInput('')
  }

  const handleSelectConversation = (id) => {
    setActiveId(id)
  }

  const handleSend = async (event) => {
    event.preventDefault()

    const messageText = input.trim()

    if (!messageText || sending) {
      return
    }

    const userMessage = {
      role: 'USER',
      content: messageText,
      id: `temp-${Date.now()}`,
    }

    setMessages((previous) => [
      ...previous,
      userMessage,
    ])

    setInput('')
    setSending(true)

    try {
      const response = await aiChatApi.send({
        conversation_id: activeId || undefined,
        message: messageText,
      })

      const assistantMessage = {
        role: 'ASSISTANT',
        content: response.reply,
        id: `reply-${Date.now()}`,
      }

      setMessages((previous) => [
        ...previous,
        assistantMessage,
      ])

      if (!activeId && response.conversation_id) {
        setActiveId(response.conversation_id)
      }

      await loadConversations()
    } catch (error) {
      toast.error(
        apiErrorMessage(
          error,
          'AI assistant is unavailable — is Ollama running?'
        )
      )

      setMessages((previous) => {
        const lastMessage = previous[previous.length - 1]

        if (
          lastMessage?.id === userMessage.id
        ) {
          return previous.slice(0, -1)
        }

        return previous
      })
    } finally {
      setSending(false)
    }
  }

  const handleDelete = async (id, event) => {
    event.stopPropagation()

    try {
      await aiChatApi.remove(id)

      if (activeId === id) {
        setActiveId(null)
        setMessages([])
      }

      await loadConversations()

      toast.success('Conversation deleted')
    } catch (error) {
      toast.error(
        apiErrorMessage(
          error,
          'Could not delete conversation.'
        )
      )
    }
  }

  if (loading) {
    return <Loader full />
  }

  return (
    <div className="h-[calc(100vh-160px)] flex gap-5">

      <AIConversationList
        conversations={conversations}
        activeId={activeId}
        onSelect={handleSelectConversation}
        onNewChat={handleNewChat}
        onDelete={handleDelete}
      />

      <div className="flex-1 card flex flex-col overflow-hidden">

        <AIChatHeader />

        <AIMessageList
          messages={messages}
          sending={sending}
          scrollRef={scrollRef}
        />

        <AIChatInput
          input={input}
          setInput={setInput}
          onSubmit={handleSend}
          sending={sending}
        />

      </div>
    </div>
  )
}
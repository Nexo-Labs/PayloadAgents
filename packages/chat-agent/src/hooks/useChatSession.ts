import { useState, useEffect } from 'react'

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  sources?: any[]
}

interface UseChatSessionReturn {
  conversationId: string | null
  setConversationId: (id: string | null) => void
  messages: Message[]
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>
  isLoadingSession: boolean
  handleNewConversation: () => Promise<void>
}

/**
 * Hook to manage chat session state and persistence
 */
export function useChatSession(): UseChatSessionReturn {
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoadingSession, setIsLoadingSession] = useState(true)
  
  // Load active session from backend on mount
  useEffect(() => {
    const loadSession = async () => {
      try {
        console.log('[useChatSession] 🔄 Loading active session from backend...')

        // Fetch active session data from API
        const response = await fetch('/api/chat/session?active=true')

        if (response.ok) {
          const sessionData = await response.json()

          console.log('[useChatSession] ✅ Active session found:', sessionData.conversation_id)

          // Restore conversation state
          setConversationId(sessionData.conversation_id)

          // Restore messages
          if (sessionData.messages && sessionData.messages.length > 0) {
            const restoredMessages: Message[] = sessionData.messages.map((msg: any) => ({
              role: msg.role,
              content: msg.content,
              timestamp: new Date(msg.timestamp),
              sources: msg.sources?.map((s: any) => ({
                id: s.id,
                title: s.title,
                slug: s.slug,
                type: s.type || 'article',
                chunkIndex: s.chunk_index || 0,
                relevanceScore: 0,
                content: '',
              })),
            }))

            setMessages(restoredMessages)
            console.log('[useChatSession] ✅ Session restored with', restoredMessages.length, 'messages')
          }
        } else if (response.status === 404) {
          // No active session found, this is normal for new users or after closing a session
          console.log('[useChatSession] ℹ️ No active session found, starting fresh')
        } else {
          console.log('[useChatSession] ⚠️ Error loading session:', await response.text())
        }
      } catch (error) {
        console.error('[useChatSession] ❌ Error loading session:', error)
      } finally {
        setIsLoadingSession(false)
      }
    }

    loadSession()
  }, [])

  // Clear conversation and start new one
  const handleNewConversation = async () => {
    try {
      // If there's an active conversation, close it on the backend
      if (conversationId) {
        console.log('[useChatSession] 🔒 Closing current conversation:', conversationId)

        const response = await fetch(`/api/chat/session?conversationId=${encodeURIComponent(conversationId)}`, {
          method: 'DELETE',
        })

        if (response.ok) {
          console.log('[useChatSession] ✅ Conversation closed successfully')
        } else {
          console.warn('[useChatSession] ⚠️ Failed to close conversation:', await response.text())
        }
      }

      // Clear local state
      setMessages([])
      setConversationId(null)
      console.log('[useChatSession] 🆕 Started new conversation')
    } catch (error) {
      console.error('[useChatSession] ❌ Error closing conversation:', error)
      // Still clear local state even if backend call fails
      setMessages([])
      setConversationId(null)
    }
  }

  return {
    conversationId,
    setConversationId,
    messages,
    setMessages,
    isLoadingSession,
    handleNewConversation,
  }
}

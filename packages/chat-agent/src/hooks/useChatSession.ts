import { useState, useEffect, useCallback } from 'react'

export interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  sources?: any[]
}

export interface SessionSummary {
  conversation_id: string
  title?: string
  last_activity: string
  status: string
}

interface UseChatSessionReturn {
  conversationId: string | null
  setConversationId: (id: string | null) => void
  messages: Message[]
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>
  isLoadingSession: boolean
  handleNewConversation: () => Promise<void>
  // History management
  sessionsHistory: SessionSummary[]
  isLoadingHistory: boolean
  loadHistory: () => Promise<void>
  loadSession: (conversationId: string) => Promise<void>
  renameSession: (conversationId: string, newTitle: string) => Promise<boolean>
  deleteSession: (conversationId: string) => Promise<boolean>
}

/**
 * Hook to manage chat session state and persistence
 */
export function useChatSession(): UseChatSessionReturn {
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoadingSession, setIsLoadingSession] = useState(true)
  
  // History state
  const [sessionsHistory, setSessionsHistory] = useState<SessionSummary[]>([])
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)

  // Helper to parse backend messages
  const parseBackendMessages = (backendMessages: any[]): Message[] => {
    return backendMessages.map((msg: any) => ({
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
  }
  
  // Load active session from backend on mount
  useEffect(() => {
    const loadActiveSession = async () => {
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
            setMessages(parseBackendMessages(sessionData.messages))
            console.log('[useChatSession] ✅ Session restored with', sessionData.messages.length, 'messages')
          }
        } else if (response.status === 404) {
          // No active session found, this is normal
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

    loadActiveSession()
  }, [])

  // Load history
  const loadHistory = useCallback(async () => {
    try {
      setIsLoadingHistory(true)
      const response = await fetch('/api/chat/sessions')
      if (response.ok) {
        const data = await response.json()
        setSessionsHistory(data.sessions || [])
      }
    } catch (error) {
      console.error('[useChatSession] ❌ Error loading history:', error)
    } finally {
      setIsLoadingHistory(false)
    }
  }, [])

  // Load a specific session
  const loadSession = useCallback(async (id: string) => {
    try {
      setIsLoadingSession(true)
      console.log('[useChatSession] 🔄 Loading session:', id)
      
      const response = await fetch(`/api/chat/session?conversationId=${encodeURIComponent(id)}`)
      
      if (response.ok) {
        const sessionData = await response.json()
        setConversationId(sessionData.conversation_id)
        if (sessionData.messages) {
          setMessages(parseBackendMessages(sessionData.messages))
        }
      } else {
        console.error('[useChatSession] ❌ Failed to load session')
      }
    } catch (error) {
      console.error('[useChatSession] ❌ Error loading session:', error)
    } finally {
      setIsLoadingSession(false)
    }
  }, [])

  // Rename session
  const renameSession = useCallback(async (id: string, newTitle: string) => {
    try {
      const response = await fetch(`/api/chat/session?conversationId=${encodeURIComponent(id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle }),
      })
      
      if (response.ok) {
        // Update local history
        setSessionsHistory(prev => prev.map(s => 
          s.conversation_id === id ? { ...s, title: newTitle } : s
        ))
        return true
      }
      return false
    } catch (error) {
      console.error('[useChatSession] ❌ Error renaming session:', error)
      return false
    }
  }, [])

  // Delete session
  const deleteSession = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/chat/session?conversationId=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      })
      
      if (response.ok) {
        // Update local history
        setSessionsHistory(prev => prev.filter(s => s.conversation_id !== id))
        // If current session was deleted, clear it
        if (id === conversationId) {
          setConversationId(null)
          setMessages([])
        }
        return true
      }
      return false
    } catch (error) {
      console.error('[useChatSession] ❌ Error deleting session:', error)
      return false
    }
  }, [conversationId])

  // Clear conversation and start new one
  const handleNewConversation = useCallback(async () => {
    // Just clear local state, don't close the session on backend (backend keeps history)
    setMessages([])
    setConversationId(null)
    console.log('[useChatSession] 🆕 Started new conversation')
  }, [])

  return {
    conversationId,
    setConversationId,
    messages,
    setMessages,
    isLoadingSession,
    handleNewConversation,
    sessionsHistory,
    isLoadingHistory,
    loadHistory,
    loadSession,
    renameSession,
    deleteSession,
  }
}


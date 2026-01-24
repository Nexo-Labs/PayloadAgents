"use client"

import { useExternalStoreRuntime, type AppendMessage, type ThreadMessage } from "@assistant-ui/react"
import { useCallback, useMemo, useState } from "react"
import { useChat } from '../components/chat-context.js'

interface Source {
  id: string
  title: string
  slug: string
  type: 'article' | 'book'
  chunkIndex: number
  relevanceScore: number
  content: string
  excerpt?: string
}

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  sources?: Source[]
}

interface Document {
  id: string
  title: string
  slug: string
  type: 'article' | 'book'
  collection: string
}

interface UseAssistantRuntimeProps {
  messages: Message[]
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>
  conversationId: string | null
  setConversationId: (id: string | null) => void
  selectedDocuments: Document[]
  selectedAgent: string | null
}

/**
 * Convert internal messages to assistant-ui format
 * Using type assertion since assistant-ui ThreadMessage is very strict
 */
function toThreadMessages(messages: Message[]): ThreadMessage[] {
  return messages.map((msg, index) => {
    if (msg.role === 'user') {
      return {
        id: `msg-${index}`,
        role: 'user',
        content: [{ type: "text", text: msg.content }],
        createdAt: msg.timestamp,
        attachments: [],
        metadata: {
          custom: msg.sources ? { sources: msg.sources } : {}
        },
      }
    }
    
    return {
      id: `msg-${index}`,
      role: 'assistant',
      content: [{ type: "text", text: msg.content }],
      createdAt: msg.timestamp,
      status: { type: 'complete', reason: 'stop' },
      metadata: {
        custom: msg.sources ? { sources: msg.sources } : {}
      },
    }
  }) as unknown as ThreadMessage[]
}

/**
 * Hook that creates an assistant-ui runtime from existing chat hooks
 */
export function useAssistantRuntime({
  messages,
  setMessages,
  conversationId,
  setConversationId,
  selectedDocuments,
  selectedAgent,
}: UseAssistantRuntimeProps) {

  const { updateTokenUsage, setLimitError } = useChat()
  const [isRunning, setIsRunning] = useState(false)
  const threadMessages = useMemo(() => toThreadMessages(messages), [messages])

  const onNew = useCallback(async (message: AppendMessage) => {
    // Extract text content from the message
    const textContent = message.content
      .filter((part): part is { type: "text"; text: string } => part.type === "text")
      .map((part) => part.text)
      .join("")

    if (!textContent.trim()) return

    // Set loading state
    setIsRunning(true)

    // Add user message
    const userMessage: Message = {
      role: 'user',
      content: textContent.trim(),
      timestamp: new Date(),
    }

    setMessages(prev => [...prev])

    // Create placeholder for assistant response
    setMessages(prev => [
      ...prev,
      userMessage,
      {
        role: 'assistant',
        content: '',
        timestamp: new Date(),
      }
    ])

    try {
      // Build request body
      const requestBody: Record<string, unknown> = {
        message: textContent.trim(),
        agentSlug: selectedAgent || undefined,
      }

      if (selectedDocuments.length > 0) {
        requestBody.selectedDocuments = selectedDocuments.map(doc => doc.id)
      }

      if (conversationId) {
        requestBody.chatId = conversationId
      }

      // Call API with streaming
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Error al procesar' }))
        
        // Handle 429 - Token limit exceeded
        if (response.status === 429 && errorData.limit_info) {
          setLimitError(errorData.error || 'Has alcanzado tu límite diario de tokens.')
          updateTokenUsage({
            limit: errorData.limit_info.limit,
            used: errorData.limit_info.used,
            remaining: errorData.limit_info.remaining,
            percentage: errorData.limit_info.limit > 0 
              ? (errorData.limit_info.used / errorData.limit_info.limit) * 100 
              : 100,
            reset_at: errorData.limit_info.reset_at,
          })
          // Remove placeholder message
          setMessages(prev => prev.slice(0, -1))
          return
        }
        
        throw new Error(errorData.error || 'Error al procesar')
      }

      // Clear any previous limit error
      setLimitError(null)

      // Process streaming response
      await processStream(response, setMessages, setConversationId, updateTokenUsage)

    } catch (err) {
      console.error('[useAssistantRuntime] Error:', err)
      // Remove placeholder on error
      setMessages(prev => prev.slice(0, -1))
    } finally {
      // Clear loading state
      setIsRunning(false)
    }
  }, [setMessages, conversationId, setConversationId, selectedDocuments, selectedAgent, setLimitError, updateTokenUsage])

  const runtime = useExternalStoreRuntime({
    messages: threadMessages,
    isRunning,
    onNew,
  })

  return runtime
}

/**
 * Process SSE stream and update messages
 */
async function processStream(
  response: Response,
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>,
  setConversationId: (id: string | null) => void,
  updateTokenUsage: (usage: { limit: number; used: number; remaining: number; percentage: number; reset_at: string }) => void,
) {
  const reader = response.body?.getReader()
  const decoder = new TextDecoder()
  
  if (!reader) throw new Error('No stream reader')
  
  let accumulatedContent = ''
  let receivedSources: Source[] = []
  let buffer = ''
  
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    
    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() || ''
    
    for (const line of lines) {
      if (!line.startsWith('data: ')) continue
      
      const data = line.slice(6)
      if (data === '[DONE]') break
      
      try {
        const event = JSON.parse(data)
        
        switch (event.type) {
          case 'conversation_id':
            setConversationId(event.data)
            break
            
          case 'token':
            accumulatedContent += event.data
            setMessages(prev => {
              const updated = [...prev]
              const lastIdx = updated.length - 1
              if (lastIdx >= 0 && updated[lastIdx]?.role === 'assistant') {
                updated[lastIdx] = { ...updated[lastIdx], content: accumulatedContent }
              }
              return updated
            })
            break
            
          case 'sources':
            if (Array.isArray(event.data)) {
              receivedSources = event.data
              setMessages(prev => {
                const updated = [...prev]
                const lastIdx = updated.length - 1
                if (lastIdx >= 0 && updated[lastIdx]?.role === 'assistant') {
                  updated[lastIdx] = { ...updated[lastIdx], sources: event.data }
                }
                return updated
              })
            }
            break
            
          case 'done':
            setMessages(prev => {
              const updated = [...prev]
              const lastIdx = updated.length - 1
              if (lastIdx >= 0 && updated[lastIdx]?.role === 'assistant') {
                updated[lastIdx] = {
                  ...updated[lastIdx],
                  content: accumulatedContent,
                  sources: updated[lastIdx].sources || receivedSources,
                }
              }
              return updated
            })
            break

          case 'usage':
            // Update token usage in context
            if (event.data) {
              updateTokenUsage({
                limit: event.data.daily_limit,
                used: event.data.daily_used,
                remaining: event.data.daily_remaining,
                percentage: event.data.daily_limit > 0 
                  ? (event.data.daily_used / event.data.daily_limit) * 100 
                  : 0,
                reset_at: event.data.reset_at,
              })
            }
            break
            
          case 'error':
            throw new Error(event.data?.error || 'Streaming error')
        }
      } catch (e) {
        if (!(e instanceof SyntaxError)) throw e
      }
    }
  }
}

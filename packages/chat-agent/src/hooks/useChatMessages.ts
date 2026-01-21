import { useState } from 'react'

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

interface UsageInfo {
  tokens_used: number
  cost_usd: number
  daily_limit: number
  daily_used: number
  daily_remaining: number
  reset_at: string
}

interface UseChatMessagesProps {
  messages: Message[]
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>
  conversationId: string | null
  setConversationId: (id: string | null) => void
  selectedDocuments: Document[]
  selectedAgent: string | null
}

interface UseChatMessagesReturn {
  isLoading: boolean
  error: string | null
  usageInfo: UsageInfo | null
  handleSubmit: (message: string) => Promise<void>
}

interface ChatRequestBody {
  message: string
  selectedDocuments?: string[]
  chatId?: string
  agentSlug?: string
}

/**
 * Hook to handle sending messages and processing SSE responses
 */
export function useChatMessages({
  messages,
  setMessages,
  conversationId,
  setConversationId,
  selectedDocuments,
  selectedAgent,
}: UseChatMessagesProps): UseChatMessagesReturn {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [usageInfo, setUsageInfo] = useState<UsageInfo | null>(null)

  const handleSubmit = async (userMessageContent: string) => {
    if (!userMessageContent.trim() || isLoading) return

    const userMessage: Message = {
      role: 'user',
      content: userMessageContent.trim(),
      timestamp: new Date(),
    }

    // Add user message to chat
    setMessages((prev) => [...prev, userMessage])
    setError(null)
    setIsLoading(true)

    // Create a placeholder for the assistant message
    const assistantMessageIndex = messages.length + 1
    setMessages((prev) => [
      ...prev,
      {
        role: 'assistant',
        content: '',
        timestamp: new Date(),
      },
    ])

    try {
      console.log('[useChatMessages] 🚀 Starting chat request')
      console.log('[useChatMessages] Conversation ID:', conversationId || '(new conversation)')
      console.log('[useChatMessages] User message:', userMessage.content)
      console.log('[useChatMessages] Selected Agent:', selectedAgent)

      // Build request body
      const requestBody: ChatRequestBody = {
        message: userMessage.content,
        selectedDocuments:
          selectedDocuments.length > 0 ? selectedDocuments.map((doc) => doc.id) : undefined,
        agentSlug: selectedAgent || undefined,
      }

      // Only include chatId for follow-up questions
      if (conversationId) {
        console.log('[useChatMessages] ✅ Using existing conversation_id:', conversationId)
        requestBody.chatId = conversationId
      } else {
        console.log('[useChatMessages] 🆕 Starting new conversation (no conversation_id yet)')
      }

      console.log('[useChatMessages] 📤 Request body:', {
        hasChatId: !!requestBody.chatId,
        chatId: requestBody.chatId,
        message: requestBody.message,
        selectedDocuments: requestBody.selectedDocuments,
        agentSlug: requestBody.agentSlug,
        selectedDocumentTitles: selectedDocuments.map((doc) => doc.title),
      })

      // Call the API with streaming
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      console.log('[useChatMessages] Response status:', response.status)
      console.log(
        '[useChatMessages] Response headers:',
        Object.fromEntries(response.headers.entries())
      )

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ error: 'Error al procesar la solicitud' }))
        throw new Error(errorData.error || 'Error al procesar la solicitud')
      }

      // Handle streaming response
      await processStreamingResponse(response, assistantMessageIndex, setMessages, setConversationId, setUsageInfo)
    } catch (err) {
      console.error('Error in chat:', err)
      setError(err instanceof Error ? err.message : 'Error desconocido')
      // Remove the incomplete assistant message
      setMessages((prev) => prev.slice(0, -1))
    } finally {
      setIsLoading(false)
    }
  }

  return {
    isLoading,
    error,
    usageInfo,
    handleSubmit,
  }
}

/**
 * Process SSE streaming response from the chat API
 */
async function processStreamingResponse(
  response: Response,
  assistantMessageIndex: number,
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>,
  setConversationId: (id: string | null) => void,
  setUsageInfo: (info: UsageInfo | null) => void
) {
  const reader = response.body?.getReader()
  const decoder = new TextDecoder()

  if (!reader) {
    throw new Error('No se pudo iniciar el streaming')
  }

  console.log('[useChatMessages] 📡 Started reading stream')
  let accumulatedContent = ''
  let receivedSources: Source[] = []
  let eventCount = 0
  let buffer = '' // Buffer for incomplete lines across chunks

  while (true) {
    const { done, value } = await reader.read()
    if (done) {
      console.log('[useChatMessages] ✅ Stream done, total events:', eventCount)
      break
    }

    const chunk = decoder.decode(value, { stream: true })
    buffer += chunk // Append to buffer
    const lines = buffer.split('\n')

    // Keep the last incomplete line in the buffer
    buffer = lines.pop() || ''

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        eventCount++
        const data = line.slice(6)

        // Check for [DONE] marker (end of stream)
        if (data === '[DONE]') {
          console.log(`[useChatMessages] ✅ Stream completed with [DONE] marker`)
          break
        }

        // console.log(`[useChatMessages] 📨 SSE Event #${eventCount}:`, data.substring(0, 200) + (data.length > 200 ? '...' : ''))

        try {
          const event = JSON.parse(data)
          // console.log(`[useChatMessages] Event type: ${event.type}`)

          switch (event.type) {
            case 'conversation_id':
              console.log(`[useChatMessages] 🆔 Conversation ID received:`, event.data)
              setConversationId(event.data)
              break

            case 'token':
              accumulatedContent += event.data
              setMessages((prev) => {
                const updated = [...prev]
                const currentMessage = updated[assistantMessageIndex]
                if (!currentMessage) {
                  return updated
                }
                updated[assistantMessageIndex] = {
                  ...currentMessage,
                  content: accumulatedContent,
                }
                return updated
              })
              break

            case 'sources':
              if (Array.isArray(event.data)) {
                console.log(`[useChatMessages] 📚 Sources received:`, event.data.length)
                receivedSources = event.data

                setMessages((prev) => {
                  const updated = [...prev]
                  const currentMessage = updated[assistantMessageIndex]
                  if (!currentMessage) {
                    return updated
                  }
                  updated[assistantMessageIndex] = {
                    ...currentMessage,
                    ...updated[assistantMessageIndex],
                    sources: event.data,
                  }
                  return updated
                })
              } else {
                console.error('[useChatMessages] ⚠️ Sources data is not an array:', typeof event.data)
              }
              break

            case 'done':
              console.log('[useChatMessages] 🏁 Done event received')
              setMessages((prev) => {
                const updated = [...prev]
                const currentMessage = updated[assistantMessageIndex]
                if (!currentMessage) {
                  return updated
                }
                updated[assistantMessageIndex] = {
                  ...currentMessage,
                  content: accumulatedContent,
                  sources: currentMessage.sources || receivedSources,
                }

                return updated
              })
              break

            case 'usage':
              console.log('[useChatMessages] 💰 Usage info received:', event.data)
              setUsageInfo(event.data)
              break

            case 'error':
              console.error('[useChatMessages] ❌ Error event received:', event.data)
              throw new Error(event.data.error || 'Error en el streaming')
          }
        } catch (e) {
          if (e instanceof SyntaxError) {
            console.error('[useChatMessages] ❌ JSON Parse error:', e.message)
            console.error('[useChatMessages] Data length:', data.length, 'chars')
            console.error('[useChatMessages] Data preview:', data.substring(0, 200) + '...')
          } else {
            console.error('[useChatMessages] ❌ Error processing SSE event:', e)
            console.error('[useChatMessages] Error type:', e instanceof Error ? e.constructor.name : typeof e)
            if (e instanceof Error) {
              console.error('[useChatMessages] Error message:', e.message)
              console.error('[useChatMessages] Error stack:', e.stack)
            }
          }
        }
      }
    }
  }
}

"use client"

import { useExternalStoreRuntime, type AppendMessage, type ThreadMessage } from "@assistant-ui/react"
import { useCallback, useMemo, useState } from "react"
import { useChat } from '../components/chat-context.js'
import type { Message, Source } from '../adapters/ChatAdapter.js'

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

  const { updateTokenUsage, setLimitError, adapter } = useChat()
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

    let accumulatedContent = ''
    let receivedSources: Source[] = []

    try {
      // Use adapter to send message
      await adapter.sendMessage(
        textContent.trim(),
        {
          conversationId,
          selectedDocuments: selectedDocuments.map(doc => doc.id),
          agentSlug: selectedAgent
        },
        {
          onConversationId: (id) => setConversationId(id),
          onToken: (token) => {
            accumulatedContent += token
            setMessages(prev => {
              const updated = [...prev]
              const lastIdx = updated.length - 1
              if (lastIdx >= 0 && updated[lastIdx]?.role === 'assistant') {
                updated[lastIdx] = { ...updated[lastIdx], content: accumulatedContent }
              }
              return updated
            })
          },
          onSources: (sources) => {
            receivedSources = sources
            setMessages(prev => {
              const updated = [...prev]
              const lastIdx = updated.length - 1
              if (lastIdx >= 0 && updated[lastIdx]?.role === 'assistant') {
                updated[lastIdx] = { ...updated[lastIdx], sources: sources }
              }
              return updated
            })
          },
          onUsage: (usage) => {
            if (usage) {
              updateTokenUsage({
                limit: usage.daily_limit,
                used: usage.daily_used,
                remaining: usage.daily_remaining,
                percentage: usage.daily_limit > 0
                  ? (usage.daily_used / usage.daily_limit) * 100
                  : 0,
                reset_at: usage.reset_at,
              })
            }
          },
          onDone: () => {
            // Final update to ensure consistency
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
          },
          onError: (error) => {
            throw error
          }
        }
      )

      // Clear any previous limit error
      setLimitError(null)

    } catch (err: any) {
      console.error('[useAssistantRuntime] Error:', err)

      // Handle 429 - Token limit exceeded (propagated from adapter)
      if (err.message === 'Has alcanzado tu límite diario de tokens.') {
        setLimitError(err.message)
        // Remove placeholder message
        setMessages(prev => prev.slice(0, -1))
        return
      }

      // Remove placeholder on other errors
      setMessages(prev => prev.slice(0, -1))
    } finally {
      // Clear loading state
      setIsRunning(false)
    }
  }, [setMessages, conversationId, setConversationId, selectedDocuments, selectedAgent, setLimitError, updateTokenUsage, adapter])

  const runtime = useExternalStoreRuntime({
    messages: threadMessages,
    isRunning,
    onNew,
  })

  return runtime
}


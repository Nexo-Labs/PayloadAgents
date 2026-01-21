'use client'

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { useChatMessages } from '../hooks/useChatMessages.js'
import { useChatSession } from '../hooks/useChatSession.js'
import { ChatInput } from './ChatInput.js'
import { ChatMessages } from './ChatMessages.js'
import DocumentSelector from './DocumentSelector.js'
import { UsageDisplay } from './UsageDisplay.js'
import { useChat } from './chat-context.js'
import { LinkComponent } from '../types/components.js'

interface Document {
  id: string
  title: string
  slug: string
  type: 'article' | 'book'
  collection: string
}

export interface ChatInterfaceRef {
  handleNewConversation: () => void
}

interface ChatInterfaceProps {
  generateHref: (props: { type: string; value: { id: number; slug?: string | null } }) => string
  LinkComponent?: LinkComponent
}

const ChatInterface = forwardRef<ChatInterfaceRef, ChatInterfaceProps>(({ generateHref, LinkComponent }, ref) => {
  const { isMaximized, setMaximized, updateTokenUsage, selectedAgent } = useChat()
  const [selectedDocuments, setSelectedDocuments] = useState<Document[]>([])
  const [isDesktop, setIsDesktop] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Handler to minimize the chat
  const handleMinimize = () => {
    setMaximized(false)
  }

  // Use custom hooks for session and message management
  const {
    conversationId,
    setConversationId,
    messages,
    setMessages,
    isLoadingSession,
    handleNewConversation,
  } = useChatSession()

  const { isLoading, error, usageInfo, handleSubmit } = useChatMessages({
    messages,
    setMessages,
    conversationId,
    setConversationId,
    selectedDocuments,
    selectedAgent,
  })

  // Sync usageInfo from streaming response with context
  useEffect(() => {
    if (usageInfo) {
      updateTokenUsage({
        limit: usageInfo.daily_limit,
        used: usageInfo.daily_used,
        remaining: usageInfo.daily_remaining,
        percentage: (usageInfo.daily_used / usageInfo.daily_limit) * 100,
        reset_at: usageInfo.reset_at,
      })
    }
  }, [usageInfo, updateTokenUsage])

  // Detect if device is desktop (window width >= 1024px)
  useEffect(() => {
    const checkIsDesktop = () => {
      setIsDesktop(window.innerWidth >= 1024)
    }

    checkIsDesktop()
    window.addEventListener('resize', checkIsDesktop)

    return () => window.removeEventListener('resize', checkIsDesktop)
  }, [])

  // Determine if we should use side panel layout
  const shouldUseSidePanel = isMaximized && isDesktop

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Expose handleNewConversation to parent via ref
  useImperativeHandle(ref, () => ({
    handleNewConversation,
  }))

  // Show loading state while restoring session
  if (isLoadingSession) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="flex space-x-2 justify-center mb-4">
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce"></div>
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce delay-100"></div>
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce delay-200"></div>
          </div>
          <p className="text-gray-600">Cargando conversación...</p>
        </div>
      </div>
    )
  }

  if (shouldUseSidePanel) {
    // Desktop maximized mode: Side panel layout (1/4 + 3/4)
    return (
      <div className="flex h-full">
        {/* Document Selector Side Panel (1/4 width) */}
        <div className="w-1/4 flex-shrink-0">
          <DocumentSelector
            onSelectionChange={setSelectedDocuments}
            isMaximized={isMaximized}
            isSidePanel={true}
          />
        </div>

        {/* Chat Area (3/4 width) */}
        <div className="flex-1 flex flex-col">

          {/* Messages area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <ChatMessages
              messages={messages}
              isLoading={isLoading}
              error={error}
              isMaximized={isMaximized}
              onMinimize={handleMinimize}
              generateHref={generateHref}
              LinkComponent={LinkComponent}
            />
            <div ref={messagesEndRef} />
          </div>

          {/* Usage info - only shows after first message */}
          {usageInfo && <UsageDisplay usageInfo={usageInfo} />}

          {/* Input area */}
          <div className="border-t border-gray-300 p-4 bg-gray-50 rounded-br-xl">
            <ChatInput onSubmit={handleSubmit} isLoading={isLoading} />
          </div>
        </div>
      </div>
    )
  }

  // Default layout: Mobile/tablet or desktop non-maximized (dropdown mode)
  return (
    <div className="flex flex-col h-full">
      {/* Document Selector */}
      <div className="border-b border-gray-200 p-4 bg-white">
        <DocumentSelector
          onSelectionChange={setSelectedDocuments}
          isMaximized={isMaximized}
          isSidePanel={false}
        />
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <ChatMessages
          messages={messages}
          isLoading={isLoading}
          error={error}
          isMaximized={isMaximized}
          onMinimize={handleMinimize}
          generateHref={generateHref}
          LinkComponent={LinkComponent}
        />
        <div ref={messagesEndRef} />
      </div>

      {/* Usage info - only shows after first message */}
      {usageInfo && <UsageDisplay usageInfo={usageInfo} showCost={false} />}

      {/* Input area */}
      <div className="border-t border-gray-300 p-4 bg-gray-50 rounded-b-xl">
        <ChatInput onSubmit={handleSubmit} isLoading={isLoading} />
      </div>
    </div>
  )
})

ChatInterface.displayName = 'ChatInterface'

export default ChatInterface

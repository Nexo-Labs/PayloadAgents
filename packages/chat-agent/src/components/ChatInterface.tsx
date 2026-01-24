'use client'

import { forwardRef, useEffect, useImperativeHandle, useState } from 'react'
import { useAssistantRuntime } from '../hooks/useAssistantRuntime.js'
import DocumentSelector from './DocumentSelector.js'
import { useChat } from './chat-context.js'
import { LinkComponent } from '../types/components.js'
import { Thread } from './assistant-ui/thread.js'

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
  const {
    isMaximized,
    setMaximized,
    updateTokenUsage,
    selectedAgent,
    // Session props from context
    conversationId,
    setConversationId,
    messages,
    setMessages,
    isLoadingSession,
    handleNewConversation,
  } = useChat()
  const [selectedDocuments, setSelectedDocuments] = useState<Document[]>([])
  const [isDesktop, setIsDesktop] = useState(false)

  // Create assistant-ui runtime
  const runtime = useAssistantRuntime({
    messages,
    setMessages,
    conversationId,
    setConversationId,
    selectedDocuments,
    selectedAgent,
  })

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
            <div className="w-3 h-3 rounded-full bg-primary animate-bounce" />
            <div className="w-3 h-3 rounded-full bg-primary animate-bounce delay-75" />
            <div className="w-3 h-3 rounded-full bg-primary animate-bounce delay-150" />
          </div>
          <p className="text-muted-foreground">Cargando conversación...</p>
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
          <Thread
            runtime={runtime}
            welcomeTitle="¡Bienvenido al Oráculo de Escohotado!"
            welcomeSubtitle="Pregunta sobre filosofía, drogas, libertad, historia de las ideas y más."
            generateHref={generateHref}
            LinkComponent={LinkComponent}
          />
        </div>
      </div>
    )
  }

  // Default layout: Mobile/tablet or desktop non-maximized (dropdown mode)
  return (
    <div className="flex flex-col h-full">
      {/* Document Selector */}
      <div className="border-b border-border p-4 bg-background">
        <DocumentSelector
          onSelectionChange={setSelectedDocuments}
          isMaximized={isMaximized}
          isSidePanel={false}
        />
      </div>

      {/* Chat Thread */}
      <div className="flex-1 min-h-0">
        <Thread
          runtime={runtime}
          welcomeTitle="¡Bienvenido al Oráculo de Escohotado!"
          welcomeSubtitle="Pregunta sobre filosofía, drogas, libertad, historia de las ideas y más."
          generateHref={generateHref}
          LinkComponent={LinkComponent}
        />
      </div>
    </div>
  )
})

ChatInterface.displayName = 'ChatInterface'

export default ChatInterface

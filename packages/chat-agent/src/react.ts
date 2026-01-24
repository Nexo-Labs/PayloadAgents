'use client'

// Client-side React components and context
export { ChatProvider, useChat } from './components/chat-context.js'
export { default as FloatingChatManager } from './components/FloatingChatManager.js'

// assistant-ui components
export { Thread, Composer, UserMessage, AssistantMessage, MarkdownText } from './components/assistant-ui/index.js'

// Runtime adapter
export { useAssistantRuntime } from './hooks/useAssistantRuntime.js'

// Adapters
export type { ChatAdapter, Message, Source, SessionSummary, StreamCallbacks } from './adapters/ChatAdapter.js'
export { NexoPayloadChatAdapter } from './adapters/NexoPayloadChatAdapter.js'
export { MockAdapter } from './adapters/MockAdapter.js'


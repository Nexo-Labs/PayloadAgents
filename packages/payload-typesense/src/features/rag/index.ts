/**
 * Conversational RAG utilities for Typesense
 *
 * This module provides tools for building conversational RAG (Retrieval Augmented Generation)
 * applications with Typesense.
 *
 * @module rag
 */

// Re-export embedding functions from parent
export { generateEmbeddingWithUsage } from '../embedding/embeddings.js'

// Query Builder
export {
    buildConversationalUrl, buildHybridSearchParams, buildMultiSearchRequestBody, buildMultiSearchRequests
} from './query-builder.js'

// Stream Handler
export type {
    ConversationEvent,
    StreamProcessingResult
} from './stream-handler.js'

export {
    buildContextText, createSSEForwardStream, extractSourcesFromResults, parseConversationEvent, processConversationStream
} from './stream-handler.js'

// Setup Utilities
export {
    ensureConversationCollection, getDefaultRAGConfig, mergeRAGConfigWithDefaults
} from './setup.js'

// API Handlers (Core Functions)
export type {
    ChatSessionData, ChunkFetchConfig,
    ChunkFetchResult, RAGChatRequest, RAGSearchConfig, RAGSearchResult, SessionConfig
} from './handlers/index.js'
export type { TypesenseConnectionConfig } from '../../shared/types/plugin-types.js'
export {
    closeSession, executeRAGSearch,
    fetchChunkById,
    getActiveSession,
    getSessionByConversationId
} from './handlers/index.js'

// SSE Utilities
export {
    formatSSEEvent,
    sendSSEEvent
} from './utils/sse-utils.js'

// Chat Session Repository
export type {
    ChatMessageWithSources
} from './chat-session-repository.js'

export {
    saveChatSession
} from './chat-session-repository.js'

// API Types
export type {
    ApiContext,
    AuthenticateMethod
} from './endpoints/types.js'

export {
    jsonResponse
} from './endpoints/chat/validators/index.js'

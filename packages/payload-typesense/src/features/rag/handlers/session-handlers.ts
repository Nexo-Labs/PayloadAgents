/**
 * Session management handlers
 *
 * Handles all chat session operations including getting, saving, and closing sessions
 */

import type { CollectionSlug, Payload } from 'payload'

/**
 * Session data structure
 */
export type ChatSessionData = {
  conversation_id: string
  messages: Array<Record<string, unknown>>
  status: string
  total_tokens?: number
  total_cost?: number
  last_activity?: string
}

/**
 * Configuration for session operations
 */
export type SessionConfig = {
  /** Collection name for sessions */
  collectionName?: CollectionSlug
  /** Time window for active sessions in milliseconds */
  activeSessionWindow?: number
}

/**
 * Get active chat session for a user
 *
 * @param payload - Payload CMS instance
 * @param userId - User ID
 * @param config - Session configuration
 * @returns Promise with session data or null
 */
export async function getActiveSession(
  payload: Payload,
  userId: string | number,
  config: SessionConfig = {},
): Promise<ChatSessionData | null> {
  const collectionName = config.collectionName || 'chat-sessions'
  const windowMs = config.activeSessionWindow || 24 * 60 * 60 * 1000 // 24 hours default

  const cutoffTime = new Date(Date.now() - windowMs)

  const chatSessions = await payload.find({
    collection: collectionName,
    where: {
      and: [
        {
          user: {
            equals: userId,
          },
        },
        {
          status: {
            equals: 'active',
          },
        },
        {
          last_activity: {
            greater_than: cutoffTime.toISOString(),
          },
        },
      ],
    },
    sort: '-last_activity',
    limit: 1,
  })

  if (!chatSessions.docs.length) {
    return null
  }

  return chatSessions.docs[0] as unknown as ChatSessionData
}

/**
 * Get session by conversation ID
 *
 * @param payload - Payload CMS instance
 * @param userId - User ID
 * @param conversationId - Conversation ID
 * @param config - Session configuration
 * @returns Promise with session data or null
 */
export async function getSessionByConversationId(
  payload: Payload,
  userId: string | number,
  conversationId: string,
  config: SessionConfig = {},
): Promise<ChatSessionData | null> {
  const collectionName = config.collectionName || 'chat-sessions'

  const chatSessions = await payload.find({
    collection: collectionName,
    where: {
      and: [
        {
          conversation_id: {
            equals: conversationId,
          },
        },
        {
          user: {
            equals: userId,
          },
        },
      ],
    },
    limit: 1,
  })

  if (!chatSessions.docs.length) {
    return null
  }

  return chatSessions.docs[0] as unknown as ChatSessionData
}

/**
 * Close a chat session
 *
 * @param payload - Payload CMS instance
 * @param userId - User ID
 * @param conversationId - Conversation ID
 * @param config - Session configuration
 * @returns Promise with updated session data or null if not found
 */
export async function closeSession(
  payload: Payload,
  userId: string | number,
  conversationId: string,
  config: SessionConfig = {},
): Promise<ChatSessionData | null> {
  const collectionName = config.collectionName || 'chat-sessions'

  const chatSessions = await payload.find({
    collection: collectionName,
    where: {
      and: [
        {
          conversation_id: {
            equals: conversationId,
          },
        },
        {
          user: {
            equals: userId,
          },
        },
      ],
    },
    limit: 1,
  })

  if (!chatSessions.docs.length) {
    return null
  }

  const session = chatSessions.docs[0] as unknown as ChatSessionData
  if (!session) {
    return null
  }
  await payload.update({
    collection: collectionName,
    where: {
      conversation_id: {
        equals: conversationId,
      },
    },
    data: {
      status: 'closed',
      closed_at: new Date().toISOString(),
    },
  })

  return {
    conversation_id: session.conversation_id,
    messages: session.messages || [],
    status: 'closed',
    total_tokens: session.total_tokens,
    total_cost: session.total_cost,
    last_activity: session.last_activity,
  }
}

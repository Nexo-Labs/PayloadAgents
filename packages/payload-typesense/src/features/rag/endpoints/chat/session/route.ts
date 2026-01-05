import { Payload, PayloadRequest } from 'payload';
import { jsonResponse } from '../validators/index.js'
import { logger } from '../../../../../core/logging/logger.js'
import { SessionConfig, getActiveSession, getSessionByConversationId, closeSession } from '../../../handlers/session-handlers.js';

/**
 * Configuration for session endpoints
 */
export type SessionEndpointConfig = {
  /** Get Payload instance */
  getPayload: () => Promise<Payload>
  checkPermissions: (request: PayloadRequest) => Promise<boolean>;
  /** Session configuration */
  sessionConfig?: SessionConfig
}

/**
 * Create a parameterizable GET handler for session endpoint
 *
 * Query params:
 * - ?active=true → Get the most recent active session
 * - ?conversationId=xxx → Get a specific session by conversation ID
 */
export function createSessionGETHandler(config: SessionEndpointConfig) {
  return async function GET(request: PayloadRequest) {
    try {
      if (!await config.checkPermissions(request)) {
        return jsonResponse({ error: 'No tienes permisos para acceder a esta sesión.' }, { status: 403 })
      }
      const userId = request.user?.id

      if (!request.url || !userId) {
        return jsonResponse({ error: 'URL not found' }, { status: 400 })
      }

      const { searchParams } = new URL(request.url)
      const isActive = searchParams.get('active') === 'true'
      const conversationId = searchParams.get('conversationId')

      // Get Payload instance
      const payload = await config.getPayload()

      // Handle active session request
      if (isActive) {
        const session = await getActiveSession(payload, userId, config.sessionConfig)

        if (!session) {
          return jsonResponse({ error: 'No hay sesión activa.' }, { status: 404 })
        }

        return jsonResponse(session)
      }

      // Handle specific session request
      if (!conversationId) {
        return jsonResponse(
          { error: 'Se requiere conversationId o active=true.' },
          { status: 400 },
        )
      }

      const session = await getSessionByConversationId(
        payload,
        userId,
        conversationId,
        config.sessionConfig,
      )

      if (!session) {
        return jsonResponse({ error: 'Sesión de chat no encontrada.' }, { status: 404 })
      }

      return jsonResponse(session)
    } catch (error) {
      logger.error('Error retrieving chat session', error as Error, {
        userId: request.user?.id,
      })

      return jsonResponse(
        {
          error: 'Error al recuperar la sesión.',
          details: error instanceof Error ? error.message : 'Error desconocido',
        },
        { status: 500 },
      )
    }
  }
}

/**
 * Create a parameterizable DELETE handler for session endpoint
 *
 * DELETE /api/chat/session?conversationId=xxx
 * Close a chat session
 */
export function createSessionDELETEHandler(config: SessionEndpointConfig) {
  return async function DELETE(request: PayloadRequest) {
    try {
      if (!await config.checkPermissions(request)) {
        return jsonResponse({ error: 'No tienes permisos para acceder a esta sesión.' }, { status: 403 })
      }
      const userId = request.user?.id
      if (!request.url || !userId) {
        return jsonResponse({ error: 'URL not found' }, { status: 400 })
      }

      const { searchParams } = new URL(request.url)
      const conversationId = searchParams.get('conversationId')

      if (!conversationId) {
        return jsonResponse(
          { error: 'Se requiere un conversationId válido.' },
          { status: 400 },
        )
      }

      // Get Payload instance
      const payload = await config.getPayload()

      logger.info('Closing chat session', { conversationId, userId })

      const session = await closeSession(payload, userId, conversationId, config.sessionConfig)

      if (!session) {
        return jsonResponse(
          { error: 'Sesión de chat no encontrada o no tienes permisos.' },
          { status: 404 },
        )
      }

      logger.info('Chat session closed successfully', {
        conversationId,
        totalTokens: session.total_tokens,
        totalCost: session.total_cost,
      })

      return jsonResponse({
        success: true,
        message: 'Sesión cerrada correctamente',
        session: {
          conversation_id: conversationId,
          status: 'closed',
          total_tokens: session.total_tokens,
          total_cost: session.total_cost,
        },
      })
    } catch (error) {
      logger.error('Error closing chat session', error as Error, {
        conversationId: request.url ? new URL(request.url).searchParams.get('conversationId') : undefined,
        userId: request.user?.id,
      })

      return jsonResponse(
        {
          error: 'Error al cerrar la sesión. Por favor, inténtalo de nuevo.',
          details: error instanceof Error ? error.message : 'Error desconocido',
        },
        { status: 500 },
      )
    }
  }
}

/**
 * Default exports for Next.js App Router
 */
export { createSessionGETHandler as GET, createSessionDELETEHandler as DELETE }

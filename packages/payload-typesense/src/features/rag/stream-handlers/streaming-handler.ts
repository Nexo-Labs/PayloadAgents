/**
 * Streaming response handler
 *
 * Handles streaming responses from Typesense conversational search
 */

import { parseConversationEvent, extractSourcesFromResults, buildContextText } from '../stream-handler.js'
import { sendSSEEvent } from '../utils/sse-utils.js'
import { logger } from '../../../core/logging/logger.js'
import { resolveDocumentType, estimateTokensFromText } from './utils.js'
import { ChunkSource, SpendingEntry } from '../../../shared/index.js';

/**
 * Default implementation for handling streaming responses
 */
export async function defaultHandleStreamingResponse(
  response: Response,
  controller: ReadableStreamDefaultController<Uint8Array>,
  encoder: TextEncoder,
): Promise<{
  fullAssistantMessage: string;
  conversationId: string | null;
  sources: ChunkSource[];
  llmSpending: SpendingEntry;
}> {
  logger.debug('Starting streaming response handling')

  if (!response.body) {
    throw new Error('Response body is null');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let sources: ChunkSource[] = [];
  let hasCollectedSources = false;
  let conversationId: string | null = null;
  let contextText = ''; // To estimate LLM tokens
  let fullAssistantMessage = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        logger.debug('Streaming response completed');
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const event = parseConversationEvent(line);
        if (!event) continue;

        // Handle [DONE] event
        if (event.raw === '[DONE]') {
          sendSSEEvent(controller, encoder, { type: 'done', data: '' });
          continue;
        }

        // Capture conversation_id
        if (!conversationId && event.conversationId) {
          conversationId = event.conversationId;
          logger.debug('Conversation ID captured', { conversationId });
          sendSSEEvent(controller, encoder, { type: 'conversation_id', data: conversationId });
        }

        // Extract sources
        if (!hasCollectedSources && event.results) {
          sources = extractSourcesFromResults(event.results, resolveDocumentType);
          contextText = buildContextText(event.results);

          if (sources.length > 0) {
            sendSSEEvent(controller, encoder, { type: 'sources', data: sources });
          }

          hasCollectedSources = true;
        }

        // Stream conversation tokens
        if (event.message) {
          fullAssistantMessage += event.message;
          sendSSEEvent(controller, encoder, { type: 'token', data: event.message });
        }
      }
    }
  } finally {
    reader.releaseLock();
  }

  // Estimate LLM tokens (context + user message + response)
  const llmInputTokens = estimateTokensFromText(contextText);
  const llmOutputTokens = estimateTokensFromText(fullAssistantMessage);

  // Track LLM spending (defaults to a simple model)
  const llmSpending: SpendingEntry = {
    service: 'openai_llm',
    model: 'gpt-4o-mini',
    tokens: {
      input: llmInputTokens,
      output: llmOutputTokens,
      total: llmInputTokens + llmOutputTokens,
    },
    cost_usd: (llmInputTokens * 0.00000015) + (llmOutputTokens * 0.0000006), // gpt-4o-mini pricing
    timestamp: new Date().toISOString(),
  };

  logger.info('LLM cost calculated', {
    inputTokens: llmInputTokens,
    outputTokens: llmOutputTokens,
    totalTokens: llmSpending.tokens.total,
    costUsd: llmSpending.cost_usd,
  })

  return {
    fullAssistantMessage,
    conversationId,
    sources,
    llmSpending,
  };
}

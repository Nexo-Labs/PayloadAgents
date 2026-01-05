/**
 * Generic indexer plugin factory
 * Creates a Payload CMS plugin that handles document syncing to any search backend
 */

import type { Config } from "payload";
import type { IndexerAdapter } from "../adapter/types.js";
import type { FieldMapping } from "../document/types.js";
import type { IndexerPluginConfig } from "./types.js";
import type { EmbeddingService } from "../embedding/types.js";
import { Logger } from "../core/logging/logger.js";
import { OpenAIEmbeddingProvider } from "../embedding/providers/openai-provider.js";
import { GeminiEmbeddingProvider } from "../embedding/providers/gemini-provider.js";
import { EmbeddingServiceImpl } from "../embedding/service.js";
import { applySyncHooks } from "./sync/hooks.js";

/**
 * Result of plugin creation containing the plugin function and internal services
 */
export interface IndexerPluginResult {
  /** The Payload plugin function */
  plugin: (config: Config) => Config;
  /** The embedding service instance (if configured) */
  embeddingService?: EmbeddingService;
  /** The adapter instance */
  adapter: IndexerAdapter;
}

/**
 * Creates an indexer plugin for Payload CMS
 *
 * This is the main factory function for creating a search indexer plugin.
 * It handles:
 * - Embedding service creation (optional)
 * - Sync hooks for document create/update/delete
 *
 * Schema management and search endpoints should be handled by the adapter-specific wrapper
 * (e.g., typesenseSearch) as they have backend-specific requirements.
 *
 * @param config - Plugin configuration
 * @returns Object containing the plugin function and created services
 *
 * @example
 * ```typescript
 * import { createIndexerPlugin } from '@nexo-labs/payload-indexer';
 * import { createTypesenseAdapter } from '@nexo-labs/payload-typesense';
 *
 * const adapter = createTypesenseAdapter({ apiKey: '...', nodes: [...] });
 *
 * // TypeScript infers TFieldMapping from the adapter
 * const { plugin, embeddingService } = createIndexerPlugin({
 *   adapter,
 *   features: {
 *     embedding: { type: 'openai', apiKey: '...' },
 *     sync: { enabled: true }
 *   },
 *   collections: {
 *     posts: [{
 *       enabled: true,
 *       fields: [
 *         { name: 'title', type: 'string' },      // ✅ Valid Typesense field
 *         { name: 'views', type: 'int64' },       // ✅ Valid Typesense field
 *         { name: 'tags', type: 'string[]', facet: true }, // ✅ With faceting
 *       ]
 *     }]
 *   }
 * });
 *
 * export default buildConfig({
 *   plugins: [plugin]
 * });
 * ```
 */
export function createIndexerPlugin<TFieldMapping extends FieldMapping>(
  config: IndexerPluginConfig<TFieldMapping>
): IndexerPluginResult {
  const { adapter, features, collections } = config;
  const logger = new Logger({ enabled: true, prefix: "[payload-indexer]" });

  // 1. Create Embedding Service (optional)
  let embeddingService: EmbeddingService | undefined;
  const embeddingConfig = features.embedding;

  if (embeddingConfig) {
    const provider =
      embeddingConfig.type === "gemini"
        ? new GeminiEmbeddingProvider(embeddingConfig, logger)
        : new OpenAIEmbeddingProvider(embeddingConfig, logger);

    embeddingService = new EmbeddingServiceImpl(provider, logger, embeddingConfig);

    logger.debug("Embedding service initialized", { provider: embeddingConfig.type });
  }

  // 2. Create the plugin function
  const plugin = (payloadConfig: Config): Config => {
    // Apply sync hooks to collections
    if (payloadConfig.collections && features.sync?.enabled) {
      payloadConfig.collections = applySyncHooks(
        payloadConfig.collections,
        config,
        adapter,
        embeddingService
      );

      logger.debug("Sync hooks applied to collections", {
        collectionsCount: Object.keys(collections).length,
      });
    }

    return payloadConfig;
  };

  return {
    plugin,
    embeddingService,
    adapter,
  };
}

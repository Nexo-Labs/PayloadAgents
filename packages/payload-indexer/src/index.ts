/**
 * @nexo-labs/payload-indexer
 *
 * Generic document indexing library for Payload CMS
 * with support for multiple search backends, embedding providers, and chunking strategies.
 */

// ============================================================================
// ADAPTER EXPORTS
// ============================================================================

export type {
  // Core adapter interface
  IndexerAdapter,
  // Schema types
  BaseCollectionSchema,
  IndexDocument,
  // Operation result types
  SyncResult,
  DeleteResult,
  VectorSearchOptions,
  AdapterSearchResult,
  // Type inference helper
  InferSchema,
} from "./adapter/index.js";

// ============================================================================
// EMBEDDING EXPORTS
// ============================================================================

// Types
export type {
  EmbeddingProvider,
  EmbeddingService,
  EmbeddingResult,
  BatchEmbeddingResult,
  EmbeddingUsage,
  EmbeddingProviderType,
  EmbeddingProviderConfig,
  OpenAIProviderConfig,
  GeminiProviderConfig,
  OpenAIEmbeddingModel,
  GeminiEmbeddingModel,
} from "./embedding/types.js";

export type { IndexableCollectionConfig } from "./plugin/types.js";
// Service
export { EmbeddingServiceImpl, createEmbeddingService } from "./embedding/service.js";

// Providers
export { OpenAIEmbeddingProvider } from "./embedding/providers/openai-provider.js";
export { GeminiEmbeddingProvider } from "./embedding/providers/gemini-provider.js";

// Chunking
export type { ChunkOptions, TextChunk } from "./embedding/chunking/types.js";
export { chunkText, shouldChunk } from "./embedding/chunking/strategies/text-chunker.js";
export { chunkMarkdown } from "./embedding/chunking/strategies/markdown-chunker.js";

// ============================================================================
// DOCUMENT EXPORTS
// ============================================================================

export type {
  FieldMapping,
  SourceField,
  ChunkingConfig,
  EmbeddingTableConfig,
  TableConfig,
  CollectionConfig,
  BaseDocument,
  PayloadDocument,
  IndexedDocument,
  ChunkDocument,
} from "./document/types.js";

export { mapPayloadDocumentToIndex } from "./document/field-mapper.js";

// ============================================================================
// CORE EXPORTS
// ============================================================================

// Constants
export {
  DEFAULT_EMBEDDING_DIMENSIONS,
  DEFAULT_EMBEDDING_MODEL,
  DEFAULT_GEMINI_EMBEDDING_MODEL,
  MAX_EMBEDDING_DIMENSIONS,
  DEFAULT_CHUNK_SIZE,
  DEFAULT_OVERLAP,
  MIN_CHUNK_SIZE,
  MAX_CHUNK_SIZE,
  MIN_EMBEDDING_TEXT_LENGTH,
} from "./core/config/constants.js";

// Logging
export type { LogLevel, LogContext, LoggerConfig } from "./core/logging/logger.js";
export {
  Logger,
  logger,
  configureLogger,
  createLogger,
  getLogger,
  setLogger,
} from "./core/logging/logger.js";

// Utilities
export {
  CHUNK_HEADER_SEPARATOR,
  formatChunkWithHeaders,
  parseChunkText,
  extractContentOnly,
  extractHeaderMetadata,
} from "./core/utils/chunk-format-utils.js";

export type { ChunkHeaderMetadata, ParsedChunk } from "./core/utils/chunk-format-utils.js";

export { buildHeaderHierarchy } from "./core/utils/header-utils.js";

export { transformLexicalToMarkdown } from "./core/utils/transforms.js";

// ============================================================================
// HOOKS EXPORTS
// ============================================================================

export type { SyncHookContext } from "./hooks/index.js";

// ============================================================================
// PLUGIN EXPORTS
// ============================================================================

// Main factory
export { createIndexerPlugin } from "./plugin/index.js";
export type { IndexerPluginResult } from "./plugin/index.js";

// Plugin types
export type {
  IndexerPluginConfig,
  IndexerFeatureConfig,
  SyncFeatureConfig,
  SearchFeatureConfig,
  SearchMode,
} from "./plugin/index.js";

// Sync utilities (for custom implementations)
export {
  syncDocumentToIndex,
  deleteDocumentFromIndex,
  DocumentSyncer,
  applySyncHooks,
} from "./plugin/index.js";

// Naming utilities
export { getIndexCollectionName } from "./plugin/index.js";

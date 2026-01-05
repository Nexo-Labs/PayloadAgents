/**
 * Plugin module exports
 */

// Main factory
export { createIndexerPlugin } from "./create-indexer-plugin.js";
export type { IndexerPluginResult } from "./create-indexer-plugin.js";

// Types
export type {
  IndexerPluginConfig,
  IndexerFeatureConfig,
  SyncFeatureConfig,
  SearchFeatureConfig,
  SearchMode,
} from "./types.js";

// Sync utilities (for custom implementations)
export {
  syncDocumentToIndex,
  deleteDocumentFromIndex,
  DocumentSyncer,
  applySyncHooks,
} from "./sync/index.js";

// Naming utilities
export { getIndexCollectionName } from "./utils/index.js";

import type { CollectionSlug } from "payload";
import type { EmbeddingProviderConfig, TypesenseConnectionConfig, RAGFeatureConfig } from "../../shared/types/plugin-types.js";
import type { TableConfig } from "@nexo-labs/payload-indexer";

// --- Search Feature Config ---

export type SearchMode = "semantic" | "keyword" | "hybrid";

export interface SearchDefaults {
  mode?: SearchMode;
  perPage?: number;
  tables?: string[];
}

export interface SearchFeatureConfig {
  enabled: boolean;
  defaults?: SearchDefaults;
}

// --- Sync Feature Config ---

export interface SyncFeatureConfig {
  enabled: boolean;
  autoSync?: boolean;
  batchSize?: number;
}

// --- Main Configuration ---

export interface FeatureFlags {
  embedding?: EmbeddingProviderConfig;
  search?: SearchFeatureConfig;
  rag?: RAGFeatureConfig;
  sync?: SyncFeatureConfig;
}

export interface ModularPluginConfig {
  typesense: TypesenseConnectionConfig;
  features: FeatureFlags;
  collections: Record<CollectionSlug | string, TableConfig[]>;
}

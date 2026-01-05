/**
 * Constants for payload-indexer
 * Centralizes all magic numbers and configuration defaults
 */

// ============================================================================
// EMBEDDING CONSTANTS
// ============================================================================

/**
 * Default dimensions for OpenAI text-embedding-3-large model
 */
export const DEFAULT_EMBEDDING_DIMENSIONS = 3072;

/**
 * Default OpenAI embedding model
 */
export const DEFAULT_EMBEDDING_MODEL = 'text-embedding-3-large';

/**
 * Default Gemini embedding model
 */
export const DEFAULT_GEMINI_EMBEDDING_MODEL = 'gemini-embedding-001';

/**
 * Maximum dimensions supported by embeddings (both OpenAI and Gemini support 3072)
 */
export const MAX_EMBEDDING_DIMENSIONS = 3072;

// ============================================================================
// CHUNKING CONSTANTS
// ============================================================================

/**
 * Default chunk size for text splitting (in characters)
 */
export const DEFAULT_CHUNK_SIZE = 1000;

/**
 * Default overlap for text splitting (in characters)
 */
export const DEFAULT_OVERLAP = 200;

/**
 * Minimum chunk size to prevent too-small chunks
 */
export const MIN_CHUNK_SIZE = 100;

/**
 * Maximum chunk size to prevent too-large chunks
 */
export const MAX_CHUNK_SIZE = 8000;

// ============================================================================
// VALIDATION CONSTANTS
// ============================================================================

/**
 * Minimum required text length for embedding generation
 */
export const MIN_EMBEDDING_TEXT_LENGTH = 1;

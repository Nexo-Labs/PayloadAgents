/**
 * Token Calculator and Cost Estimator
 * Utility functions for calculating token usage and estimating costs for AI services
 */

// OpenAI Pricing (as of 2025)
const PRICING = {
  'text-embedding-3-large': {
    input: 0.00013 / 1000, // per token
  },
  'gpt-4o-mini': {
    input: 0.15 / 1_000_000, // per token
    output: 0.60 / 1_000_000, // per token
  },
  'openai/gpt-4o-mini': {
    // Typesense format
    input: 0.15 / 1_000_000,
    output: 0.60 / 1_000_000,
  },
} as const

export type ServiceType = 'openai_embedding' | 'openai_llm'
export type ModelName = keyof typeof PRICING

export interface TokenUsage {
  input?: number
  output?: number
  total: number
}

export interface SpendingEntry {
  service: ServiceType
  model: string
  tokens: TokenUsage
  cost_usd?: number
  timestamp: string
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  sources?: Array<{
    id: string
    title: string
    chunk_index: number
    slug?: string
  }>
}

/**
 * Calculate the cost in USD for a given model and token usage
 */
export function calculateCost(model: string, tokens: TokenUsage): number {
  const pricing = PRICING[model as ModelName]

  if (!pricing) {
    console.warn(`[Token Calculator] No pricing data for model: ${model}`)
    return 0
  }

  let cost = 0

  // For models with input/output pricing (LLMs)
  if ('input' in pricing && 'output' in pricing) {
    cost += (tokens.input || 0) * pricing.input
    cost += (tokens.output || 0) * pricing.output
  }
  // For models with only input pricing (embeddings)
  else if ('input' in pricing) {
    cost += tokens.total * pricing.input
  }

  return cost
}

/**
 * Create a spending entry for embedding operations
 */
export function createEmbeddingSpending(
  model: string,
  tokens: number,
  timestamp?: Date
): SpendingEntry {
  const tokenUsage: TokenUsage = {
    input: tokens,
    total: tokens,
  }

  return {
    service: 'openai_embedding',
    model,
    tokens: tokenUsage,
    cost_usd: calculateCost(model, tokenUsage),
    timestamp: (timestamp || new Date()).toISOString(),
  }
}

/**
 * Create a spending entry for LLM operations
 */
export function createLLMSpending(
  model: string,
  inputTokens: number,
  outputTokens: number,
  timestamp?: Date
): SpendingEntry {
  const tokenUsage: TokenUsage = {
    input: inputTokens,
    output: outputTokens,
    total: inputTokens + outputTokens,
  }

  return {
    service: 'openai_llm',
    model,
    tokens: tokenUsage,
    cost_usd: calculateCost(model, tokenUsage),
    timestamp: (timestamp || new Date()).toISOString(),
  }
}

/**
 * Calculate total tokens from an array of spending entries
 */
export function calculateTotalTokens(spending: SpendingEntry[]): number {
  return spending.reduce((total, entry) => total + entry.tokens.total, 0)
}

/**
 * Calculate total cost from an array of spending entries
 */
export function calculateTotalCost(spending: SpendingEntry[]): number {
  return spending.reduce((total, entry) => total + (entry.cost_usd || 0), 0)
}

/**
 * Estimate tokens from text length (rough approximation: 1 token ≈ 4 characters)
 */
export function estimateTokensFromText(text: string): number {
  return Math.ceil(text.length / 4)
}

/**
 * Format cost in USD with appropriate precision
 */
export function formatCost(cost: number): string {
  if (cost < 0.01) {
    return `$${cost.toFixed(6)}`
  } else if (cost < 1) {
    return `$${cost.toFixed(4)}`
  } else {
    return `$${cost.toFixed(2)}`
  }
}

/**
 * Get spending breakdown by service
 */
export function getSpendingBreakdown(spending: SpendingEntry[]): {
  embedding: { tokens: number; cost: number }
  llm: { tokens: number; cost: number }
  total: { tokens: number; cost: number }
} {
  const breakdown = {
    embedding: { tokens: 0, cost: 0 },
    llm: { tokens: 0, cost: 0 },
    total: { tokens: 0, cost: 0 },
  }

  for (const entry of spending) {
    const tokens = entry.tokens.total
    const cost = entry.cost_usd || 0

    if (entry.service === 'openai_embedding') {
      breakdown.embedding.tokens += tokens
      breakdown.embedding.cost += cost
    } else if (entry.service === 'openai_llm') {
      breakdown.llm.tokens += tokens
      breakdown.llm.cost += cost
    }

    breakdown.total.tokens += tokens
    breakdown.total.cost += cost
  }

  return breakdown
}

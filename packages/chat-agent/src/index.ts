// Components
export { ChatProvider } from "./components/chat-context.js"
export { default as FloatingChatManager } from "./components/FloatingChatManager.js"

// Usage utilities (para plugins/backend)
export {
  checkTokenLimit,
  getUserDailyLimit,
  getCurrentDailyUsage,
  getUserUsageStats,
} from "./usage/limits.js"

export {
  calculateCost,
  createEmbeddingSpending,
  createLLMSpending,
  calculateTotalTokens,
  calculateTotalCost,
  estimateTokensFromText,
  formatCost,
  getSpendingBreakdown,
} from "./usage/token-calculator.js"
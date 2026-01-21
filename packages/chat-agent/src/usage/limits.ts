/**
 * Token Usage Limits and Quota Management
 * Utilities for managing daily token limits based on Stripe subscriptions
 */

import type { Payload } from 'payload'
import type { SpendingEntry } from './token-calculator.js'
import { BaseUser, CustomerInventory } from '@nexo-labs/payload-stripe-inventory'

// Stripe types
interface StripeSubscription {
  status: 'active' | 'trialing' | 'canceled' | 'incomplete' | 'incomplete_expired' | 'past_due' | 'unpaid' | 'paused'
  items?: {
    data: Array<{
      price?: {
        product?: {
          metadata?: Record<string, string>
        }
      }
    }>
  }
}

interface StripeCustomerWithInventory {
  inventory?: {
    subscriptions?: Record<string, StripeSubscription>
  }
}

interface ChatSessionWithSpending {
  spending?: SpendingEntry[]
}

// Default limits (fallback when no subscription is found)
const DEFAULT_LIMITS = {
  free: 1000, // 1K tokens/day for free users
  basic: 5000, // 5K tokens/day
  pro: 20000, // 20K tokens/day
  enterprise: 100000, // 100K tokens/day
} as const

export interface DailyTokenUsage {
  date: string // ISO date string (YYYY-MM-DD)
  tokens_used: number
  reset_at: string // ISO datetime string
}

export interface TokenLimitCheckResult {
  allowed: boolean
  limit: number
  used: number
  remaining: number
  reset_at: string
  message?: string
}

/**
 * Get the daily token limit for a user based on their Stripe subscription
 */
export async function getUserDailyLimit(
  payload: Payload,
  userId: string | number
): Promise<number> {
  try {
    const user = await payload.findByID({
      collection: 'users',
      id: userId,
      depth: 2, // Include customer and their inventory
    })

    if (!user) {
      console.warn('[Token Limits] User not found:', userId)
      return DEFAULT_LIMITS.free
    }

    // Check if user has a custom limit set manually
    const userTyped = user as BaseUser
    if (userTyped.daily_token_limit && userTyped.daily_token_limit > 0) {
      return userTyped.daily_token_limit
    }

    // Get limit from Stripe subscription
    const limitFromStripe = await getLimitFromStripeSubscription(user as BaseUser)
    if (limitFromStripe > 0) {
      return limitFromStripe
    }

    // Fallback to free tier
    return DEFAULT_LIMITS.free
  } catch (error) {
    console.error('[Token Limits] Error getting user limit:', error)
    return DEFAULT_LIMITS.free
  }
}

/**
 * Extract token limit from user's active Stripe subscription
 */
async function getLimitFromStripeSubscription(user: BaseUser): Promise<number> {
  try {
    // Check if user has a customer relationship
    const customer = user?.customer
    if (!customer || typeof customer === 'string' || typeof customer === 'number') {
      return 0
    }

    // Get inventory from customer
    const inventory = customer?.inventory as unknown as CustomerInventory
    if (!inventory || !inventory.subscriptions) {
      return 0
    }

    // Find active subscriptions
    const subscriptions = Object.values(inventory.subscriptions)
    const activeSubscription = subscriptions.find(
      (sub) => sub.status === 'active' || sub.status === 'trialing'
    )

    if (!activeSubscription) {
      return 0
    }

    // Get products from subscription items
    const items = activeSubscription.items?.data || []

    for (const item of items) {
      const product = item.price?.product
      if (!product) continue
      if (typeof product === 'string') continue
      if (product.deleted) continue

      // Check if product has metadata with daily_token_limit
      const metadata = product.metadata
      if (metadata && metadata.daily_token_limit) {
        const limit = parseInt(metadata.daily_token_limit, 10)
        if (!isNaN(limit) && limit > 0) {
          return limit
        }
      }
    }

    return 0
  } catch (error) {
    console.error('[Token Limits] Error extracting limit from Stripe:', error)
    return 0
  }
}

/**
 * Get the current daily usage for a user by querying chat-sessions
 * Counts tokens from spending entries that occurred today
 */
export async function getCurrentDailyUsage(
  payload: Payload,
  userId: string | number
): Promise<DailyTokenUsage> {
  const today = new Date()
  today.setUTCHours(0, 0, 0, 0)
  const todayStr = today.toISOString()

  const resetAt = getNextResetTime()

  try {
    // Query all sessions for this user
    // We can't filter by date in the query because we need to look inside the spending array
    const sessions = await payload.find({
      collection: 'chat-sessions',
      where: {
        user: {
          equals: userId,
        },
      },
      limit: 1000,
      pagination: false,
    })

    // Sum tokens from spending entries that occurred today
    let totalTokens = 0

    for (const session of sessions.docs) {
      const spending = (session as ChatSessionWithSpending).spending || []

      for (const entry of spending) {
        const entryDate = new Date(entry.timestamp)

        // Check if this spending entry is from today
        if (entryDate >= today) {
          totalTokens += entry.tokens.total || 0
        }
      }
    }

    return {
      date: today.toISOString().split('T')[0] ?? '',
      tokens_used: totalTokens,
      reset_at: resetAt.toISOString(),
    }
  } catch (error) {
    console.error('[Token Limits] Error calculating daily usage:', error)
    return {
      date: today.toISOString().split('T')[0] ?? '',
      tokens_used: 0,
      reset_at: resetAt.toISOString(),
    }
  }
}

/**
 * Get the next reset time (midnight UTC)
 */
function getNextResetTime(): Date {
  const now = new Date()
  const tomorrow = new Date(now)
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1)
  tomorrow.setUTCHours(0, 0, 0, 0)
  return tomorrow
}

/**
 * Check if a user can use the specified number of tokens
 */
export async function checkTokenLimit(
  payload: Payload,
  userId: string | number,
  tokensToUse: number
): Promise<TokenLimitCheckResult> {
  try {
    // Get limit and current usage
    const limit = await getUserDailyLimit(payload, userId)
    const currentUsage = await getCurrentDailyUsage(payload, userId)

    const remaining = Math.max(0, limit - currentUsage.tokens_used)
    const allowed = currentUsage.tokens_used + tokensToUse <= limit

    return {
      allowed,
      limit,
      used: currentUsage.tokens_used,
      remaining,
      reset_at: currentUsage.reset_at,
      message: allowed
        ? undefined
        : `Daily token limit exceeded. Resets at ${currentUsage.reset_at}`,
    }
  } catch (error) {
    console.error('[Token Limits] Error checking limit:', error)
    return {
      allowed: false,
      limit: 0,
      used: 0,
      remaining: 0,
      reset_at: new Date().toISOString(),
      message: 'Error checking token limit',
    }
  }
}

/**
 * Get usage statistics for a user (for display in UI)
 */
export async function getUserUsageStats(
  payload: Payload,
  userId: string | number
): Promise<{
  limit: number
  used: number
  remaining: number
  percentage: number
  reset_at: string
}> {
  const limit = await getUserDailyLimit(payload, userId)
  const currentUsage = await getCurrentDailyUsage(payload, userId)

  const remaining = Math.max(0, limit - currentUsage.tokens_used)
  const percentage = limit > 0 ? (currentUsage.tokens_used / limit) * 100 : 0

  return {
    limit,
    used: currentUsage.tokens_used,
    remaining,
    percentage: Math.min(100, percentage),
    reset_at: currentUsage.reset_at,
  }
}

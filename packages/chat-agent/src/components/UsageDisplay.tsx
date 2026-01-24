'use client'

import { motion } from 'framer-motion'
import { cn } from '../lib/utils.js'

interface UsageInfo {
  tokens_used: number
  cost_usd: number
  daily_limit: number
  daily_used: number
  daily_remaining: number
  reset_at: string
}

interface UsageDisplayProps {
  usageInfo: UsageInfo
  showCost?: boolean
}

/**
 * Component to display token usage and daily limits with animated progress bar
 */
export function UsageDisplay({ usageInfo, showCost = true }: UsageDisplayProps) {
  const usagePercentage = (usageInfo.daily_used / usageInfo.daily_limit) * 100
  const isWarning = usagePercentage > 50
  const isCritical = usagePercentage > 80

  const getGradient = () => {
    if (isCritical) {
      return 'from-red-500 via-red-400 to-red-600'
    }
    if (isWarning) {
      return 'from-yellow-500 via-yellow-400 to-orange-500'
    }
    return 'from-primary via-primary/80 to-primary'
  }

  const getGlowColor = () => {
    if (isCritical) return 'hsl(0 84% 60% / 0.3)'
    if (isWarning) return 'hsl(45 93% 47% / 0.3)'
    return 'hsl(var(--chat-accent) / 0.2)'
  }

  return (
    <motion.div
      className="border-t border-border px-4 py-3 bg-muted/30"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
        <div className="flex items-center space-x-4">
          <span>
            Uso diario:{' '}
            <motion.strong
              className="text-foreground"
              key={usageInfo.daily_used}
              initial={{ scale: 1.2, color: 'var(--primary)' }}
              animate={{ scale: 1, color: 'var(--foreground)' }}
              transition={{ duration: 0.3 }}
            >
              {usageInfo.daily_used.toLocaleString()}
            </motion.strong>{' '}
            / {usageInfo.daily_limit.toLocaleString()} tokens
          </span>
        </div>
        {showCost && (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            Costo: ${usageInfo.cost_usd.toFixed(6)}
          </motion.span>
        )}
      </div>
      <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
        <motion.div
          className={cn(
            "h-full rounded-full bg-gradient-to-r",
            getGradient()
          )}
          initial={{ width: 0 }}
          animate={{
            width: `${Math.min(usagePercentage, 100)}%`,
            boxShadow: `0 0 10px ${getGlowColor()}`
          }}
          transition={{
            width: { duration: 0.8, ease: [0.4, 0, 0.2, 1] },
            boxShadow: { duration: 0.3 }
          }}
        />
      </div>
      {isCritical && (
        <motion.p
          className="text-xs text-destructive mt-2 flex items-center gap-1"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <motion.span
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
          >
            !
          </motion.span>
          Estas cerca de alcanzar tu limite diario
        </motion.p>
      )}
    </motion.div>
  )
}

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
 * Component to display token usage and daily limits
 */
export function UsageDisplay({ usageInfo, showCost = true }: UsageDisplayProps) {
  const usagePercentage = (usageInfo.daily_used / usageInfo.daily_limit) * 100
  const isWarning = usagePercentage > 50
  const isCritical = usagePercentage > 80

  return (
    <div className="border-t border-gray-200 px-4 py-2 bg-gray-50">
      <div className="flex items-center justify-between text-xs text-gray-600">
        <div className="flex items-center space-x-4">
          <span>
            Uso diario: <strong>{usageInfo.daily_used.toLocaleString()}</strong> /{' '}
            {usageInfo.daily_limit.toLocaleString()} tokens
          </span>
        </div>
        {showCost && (
          <span className="text-gray-500">Costo: ${usageInfo.cost_usd.toFixed(6)}</span>
        )}
      </div>
      {/* Progress bar */}
      <div className="mt-2 w-full bg-gray-200 rounded-full h-1.5">
        <div
          className={`h-1.5 rounded-full transition-all ${
            isCritical ? 'bg-red-500' : isWarning ? 'bg-yellow-500' : 'bg-green-500'
          }`}
          style={{ width: `${Math.min(100, usagePercentage)}%` }}
        />
      </div>
    </div>
  )
}

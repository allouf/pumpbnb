'use client'

import { useMemo, useState, useEffect } from 'react'
import styles from './ATHProgressBar.module.css'

interface ATHProgressBarProps {
  currentMarketCap?: number // Current market cap in USD
  athMarketCap?: number // All-time high market cap in USD
  marketCapChange?: number // Percentage change (e.g., +35.94)
  // Legacy props for backwards compatibility
  currentPrice?: number
  athPrice?: number
  className?: string
  compact?: boolean
}

// Generate random sparkle properties
const generateSparkle = (index: number) => {
  const rotation = Math.floor(Math.random() * 360)
  const delay = Math.random()
  const speed = 0.2 + Math.random() * 0.6
  const travel = 10 + Math.floor(Math.random() * 40)
  // Gold/yellow hue range (20-60)
  const h = 20 + Math.floor(Math.random() * 40)
  const s = 50 + Math.floor(Math.random() * 50)
  const l = 50 + Math.floor(Math.random() * 50)

  return {
    rotation,
    delay,
    speed,
    travel,
    h,
    s,
    l,
  }
}

/**
 * ATHProgressBar - A progress bar showing how close the current market cap is to ATH
 * Inspired by pump.fun's animated ATH progress bar with sparkler effect
 *
 * Features:
 * - Gold pulsing border when price is near ATH (90%+)
 * - Sparkler/fire animation at the progress edge when at or near ATH
 * - Animated gradient fill
 * - Shimmer effect
 */
export function ATHProgressBar({
  currentMarketCap,
  athMarketCap,
  marketCapChange = 0,
  // Legacy props for backwards compatibility
  currentPrice,
  athPrice,
  className = '',
  compact = false
}: ATHProgressBarProps) {
  const [sparkles, setSparkles] = useState<ReturnType<typeof generateSparkle>[]>([])

  // Support both new (currentMarketCap) and legacy (currentPrice) props
  const currentValue = currentMarketCap ?? currentPrice ?? 0
  const athValue = athMarketCap ?? athPrice ?? currentValue

  // Generate sparkles on mount
  useEffect(() => {
    setSparkles(Array.from({ length: 50 }, (_, i) => generateSparkle(i)))
  }, [])

  // Calculate ATH percentage (capped at 100% for display)
  const athPercentage = useMemo(() => {
    if (!athValue || athValue <= 0) return 100 // No ATH recorded yet, show full
    return Math.min((currentValue / athValue) * 100, 100)
  }, [currentValue, athValue])

  // Determine animation state based on proximity to ATH
  const isNearATH = athPercentage >= 90 // Within 10% of ATH
  const isAtATH = athPercentage >= 99 // At or very close to ATH
  const isNewATH = currentValue > athValue && athValue > 0 // Above ATH (new record)

  // Should show sparkles (near ATH or at ATH)
  const showSparkles = isNearATH || isAtATH || isNewATH

  // Get gradient class based on ATH proximity
  const getGradientClass = () => {
    if (isNewATH || isAtATH) {
      return styles.gradientGold
    }
    if (isNearATH) {
      return styles.gradientGold
    }
    return styles.gradientNormal
  }

  // Format market cap for display
  const formatMC = (value: number) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(2)}M`
    }
    if (value >= 1000) {
      return `$${(value / 1000).toFixed(1)}K`
    }
    return `$${value.toFixed(2)}`
  }

  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      {/* MC Label and Value */}
      <div className="flex items-center gap-1 text-xs leading-normal">
        <span className="text-gray-400">MC</span>
        <div className={`font-semibold ${isNewATH ? 'text-yellow-400' : 'text-white'}`}>
          {formatMC(currentValue)}
        </div>
      </div>

      {/* Progress Bar Container */}
      <div className="cursor-help relative" title={`${athPercentage.toFixed(1)}% of ATH (${formatMC(athValue)})`}>
        <div className="relative flex w-full items-center gap-1">
          <div className="relative flex-1">
            {/* Progress Bar */}
            <div
              role="progressbar"
              aria-valuemax={100}
              aria-valuemin={0}
              aria-valuenow={athPercentage}
              className={`
                relative overflow-hidden rounded-full bg-gray-700
                ${compact ? 'h-2 w-16' : 'h-3 w-[210px]'}
                shrink-0
                ${showSparkles ? styles.animateBorderPulse : ''}
                ${showSparkles ? styles.borderGold : ''}
              `}
            >
              {/* Progress Fill with Gradient */}
              <div
                className={`
                  h-full flex-1 transition-all duration-500 ease-out
                  ${showSparkles ? styles.animatedGradient : ''}
                  ${getGradientClass()}
                `}
                style={{
                  width: `${athPercentage}%`,
                }}
              />
            </div>

            {/* Sparkler Effect - positioned at the edge of progress */}
            {showSparkles && (
              <div
                className="pointer-events-none absolute z-10 -translate-x-1/2 transform"
                style={{
                  left: `${athPercentage}%`,
                  top: compact ? '-2px' : '-6px',
                }}
              >
                <div className="pointer-events-none absolute">
                  <div className="absolute left-0 top-0">
                    {sparkles.map((sparkle, i) => (
                      <div
                        key={i}
                        className={styles.spark}
                        style={{
                          '--rotation': `${sparkle.rotation}deg`,
                          '--delay': sparkle.delay,
                          '--speed': sparkle.speed,
                          '--travel': sparkle.travel,
                          '--h': sparkle.h,
                          '--s': `${sparkle.s}%`,
                          '--l': `${sparkle.l}%`,
                        } as React.CSSProperties}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MC Change Indicator */}
      {marketCapChange !== 0 && (
        <button className="flex items-center">
          <div
            className={`
              inline-block text-xs font-medium leading-normal
              transition-all duration-300
              ${marketCapChange >= 0 ? 'text-green-400' : 'text-red-400'}
            `}
          >
            <div className="flex items-center">
              {/* Arrow */}
              <svg
                className={marketCapChange >= 0 ? 'rotate-0' : 'rotate-180'}
                aria-hidden="true"
                width="12px"
                height="12px"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M6 10L12 4L18 10M12 5V20"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span>{Math.abs(marketCapChange).toFixed(2)}%</span>
            </div>
          </div>
        </button>
      )}
    </div>
  )
}

/**
 * ATHProgressBarWithLabel - Same as ATHProgressBar but with ATH label
 */
export function ATHProgressBarWithLabel({
  currentMarketCap,
  athMarketCap,
  marketCapChange = 0,
  currentPrice,
  athPrice,
  showLabel = true,
  className = ''
}: ATHProgressBarProps & { showLabel?: boolean }) {
  // Support both new (currentMarketCap) and legacy (currentPrice) props
  const currentValue = currentMarketCap ?? currentPrice ?? 0
  const athValue = athMarketCap ?? athPrice ?? currentValue

  const athPercentage = useMemo(() => {
    if (!athValue || athValue <= 0) return 100
    return Math.min((currentValue / athValue) * 100, 100)
  }, [currentValue, athValue])

  const isNewATH = currentValue > athValue && athValue > 0

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {showLabel && (
        <span className={`text-xs font-medium ${
          isNewATH ? 'text-yellow-400' : 'text-gray-400'
        }`}>
          {isNewATH ? 'NEW ATH!' : 'ATH'}
        </span>
      )}
      <ATHProgressBar
        currentMarketCap={currentValue}
        athMarketCap={athValue}
        marketCapChange={marketCapChange}
      />
      {showLabel && (
        <span className={`text-xs ${
          athPercentage >= 90 ? 'text-yellow-400' : 'text-gray-500'
        }`}>
          {athPercentage.toFixed(0)}%
        </span>
      )}
    </div>
  )
}

/**
 * Mini ATH Progress - For token cards
 */
export function MiniATHProgress({
  currentMarketCap,
  athMarketCap,
  marketCapChange = 0,
  className = ''
}: {
  currentMarketCap: number
  athMarketCap: number
  marketCapChange?: number
  className?: string
}) {
  return (
    <ATHProgressBar
      currentMarketCap={currentMarketCap}
      athMarketCap={athMarketCap}
      marketCapChange={marketCapChange}
      compact={true}
      className={className}
    />
  )
}

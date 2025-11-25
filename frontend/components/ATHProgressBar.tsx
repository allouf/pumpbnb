'use client'

import { useMemo } from 'react'

interface ATHProgressBarProps {
  currentPrice: number
  athPrice: number
  className?: string
}

/**
 * ATHProgressBar - A mini progress bar showing how close the current price is to ATH
 * Inspired by pump.fun's animated ATH progress bar
 *
 * Animations activate when:
 * - Price is at or above 90% of ATH (near ATH - gold pulsing)
 * - Price is at new ATH (100%+ - celebration animation)
 */
export function ATHProgressBar({
  currentPrice,
  athPrice,
  className = ''
}: ATHProgressBarProps) {
  // Calculate ATH percentage (capped at 100% for display)
  const athPercentage = useMemo(() => {
    if (!athPrice || athPrice <= 0) return 100 // No ATH recorded yet, show full
    return Math.min((currentPrice / athPrice) * 100, 100)
  }, [currentPrice, athPrice])

  // Determine animation state based on proximity to ATH
  const isNearATH = athPercentage >= 90 // Within 10% of ATH
  const isNewATH = currentPrice > athPrice && athPrice > 0 // Above ATH (new record)

  // Get color scheme based on ATH proximity
  const getColorScheme = () => {
    if (isNewATH) {
      return {
        gradient: 'from-yellow-400 via-amber-300 to-yellow-500',
        glow: 'shadow-[0_0_12px_rgba(250,204,21,0.8)]',
        border: 'border-yellow-400',
        bgGlow: 'bg-yellow-400/20'
      }
    }
    if (isNearATH) {
      return {
        gradient: 'from-amber-400 via-yellow-300 to-amber-500',
        glow: 'shadow-[0_0_8px_rgba(245,158,11,0.6)]',
        border: 'border-amber-400',
        bgGlow: 'bg-amber-400/10'
      }
    }
    return {
      gradient: 'from-gray-500 to-gray-400',
      glow: '',
      border: 'border-gray-600',
      bgGlow: ''
    }
  }

  const colors = getColorScheme()

  return (
    <div className={`relative ${className}`}>
      {/* Progress bar container */}
      <div
        className={`
          relative overflow-hidden rounded-full bg-gray-700 h-2.5 w-64 shrink-0
          ${isNearATH || isNewATH ? 'animate-border-pulse' : ''}
          ${colors.border}
          ${colors.glow}
          transition-all duration-300
        `}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={athPercentage}
        title={`${athPercentage.toFixed(1)}% of ATH`}
      >
        {/* Progress fill with gradient */}
        <div
          className={`
            h-full flex-1 transition-all duration-500 ease-out rounded-full
            bg-gradient-to-r ${colors.gradient}
            ${isNearATH || isNewATH ? 'animate-gradient-shift bg-[length:200%_200%]' : ''}
          `}
          style={{
            width: `${athPercentage}%`,
            transform: 'translateX(0%)'
          }}
        />

        {/* Animated shimmer effect for near/at ATH */}
        {(isNearATH || isNewATH) && (
          <div
            className="absolute inset-0 animate-ath-shimmer bg-[length:200%_100%]"
            style={{
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
              backgroundSize: '200% 100%'
            }}
          />
        )}

        {/* Sparkle particles for new ATH */}
        {isNewATH && (
          <div className="absolute inset-0 overflow-hidden">
            <div
              className="absolute w-1 h-1 bg-white rounded-full animate-sparkle"
              style={{ top: '25%', left: '30%' }}
            />
            <div
              className="absolute w-0.5 h-0.5 bg-yellow-200 rounded-full animate-sparkle"
              style={{ top: '60%', left: '60%', animationDelay: '0.3s' }}
            />
            <div
              className="absolute w-1 h-1 bg-white rounded-full animate-sparkle"
              style={{ top: '40%', left: '80%', animationDelay: '0.6s' }}
            />
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * ATHProgressBarWithLabel - Same as ATHProgressBar but with a label
 */
export function ATHProgressBarWithLabel({
  currentPrice,
  athPrice,
  showLabel = true,
  className = ''
}: ATHProgressBarProps & { showLabel?: boolean }) {
  const athPercentage = useMemo(() => {
    if (!athPrice || athPrice <= 0) return 100
    return Math.min((currentPrice / athPrice) * 100, 100)
  }, [currentPrice, athPrice])

  const isNewATH = currentPrice > athPrice && athPrice > 0

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
        currentPrice={currentPrice}
        athPrice={athPrice}
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

'use client'

import { useState, useEffect } from 'react'
import { useUsdPrice, asterToUsd, formatUsdPrice } from '@/lib/hooks/useUsdPrice'

interface DualProgressBarsProps {
  asterReserves: number
  tokenSymbol: string
  currentPrice: number
  athPrice?: number
  className?: string
}

export function DualProgressBars({ 
  asterReserves, 
  tokenSymbol, 
  currentPrice, 
  athPrice = 0,
  className = "" 
}: DualProgressBarsProps) {
  const { usdRate } = useUsdPrice()
  const [animatingProgress, setAnimatingProgress] = useState(false)
  const [animatingAth, setAnimatingAth] = useState(false)

  // Bonding Curve Progress (0 to 100 ASTER)
  const graduationTarget = 100
  const bondingProgress = Math.min((asterReserves / graduationTarget) * 100, 100)
  
  // ATH Progress (0 to current ATH or current price if no ATH)
  const effectiveAth = Math.max(athPrice, currentPrice)
  const athProgress = athPrice > 0 ? (currentPrice / athPrice) * 100 : 100
  
  const marketCapUsd = asterToUsd(asterReserves, usdRate)

  // Animation triggers
  useEffect(() => {
    if (bondingProgress > 0) {
      setAnimatingProgress(true)
      const timer = setTimeout(() => setAnimatingProgress(false), 2000)
      return () => clearTimeout(timer)
    }
  }, [bondingProgress])

  useEffect(() => {
    if (currentPrice >= athPrice && athPrice > 0) {
      setAnimatingAth(true)
      const timer = setTimeout(() => setAnimatingAth(false), 3000)
      return () => clearTimeout(timer)
    }
  }, [currentPrice, athPrice])

  const isGraduated = bondingProgress >= 100
  const isNewAth = currentPrice >= athPrice && athPrice > 0

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Bonding Curve Progress */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold text-white">
              Bonding Curve Progress
            </h3>
            <p className="text-sm text-gray-400">
              Path to PancakeSwap listing
            </p>
          </div>
          <div className="text-right">
            <div className="text-xl font-bold text-primary">
              {bondingProgress.toFixed(1)}%
            </div>
            <div className="text-xs text-gray-400">
              {asterReserves.toFixed(2)} / {graduationTarget} ASTER
            </div>
          </div>
        </div>

        {/* Progress Bar Container - Increased height from h-4 to h-8 */}
        <div className="relative">
          <div className="w-full bg-gray-800 rounded-full h-8 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-1000 ease-out ${
                isGraduated
                  ? 'bg-gradient-to-r from-green-400 via-emerald-400 to-green-500'
                  : 'bg-gradient-to-r from-primary via-yellow-400 to-primary'
              } ${animatingProgress ? 'animate-pulse' : ''}`}
              style={{ 
                width: `${bondingProgress}%`,
                boxShadow: isGraduated 
                  ? '0 0 20px rgba(34, 197, 94, 0.5)' 
                  : '0 0 15px rgba(255, 215, 0, 0.3)'
              }}
            >
              {/* Animated sparkles */}
              {bondingProgress > 10 && (
                <div className="absolute inset-0 overflow-hidden">
                  <div className="absolute top-1 left-1/4 w-1 h-1 bg-white rounded-full animate-ping" 
                       style={{ animationDelay: '0s', animationDuration: '2s' }} />
                  <div className="absolute top-2 right-1/3 w-0.5 h-0.5 bg-white rounded-full animate-ping"
                       style={{ animationDelay: '0.5s', animationDuration: '2s' }} />
                  <div className="absolute bottom-1 left-1/2 w-1 h-1 bg-white rounded-full animate-ping"
                       style={{ animationDelay: '1s', animationDuration: '2s' }} />
                </div>
              )}
            </div>
          </div>

          {/* Milestone markers - Adjusted for new h-8 height */}
          <div className="absolute top-0 w-full h-8">
            {[25, 50, 75].map((milestone) => (
              <div
                key={milestone}
                className="absolute top-0 h-full w-0.5 bg-gray-600"
                style={{ left: `${milestone}%` }}
              >
                <div className="absolute -top-6 -translate-x-1/2 text-xs text-gray-500">
                  {milestone}%
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Status indicators */}
        <div className="flex justify-between text-xs">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${
              asterReserves > 0 ? 'bg-green-500' : 'bg-gray-500'
            }`} />
            <span className="text-gray-400">Active Trading</span>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-gray-400">Market Cap:</span>
            <span className="font-semibold text-primary">
              {formatUsdPrice(marketCapUsd)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${
              isGraduated ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'
            }`} />
            <span className="text-gray-400">
              {isGraduated ? 'Graduated!' : 'Pre-launch'}
            </span>
          </div>
        </div>
      </div>

      {/* ATH Progress */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold text-white">
              All-Time High
            </h3>
            <p className="text-sm text-gray-400">
              Price performance tracker
            </p>
          </div>
          <div className="text-right">
            <div className={`text-xl font-bold ${
              isNewAth ? 'text-green-500 animate-pulse' : 'text-orange-400'
            }`}>
              {athProgress.toFixed(1)}%
            </div>
            <div className="text-xs text-gray-400">
              Current: {currentPrice.toFixed(8)} ASTER
            </div>
            {effectiveAth > 0 && (
              <div className="text-xs text-gray-400">
                ATH: {effectiveAth.toFixed(8)} ASTER
              </div>
            )}
          </div>
        </div>

        {/* ATH Progress Bar - Increased height to h-8 to match bonding curve */}
        <div className="relative">
          <div className="w-full bg-gray-800 rounded-full h-8 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-1000 ease-out ${
                isNewAth
                  ? 'bg-gradient-to-r from-green-400 to-emerald-500 animate-pulse'
                  : athProgress >= 90
                  ? 'bg-gradient-to-r from-orange-400 to-red-500'
                  : 'bg-gradient-to-r from-blue-400 to-purple-500'
              } ${animatingAth ? 'animate-pulse' : ''}`}
              style={{ 
                width: `${Math.min(athProgress, 100)}%`,
                boxShadow: isNewAth 
                  ? '0 0 20px rgba(34, 197, 94, 0.6)' 
                  : '0 0 10px rgba(156, 163, 175, 0.2)'
              }}
            >
              {/* New ATH celebration effects */}
              {isNewAth && (
                <div className="absolute inset-0 overflow-hidden">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className="absolute w-1 h-1 bg-white rounded-full animate-ping"
                      style={{
                        top: `${Math.random() * 100}%`,
                        left: `${Math.random() * 100}%`,
                        animationDelay: `${i * 0.2}s`,
                        animationDuration: '1.5s'
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ATH marker - Adjusted for new h-8 height */}
          {athProgress < 100 && (
            <div className="absolute top-0 right-0 h-8 flex items-center">
              <div className="w-0.5 h-full bg-orange-500" />
              <div className="absolute -top-6 right-0 text-xs text-orange-500 font-semibold">
                ATH
              </div>
            </div>
          )}
        </div>

        {/* ATH Status */}
        <div className="flex justify-between items-center text-xs">
          <div className="flex items-center gap-2">
            {isNewAth ? (
              <>
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-green-400 font-semibold">🎉 NEW ALL-TIME HIGH!</span>
              </>
            ) : (
              <>
                <div className="w-2 h-2 rounded-full bg-orange-500" />
                <span className="text-gray-400">
                  {athProgress >= 80 ? 'Near ATH' : 'Below ATH'}
                </span>
              </>
            )}
          </div>
          
          <div className="text-gray-400">
            {athPrice > 0 && !isNewAth && (
              <span>
                {((effectiveAth - currentPrice) / effectiveAth * 100).toFixed(1)}% from ATH
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Combined Status Banner */}
      {(isGraduated || isNewAth) && (
        <div className={`p-4 rounded-xl border-2 ${
          isGraduated 
            ? 'bg-green-500/10 border-green-500/50 text-green-400'
            : 'bg-orange-500/10 border-orange-500/50 text-orange-400'
        }`}>
          <div className="flex items-center justify-center gap-2 text-sm font-semibold">
            {isGraduated && (
              <>
                🎓 <span>Congratulations! {tokenSymbol} has graduated to PancakeSwap!</span>
              </>
            )}
            {isNewAth && !isGraduated && (
              <>
                🚀 <span>New All-Time High Reached!</span>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
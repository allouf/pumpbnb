'use client'

import { useState, useEffect, useMemo } from 'react'
import { useUsdPrice, asterToUsd, formatUsdPrice } from '@/lib/hooks/useUsdPrice'
import { useATHTracking, getATHBadge } from '@/lib/hooks/useATHTracking'
import { ATHProgressBar } from './ATHProgressBar'

interface ChartStatsHeaderProps {
  tokenSymbol: string
  tokenAddress: string
  currentPrice: number
  priceChange24h: number
  volume24h: number
  high24h: number
  low24h: number
  marketCap: number
  transactions: any[]
  className?: string
}

export function ChartStatsHeader({
  tokenSymbol,
  tokenAddress,
  currentPrice,
  priceChange24h,
  volume24h,
  high24h,
  low24h,
  marketCap,
  transactions,
  className = ''
}: ChartStatsHeaderProps) {
  const { usdRate } = useUsdPrice()
  const [showUsd, setShowUsd] = useState(false)
  const [priceHistory, setPriceHistory] = useState<{ price: number; timestamp: number }[]>([])
  
  const athData = useATHTracking({
    tokenAddress,
    currentPrice,
    currentVolume: volume24h,
    transactions
  })

  // Track price changes for real-time updates
  useEffect(() => {
    if (currentPrice > 0) {
      setPriceHistory(prev => {
        const now = Date.now()
        const newHistory = [...prev, { price: currentPrice, timestamp: now }]
        // Keep only last 50 price points for mini chart
        return newHistory.slice(-50)
      })
    }
  }, [currentPrice])

  // Calculate additional metrics
  const metrics = useMemo(() => {
    const marketCapUsd = asterToUsd(marketCap, usdRate)
    const volumeUsd = asterToUsd(volume24h, usdRate)
    const currentPriceUsd = asterToUsd(currentPrice, usdRate)
    const high24hUsd = asterToUsd(high24h, usdRate)
    const low24hUsd = asterToUsd(low24h, usdRate)

    // Calculate Fully Diluted Valuation (assuming max supply)
    const maxSupply = 1000000000 // 1B tokens assumption
    const fdv = currentPrice * maxSupply
    const fdvUsd = asterToUsd(fdv, usdRate)

    // Price volatility (based on 24h range)
    const volatility = high24h > low24h ? ((high24h - low24h) / low24h) * 100 : 0

    return {
      marketCapUsd,
      volumeUsd,
      currentPriceUsd,
      high24hUsd,
      low24hUsd,
      fdv,
      fdvUsd,
      volatility,
    }
  }, [marketCap, volume24h, currentPrice, high24h, low24h, usdRate])

  const athBadge = getATHBadge(athData.percentFromATH)
  
  // Get price trend arrow
  const getPriceTrend = () => {
    if (priceHistory.length < 2) return '→'
    const recent = priceHistory.slice(-5)
    const trend = recent[recent.length - 1].price - recent[0].price
    if (trend > 0) return '↗'
    if (trend < 0) return '↘'
    return '→'
  }

  return (
    <div className={`bg-gray-900 border-b border-gray-800 ${className}`}>
      {/* Main Stats Row */}
      <div className="px-6 py-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          {/* Token & Price Section */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-white">
                {tokenSymbol}
              </h1>
              <button
                onClick={() => setShowUsd(!showUsd)}
                className="px-2 py-1 text-xs bg-gray-800 hover:bg-gray-700 rounded-md transition"
                title="Toggle USD/ASTER display"
              >
                {showUsd ? 'USD' : 'ASTER'}
              </button>
            </div>

            {/* Current Price */}
            <div className="flex items-center gap-2">
              <span className={`text-3xl font-bold ${priceChange24h >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {showUsd 
                  ? formatUsdPrice(metrics.currentPriceUsd)
                  : currentPrice.toFixed(8)
                }
              </span>
              <span className="text-xl text-gray-400">
                {getPriceTrend()}
              </span>
            </div>

            {/* 24h Change */}
            <div className={`px-3 py-1 rounded-lg text-sm font-semibold ${
              priceChange24h >= 0 
                ? 'bg-green-500/20 text-green-400' 
                : 'bg-red-500/20 text-red-400'
            }`}>
              {priceChange24h >= 0 ? '+' : ''}{priceChange24h.toFixed(2)}%
            </div>

            {/* ATH Badge with Progress Bar */}
            {athData.currentATH && (
              <div className="flex items-center gap-2">
                <ATHProgressBar
                  currentPrice={currentPrice}
                  athPrice={athData.currentATH.price}
                />
                <div className={`px-2 py-1 rounded-lg text-xs font-medium border ${
                  athBadge.color === 'green' ? 'border-green-500/50 bg-green-500/10 text-green-400' :
                  athBadge.color === 'yellow' ? 'border-yellow-500/50 bg-yellow-500/10 text-yellow-400' :
                  athBadge.color === 'orange' ? 'border-orange-500/50 bg-orange-500/10 text-orange-400' :
                  athBadge.color === 'red' ? 'border-red-500/50 bg-red-500/10 text-red-400' :
                  'border-gray-500/50 bg-gray-500/10 text-gray-400'
                }`}>
                  {athBadge.emoji} {athBadge.text}
                </div>
              </div>
            )}
          </div>

          {/* Mini Sparkline */}
          <div className="flex items-center gap-4">
            {priceHistory.length > 1 && (
              <div className="w-32 h-8 relative">
                <MiniSparkline 
                  data={priceHistory} 
                  color={priceChange24h >= 0 ? '#10b981' : '#ef4444'}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Detailed Metrics Row */}
      <div className="px-6 py-3 bg-gray-950 border-t border-gray-800">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
          {/* Market Cap */}
          <div className="text-center">
            <p className="text-xs text-gray-500 mb-1">Market Cap</p>
            <p className="font-bold text-primary">
              {showUsd ? formatUsdPrice(metrics.marketCapUsd) : `${marketCap.toFixed(2)} ASTER`}
            </p>
          </div>

          {/* 24h Volume */}
          <div className="text-center">
            <p className="text-xs text-gray-500 mb-1">24h Volume</p>
            <p className="font-semibold text-white">
              {showUsd ? formatUsdPrice(metrics.volumeUsd) : `${volume24h.toFixed(2)} ASTER`}
            </p>
          </div>

          {/* 24h High/Low */}
          <div className="text-center">
            <p className="text-xs text-gray-500 mb-1">24h Range</p>
            <div className="text-xs">
              <span className="text-green-400">
                {showUsd ? formatUsdPrice(metrics.high24hUsd) : high24h.toFixed(6)}
              </span>
              <span className="text-gray-500 mx-1">-</span>
              <span className="text-red-400">
                {showUsd ? formatUsdPrice(metrics.low24hUsd) : low24h.toFixed(6)}
              </span>
            </div>
          </div>

          {/* FDV */}
          <div className="text-center">
            <p className="text-xs text-gray-500 mb-1">FDV</p>
            <p className="font-semibold text-white text-sm">
              {showUsd ? formatUsdPrice(metrics.fdvUsd) : `${metrics.fdv.toFixed(0)} ASTER`}
            </p>
          </div>

          {/* ATH Info */}
          <div className="text-center">
            <p className="text-xs text-gray-500 mb-1">All-Time High</p>
            {athData.currentATH ? (
              <div className="text-xs">
                <div className="font-semibold text-orange-400">
                  {showUsd 
                    ? formatUsdPrice(asterToUsd(athData.currentATH.price, usdRate))
                    : athData.currentATH.price.toFixed(6)
                  }
                </div>
                {athData.daysFromATH > 0 && (
                  <div className="text-gray-500">
                    {athData.daysFromATH}d ago
                  </div>
                )}
              </div>
            ) : (
              <p className="text-gray-500 text-xs">Not set</p>
            )}
          </div>

          {/* Volatility */}
          <div className="text-center">
            <p className="text-xs text-gray-500 mb-1">24h Volatility</p>
            <p className={`font-semibold text-sm ${
              metrics.volatility > 20 ? 'text-red-400' :
              metrics.volatility > 10 ? 'text-orange-400' :
              'text-green-400'
            }`}>
              {metrics.volatility.toFixed(1)}%
            </p>
          </div>
        </div>
      </div>

      {/* New ATH Celebration Banner */}
      {athData.isNewATH && (
        <div className="px-6 py-3 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-t border-green-500/50 animate-pulse">
          <div className="flex items-center justify-center gap-3 text-green-400 font-bold">
            <span className="text-2xl">🚀</span>
            <span>NEW ALL-TIME HIGH REACHED!</span>
            <span className="text-2xl">🚀</span>
          </div>
        </div>
      )}
    </div>
  )
}

// Mini sparkline component
function MiniSparkline({ data, color }: { data: { price: number; timestamp: number }[], color: string }) {
  if (data.length < 2) return null

  const prices = data.map(d => d.price)
  const minPrice = Math.min(...prices)
  const maxPrice = Math.max(...prices)
  const priceRange = maxPrice - minPrice

  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * 100
    const y = priceRange > 0 ? 100 - ((d.price - minPrice) / priceRange) * 100 : 50
    return `${x},${y}`
  }).join(' ')

  return (
    <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="2"
        points={points}
        className="opacity-80"
      />
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="1"
        points={points}
        className="opacity-40 animate-pulse"
      />
    </svg>
  )
}
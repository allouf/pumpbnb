'use client'

import { useMemo } from 'react'

interface MiniSparklineProps {
  priceChange24h?: string | number
  // Optional real price data for accurate sparklines
  priceHistory?: number[]
  // Token address for deterministic pseudo-random pattern
  tokenAddress?: string
  width?: number
  height?: number
  className?: string
}

// Simple hash function for deterministic pseudo-random generation
function simpleHash(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32bit integer
  }
  return Math.abs(hash)
}

/**
 * MiniSparkline - A simple SVG sparkline for token list view
 * Uses real price history if available, otherwise generates a representative line
 * based on 24h change with deterministic pattern per token
 */
export function MiniSparkline({
  priceChange24h = 0,
  priceHistory,
  tokenAddress = '',
  width = 64,
  height = 32,
  className = '',
}: MiniSparklineProps) {
  const change = typeof priceChange24h === 'string'
    ? parseFloat(priceChange24h) || 0
    : priceChange24h

  // Determine color based on price change
  const isPositive = change >= 0
  const strokeColor = isPositive ? '#86EFAC' : '#FCA5A5' // green-300 or red-300

  // Use stable gradient ID based on token address
  const gradientId = useMemo(() =>
    `gradient-${tokenAddress ? simpleHash(tokenAddress).toString(36) : Math.random().toString(36).substr(2, 9)}`,
    [tokenAddress]
  )

  // Generate sparkline path data
  const { pathData, areaPath } = useMemo(() => {
    const padding = 5
    const chartWidth = width - padding * 2
    const chartHeight = height - padding * 2

    let points: { x: number; y: number }[] = []

    // If real price history is provided, use it
    if (priceHistory && priceHistory.length > 1) {
      const minPrice = Math.min(...priceHistory)
      const maxPrice = Math.max(...priceHistory)
      const priceRange = maxPrice - minPrice || 1 // Avoid division by zero

      points = priceHistory.map((price, i) => {
        const x = padding + (i / (priceHistory.length - 1)) * chartWidth
        // Normalize price to chart height (invert Y - higher price = lower Y)
        const normalizedPrice = (price - minPrice) / priceRange
        const y = padding + chartHeight * (1 - normalizedPrice)
        return { x, y }
      })
    } else {
      // Generate pseudo-random but deterministic points based on token address and price change
      const numPoints = 12

      // Use token address hash for deterministic seed, fall back to change value
      const seed = tokenAddress ? simpleHash(tokenAddress) : Math.abs(change * 1000) % 100

      for (let i = 0; i < numPoints; i++) {
        const x = padding + (i / (numPoints - 1)) * chartWidth

        // Create a wave pattern with overall trend based on price change
        const progress = i / (numPoints - 1)

        // Determine trend direction and magnitude based on price change
        let trendY: number
        const changeMagnitude = Math.min(Math.abs(change), 100) / 100 // Normalize to 0-1

        if (isPositive) {
          // Upward trend - starts low, ends high
          const baseProgress = 0.7 - progress * 0.5 * (1 + changeMagnitude)
          trendY = chartHeight * Math.max(0.1, Math.min(0.9, baseProgress))
        } else {
          // Downward trend - starts high, ends low
          const baseProgress = 0.3 + progress * 0.5 * (1 + changeMagnitude)
          trendY = chartHeight * Math.max(0.1, Math.min(0.9, baseProgress))
        }

        // Add deterministic variation based on seed
        const seedVariation = ((seed + i * 17) % 100) / 100
        const variation = Math.sin(i * 1.5 + seedVariation * 6.28) * (chartHeight * 0.12)
        const noise = Math.cos(i * 2.7 + seedVariation * 3.14) * (chartHeight * 0.06)

        const y = padding + Math.max(0, Math.min(chartHeight, trendY + variation + noise))
        points.push({ x, y })
      }
    }

    // Create SVG path
    if (points.length === 0) {
      return { pathData: '', areaPath: '' }
    }

    // Line path
    const pathData = points.reduce((path, point, index) => {
      if (index === 0) return `M${point.x},${point.y}`
      return `${path}L${point.x},${point.y}`
    }, '')

    // Area path (for gradient fill)
    const areaPath = pathData +
      `L${points[points.length - 1].x},${height - padding}` +
      `L${points[0].x},${height - padding}Z`

    return { pathData, areaPath }
  }, [change, width, height, isPositive, priceHistory, tokenAddress])

  return (
    <div className={`w-16 h-8 ${className}`}>
      <svg
        className="recharts-surface"
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        style={{ width: '100%', height: '100%' }}
      >
        <defs>
          <clipPath id={`clip-${gradientId}`}>
            <rect x="5" y="5" height={height - 10} width={width - 10} />
          </clipPath>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={strokeColor} stopOpacity={0.6} />
            <stop offset="100%" stopColor={strokeColor} stopOpacity={0} />
          </linearGradient>
        </defs>

        {/* Area fill with gradient */}
        <path
          fill={`url(#${gradientId})`}
          fillOpacity={0.4}
          stroke="none"
          d={areaPath}
        />

        {/* Line stroke */}
        <path
          stroke={strokeColor}
          strokeWidth={1.5}
          fill="none"
          d={pathData}
        />
      </svg>
    </div>
  )
}

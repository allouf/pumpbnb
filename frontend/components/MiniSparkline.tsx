'use client'

import { useMemo } from 'react'

interface MiniSparklineProps {
  priceChange24h?: string | number
  width?: number
  height?: number
  className?: string
}

/**
 * MiniSparkline - A simple SVG sparkline for token list view
 * Generates a representative price line based on 24h change
 */
export function MiniSparkline({
  priceChange24h = 0,
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
  const gradientId = `gradient-${Math.random().toString(36).substr(2, 9)}`

  // Generate sparkline path data
  const { pathData, areaPath } = useMemo(() => {
    const padding = 5
    const chartWidth = width - padding * 2
    const chartHeight = height - padding * 2

    // Generate pseudo-random but deterministic points based on price change
    // This creates a realistic-looking sparkline
    const numPoints = 12
    const points: { x: number; y: number }[] = []

    // Seed for pseudo-random generation based on change value
    const seed = Math.abs(change * 1000) % 100

    for (let i = 0; i < numPoints; i++) {
      const x = padding + (i / (numPoints - 1)) * chartWidth

      // Create a wave pattern with overall trend based on price change
      const progress = i / (numPoints - 1)
      const trendY = isPositive
        ? chartHeight * (1 - progress * 0.6) // Trend upward (lower Y = higher on screen)
        : chartHeight * (0.3 + progress * 0.5) // Trend downward

      // Add some natural-looking variation
      const variation = Math.sin(i * 1.5 + seed) * (chartHeight * 0.15)
      const noise = Math.cos(i * 2.7 + seed * 0.5) * (chartHeight * 0.08)

      const y = padding + Math.max(0, Math.min(chartHeight, trendY + variation + noise))
      points.push({ x, y })
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
  }, [change, width, height, isPositive])

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

'use client'

import { useEffect, useRef, useState } from 'react'
import { createChart, ColorType, IChartApi, AreaSeries, HistogramSeries, UTCTimestamp, CrosshairMode } from 'lightweight-charts'
import { useTransactionHistory } from '@/lib/hooks/useTransactionHistory'

interface PriceChartProps {
  bondingCurveAddress: string
  tokenSymbol: string
}

export function PriceChart({ bondingCurveAddress, tokenSymbol }: PriceChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const priceSeriesRef = useRef<any>(null)
  const volumeSeriesRef = useRef<any>(null)
  const [hoveredData, setHoveredData] = useState<{price: number, volume: number, time: string} | null>(null)
  const { transactions, isLoading } = useTransactionHistory(bondingCurveAddress)

  console.log(`[PriceChart] Rendering with ${transactions.length} transactions, isLoading: ${isLoading}`)

  // Create chart only once on mount
  useEffect(() => {
    if (!chartContainerRef.current) {
      console.log('[PriceChart] Container ref not ready, skipping chart creation')
      return
    }

    // Don't create chart if it already exists
    if (chartRef.current) {
      console.log('[PriceChart] Chart already exists, skipping creation')
      return
    }

    console.log('[PriceChart] Creating chart instance (one-time setup)')
    console.log('[PriceChart] Container width:', chartContainerRef.current.clientWidth)

    // Create chart with enhanced configuration
    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: '#1E2329' },
        textColor: '#9CA3AF',
      },
      grid: {
        vertLines: { color: '#2B3139' },
        horzLines: { color: '#2B3139' },
      },
      width: chartContainerRef.current.clientWidth,
      height: 500,
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          width: 1,
          color: '#758696',
          style: 3,
          labelBackgroundColor: '#F0B90B',
        },
        horzLine: {
          width: 1,
          color: '#758696',
          style: 3,
          labelBackgroundColor: '#F0B90B',
        },
      },
      timeScale: {
        timeVisible: true,
        secondsVisible: true,
        borderColor: '#2B3139',
        rightOffset: 5,
      },
      rightPriceScale: {
        borderColor: '#2B3139',
        scaleMargins: {
          top: 0.05,
          bottom: 0.35,
        },
      },
    })

    chartRef.current = chart
    console.log('[PriceChart] Chart instance created successfully')

    // Add price series (Area chart) using v5 API
    const priceSeries = chart.addSeries(AreaSeries, {
      lineColor: '#F0B90B',
      topColor: 'rgba(240, 185, 11, 0.4)',
      bottomColor: 'rgba(240, 185, 11, 0.0)',
      lineWidth: 3,
      priceFormat: {
        type: 'price',
        precision: 8,
        minMove: 0.00000001,
      },
    })

    priceSeriesRef.current = priceSeries
    console.log('[PriceChart] Price series added')

    // Add volume series (Histogram) using v5 API
    const volumeSeries = chart.addSeries(HistogramSeries, {
      color: '#26a69a',
      priceFormat: {
        type: 'volume',
      },
      priceScaleId: 'volume',
    })

    volumeSeriesRef.current = volumeSeries
    console.log('[PriceChart] Volume series added')

    // Configure volume scale - keep it small at the bottom
    chart.priceScale('volume').applyOptions({
      scaleMargins: {
        top: 0.85,
        bottom: 0,
      },
    })

    // Add crosshair move handler for tooltips
    chart.subscribeCrosshairMove((param) => {
      if (!param.time || !param.point) {
        setHoveredData(null)
        return
      }

      // Use refs to get current series (important for updates)
      if (!priceSeriesRef.current || !volumeSeriesRef.current) {
        return
      }

      const priceData = param.seriesData.get(priceSeriesRef.current) as any
      const volumeData = param.seriesData.get(volumeSeriesRef.current) as any

      if (priceData && volumeData) {
        const date = new Date((param.time as number) * 1000)
        setHoveredData({
          price: priceData.value || 0,
          volume: volumeData.value || 0,
          time: date.toLocaleString(),
        })
      }
    })

    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current && chart) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth })
      }
    }

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      chart.remove()
    }
  }, []) // Only run once on mount

  // Update chart data when transactions change
  useEffect(() => {
    console.log('[PriceChart] Data update effect triggered:', {
      hasPriceSeries: !!priceSeriesRef.current,
      hasVolumeSeries: !!volumeSeriesRef.current,
      transactionCount: transactions.length
    })

    if (!priceSeriesRef.current || !volumeSeriesRef.current) {
      console.log('[PriceChart] Series not ready yet, skipping data update')
      return
    }

    if (transactions.length === 0) {
      console.log('[PriceChart] No transactions to display')
      return
    }

    console.log('[PriceChart] Updating chart data with', transactions.length, 'transactions')

    // Process transactions into price and volume data
    const priceData: Array<{time: UTCTimestamp, value: number}> = []
    const volumeData: Array<{time: UTCTimestamp, value: number, color: string}> = []

    transactions
      .filter(tx => tx.timestamp > 0)
      .sort((a, b) => a.timestamp - b.timestamp)
      .forEach(tx => {
        const asterAmount = Number(tx.asterAmountFormatted)
        const tokenAmount = Number(tx.tokenAmountFormatted)
        const price = tokenAmount > 0 ? asterAmount / tokenAmount : 0
        const time = Math.floor(tx.timestamp) as UTCTimestamp

        priceData.push({
          time,
          value: price,
        })

        volumeData.push({
          time,
          value: asterAmount,
          color: tx.type === 'buy' ? '#26a69a' : '#ef5350',
        })
      })

    // Update data smoothly without recreating chart
    if (priceData.length > 0) {
      try {
        priceSeriesRef.current.setData(priceData)
        volumeSeriesRef.current.setData(volumeData)

        // Only fit content on initial load or significant changes
        if (priceData.length <= 5) {
          chartRef.current?.timeScale().fitContent()
        }

        console.log('[PriceChart] Chart data updated smoothly')
      } catch (error) {
        console.error('[PriceChart] Error updating chart data:', error)
      }
    }
  }, [transactions])

  // Only show loading if we're truly loading AND have no data yet
  if (isLoading && transactions.length === 0) {
    return (
      <div className="bg-secondary-light rounded-xl p-6">
        <h2 className="text-xl font-bold mb-4">Price Chart</h2>
        <div className="h-[400px] flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
            <p className="text-gray-400">Loading chart data...</p>
          </div>
        </div>
      </div>
    )
  }

  // Show empty state only if not loading AND no transactions
  if (!isLoading && transactions.length === 0) {
    return (
      <div className="bg-secondary-light rounded-xl p-6">
        <h2 className="text-xl font-bold mb-4">Price Chart</h2>
        <div className="h-[400px] flex items-center justify-center">
          <div className="text-center">
            <svg className="w-16 h-16 text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-gray-400">No trading data available yet</p>
            <p className="text-sm text-gray-500 mt-2">Chart will appear after first trade</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-secondary-light rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Price Chart</h2>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-400">{tokenSymbol}/ASTER</span>
          <span className="px-2 py-1 bg-primary/20 text-primary rounded text-xs font-semibold">
            {transactions.length} trades
          </span>
        </div>
      </div>

      {/* Tooltip Display - Shows on hover */}
      {hoveredData && (
        <div className="mb-4 p-4 bg-secondary rounded-lg border border-primary/30 shadow-lg">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-gray-400 text-xs mb-1 uppercase tracking-wide">Time</p>
              <p className="font-semibold text-white text-sm">{hoveredData.time}</p>
            </div>
            <div>
              <p className="text-gray-400 text-xs mb-1 uppercase tracking-wide">Price</p>
              <p className="font-bold text-primary text-base">{hoveredData.price.toFixed(8)} ASTER</p>
            </div>
            <div>
              <p className="text-gray-400 text-xs mb-1 uppercase tracking-wide">Volume</p>
              <p className="font-semibold text-green-400 text-sm">{hoveredData.volume.toFixed(4)} ASTER</p>
            </div>
          </div>
        </div>
      )}

      {/* Instruction hint when no hover */}
      {!hoveredData && transactions.length > 0 && (
        <div className="mb-4 p-3 bg-secondary/50 rounded-lg border border-gray-700/50">
          <p className="text-gray-500 text-xs text-center">
            💡 Hover over the chart to see detailed price and volume data
          </p>
        </div>
      )}

      <div ref={chartContainerRef} className="w-full" />

      {/* Chart Legend */}
      <div className="mt-4 flex items-center gap-4 text-xs text-gray-400">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-primary rounded"></div>
          <span>Price ({tokenSymbol}/ASTER)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500 rounded"></div>
          <span>Buy Volume</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-red-500 rounded"></div>
          <span>Sell Volume</span>
        </div>
      </div>
    </div>
  )
}

'use client'

import { useEffect, useRef, useState, useMemo } from 'react'
import { createChart, ColorType, IChartApi, AreaSeries, HistogramSeries, UTCTimestamp, CrosshairMode } from 'lightweight-charts'
import { useTransactionHistory } from '@/lib/hooks/useTransactionHistory'

interface AdvancedPriceChartProps {
  bondingCurveAddress: string
  tokenSymbol: string
}

type Timeframe = 'all' | '1m' | '5m' | '15m' | '30m' | '1h' | '4h' | '1d'

export function AdvancedPriceChart({ bondingCurveAddress, tokenSymbol }: AdvancedPriceChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const priceSeriesRef = useRef<any>(null)
  const volumeSeriesRef = useRef<any>(null)
  const chartCreatedRef = useRef(false)

  const [timeframe, setTimeframe] = useState<Timeframe>('all')
  const [hoveredData, setHoveredData] = useState<{price: number, volume: number, time: string} | null>(null)

  const { transactions, isLoading } = useTransactionHistory(bondingCurveAddress)

  // Calculate statistics from transactions
  const stats = useMemo(() => {
    if (transactions.length === 0) {
      return {
        currentPrice: 0,
        change24h: 0,
        high24h: 0,
        low24h: 0,
        volume24h: 0,
      }
    }

    // Calculate prices for all transactions
    const prices = transactions.map(tx => {
      const asterAmount = Number(tx.asterAmountFormatted)
      const tokenAmount = Number(tx.tokenAmountFormatted)
      return tokenAmount > 0 ? asterAmount / tokenAmount : 0
    }).filter(p => p > 0)

    if (prices.length === 0) {
      return {
        currentPrice: 0,
        change24h: 0,
        high24h: 0,
        low24h: 0,
        volume24h: 0,
      }
    }

    const currentPrice = prices[prices.length - 1]
    const firstPrice = prices[0]
    const change24h = firstPrice > 0 ? ((currentPrice - firstPrice) / firstPrice) * 100 : 0
    const high24h = Math.max(...prices)
    const low24h = Math.min(...prices)
    const volume24h = transactions.reduce((sum, tx) => sum + Number(tx.asterAmountFormatted), 0)

    return {
      currentPrice,
      change24h,
      high24h,
      low24h,
      volume24h,
    }
  }, [transactions])

  // Filter transactions by timeframe
  const filteredTransactions = useMemo(() => {
    if (transactions.length === 0) return []

    // If "all" is selected, show all transactions
    if (timeframe === 'all') {
      return transactions
    }

    const now = Math.floor(Date.now() / 1000)
    const timeframeSeconds: Record<Exclude<Timeframe, 'all'>, number> = {
      '1m': 60,
      '5m': 300,
      '15m': 900,
      '30m': 1800,
      '1h': 3600,
      '4h': 14400,
      '1d': 86400,
    }

    const cutoff = now - timeframeSeconds[timeframe]
    return transactions.filter(tx => tx.timestamp >= cutoff)
  }, [transactions, timeframe])

  // Create chart (one-time setup)
  useEffect(() => {
    if (chartCreatedRef.current) return
    if (!chartContainerRef.current) return
    if (transactions.length === 0) return

    chartCreatedRef.current = true

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: '#1a1b1e' },
        textColor: '#d1d4dc',
      },
      grid: {
        vertLines: { color: '#2b2b43' },
        horzLines: { color: '#2b2b43' },
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
        secondsVisible: false,
        borderColor: '#2b2b43',
        rightOffset: 5,
      },
      rightPriceScale: {
        borderColor: '#2b2b43',
        visible: true,
        scaleMargins: {
          top: 0.05,
          bottom: 0.35,
        },
      },
    })

    chartRef.current = chart

    // Add price series (Area chart)
    const priceSeries = chart.addSeries(AreaSeries, {
      lineColor: '#26a69a',
      topColor: 'rgba(38, 166, 154, 0.4)',
      bottomColor: 'rgba(38, 166, 154, 0.0)',
      lineWidth: 2,
      priceFormat: {
        type: 'price',
        precision: 8,
        minMove: 0.00000001,
      },
    })

    priceSeriesRef.current = priceSeries

    // Add volume series (Histogram)
    const volumeSeries = chart.addSeries(HistogramSeries, {
      color: '#26a69a',
      priceFormat: {
        type: 'volume',
      },
      priceScaleId: 'volume',
    })

    volumeSeriesRef.current = volumeSeries

    // Configure volume scale
    chart.priceScale('volume').applyOptions({
      scaleMargins: {
        top: 0.85,
        bottom: 0,
      },
    })

    // Add crosshair handler
    chart.subscribeCrosshairMove((param) => {
      if (!param.time || !param.point) {
        setHoveredData(null)
        return
      }

      if (!priceSeriesRef.current || !volumeSeriesRef.current) return

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
      if (chartRef.current) {
        chartRef.current.remove()
        chartCreatedRef.current = false
      }
    }
  }, [transactions.length])

  // Update chart data when filtered transactions change
  useEffect(() => {
    if (!priceSeriesRef.current || !volumeSeriesRef.current) return
    if (filteredTransactions.length === 0) return

    const priceData: Array<{time: UTCTimestamp, value: number}> = []
    const volumeData: Array<{time: UTCTimestamp, value: number, color: string}> = []

    filteredTransactions
      .filter(tx => tx.timestamp > 0)
      .sort((a, b) => a.timestamp - b.timestamp)
      .forEach(tx => {
        const asterAmount = Number(tx.asterAmountFormatted)
        const tokenAmount = Number(tx.tokenAmountFormatted)
        const price = tokenAmount > 0 ? asterAmount / tokenAmount : 0
        const time = Math.floor(tx.timestamp) as UTCTimestamp

        priceData.push({ time, value: price })
        volumeData.push({
          time,
          value: asterAmount,
          color: tx.type === 'buy' ? '#26a69a' : '#ef5350',
        })
      })

    if (priceData.length > 0) {
      try {
        priceSeriesRef.current.setData(priceData)
        volumeSeriesRef.current.setData(volumeData)
        chartRef.current?.timeScale().fitContent()
      } catch (error) {
        console.error('[AdvancedPriceChart] Error updating data:', error)
      }
    }
  }, [filteredTransactions])

  if (isLoading && transactions.length === 0) {
    return (
      <div className="bg-secondary-light rounded-xl overflow-hidden">
        <div className="p-6">
          <div className="h-[500px] flex items-center justify-center">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
              <p className="text-gray-400">Loading chart data...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!isLoading && transactions.length === 0) {
    return (
      <div className="bg-secondary-light rounded-xl overflow-hidden">
        <div className="p-6">
          <div className="h-[500px] flex items-center justify-center">
            <div className="text-center">
              <div className="text-4xl mb-4">📊</div>
              <h3 className="text-xl font-bold mb-2">No Chart Data</h3>
              <p className="text-gray-400">Chart will appear after first trades</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-secondary-light rounded-xl overflow-hidden">
      {/* Chart Header with Statistics */}
      <div className="px-6 py-4 border-b border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">{tokenSymbol}/ASTER</h2>

          {/* Timeframe Selector */}
          <div className="flex gap-2">
            {(['all', '1m', '5m', '15m', '30m', '1h', '4h', '1d'] as Timeframe[]).map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                  timeframe === tf
                    ? 'bg-primary text-black'
                    : 'bg-secondary text-gray-400 hover:text-white hover:bg-secondary-light'
                }`}
              >
                {tf === 'all' ? 'All' : tf}
              </button>
            ))}
          </div>
        </div>

        {/* Price Statistics Panel */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div>
            <p className="text-xs text-gray-400 mb-1">Price</p>
            <p className={`text-lg font-bold ${stats.change24h >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {stats.currentPrice.toFixed(8)} <span className="text-xs text-gray-400">ASTER</span>
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-1">24h Change</p>
            <p className={`text-lg font-bold ${stats.change24h >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {stats.change24h >= 0 ? '+' : ''}{stats.change24h.toFixed(2)}%
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-1">24h High</p>
            <p className="text-lg font-bold text-gray-300">{stats.high24h.toFixed(8)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-1">24h Low</p>
            <p className="text-lg font-bold text-gray-300">{stats.low24h.toFixed(8)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-1">24h Volume</p>
            <p className="text-lg font-bold text-primary">{stats.volume24h.toFixed(2)} <span className="text-xs text-gray-400">ASTER</span></p>
          </div>
        </div>
      </div>

      {/* Hover Tooltip */}
      {hoveredData && (
        <div className="px-6 py-3 bg-secondary border-b border-gray-700">
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-gray-400 text-xs mb-1">Time</p>
              <p className="font-semibold text-white">{hoveredData.time}</p>
            </div>
            <div>
              <p className="text-gray-400 text-xs mb-1">Price</p>
              <p className="font-bold text-primary">{hoveredData.price.toFixed(8)} ASTER</p>
            </div>
            <div>
              <p className="text-gray-400 text-xs mb-1">Volume</p>
              <p className="font-semibold text-green-400">{hoveredData.volume.toFixed(4)} ASTER</p>
            </div>
          </div>
        </div>
      )}

      {/* Chart Container */}
      <div className="relative">
        <div ref={chartContainerRef} className="w-full" />
      </div>

      {/* Chart Footer */}
      <div className="px-6 py-3 bg-secondary border-t border-gray-700 flex items-center justify-between text-xs text-gray-400">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span>Price Line</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span>Buy Volume</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded"></div>
            <span>Sell Volume</span>
          </div>
          <div>
            <span className="text-gray-500">{filteredTransactions.length} trades in view</span>
          </div>
        </div>
        <div>
          Powered by TradingView Lightweight Charts
        </div>
      </div>
    </div>
  )
}

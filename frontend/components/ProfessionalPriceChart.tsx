'use client'

import { useEffect, useRef, useState } from 'react'
import { createChart, IChartApi, ISeriesApi, CandlestickData, Time } from 'lightweight-charts'

interface ProfessionalPriceChartProps {
  bondingCurveAddress: string
  tokenSymbol: string
}

type Timeframe = '1m' | '5m' | '15m' | '1h' | '4h' | '1d'

export function ProfessionalPriceChart({ bondingCurveAddress, tokenSymbol }: ProfessionalPriceChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const candlestickSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null)

  const [timeframe, setTimeframe] = useState<Timeframe>('1h')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState({
    price: '0.00',
    change24h: 0,
    high24h: '0.00',
    low24h: '0.00',
    volume24h: '0.00',
  })

  // Fetch chart data
  const fetchChartData = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const now = Math.floor(Date.now() / 1000)
      const timeframes: Record<Timeframe, number> = {
        '1m': 60,
        '5m': 300,
        '15m': 900,
        '1h': 3600,
        '4h': 14400,
        '1d': 86400,
      }

      const duration = timeframes[timeframe]
      const from = now - (duration * 100) // Last 100 candles

      const response = await fetch(
        `/api/v2/tokens/${bondingCurveAddress}/ohlcv?timeframe=${timeframe}&from=${from}&to=${now}`
      )

      if (!response.ok) {
        throw new Error('Failed to fetch chart data')
      }

      const data = await response.json()

      if (!data.success || !data.data || data.data.length === 0) {
        setError('No trading data available yet')
        setIsLoading(false)
        return
      }

      // Transform data for TradingView
      const candles: CandlestickData[] = data.data.map((candle: any) => ({
        time: candle.timestamp as Time,
        open: parseFloat(candle.open),
        high: parseFloat(candle.high),
        low: parseFloat(candle.low),
        close: parseFloat(candle.close),
      }))

      // Calculate stats
      const lastCandle = candles[candles.length - 1]
      const firstCandle = candles[0]
      const change = ((lastCandle.close - firstCandle.open) / firstCandle.open) * 100

      const high = Math.max(...candles.map(c => c.high))
      const low = Math.min(...candles.map(c => c.low))

      setStats({
        price: lastCandle.close.toFixed(8),
        change24h: change,
        high24h: high.toFixed(8),
        low24h: low.toFixed(8),
        volume24h: data.volume24h || '0.00',
      })

      // Update chart
      if (candlestickSeriesRef.current) {
        candlestickSeriesRef.current.setData(candles)
      }

      setIsLoading(false)
    } catch (err: any) {
      console.error('Chart data fetch error:', err)
      setError(err.message || 'Failed to load chart')
      setIsLoading(false)
    }
  }

  // Initialize chart
  useEffect(() => {
    if (!chartContainerRef.current) return

    // Create chart
    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: 500,
      layout: {
        background: { color: '#1a1b1e' },
        textColor: '#d1d4dc',
      },
      grid: {
        vertLines: { color: '#2b2b43' },
        horzLines: { color: '#2b2b43' },
      },
      crosshair: {
        mode: 1,
        vertLine: {
          width: 1,
          color: '#758696',
          style: 3,
        },
        horzLine: {
          width: 1,
          color: '#758696',
          style: 3,
        },
      },
      rightPriceScale: {
        borderColor: '#2b2b43',
        visible: true,
      },
      timeScale: {
        borderColor: '#2b2b43',
        timeVisible: true,
        secondsVisible: false,
      },
    })

    chartRef.current = chart

    // Add candlestick series
    const candlestickSeries = chart.addCandlestickSeries({
      upColor: '#26a69a',
      downColor: '#ef5350',
      borderVisible: false,
      wickUpColor: '#26a69a',
      wickDownColor: '#ef5350',
    })

    candlestickSeriesRef.current = candlestickSeries

    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
        })
      }
    }

    window.addEventListener('resize', handleResize)

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize)
      chart.remove()
    }
  }, [])

  // Fetch data when timeframe changes
  useEffect(() => {
    fetchChartData()
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchChartData, 30000)
    return () => clearInterval(interval)
  }, [timeframe, bondingCurveAddress])

  return (
    <div className="bg-secondary-light rounded-xl overflow-hidden">
      {/* Chart Header */}
      <div className="px-6 py-4 border-b border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">{tokenSymbol}/ASTER</h2>
          <div className="flex gap-2">
            {(['1m', '5m', '15m', '1h', '4h', '1d'] as Timeframe[]).map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-3 py-1 rounded text-sm font-medium transition ${
                  timeframe === tf
                    ? 'bg-primary text-black'
                    : 'bg-secondary text-gray-400 hover:text-white'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>

        {/* Price Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div>
            <p className="text-xs text-gray-400 mb-1">Price</p>
            <p className={`text-lg font-bold ${stats.change24h >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {stats.price} ASTER
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
            <p className="text-lg font-bold text-gray-300">{stats.high24h}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-1">24h Low</p>
            <p className="text-lg font-bold text-gray-300">{stats.low24h}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-1">24h Volume</p>
            <p className="text-lg font-bold text-gray-300">{parseFloat(stats.volume24h).toFixed(2)} ASTER</p>
          </div>
        </div>
      </div>

      {/* Chart Container */}
      <div className="relative">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-secondary-light bg-opacity-80 z-10">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-2"></div>
              <p className="text-gray-400">Loading chart...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-secondary-light z-10">
            <div className="text-center p-8">
              <div className="text-4xl mb-4">📊</div>
              <h3 className="text-xl font-bold mb-2">No Chart Data</h3>
              <p className="text-gray-400 mb-4">{error}</p>
              <p className="text-sm text-gray-500">Chart will appear after first trades</p>
            </div>
          </div>
        )}

        <div ref={chartContainerRef} className="w-full" style={{ minHeight: '500px' }} />
      </div>

      {/* Chart Tools Info */}
      <div className="px-6 py-3 bg-secondary border-t border-gray-700 flex items-center justify-between text-xs text-gray-400">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span>Bullish</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded"></div>
            <span>Bearish</span>
          </div>
        </div>
        <div>
          Powered by TradingView Lightweight Charts
        </div>
      </div>
    </div>
  )
}

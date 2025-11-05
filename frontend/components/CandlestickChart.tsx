'use client'

import { useEffect, useRef, useState, useMemo } from 'react'
import {
  createChart,
  ColorType,
  IChartApi,
  UTCTimestamp,
  CrosshairMode,
  LogicalRange,
} from 'lightweight-charts'
import { useTransactionHistory } from '@/lib/hooks/useTransactionHistory'
import { useUsdPrice, asterToUsd, formatUsdPrice } from '@/lib/hooks/useUsdPrice'

interface CandlestickChartProps {
  bondingCurveAddress: string
  tokenSymbol: string
}

type Timeframe = '1m' | '5m' | '15m' | '1h' | '1d' | 'all'

interface OHLCV {
  timestamp: number
  open: number
  high: number
  low: number
  close: number
  volume: number
  buyVolume: number
  sellVolume: number
}

export function CandlestickChart({ bondingCurveAddress, tokenSymbol }: CandlestickChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const candleSeriesRef = useRef<any>(null)
  const volumeSeriesRef = useRef<any>(null)
  const chartCreatedRef = useRef(false)
  const savedRangeRef = useRef<LogicalRange | null>(null)

  const [timeframe, setTimeframe] = useState<Timeframe>('all')
  const [showVolume, setShowVolume] = useState(true)
  const [zoomLocked, setZoomLocked] = useState(false)
  const [hoveredCandle, setHoveredCandle] = useState<any>(null)
  const [showUsd, setShowUsd] = useState(false)

  const { transactions, isLoading } = useTransactionHistory(bondingCurveAddress)
  const { usdRate } = useUsdPrice()
  
  console.log('[CandlestickChart] 📄 Component render:', {
    bondingCurveAddress,
    tokenSymbol,
    transactionsCount: transactions.length,
    isLoading,
    usdRate
  })

  // Aggregate transactions into OHLCV candles
  const candles = useMemo(() => {
    console.log('[CandlestickChart] 📊 Processing candles data:', {
      transactionsCount: transactions.length,
      timeframe,
      bondingCurveAddress
    })
    
    if (transactions.length === 0) {
      console.log('[CandlestickChart] ⚠️ No transactions to process')
      return []
    }

    // Get interval in seconds
    const intervals: Record<Timeframe, number> = {
      '1m': 60,
      '5m': 300,
      '15m': 900,
      '1h': 3600,
      '1d': 86400,
      'all': 0, // Will be calculated
    }

    let interval = intervals[timeframe]

    // For "all" timeframe, calculate appropriate interval
    if (timeframe === 'all' && transactions.length > 0) {
      const first = transactions[0].timestamp
      const last = transactions[transactions.length - 1].timestamp
      const range = last - first
      // Aim for about 100 candles
      interval = Math.max(60, Math.floor(range / 100))
    }

    // Group transactions into time buckets
    const buckets = new Map<number, {
      prices: number[]
      volumes: number[]
      buyVolume: number
      sellVolume: number
    }>()

    transactions
      .filter(tx => tx.timestamp > 0)
      .sort((a, b) => a.timestamp - b.timestamp)
      .forEach(tx => {
        const asterAmount = Number(tx.asterAmountFormatted)
        const tokenAmount = Number(tx.tokenAmountFormatted)
        const price = tokenAmount > 0 ? asterAmount / tokenAmount : 0

        if (price <= 0) return

        // Round down to interval
        const bucketTime = Math.floor(tx.timestamp / interval) * interval

        if (!buckets.has(bucketTime)) {
          buckets.set(bucketTime, {
            prices: [],
            volumes: [],
            buyVolume: 0,
            sellVolume: 0,
          })
        }

        const bucket = buckets.get(bucketTime)!
        bucket.prices.push(price)
        bucket.volumes.push(asterAmount)

        if (tx.type === 'buy') {
          bucket.buyVolume += asterAmount
        } else {
          bucket.sellVolume += asterAmount
        }
      })

    // Convert buckets to OHLCV
    const ohlcvData: OHLCV[] = []

    buckets.forEach((bucket, timestamp) => {
      if (bucket.prices.length === 0) return

      ohlcvData.push({
        timestamp,
        open: bucket.prices[0],
        high: Math.max(...bucket.prices),
        low: Math.min(...bucket.prices),
        close: bucket.prices[bucket.prices.length - 1],
        volume: bucket.volumes.reduce((a, b) => a + b, 0),
        buyVolume: bucket.buyVolume,
        sellVolume: bucket.sellVolume,
      })
    })

    return ohlcvData.sort((a, b) => a.timestamp - b.timestamp)
  }, [transactions, timeframe])

  // Calculate stats
  const stats = useMemo(() => {
    if (candles.length === 0) {
      return {
        currentPrice: 0,
        change24h: 0,
        high24h: 0,
        low24h: 0,
        volume24h: 0,
      }
    }

    const now = Math.floor(Date.now() / 1000)
    const oneDayAgo = now - 86400

    const recent24h = candles.filter(c => c.timestamp >= oneDayAgo)
    const currentPrice = candles[candles.length - 1].close
    const firstPrice = recent24h.length > 0 ? recent24h[0].open : candles[0].open
    const change24h = firstPrice > 0 ? ((currentPrice - firstPrice) / firstPrice) * 100 : 0
    const high24h = recent24h.length > 0 ? Math.max(...recent24h.map(c => c.high)) : Math.max(...candles.map(c => c.high))
    const low24h = recent24h.length > 0 ? Math.min(...recent24h.map(c => c.low)) : Math.min(...candles.map(c => c.low))
    const volume24h = recent24h.reduce((sum, c) => sum + c.volume, 0)

    return {
      currentPrice,
      change24h,
      high24h,
      low24h,
      volume24h,
    }
  }, [candles])

  // Create chart (one-time)
  useEffect(() => {
    console.log('[CandlestickChart] 🔍 Chart creation effect triggered:', {
      chartCreated: chartCreatedRef.current,
      hasContainer: !!chartContainerRef.current,
      candlesLength: candles.length,
      bondingCurveAddress,
      tokenSymbol
    })
    
    if (chartCreatedRef.current) {
      console.log('[CandlestickChart] ⚠️ Chart already created, skipping')
      return
    }
    if (!chartContainerRef.current) {
      console.log('[CandlestickChart] ⚠️ No chart container ref, skipping')
      return
    }
    if (candles.length === 0) {
      console.log('[CandlestickChart] ⚠️ No candles data, skipping')
      return
    }

    console.log('[CandlestickChart] 🚀 Starting chart creation process...')
    chartCreatedRef.current = true

    const container = chartContainerRef.current
    if (!container) {
      console.log('[CandlestickChart] ❌ Container lost after ref check')
      return
    }

    console.log('[CandlestickChart] 📊 Creating chart instance...')
    const chart: any = createChart(container, {
      layout: {
        background: { type: ColorType.Solid, color: '#0f0f0f' },
        textColor: '#9ca3af',
      },
      grid: {
        vertLines: { color: '#1f2937' },
        horzLines: { color: '#1f2937' },
      },
      width: container.clientWidth,
      height: 500,
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          width: 1,
          color: '#6b7280',
          style: 2,
          labelBackgroundColor: '#10b981',
        },
        horzLine: {
          width: 1,
          color: '#6b7280',
          style: 2,
          labelBackgroundColor: '#10b981',
        },
      },
      timeScale: {
        timeVisible: true,
        secondsVisible: timeframe === '1m',
        borderColor: '#1f2937',
        rightOffset: 12,
        // Enable zoom lock with Ctrl key
        lockVisibleTimeRangeOnResize: zoomLocked,
      },
      rightPriceScale: {
        borderColor: '#1f2937',
        visible: true,
        scaleMargins: {
          top: 0.1,
          bottom: showVolume ? 0.25 : 0.1,
        },
      },
      handleScale: {
        mouseWheel: !zoomLocked,
        pinch: !zoomLocked,
        axisPressedMouseMove: {
          time: !zoomLocked,
          price: !zoomLocked,
        },
      },
      handleScroll: {
        mouseWheel: true,
        pressedMouseMove: true,
        horzTouchDrag: true,
        vertTouchDrag: true,
      },
    })

    console.log('[CandlestickChart] ✅ Chart instance created successfully')
    chartRef.current = chart

    // Add candlestick series using v5 API
    console.log('[CandlestickChart] 📈 Adding candlestick series...')
    console.log('[CandlestickChart] Chart methods available:', Object.getOwnPropertyNames(chart).filter(name => name.includes('add')))
    
    try {
      const candleSeries = chart.addCandlestickSeries({
        upColor: '#10b981',
        downColor: '#ef4444',
        borderUpColor: '#10b981',
        borderDownColor: '#ef4444',
        wickUpColor: '#10b981',
        wickDownColor: '#ef4444',
        priceFormat: {
          type: 'price',
          precision: 8,
          minMove: 0.00000001,
        },
      })
      console.log('[CandlestickChart] ✅ Candlestick series created successfully')
      candleSeriesRef.current = candleSeries
    } catch (error) {
      console.error('[CandlestickChart] ❌ Error creating candlestick series:', error)
      console.log('[CandlestickChart] Chart object:', chart)
      console.log('[CandlestickChart] Available methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(chart)))
      throw error
    }

    // Add volume series using v5 API
    console.log('[CandlestickChart] 📊 Adding volume series...')
    try {
      const volumeSeries = chart.addHistogramSeries({
        color: '#26a69a',
        priceFormat: {
          type: 'volume',
        },
        priceScaleId: 'volume',
      })
      console.log('[CandlestickChart] ✅ Volume series created successfully')
      volumeSeriesRef.current = volumeSeries
    } catch (error) {
      console.error('[CandlestickChart] ❌ Error creating volume series:', error)
      throw error
    }

    // Configure volume scale
    chart.priceScale('volume').applyOptions({
      scaleMargins: {
        top: 0.8,
        bottom: 0,
      },
    })

    // Crosshair handler
    chart.subscribeCrosshairMove((param: any) => {
      if (!param.time || !candleSeriesRef.current) {
        setHoveredCandle(null)
        return
      }

      const data = param.seriesData.get(candleSeriesRef.current) as any
      setHoveredCandle(data || null)
    })

    // Save zoom range when user interacts
    chart.timeScale().subscribeVisibleLogicalRangeChange((range: any) => {
      if (zoomLocked && range) {
        savedRangeRef.current = range
      }
    })

    // Resize handler
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
  }, [candles.length, showVolume, zoomLocked, timeframe])

  // Update zoom lock
  useEffect(() => {
    if (chartRef.current) {
      chartRef.current.applyOptions({
        handleScale: {
          mouseWheel: !zoomLocked,
          pinch: !zoomLocked,
          axisPressedMouseMove: {
            time: !zoomLocked,
            price: !zoomLocked,
          },
        },
        timeScale: {
          lockVisibleTimeRangeOnResize: zoomLocked,
        },
      })
    }
  }, [zoomLocked])

  // Update chart data
  useEffect(() => {
    if (!candleSeriesRef.current || !volumeSeriesRef.current) return
    if (candles.length === 0) return

    try {
      // Convert to chart data format
      const candleData = candles.map(c => ({
        time: c.timestamp as UTCTimestamp,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
      }))

      const volumeData = candles.map(c => ({
        time: c.timestamp as UTCTimestamp,
        value: c.volume,
        // Green if more buy volume, red if more sell volume
        color: c.buyVolume >= c.sellVolume ? '#10b98180' : '#ef444480',
      }))

      candleSeriesRef.current.setData(candleData)

      if (showVolume) {
        volumeSeriesRef.current.setData(volumeData)
      } else {
        volumeSeriesRef.current.setData([])
      }

      // Improved chart fitting for better token history visibility
      if (!zoomLocked) {
        try {
          if (chartRef.current && candleData.length > 0) {
            // For timeframe 'all', ensure we show the complete trading history
            if (timeframe === 'all') {
              console.log('[CandlestickChart] Setting up complete history view for', candleData.length, 'candles')
              
              // Get full time range
              const firstTime = candleData[0].time
              const lastTime = candleData[candleData.length - 1].time
              const totalRange = lastTime - firstTime
              
              // Add moderate padding for better visibility
              const padding = Math.max(totalRange * 0.05, 300) // 5% or minimum 5 minutes
              const paddedStart = (firstTime - padding) as UTCTimestamp
              const paddedEnd = (lastTime + (padding * 0.5)) as UTCTimestamp
              
              // Set visible range to show all data with padding
              chartRef.current.timeScale().setVisibleRange({
                from: paddedStart,
                to: paddedEnd,
              })
              
              console.log('[CandlestickChart] ✅ Complete history view applied:', {
                firstCandle: new Date(firstTime * 1000).toISOString(),
                lastCandle: new Date(lastTime * 1000).toISOString(),
                totalDuration: `${(totalRange / 3600).toFixed(1)} hours`,
                candleCount: candleData.length
              })
            } else {
              // For specific timeframes, use standard fit content
              chartRef.current.timeScale().fitContent()
            }
          }
        } catch (error) {
          console.error('[CandlestickChart] Error setting visible range, falling back to fitContent:', error)
          chartRef.current?.timeScale().fitContent()
        }
      } else if (savedRangeRef.current && chartRef.current) {
        // Restore saved zoom range when locked
        chartRef.current.timeScale().setVisibleLogicalRange(savedRangeRef.current)
      }
    } catch (error) {
      console.error('[CandlestickChart] Error updating data:', error)
    }
  }, [candles, showVolume, zoomLocked])

  // Loading state
  if (isLoading && transactions.length === 0) {
    return (
      <div className="bg-gray-900 rounded-xl border border-gray-800">
        <div className="p-6">
          <div className="h-[500px] flex items-center justify-center">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500 mb-4"></div>
              <p className="text-gray-400">Loading chart data...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Empty state
  if (!isLoading && candles.length === 0) {
    return (
      <div className="bg-gray-900 rounded-xl border border-gray-800">
        <div className="p-6">
          <div className="h-[500px] flex items-center justify-center">
            <div className="text-center">
              <svg className="w-20 h-20 text-gray-700 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <h3 className="text-xl font-semibold text-gray-300 mb-2">No Trading Data Yet</h3>
              <p className="text-gray-500">Chart will appear after the first trade</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
      {/* Chart Header */}
      <div className="px-4 py-3 border-b border-gray-800 bg-gray-950">
        <div className="flex items-center justify-between flex-wrap gap-4">
          {/* Token Info */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-white">
                {tokenSymbol}/{showUsd ? 'USD' : 'ASTER'}
              </h2>
              <button
                onClick={() => setShowUsd(!showUsd)}
                className="px-2 py-1 text-xs bg-gray-800 hover:bg-gray-700 rounded-md transition"
                title="Toggle USD/ASTER display"
              >
                {showUsd ? 'USD' : 'ASTER'}
              </button>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <div>
                <span className="text-gray-500">Price: </span>
                <span className={`font-bold ${stats.change24h >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {showUsd 
                    ? formatUsdPrice(asterToUsd(stats.currentPrice, usdRate))
                    : stats.currentPrice.toFixed(8)
                  }
                </span>
              </div>
              <div>
                <span className="text-gray-500">24h: </span>
                <span className={`font-semibold ${stats.change24h >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {stats.change24h >= 0 ? '+' : ''}{stats.change24h.toFixed(2)}%
                </span>
              </div>
            </div>
          </div>

          {/* Timeframe Buttons */}
          <div className="flex items-center gap-2">
            {(['1m', '5m', '15m', '1h', '1d', 'all'] as Timeframe[]).map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${
                  timeframe === tf
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
                }`}
              >
                {tf === 'all' ? 'All' : tf.toUpperCase()}
              </button>
            ))}

            {/* Zoom Lock Toggle */}
            <button
              onClick={() => setZoomLocked(!zoomLocked)}
              className={`ml-2 px-3 py-1.5 rounded-md text-xs font-medium transition ${
                zoomLocked
                  ? 'bg-yellow-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
              title={zoomLocked ? 'Zoom Locked (Click to Unlock)' : 'Click to Lock Zoom'}
            >
              {zoomLocked ? '🔒' : '🔓'}
            </button>

            {/* Volume Toggle */}
            <button
              onClick={() => setShowVolume(!showVolume)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${
                showVolume
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              Vol
            </button>
          </div>
        </div>

        {/* Fixed-Size Stats Bar - Prevents Layout Shifts */}
        <div className="grid grid-cols-6 gap-4 mt-3 text-xs min-h-[16px]">
          {/* Time/Status - Fixed Width */}
          <div className="flex items-center">
            <span className="text-blue-400 mr-1">Time:</span>
            <span className="text-gray-300 font-mono">
              {hoveredCandle 
                ? new Date((hoveredCandle.time as number) * 1000).toLocaleTimeString('en-US', {hour12: false, hour: '2-digit', minute: '2-digit'})
                : `${candles.length} bars`
              }
            </span>
          </div>
          
          {/* Open - Fixed Width */}
          <div className="flex items-center">
            <span className="text-gray-500 mr-1">O:</span>
            <span className="text-white font-mono text-xs">
              {hoveredCandle ? (
                showUsd 
                  ? formatUsdPrice(asterToUsd(hoveredCandle.open, usdRate))
                  : hoveredCandle.open.toFixed(6)
              ) : (
                showUsd 
                  ? formatUsdPrice(asterToUsd(stats.high24h, usdRate))
                  : stats.high24h.toFixed(6)
              )}
            </span>
          </div>
          
          {/* High - Fixed Width */}
          <div className="flex items-center">
            <span className="text-gray-500 mr-1">H:</span>
            <span className="text-green-400 font-mono text-xs">
              {hoveredCandle ? (
                showUsd 
                  ? formatUsdPrice(asterToUsd(hoveredCandle.high, usdRate))
                  : hoveredCandle.high.toFixed(6)
              ) : (
                showUsd 
                  ? formatUsdPrice(asterToUsd(stats.high24h, usdRate))
                  : stats.high24h.toFixed(6)
              )}
            </span>
          </div>
          
          {/* Low - Fixed Width */}
          <div className="flex items-center">
            <span className="text-gray-500 mr-1">L:</span>
            <span className="text-red-400 font-mono text-xs">
              {hoveredCandle ? (
                showUsd 
                  ? formatUsdPrice(asterToUsd(hoveredCandle.low, usdRate))
                  : hoveredCandle.low.toFixed(6)
              ) : (
                showUsd 
                  ? formatUsdPrice(asterToUsd(stats.low24h, usdRate))
                  : stats.low24h.toFixed(6)
              )}
            </span>
          </div>
          
          {/* Close - Fixed Width */}
          <div className="flex items-center">
            <span className="text-gray-500 mr-1">C:</span>
            <span className={`font-mono text-xs ${
              hoveredCandle 
                ? (hoveredCandle.close >= hoveredCandle.open ? 'text-green-400' : 'text-red-400')
                : 'text-white'
            }`}>
              {hoveredCandle ? (
                showUsd 
                  ? formatUsdPrice(asterToUsd(hoveredCandle.close, usdRate))
                  : hoveredCandle.close.toFixed(6)
              ) : (
                showUsd 
                  ? formatUsdPrice(asterToUsd(stats.currentPrice, usdRate))
                  : stats.currentPrice.toFixed(6)
              )}
            </span>
          </div>
          
          {/* Volume - Fixed Width */}
          <div className="flex items-center">
            <span className="text-gray-500 mr-1">Vol:</span>
            <span className="text-green-400 font-mono text-xs">
              {hoveredCandle ? (
                '----' // No volume data in hover for individual candles
              ) : (
                showUsd 
                  ? formatUsdPrice(asterToUsd(stats.volume24h, usdRate))
                  : `${stats.volume24h.toFixed(2)} A`
              )}
            </span>
          </div>
        </div>
      </div>


      {/* Chart Container */}
      <div ref={chartContainerRef} className="w-full" />

      {/* Chart Footer */}
      <div className="px-4 py-2 bg-gray-950 border-t border-gray-800">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-1.5 bg-green-500"></div>
              <span>Bullish</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-1.5 bg-red-500"></div>
              <span>Bearish</span>
            </div>
            {showVolume && (
              <>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-1.5 bg-green-500 opacity-50"></div>
                  <span>Buy Volume</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-1.5 bg-red-500 opacity-50"></div>
                  <span>Sell Volume</span>
                </div>
              </>
            )}
          </div>
          <div>
            {zoomLocked && (
              <span className="text-yellow-500">🔒 Zoom Locked - Press Ctrl while zooming to maintain position</span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

'use client'

import { useEffect, useRef, useState, useMemo } from 'react'
import { createChart, ColorType, IChartApi, UTCTimestamp, CrosshairMode, ISeriesApi, CandlestickData, HistogramData } from 'lightweight-charts'
// Import series constructors for v5 API
import { CandlestickSeries, HistogramSeries, LineSeries, AreaSeries } from 'lightweight-charts'
import { useTransactionHistory } from '@/lib/hooks/useTransactionHistory'

// Debug: Log the imported functions
console.log('[AdvancedPriceChart] 📚 Import check:', {
  createChart: typeof createChart,
  ColorType: typeof ColorType,
  CrosshairMode: typeof CrosshairMode
})

interface AdvancedPriceChartProps {
  bondingCurveAddress: string
  tokenSymbol: string
}

type Timeframe = 'all' | '1m' | '5m' | '15m' | '30m' | '1h' | '4h' | '1d'
type PriceMode = 'ASTER' | 'USD'
type ChartType = 'candlestick' | 'line' | 'area'

// Mock ASTER USD price - can be replaced with real API
// TODO: Replace with CoinGecko or DexScreener API for real-time price
const ASTER_USD_PRICE = 1.22

export function AdvancedPriceChart({ bondingCurveAddress, tokenSymbol }: AdvancedPriceChartProps) {
  // Global error handler
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.error('[AdvancedPriceChart] 🔥 Global error caught:', event.error)
      if (event.error?.message?.includes('addCandlestickSeries') || 
          event.error?.message?.includes('addHistogramSeries')) {
        console.error('[AdvancedPriceChart] ❌ Chart API Error detected!', {
          message: event.error.message,
          stack: event.error.stack,
          bondingCurveAddress,
          tokenSymbol
        })
      }
    }
    window.addEventListener('error', handleError)
    return () => window.removeEventListener('error', handleError)
  }, [])
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<any>(null)
  const priceSeriesRef = useRef<any>(null)
  const volumeSeriesRef = useRef<any>(null)
  const chartCreatedRef = useRef(false)
  const isInitialLoadRef = useRef(true)

  const [timeframe, setTimeframe] = useState<Timeframe>('all')
  const [priceMode, setPriceMode] = useState<PriceMode>('ASTER')
  const [chartType, setChartType] = useState<ChartType>('candlestick')
  const [hoveredData, setHoveredData] = useState<{open: number, high: number, low: number, close: number, volume: number, time: string} | null>(null)

  const { transactions, isLoading } = useTransactionHistory(bondingCurveAddress)
  
  console.log('[AdvancedPriceChart] 📄 Component render:', {
    bondingCurveAddress,
    tokenSymbol,
    transactionsCount: transactions.length,
    isLoading,
    chartCreated: chartCreatedRef.current,
    timeframe,
    priceMode
  })

  // Calculate statistics from transactions
  const stats = useMemo(() => {
    if (transactions.length === 0) {
      return {
        currentPrice: 0,
        currentPriceUSD: 0,
        change24h: 0,
        high24h: 0,
        low24h: 0,
        volume24h: 0,
        volume24hUSD: 0,
        ath: 0,
        athUSD: 0,
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
        currentPriceUSD: 0,
        change24h: 0,
        high24h: 0,
        low24h: 0,
        volume24h: 0,
        volume24hUSD: 0,
        ath: 0,
        athUSD: 0,
      }
    }

    const currentPrice = prices[prices.length - 1]
    const currentPriceUSD = currentPrice * ASTER_USD_PRICE
    const firstPrice = prices[0]
    const change24h = firstPrice > 0 ? ((currentPrice - firstPrice) / firstPrice) * 100 : 0
    const high24h = Math.max(...prices)
    const low24h = Math.min(...prices)
    const ath = high24h
    const athUSD = ath * ASTER_USD_PRICE
    const volume24h = transactions.reduce((sum, tx) => sum + Number(tx.asterAmountFormatted), 0)
    const volume24hUSD = volume24h * ASTER_USD_PRICE

    return {
      currentPrice,
      currentPriceUSD,
      change24h,
      high24h,
      low24h,
      volume24h,
      volume24hUSD,
      ath,
      athUSD,
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
    console.log('[AdvancedPriceChart] 🔍 Chart creation effect triggered:', {
      chartCreated: chartCreatedRef.current,
      hasContainer: !!chartContainerRef.current,
      transactionsLength: transactions.length,
      bondingCurveAddress,
      tokenSymbol
    })
    
    if (chartCreatedRef.current) {
      console.log('[AdvancedPriceChart] ⚠️ Chart already created, skipping')
      return
    }
    if (!chartContainerRef.current) {
      console.log('[AdvancedPriceChart] ⚠️ No chart container ref, skipping')
      return
    }
    if (transactions.length === 0) {
      console.log('[AdvancedPriceChart] ⚠️ No transactions data, skipping')
      return
    }

    console.log('[AdvancedPriceChart] 🚀 Starting chart creation process...')
    chartCreatedRef.current = true

    console.log('[AdvancedPriceChart] 📊 Creating chart instance...')
    const chart: any = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: '#1a1b1e' },
        textColor: '#d1d4dc',
      },
      grid: {
        vertLines: { color: '#2b2b43' },
        horzLines: { color: '#2b2b43' },
      },
      width: chartContainerRef.current.clientWidth,
      height: 600,
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
        borderColor: '#2b2b43',
        rightOffset: 20, // More space on right to show latest data clearly
        barSpacing: 12, // Better spacing between candles
        minBarSpacing: 0.5,
        fixLeftEdge: false,
        fixRightEdge: false,
        lockVisibleTimeRangeOnResize: true,
        rightBarStaysOnScroll: true,
        visible: true,
        // Add time before token creation for better visibility
        shiftVisibleRangeOnNewBar: true,
      },
      rightPriceScale: {
        borderColor: '#2b2b43',
        visible: true,
        scaleMargins: {
          top: 0.05,
          bottom: 0.35,
        },
        autoScale: true,
      },
    })

    console.log('[AdvancedPriceChart] ✅ Chart instance created successfully')
    chartRef.current = chart

    // Add candlestick series
    console.log('[AdvancedPriceChart] 📈 Adding candlestick series...')
    console.log('[AdvancedPriceChart] Chart object type:', typeof chart)
    console.log('[AdvancedPriceChart] Chart object:', chart)
    console.log('[AdvancedPriceChart] Chart constructor:', chart.constructor?.name)
    
    // Get all available methods
    const allMethods = []
    let obj = chart
    while (obj) {
      allMethods.push(...Object.getOwnPropertyNames(obj))
      obj = Object.getPrototypeOf(obj)
    }
    const uniqueMethods = [...new Set(allMethods)]
    console.log('[AdvancedPriceChart] All available methods:', uniqueMethods)
    console.log('[AdvancedPriceChart] Methods containing "add":', uniqueMethods.filter(name => name.toLowerCase().includes('add')))
    console.log('[AdvancedPriceChart] Methods containing "series":', uniqueMethods.filter(name => name.toLowerCase().includes('series')))
    console.log('[AdvancedPriceChart] Methods containing "candlestick":', uniqueMethods.filter(name => name.toLowerCase().includes('candlestick')))
    
    // Log specific method details
    const addMethods = uniqueMethods.filter(name => name.toLowerCase().includes('add'))
    console.log('[AdvancedPriceChart] Detailed add methods:')
    addMethods.forEach(method => {
      console.log(`  - ${method}: ${typeof chart[method]}`)
    })
    
    try {
      let priceSeries
      const seriesOptions = {
        upColor: '#26a69a',
        downColor: '#ef5350',
        borderVisible: false,
        wickUpColor: '#26a69a',
        wickDownColor: '#ef5350',
        priceFormat: {
          type: 'price',
          precision: 8,
          minMove: 0.00000001,
        },
      }
      
      // Try TradingView v5 API with series constructor
      if (typeof chart.addSeries === 'function') {
        try {
          console.log('[AdvancedPriceChart] Trying addSeries with CandlestickSeries constructor')
          priceSeries = chart.addSeries(CandlestickSeries, seriesOptions)
          console.log('[AdvancedPriceChart] ✅ CandlestickSeries constructor worked!')
        } catch (e) {
          console.log('[AdvancedPriceChart] ❌ CandlestickSeries constructor failed:', (e as Error).message)
          
          // Fallback: Try string-based approach (in case it's a different v5 variant)
          const typeVariations = ['Candlestick', 'candlestick', 'CANDLESTICK', 'CandlestickSeries', 'ohlc', 'OHLC', 'bars']
          
          for (const seriesType of typeVariations) {
            try {
              console.log(`[AdvancedPriceChart] Trying addSeries('${seriesType}')`)
              priceSeries = chart.addSeries(seriesType, seriesOptions)
              console.log(`[AdvancedPriceChart] ✅ addSeries('${seriesType}') worked!`)
              break
            } catch (e2) {
              console.log(`[AdvancedPriceChart] ❌ addSeries('${seriesType}') failed: ${(e2 as Error).message}`)
            }
          }
        }
      }
      
      if (!priceSeries) {
        throw new Error('All candlestick series creation methods failed')
      }
      
      console.log('[AdvancedPriceChart] ✅ Candlestick series created successfully')
      priceSeriesRef.current = priceSeries
    } catch (error) {
      console.error('[AdvancedPriceChart] ❌ Error creating candlestick series:', error)
      throw error
    }

    // Add volume series (Histogram)
    console.log('[AdvancedPriceChart] 📊 Adding volume histogram series...')
    try {
      let volumeSeries
      const volumeOptions = {
        color: '#26a69a',
        priceFormat: {
          type: 'volume',
        },
        priceScaleId: 'volume',
      }
      
      // Try TradingView v5 API with histogram series constructor
      if (typeof chart.addSeries === 'function') {
        try {
          console.log('[AdvancedPriceChart] Trying addSeries with HistogramSeries constructor')
          volumeSeries = chart.addSeries(HistogramSeries, volumeOptions)
          console.log('[AdvancedPriceChart] ✅ HistogramSeries constructor worked!')
        } catch (e) {
          console.log('[AdvancedPriceChart] ❌ HistogramSeries constructor failed:', (e as Error).message)
          
          // Fallback: Try string-based approach
          const typeVariations = ['Histogram', 'histogram', 'HISTOGRAM', 'HistogramSeries', 'volume', 'Volume']
          
          for (const seriesType of typeVariations) {
            try {
              console.log(`[AdvancedPriceChart] Trying addSeries('${seriesType}') for volume`)
              volumeSeries = chart.addSeries(seriesType, volumeOptions)
              console.log(`[AdvancedPriceChart] ✅ addSeries('${seriesType}') worked for volume!`)
              break
            } catch (e2) {
              console.log(`[AdvancedPriceChart] ❌ addSeries('${seriesType}') failed for volume: ${(e2 as Error).message}`)
            }
          }
        }
      }
      
      if (!volumeSeries) {
        throw new Error('All volume series creation methods failed')
      }
      
      console.log('[AdvancedPriceChart] ✅ Volume histogram series created successfully')
      volumeSeriesRef.current = volumeSeries
    } catch (error) {
      console.error('[AdvancedPriceChart] ❌ Error creating volume histogram series:', error)
      throw error
    }

    // Configure volume scale
    chart.priceScale('volume').applyOptions({
      scaleMargins: {
        top: 0.85,
        bottom: 0,
      },
    })

    // Add crosshair handler
    chart.subscribeCrosshairMove((param: any) => {
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
          open: priceData.open || 0,
          high: priceData.high || 0,
          low: priceData.low || 0,
          close: priceData.close || 0,
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

  // Switch chart type (candlestick, line, area)
  const switchChartType = (newType: ChartType) => {
    if (!chartRef.current || !priceSeriesRef.current) return
    
    console.log('[AdvancedPriceChart] Switching chart type from', chartType, 'to', newType)
    
    // Remove existing price series
    try {
      chartRef.current.removeSeries(priceSeriesRef.current)
    } catch (error) {
      console.error('[AdvancedPriceChart] Error removing series:', error)
    }
    
    // Create new series based on type
    let newSeries
    const priceFormat = {
      type: 'price',
      precision: 8,
      minMove: 0.00000001,
    }
    
    try {
      switch (newType) {
        case 'line':
          newSeries = chartRef.current.addSeries(LineSeries, {
            color: '#00D4AA',
            lineWidth: 2,
            priceFormat,
          })
          break
        case 'area':
          newSeries = chartRef.current.addSeries(AreaSeries, {
            topColor: 'rgba(0, 212, 170, 0.4)',
            bottomColor: 'rgba(0, 212, 170, 0.0)',
            lineColor: '#00D4AA',
            lineWidth: 2,
            priceFormat,
          })
          break
        case 'candlestick':
        default:
          newSeries = chartRef.current.addSeries(CandlestickSeries, {
            upColor: '#26a69a',
            downColor: '#ef5350',
            borderVisible: false,
            wickUpColor: '#26a69a',
            wickDownColor: '#ef5350',
            priceFormat,
          })
          break
      }
      
      priceSeriesRef.current = newSeries
      console.log('[AdvancedPriceChart] ✅ Chart type switched to', newType)
      
      // Update chart type state
      setChartType(newType)
    } catch (error) {
      console.error('[AdvancedPriceChart] Error creating new series:', error)
    }
  }

  // Update chart data when filtered transactions change or price mode changes
  useEffect(() => {
    if (!priceSeriesRef.current || !volumeSeriesRef.current) return
    if (filteredTransactions.length === 0) return

    // Get candle interval in seconds based on timeframe
    const getCandleInterval = () => {
      switch (timeframe) {
        case '1m': return 60
        case '5m': return 300
        case '15m': return 900
        case '30m': return 1800
        case '1h': return 3600
        case '4h': return 14400
        case '1d': return 86400
        default: return 300 // default 5 minutes for 'all'
      }
    }

    const intervalSeconds = getCandleInterval()
    const priceMultiplier = priceMode === 'USD' ? ASTER_USD_PRICE : 1

    // Aggregate transactions into candlesticks
    const candleMap = new Map<number, {open: number, high: number, low: number, close: number, volume: number, lastTimestamp: number}>()

    filteredTransactions
      .filter(tx => tx.timestamp > 0)
      .sort((a, b) => a.timestamp - b.timestamp)
      .forEach(tx => {
        const asterAmount = Number(tx.asterAmountFormatted)
        const tokenAmount = Number(tx.tokenAmountFormatted)
        let price = tokenAmount > 0 ? asterAmount / tokenAmount : 0
        price *= priceMultiplier

        // Round timestamp to interval
        const candleTime = Math.floor(tx.timestamp / intervalSeconds) * intervalSeconds

        const existing = candleMap.get(candleTime)
        if (!existing) {
          candleMap.set(candleTime, {
            open: price,
            high: price,
            low: price,
            close: price,
            volume: asterAmount,
            lastTimestamp: tx.timestamp,
          })
        } else {
          existing.high = Math.max(existing.high, price)
          existing.low = Math.min(existing.low, price)
          if (tx.timestamp > existing.lastTimestamp) {
            existing.close = price
            existing.lastTimestamp = tx.timestamp
          }
          existing.volume += asterAmount
        }
      })

    // Convert to array format for TradingView
    const candleData: Array<{time: UTCTimestamp, open: number, high: number, low: number, close: number}> = []
    const volumeData: Array<{time: UTCTimestamp, value: number, color: string}> = []

    const sortedCandles = Array.from(candleMap.entries()).sort(([a], [b]) => a - b)
    
    // Add padding before first candle for better visibility (Pump.fun style)
    if (sortedCandles.length > 0) {
      const firstTime = sortedCandles[0][0]
      const firstCandle = sortedCandles[0][1]
      const paddingIntervals = 3 // Add 3 intervals before first trade
      
      for (let i = paddingIntervals; i > 0; i--) {
        const paddedTime = (firstTime - (intervalSeconds * i)) as UTCTimestamp
        candleData.push({
          time: paddedTime,
          open: firstCandle.open,
          high: firstCandle.open,
          low: firstCandle.open,
          close: firstCandle.open,
        })
        volumeData.push({
          time: paddedTime,
          value: 0,
          color: '#26a69a',
        })
      }
    }
    
    // Add actual candle data
    sortedCandles.forEach(([time, candle]) => {
      candleData.push({
        time: time as UTCTimestamp,
        open: candle.open,
        high: candle.high,
        low: candle.low,
        close: candle.close,
      })
      volumeData.push({
        time: time as UTCTimestamp,
        value: candle.volume,
        color: candle.close >= candle.open ? '#26a69a' : '#ef5350',
      })
    })

    if (candleData.length > 0) {
      try {
        // Set data based on chart type
        if (chartType === 'line' || chartType === 'area') {
          // For line/area charts, we only need time and value (close price)
          const lineData = candleData.map(candle => ({
            time: candle.time,
            value: candle.close,
          }))
          priceSeriesRef.current.setData(lineData)
        } else {
          // For candlestick charts, use full OHLC data
          priceSeriesRef.current.setData(candleData)
        }
        
        volumeSeriesRef.current.setData(volumeData)
        
        // Fit content ONLY on initial load to show all candles
        if (isInitialLoadRef.current && chartRef.current) {
          console.log('[AdvancedPriceChart] Initial load - fitting all candles:', candleData.length)
          setTimeout(() => {
            if (chartRef.current) {
              chartRef.current.timeScale().fitContent()
              isInitialLoadRef.current = false
            }
          }, 100)
        }
      } catch (error) {
        console.error('[AdvancedPriceChart] Error updating data:', error)
      }
    }
  }, [filteredTransactions, priceMode, chartType])

  // Separate effect to fit content only when timeframe changes
  useEffect(() => {
    if (!chartRef.current || !priceSeriesRef.current) return
    if (filteredTransactions.length === 0) return
    if (isInitialLoadRef.current) return // Don't interfere with initial load
    
    // Fit content when timeframe changes to show the selected period properly
    console.log('[AdvancedPriceChart] Timeframe changed, fitting content to:', timeframe, 'with', filteredTransactions.length, 'transactions')
    
    // Add a small delay to ensure data is updated before fitting
    setTimeout(() => {
      if (chartRef.current) {
        chartRef.current.timeScale().fitContent()
      }
    }, 100)
  }, [timeframe])

  if (isLoading && transactions.length === 0) {
    return (
      <div className="bg-secondary-light rounded-xl overflow-hidden">
        <div className="p-6">
        <div className="h-[600px] flex items-center justify-center">
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
          <div className="h-[600px] flex items-center justify-center">
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

  // Get current OHLC data from hovered or latest
  const currentOHLC = useMemo(() => {
    if (hoveredData) {
      return hoveredData
    }
    // Get latest candle data
    if (filteredTransactions.length > 0) {
      const latest = filteredTransactions[filteredTransactions.length - 1]
      const asterAmount = Number(latest.asterAmountFormatted)
      const tokenAmount = Number(latest.tokenAmountFormatted)
      const price = tokenAmount > 0 ? asterAmount / tokenAmount : 0
      return {
        open: price,
        high: price,
        low: price,
        close: price,
        volume: asterAmount,
        time: new Date(latest.timestamp * 1000).toLocaleString(),
      }
    }
    return null
  }, [hoveredData, filteredTransactions])

  // Calculate percentage changes for different periods
  const periodChanges = useMemo(() => {
    const now = Math.floor(Date.now() / 1000)
    const periods = {
      '5m': 300,
      '1h': 3600,
      '6h': 21600,
    }

    const currentPrice = stats.currentPrice
    const changes: Record<string, number> = {}

    Object.entries(periods).forEach(([period, seconds]) => {
      const cutoff = now - seconds
      const oldTx = transactions.find(tx => tx.timestamp <= cutoff)
      if (oldTx && currentPrice > 0) {
        const asterAmount = Number(oldTx.asterAmountFormatted)
        const tokenAmount = Number(oldTx.tokenAmountFormatted)
        const oldPrice = tokenAmount > 0 ? asterAmount / tokenAmount : 0
        if (oldPrice > 0) {
          changes[period] = ((currentPrice - oldPrice) / oldPrice) * 100
        } else {
          changes[period] = 0
        }
      } else {
        changes[period] = 0
      }
    })

    return changes
  }, [transactions, stats.currentPrice])

  return (
    <div className="bg-secondary-light rounded-xl overflow-hidden">
      {/* Pump.fun Style: Inline OHLC Header */}
      <div className="px-6 py-3 border-b border-gray-700">
        {/* Top Controls Row */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            {/* Timeframe Selector */}
            <select
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value as Timeframe)}
              className="bg-secondary text-white px-3 py-1.5 rounded text-xs font-medium border border-gray-700 hover:border-primary transition cursor-pointer"
            >
              <option value="15m">15m</option>
              <option value="1h">1h</option>
              <option value="4h">4h</option>
              <option value="1d">1d</option>
              <option value="all">All</option>
            </select>

            {/* Chart Type Selector */}
            <select
              value={chartType}
              onChange={(e) => switchChartType(e.target.value as ChartType)}
              className="bg-secondary text-white px-3 py-1.5 rounded text-xs font-medium border border-gray-700 hover:border-primary transition cursor-pointer"
            >
              <option value="candlestick">Candlestick</option>
              <option value="line">Line</option>
              <option value="area">Area</option>
            </select>

            {/* USD/ASTER Toggle */}
            <div className="flex bg-secondary rounded p-0.5">
              <button
                onClick={() => setPriceMode('ASTER')}
                className={`px-2 py-1 rounded text-xs font-medium transition ${
                  priceMode === 'ASTER'
                    ? 'bg-primary text-black'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                ASTER
              </button>
              <button
                onClick={() => setPriceMode('USD')}
                className={`px-2 py-1 rounded text-xs font-medium transition ${
                  priceMode === 'USD'
                    ? 'bg-primary text-black'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                USD
              </button>
            </div>
          </div>
        </div>

        {/* OHLC Info Line - Pump.fun Style */}
        <div className="flex items-center gap-3 text-sm mb-1">
          <span className="font-medium text-white">
            {tokenSymbol}/{priceMode === 'USD' ? 'USD' : 'ASTER'} Price ({priceMode === 'USD' ? 'USD' : 'ASTER'})
          </span>
          <span className="text-gray-400">•</span>
          <span className="text-gray-400">{timeframe === 'all' ? 'All' : timeframe}</span>
          <span className="text-gray-400">•</span>
          <span className="text-gray-400">Pump</span>
          
          {currentOHLC && (
            <>
              <span className="text-green-400">
                O:{(priceMode === 'USD' ? currentOHLC.open * ASTER_USD_PRICE : currentOHLC.open).toFixed(priceMode === 'USD' ? 4 : 8)}
              </span>
              <span className="text-green-400">
                H:{(priceMode === 'USD' ? currentOHLC.high * ASTER_USD_PRICE : currentOHLC.high).toFixed(priceMode === 'USD' ? 4 : 8)}
              </span>
              <span className="text-red-400">
                L:{(priceMode === 'USD' ? currentOHLC.low * ASTER_USD_PRICE : currentOHLC.low).toFixed(priceMode === 'USD' ? 4 : 8)}
              </span>
              <span className={stats.change24h >= 0 ? 'text-green-400' : 'text-red-400'}>
                C:{(priceMode === 'USD' ? currentOHLC.close * ASTER_USD_PRICE : currentOHLC.close).toFixed(priceMode === 'USD' ? 4 : 8)}
              </span>
              <span className={`font-medium ${
                stats.change24h >= 0 ? 'text-green-500' : 'text-red-500'
              }`}>
                {stats.change24h >= 0 ? '+' : ''}{stats.change24h.toFixed(2)}%
              </span>
            </>
          )}
        </div>

        {/* Volume Line */}
        <div className="text-xs text-gray-400">
          Volume {priceMode === 'USD' ? `$${stats.volume24hUSD.toFixed(2)}` : `${stats.volume24h.toFixed(4)} ASTER`}
        </div>
      </div>

      {/* Hover Tooltip - Candlestick OHLC */}
      {hoveredData && (
        <div className="px-6 py-3 bg-secondary border-b border-gray-700">
          <div className="grid grid-cols-6 gap-3 text-sm">
            <div>
              <p className="text-gray-400 text-xs mb-1">Time</p>
              <p className="font-semibold text-white text-xs">{hoveredData.time}</p>
            </div>
            <div>
              <p className="text-gray-400 text-xs mb-1">Open</p>
              <p className="font-bold text-white">
                {priceMode === 'USD' ? `$${hoveredData.open.toFixed(6)}` : hoveredData.open.toFixed(8)}
              </p>
            </div>
            <div>
              <p className="text-gray-400 text-xs mb-1">High</p>
              <p className="font-bold text-green-400">
                {priceMode === 'USD' ? `$${hoveredData.high.toFixed(6)}` : hoveredData.high.toFixed(8)}
              </p>
            </div>
            <div>
              <p className="text-gray-400 text-xs mb-1">Low</p>
              <p className="font-bold text-red-400">
                {priceMode === 'USD' ? `$${hoveredData.low.toFixed(6)}` : hoveredData.low.toFixed(8)}
              </p>
            </div>
            <div>
              <p className="text-gray-400 text-xs mb-1">Close</p>
              <p className={`font-bold ${hoveredData.close >= hoveredData.open ? 'text-green-500' : 'text-red-500'}`}>
                {priceMode === 'USD' ? `$${hoveredData.close.toFixed(6)}` : hoveredData.close.toFixed(8)}
              </p>
            </div>
            <div>
              <p className="text-gray-400 text-xs mb-1">Volume</p>
              <p className="font-semibold text-primary">
                {priceMode === 'USD'
                  ? `$${(hoveredData.volume * ASTER_USD_PRICE).toFixed(2)}`
                  : `${hoveredData.volume.toFixed(4)} ASTER`
                }
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Chart Container with Toolbar */}
      <div className="relative">
        {/* Vertical Chart Toolbar - Left Side */}
        <div className="absolute left-2 top-4 z-10 flex flex-col gap-1">
          {/* Zoom In */}
          <button
            onClick={() => {
              if (chartRef.current) {
                const timeScale = chartRef.current.timeScale()
                timeScale.scrollToPosition(-5, true)
              }
            }}
            className="bg-secondary/90 hover:bg-secondary border border-gray-700 p-1.5 rounded transition backdrop-blur-sm"
            title="Zoom In"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
            </svg>
          </button>
          
          {/* Zoom Out */}
          <button
            onClick={() => {
              if (chartRef.current) {
                const timeScale = chartRef.current.timeScale()
                timeScale.scrollToPosition(5, true)
              }
            }}
            className="bg-secondary/90 hover:bg-secondary border border-gray-700 p-1.5 rounded transition backdrop-blur-sm"
            title="Zoom Out"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
            </svg>
          </button>
          
          {/* Fit Content */}
          <button
            onClick={() => {
              if (chartRef.current) {
                chartRef.current.timeScale().fitContent()
              }
            }}
            className="bg-secondary/90 hover:bg-secondary border border-gray-700 p-1.5 rounded transition backdrop-blur-sm"
            title="Fit to Screen"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
          </button>

          {/* Divider */}
          <div className="h-px bg-gray-700 my-1"></div>

          {/* Period Selectors - Moved to toolbar bottom */}
          <button
            onClick={() => setTimeframe('1d')}
            className={`px-2 py-1.5 rounded text-xs font-medium transition ${
              timeframe === '1d'
                ? 'bg-primary text-black'
                : 'bg-secondary/90 text-gray-300 hover:text-white border border-gray-700'
            }`}
            title="1 Day"
          >
            1D
          </button>
          <button
            onClick={() => setTimeframe('4h')}
            className={`px-2 py-1.5 rounded text-xs font-medium transition ${
              timeframe === '4h'
                ? 'bg-primary text-black'
                : 'bg-secondary/90 text-gray-300 hover:text-white border border-gray-700'
            }`}
            title="5 Days"
          >
            5D
          </button>
          <button
            onClick={() => setTimeframe('all')}
            className={`px-2 py-1.5 rounded text-xs font-medium transition ${
              timeframe === 'all'
                ? 'bg-primary text-black'
                : 'bg-secondary/90 text-gray-300 hover:text-white border border-gray-700'
            }`}
            title="1 Month / All"
          >
            1M
          </button>
        </div>
        
        <div ref={chartContainerRef} className="w-full" />
      </div>

      {/* Stats Row Below Chart - Pump.fun Style */}
      <div className="px-6 py-3 bg-secondary border-t border-gray-700">
        <div className="flex items-center gap-6 text-sm">
          <div>
            <span className="text-gray-400">Vol 24h: </span>
            <span className="font-bold text-white">
              {priceMode === 'USD' ? `$${stats.volume24hUSD.toFixed(2)}` : `${stats.volume24h.toFixed(4)} ASTER`}
            </span>
          </div>
          <div>
            <span className="text-gray-400">Price: </span>
            <span className={`font-bold ${
              stats.change24h >= 0 ? 'text-green-500' : 'text-red-500'
            }`}>
              {priceMode === 'USD'
                ? `$${stats.currentPriceUSD.toFixed(6)}`
                : `${stats.currentPrice.toFixed(8)} ASTER`
              }
            </span>
          </div>
          <div>
            <span className="text-gray-400">5m: </span>
            <span className={`font-bold ${
              periodChanges['5m'] >= 0 ? 'text-green-500' : 'text-red-500'
            }`}>
              {periodChanges['5m'] >= 0 ? '+' : ''}{periodChanges['5m'].toFixed(2)}%
            </span>
          </div>
          <div>
            <span className="text-gray-400">1h: </span>
            <span className={`font-bold ${
              periodChanges['1h'] >= 0 ? 'text-green-500' : 'text-red-500'
            }`}>
              {periodChanges['1h'] >= 0 ? '+' : ''}{periodChanges['1h'].toFixed(2)}%
            </span>
          </div>
          <div>
            <span className="text-gray-400">6h: </span>
            <span className={`font-bold ${
              periodChanges['6h'] >= 0 ? 'text-green-500' : 'text-red-500'
            }`}>
              {periodChanges['6h'] >= 0 ? '+' : ''}{periodChanges['6h'].toFixed(2)}%
            </span>
          </div>
        </div>
      </div>

      {/* Chart Footer */}
      <div className="px-6 py-3 bg-secondary border-t border-gray-700 flex items-center justify-between text-xs text-gray-400">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span>Bullish Candle</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded"></div>
            <span>Bearish Candle</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-1 bg-primary rounded"></div>
            <span>Volume</span>
          </div>
          <div>
            <span className="text-gray-500">{filteredTransactions.length} trades • {timeframe === 'all' ? 'All time' : timeframe} candles</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs">1 ASTER = ${ASTER_USD_PRICE.toFixed(2)}</span>
          <span className="text-gray-600">•</span>
          <span>Powered by TradingView</span>
        </div>
      </div>
    </div>
  )
}

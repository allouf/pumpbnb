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

// Backend stats interface - these are the source of truth, no frontend calculations needed
interface BackendTokenStats {
  price?: string
  priceUsd?: string
  marketCap?: string
  marketCapUsd?: string
  volume24h?: string
  volume24hUsd?: string
  trades24h?: number
  holders?: number
  priceChange24h?: string
  liquidity?: string
  liquidityUsd?: string
}

interface AdvancedPriceChartProps {
  bondingCurveAddress: string
  tokenSymbol: string
  marketCap?: string
  marketCapChange24h?: number
  ath?: number
  // Backend-calculated USD values (most accurate - uses ASTER reserves × ASTER USD price)
  backendPriceUsd?: number
  backendMarketCapUsd?: number
  // Full backend stats - use these directly, no frontend calculations!
  backendStats?: BackendTokenStats
}

type Timeframe = 'all' | '1m' | '5m' | '15m' | '30m' | '1h' | '4h' | '1d'
type PriceMode = 'ASTER' | 'USD'
type ChartType = 'candlestick' | 'line' | 'area' | 'columns'

// Default ASTER USD price - will be fetched live
const DEFAULT_ASTER_USD_PRICE = 1.17

// Total token supply - all tokens have 1 billion supply
const TOTAL_TOKEN_SUPPLY = 1_000_000_000

// Format market cap with K, M, B suffixes
const formatMarketCap = (mcap: number, currency: 'USD' | 'ASTER' = 'ASTER'): string => {
  if (mcap === undefined || mcap === null || isNaN(mcap) || mcap === 0) return '0'

  const prefix = currency === 'USD' ? '$' : ''
  const suffix = currency === 'ASTER' ? ' ASTER' : ''

  if (mcap >= 1_000_000_000) {
    return `${prefix}${(mcap / 1_000_000_000).toFixed(2)}B${suffix}`
  }
  if (mcap >= 1_000_000) {
    return `${prefix}${(mcap / 1_000_000).toFixed(2)}M${suffix}`
  }
  if (mcap >= 1_000) {
    return `${prefix}${(mcap / 1_000).toFixed(2)}K${suffix}`
  }
  return `${prefix}${mcap.toFixed(2)}${suffix}`
}

// Smart price formatting function - ASTER per token with Pump.fun style subscript notation
const formatPrice = (price: number, currency: 'USD' | 'ASTER' = 'ASTER'): string => {
  // Handle undefined, null, NaN, or 0
  if (price === undefined || price === null || isNaN(price) || price === 0) return '0'

  const prefix = currency === 'USD' ? '$' : ''
  const suffix = currency === 'ASTER' ? ' ASTER' : ''

  // For very small values, use Pump.fun style subscript notation: 0.0₆39
  if (Math.abs(price) < 0.0001) {
    const priceStr = price.toFixed(20) // Get many decimals
    const match = priceStr.match(/^0\.0+/)

    if (match) {
      const leadingZeros = match[0].length - 2 // Subtract "0."
      const significantDigits = priceStr.slice(match[0].length, match[0].length + 2)

      // Convert zero count to subscript
      const subscriptDigits = ['₀', '₁', '₂', '₃', '₄', '₅', '₆', '₇', '₈', '₉']
      const subscriptCount = leadingZeros.toString().split('').map(d => subscriptDigits[parseInt(d)]).join('')

      return `${prefix}0.0${subscriptCount}${significantDigits}${suffix}`
    }
  }

  // For small values, use more decimal places
  if (Math.abs(price) < 0.01) {
    return `${prefix}${price.toFixed(8)}${suffix}`
  }

  // For normal values
  return `${prefix}${price.toFixed(6)}${suffix}`
}

// Compact price formatting for header (no suffix, cleaner) - Pump.fun style
const formatCompactPrice = (price: number, currency: 'USD' | 'ASTER' = 'ASTER'): string => {
  // Handle undefined, null, NaN, or 0
  if (price === undefined || price === null || isNaN(price) || price === 0) return '0'

  const prefix = currency === 'USD' ? '$' : ''

  // For very small values, use Pump.fun style subscript notation: 0.0₆39
  if (Math.abs(price) < 0.0001) {
    const priceStr = price.toFixed(20) // Get many decimals
    const match = priceStr.match(/^0\.0+/)

    if (match) {
      const leadingZeros = match[0].length - 2 // Subtract "0."
      const significantDigits = priceStr.slice(match[0].length, match[0].length + 2)

      // Convert zero count to subscript
      const subscriptDigits = ['₀', '₁', '₂', '₃', '₄', '₅', '₆', '₇', '₈', '₉']
      const subscriptCount = leadingZeros.toString().split('').map(d => subscriptDigits[parseInt(d)]).join('')

      return `${prefix}0.0${subscriptCount}${significantDigits}`
    }
  }

  return `${prefix}${price.toFixed(6)}`
}

export function AdvancedPriceChart({
  bondingCurveAddress,
  tokenSymbol,
  marketCap,
  marketCapChange24h = 0,
  ath,
  backendPriceUsd = 0,
  backendMarketCapUsd = 0,
  backendStats,
}: AdvancedPriceChartProps) {
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
  const [priceMode, setPriceMode] = useState<PriceMode>('USD') // Default to USD for user-friendly display
  const [chartType, setChartType] = useState<ChartType>('candlestick')
  const [hoveredData, setHoveredData] = useState<{open: number, high: number, low: number, close: number, volume: number, time: string} | null>(null)
  
  // Chart control toggles
  const [showTradeDisplay, setShowTradeDisplay] = useState(true)
  const [displayMetric, setDisplayMetric] = useState<'Price' | 'MCap'>('Price')
  const [showDebugPanel, setShowDebugPanel] = useState(false)

  // ASTER USD price state - fetched from API
  const [asterUsdPrice, setAsterUsdPrice] = useState(DEFAULT_ASTER_USD_PRICE)

  // Debug function to log comprehensive chart state
  const logDebugInfo = () => {
    console.log('╔═══════════════════════════════════════════════════════════════╗')
    console.log('║           🔍 CHART DEBUG INFO - Manual Trigger                ║')
    console.log('╚═══════════════════════════════════════════════════════════════╝')

    // 1. BACKEND STATS (Source of Truth)
    console.log('\n📊 BACKEND STATS (Source of Truth - from API):')
    console.log('┌─────────────────────────────────────────────────────────────┐')
    console.log('│ Price (ASTER):', backendStats?.price)
    console.log('│ Price (USD):', backendStats?.priceUsd)
    console.log('│ Market Cap (ASTER):', backendStats?.marketCap)
    console.log('│ Market Cap (USD):', backendStats?.marketCapUsd)
    console.log('│ Volume 24h (USD):', backendStats?.volume24hUsd)
    console.log('│ Price Change 24h:', backendStats?.priceChange24h, '%')
    console.log('│ Trades 24h:', backendStats?.trades24h)
    console.log('│ Holders:', backendStats?.holders)
    console.log('└─────────────────────────────────────────────────────────────┘')

    // 2. CURRENT BUTTON/TOGGLE STATES
    console.log('\n🎛️ CURRENT BUTTON STATES:')
    console.log('┌─────────────────────────────────────────────────────────────┐')
    console.log('│ Price Mode:', priceMode, priceMode === 'USD' ? '✅ (USD selected)' : '(ASTER selected)')
    console.log('│ Display Metric:', displayMetric, displayMetric === 'MCap' ? '(Market Cap)' : '(Price)')
    console.log('│ Chart Type:', chartType)
    console.log('│ Timeframe:', timeframe)
    console.log('│ Show Trade Display:', showTradeDisplay)
    console.log('└─────────────────────────────────────────────────────────────┘')

    // 3. CHART STATE & AXES
    console.log('\n📈 CHART STATE & AXES:')
    console.log('┌─────────────────────────────────────────────────────────────┐')
    console.log('│ Chart Created:', chartCreatedRef.current ? '✅ YES' : '❌ NO')
    console.log('│ Initial Load Complete:', !isInitialLoadRef.current ? '✅ YES' : '⏳ NO (still loading)')
    console.log('│ Price Series Ready:', priceSeriesRef.current ? '✅ YES' : '❌ NO')
    console.log('│ Volume Series Ready:', volumeSeriesRef.current ? '✅ YES' : '❌ NO')

    if (chartRef.current) {
      try {
        const timeScale = chartRef.current.timeScale()
        const visibleRange = timeScale.getVisibleRange()
        if (visibleRange) {
          const fromDate = new Date((visibleRange as any).from * 1000)
          const toDate = new Date((visibleRange as any).to * 1000)
          const durationHours = ((visibleRange as any).to - (visibleRange as any).from) / 3600
          console.log('│ X-Axis (Time):')
          console.log('│   From:', fromDate.toLocaleString())
          console.log('│   To:', toDate.toLocaleString())
          console.log('│   Duration:', durationHours.toFixed(1), 'hours')
        }
      } catch (e) {
        console.log('│ X-Axis: Error getting range')
      }
    }
    console.log('└─────────────────────────────────────────────────────────────┘')

    // 4. DATA FIT & CANDLES
    console.log('\n📊 DATA & CANDLES:')
    console.log('┌─────────────────────────────────────────────────────────────┐')
    console.log('│ Total Transactions:', transactions.length)
    console.log('│ Filtered Transactions:', filteredTransactions.length)
    console.log('│ ASTER USD Price (for conversion):', asterUsdPrice)

    if (filteredTransactions.length > 0) {
      const firstTx = filteredTransactions[0]
      const lastTx = filteredTransactions[filteredTransactions.length - 1]
      console.log('│ First Transaction:', new Date(firstTx.timestamp * 1000).toLocaleString())
      console.log('│ Last Transaction:', new Date(lastTx.timestamp * 1000).toLocaleString())
    }
    console.log('└─────────────────────────────────────────────────────────────┘')

    // 5. DISPLAY VALUES (What user sees)
    console.log('\n👁️ DISPLAYED VALUES (What user sees):')
    console.log('┌─────────────────────────────────────────────────────────────┐')
    const mcapDisplay = parseFloat(backendStats?.marketCapUsd || '0') || backendMarketCapUsd
    const priceDisplay = parseFloat(backendStats?.priceUsd || '0') || backendPriceUsd
    const changeDisplay = parseFloat(backendStats?.priceChange24h || '0')
    console.log('│ Market Cap Header:', '$' + mcapDisplay.toFixed(2))
    console.log('│ Price (Row 3):', '$' + priceDisplay.toExponential(2))
    console.log('│ 24h Change:', changeDisplay >= 0 ? '+' : '', changeDisplay.toFixed(2), '%')
    console.log('│ ATH:', '$' + (ath || mcapDisplay).toFixed(2))
    console.log('└─────────────────────────────────────────────────────────────┘')

    // 6. RENDER STATUS
    console.log('\n✅ RENDER STATUS: SUCCESS')
    console.log('═══════════════════════════════════════════════════════════════')
  }

  // Fetch ASTER price on mount and when price mode changes to USD
  useEffect(() => {
    const fetchAsterPrice = async () => {
      console.log('[AdvancedPriceChart] 💰 Fetching ASTER USD price...')
      try {
        // Try backend first
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
        const backendRes = await fetch(`${API_URL}/api/prices/aster`, {
          signal: AbortSignal.timeout(3000)
        }).catch(() => null)

        if (backendRes?.ok) {
          const data = await backendRes.json()
          if (data.price && data.price > 0) {
            console.log('[AdvancedPriceChart] ✅ ASTER price from backend:', data.price)
            setAsterUsdPrice(data.price)
            return
          }
        }

        // Fallback: Try GeckoTerminal API directly
        const geckoRes = await fetch(
          'https://api.geckoterminal.com/api/v2/networks/bsc/tokens/0x000ae314e2a2172a039b26378814c252734f556a',
          { signal: AbortSignal.timeout(5000) }
        ).catch(() => null)

        if (geckoRes?.ok) {
          const data = await geckoRes.json()
          const price = data?.data?.attributes?.price_usd
          if (price && parseFloat(price) > 0) {
            console.log('[AdvancedPriceChart] ✅ ASTER price from GeckoTerminal:', parseFloat(price))
            setAsterUsdPrice(parseFloat(price))
            return
          }
        }

        console.log('[AdvancedPriceChart] ⚠️ Using fallback ASTER price:', DEFAULT_ASTER_USD_PRICE)
      } catch (error) {
        console.warn('[AdvancedPriceChart] ❌ Failed to fetch ASTER price:', error)
      }
    }

    fetchAsterPrice()

    // Refresh every 5 minutes
    const interval = setInterval(fetchAsterPrice, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  // Debug function to log current chart state
  const logCurrentChartState = () => {
    console.log('🔴 DEBUG BUTTON CLICKED!')
    
    if (!chartRef.current) {
      console.log('❌ Chart ref is null!')
      alert('Chart not initialized yet!')
      return
    }
    
    try {
      const timeScale = chartRef.current.timeScale()
      const visibleRange = timeScale.getVisibleRange()
      
      console.log('═══════════════════════════════════════════════════')
      console.log('📊 CURRENT CHART STATE:')
      console.log('═══════════════════════════════════════════════════')
      console.log('Visible Time Range:', visibleRange)
      console.log('From:', visibleRange ? new Date((visibleRange as any).from * 1000).toISOString() : 'N/A')
      console.log('To:', visibleRange ? new Date((visibleRange as any).to * 1000).toISOString() : 'N/A')
      console.log('Scale Margins (current):', {
        top: 0.20,
        bottom: 0.35
      })
      console.log('Chart Type:', chartType)
      console.log('Timeframe:', timeframe)
      console.log('Price Mode:', priceMode)
      console.log('Transactions Count:', filteredTransactions.length)
      console.log('═══════════════════════════════════════════════════')
      
      alert('Chart state logged to console! Check browser console (F12)')
    } catch (error) {
      console.error('Error logging chart state:', error)
      alert('Error logging state: ' + error)
    }
  }

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
  
  // Debug transaction data quality
  if (transactions.length > 0) {
    const validTxs = transactions.filter(tx => {
      return (tx.asterAmountFormatted && tx.tokenAmountFormatted) || (tx.asterAmount && tx.tokenAmount)
    })
    console.log('[AdvancedPriceChart] 🔍 Transaction data quality:', {
      total: transactions.length,
      withValidData: validTxs.length,
      withNullData: transactions.length - validTxs.length,
      firstTxTimestamp: validTxs[0] ? new Date(validTxs[0].timestamp * 1000).toLocaleString() : 'none',
      lastTxTimestamp: validTxs[validTxs.length - 1] ? new Date(validTxs[validTxs.length - 1].timestamp * 1000).toLocaleString() : 'none',
      pricesCalculated: validTxs.map(tx => {
        const asterAmount = tx.asterAmountFormatted ? Number(tx.asterAmountFormatted) : Number(tx.asterAmount) / 1e18
        const tokenAmount = tx.tokenAmountFormatted ? Number(tx.tokenAmountFormatted) : Number(tx.tokenAmount) / 1e18
        const priceAster = tokenAmount > 0 ? asterAmount / tokenAmount : 0
        const priceUSD = priceAster * asterUsdPrice
        return { priceAster: priceAster.toFixed(12), priceUSD: priceUSD.toFixed(12), timestamp: new Date(tx.timestamp * 1000).toLocaleString() }
      })
    })
  }

  // Calculate prices from transactions - ONLY used for chart candle rendering
  // Display values come from backendStats (source of truth)
  const stats = useMemo(() => {
    const emptyStats = {
      currentPrice: 0,
      currentPriceUSD: 0,
      change24h: 0,
      high24h: 0,
      low24h: 0,
    }

    if (transactions.length === 0) return emptyStats

    // Sort transactions by timestamp (oldest first) for proper price history
    const sortedTransactions = [...transactions].sort((a, b) => a.timestamp - b.timestamp)

    // Calculate prices for chart candles only
    const prices = sortedTransactions.map(tx => {
      let asterAmount, tokenAmount

      if (tx.asterAmountFormatted && tx.tokenAmountFormatted) {
        asterAmount = Number(tx.asterAmountFormatted)
        tokenAmount = Number(tx.tokenAmountFormatted)
      } else if (tx.asterAmount && tx.tokenAmount) {
        asterAmount = Number(tx.asterAmount) / 1e18
        tokenAmount = Number(tx.tokenAmount) / 1e18
      } else {
        return 0
      }

      return tokenAmount > 0 ? asterAmount / tokenAmount : 0
    }).filter(p => p > 0)

    if (prices.length === 0) return emptyStats

    const currentAsterPerToken = prices[prices.length - 1]
    const currentUSDPerToken = currentAsterPerToken * asterUsdPrice
    const firstPrice = prices[0]
    const change24h = firstPrice > 0 ? ((currentAsterPerToken - firstPrice) / firstPrice) * 100 : 0

    // Calculate high/low from prices array for chart rendering
    const high24hAsterPerToken = Math.max(...prices)
    const low24hAsterPerToken = Math.min(...prices)

    // Only return what's needed for chart candle rendering
    // All display values (volume, mcap, etc.) come from backendStats
    return {
      currentPrice: currentAsterPerToken,
      currentPriceUSD: currentUSDPerToken,
      change24h,
      high24h: high24hAsterPerToken,
      low24h: low24hAsterPerToken,
    }
  }, [transactions, asterUsdPrice])

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
        background: { type: ColorType.Solid, color: '#0a0a0a' }, // Very dark background like Pump.fun
        textColor: '#9ca3af',    // Gray text for labels
        fontSize: 11,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Inter", sans-serif',
      },
      grid: {
        vertLines: {
          color: 'rgba(75, 85, 99, 0.4)',  // Much more visible grid lines (darker gray)
          style: 0,  // Solid lines
          visible: true,
        },
        horzLines: {
          color: 'rgba(75, 85, 99, 0.4)',  // Much more visible horizontal lines
          style: 0,  // Solid lines
          visible: true,
        },
      },
      width: chartContainerRef.current.clientWidth,
      height: 400,
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          width: 1,
          color: 'rgba(156, 163, 175, 0.5)',
          style: 2,  // Dashed line
          labelBackgroundColor: '#1f2937',
          labelVisible: true,
        },
        horzLine: {
          width: 1,
          color: 'rgba(156, 163, 175, 0.5)',
          style: 2,  // Dashed line
          labelBackgroundColor: '#1f2937',
          labelVisible: true,
        },
      },
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
        borderColor: 'rgba(75, 85, 99, 0.3)',
        borderVisible: true,
        rightOffset: 12,
        barSpacing: 8, // Tighter spacing like Pump.fun
        minBarSpacing: 2,
        fixLeftEdge: false,
        fixRightEdge: false,
        lockVisibleTimeRangeOnResize: true,
        rightBarStaysOnScroll: true,
        visible: true,
        shiftVisibleRangeOnNewBar: true,
        tickMarkFormatter: (time: any) => {
          const date = new Date(time * 1000)
          const hours = date.getHours()
          const minutes = date.getMinutes()

          // Format like Pump.fun: "12:00", "18:00", "20" (just hour if :00)
          if (minutes === 0) {
            return hours.toString()
          }
          return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
        },
      },
      rightPriceScale: {
        borderColor: 'rgba(156, 163, 175, 0.5)',
        textColor: '#d1d5db',
        visible: true,
        scaleMargins: {
          top: 0.15,
          bottom: 0.30,
        },
        autoScale: true,
        mode: 0, // Normal price scale mode
        invertScale: false,
        alignLabels: true,
        borderVisible: true,
        entireTextOnly: false,
        minimumWidth: 0,
        ticksVisible: true,
      },
      kineticScroll: {
        touch: true,
        mouse: false,
      },
      handleScroll: {
        mouseWheel: true,
        pressedMouseMove: true,
        horzTouchDrag: true,
        vertTouchDrag: true,
      },
      handleScale: {
        axisPressedMouseMove: true,
        mouseWheel: true,
        pinch: true,
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
      const priceSeriesOptions = {
        upColor: '#22c55e',     // Bright green for bullish candles (more vibrant)
        downColor: '#ef4444',   // Bright red for bearish candles
        borderVisible: true,
        borderUpColor: '#22c55e', // Same color border for cleaner look
        borderDownColor: '#ef4444', // Same color border for cleaner look
        wickUpColor: '#22c55e',
        wickDownColor: '#ef4444',
        priceFormat: {
          type: 'custom',
          // Custom formatter for Y-axis with Pump.fun style subscript notation
          formatter: (price: number) => {
            if (price === 0) return '0'

            // For very small values, use Pump.fun style subscript notation
            if (Math.abs(price) < 0.0001) {
              const priceStr = price.toFixed(20)
              const match = priceStr.match(/^0\.0+/)

              if (match) {
                const leadingZeros = match[0].length - 2
                const significantDigits = priceStr.slice(match[0].length, match[0].length + 2)
                const subscriptDigits = ['₀', '₁', '₂', '₃', '₄', '₅', '₆', '₇', '₈', '₉']
                const subscriptCount = leadingZeros.toString().split('').map(d => subscriptDigits[parseInt(d)]).join('')
                return `0.0${subscriptCount}${significantDigits}`
              }
            }

            // For small values, use more decimals
            if (Math.abs(price) < 0.01) return price.toFixed(8)

            // For normal values
            return price.toFixed(6)
          },
          minMove: 0.000000000001,
        },
        // Enhanced visual properties
        priceLineVisible: false, // Hide price line for cleaner look
        lastValueVisible: true,
      }
      
      // Try TradingView v5 API with series constructor
      if (typeof chart.addSeries === 'function') {
        try {
          console.log('[AdvancedPriceChart] Trying addSeries with CandlestickSeries constructor')
          priceSeries = chart.addSeries(CandlestickSeries, priceSeriesOptions)
          console.log('[AdvancedPriceChart] ✅ CandlestickSeries constructor worked!')
        } catch (e) {
          console.log('[AdvancedPriceChart] ❌ CandlestickSeries constructor failed:', (e as Error).message)
          
          // Fallback: Try string-based approach (in case it's a different v5 variant)
          const typeVariations = ['Candlestick', 'candlestick', 'CANDLESTICK', 'CandlestickSeries', 'ohlc', 'OHLC', 'bars']
          
          for (const seriesType of typeVariations) {
            try {
              console.log(`[AdvancedPriceChart] Trying addSeries('${seriesType}')`)
              priceSeries = chart.addSeries(seriesType, priceSeriesOptions)
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
        color: 'rgba(34, 197, 94, 0.5)',  // Brighter green matching candles
        priceFormat: {
          type: 'volume',
        },
        priceScaleId: 'volume',
        base: 0,
        // Enhanced volume bar appearance
        lastValueVisible: false,
        priceLineVisible: false,
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

    // Add crosshair handler with improved OHLC data handling
    chart.subscribeCrosshairMove((param: any) => {
      try {
        if (!param.time || !param.point || !param.seriesData || param.seriesData.size === 0) {
          setHoveredData(null)
          return
        }

        if (!priceSeriesRef.current || !volumeSeriesRef.current) return

        const priceData = param.seriesData.get(priceSeriesRef.current) as any
        const volumeData = param.seriesData.get(volumeSeriesRef.current) as any

        if (priceData && volumeData) {
          const date = new Date((param.time as number) * 1000)
          // Handle different data structures for candlestick vs line/area charts
          const hasOHLC = priceData.open !== undefined && priceData.high !== undefined
          
          if (hasOHLC) {
            // Candlestick data - values are already in the correct price mode from candle generation
            setHoveredData({
              open: priceData.open,
              high: priceData.high,
              low: priceData.low,
              close: priceData.close,
              volume: volumeData.value || 0,
              time: date.toLocaleString(),
            })
          } else {
            // Line/Area data - use value for all OHLC
            const value = priceData.value || 0
            setHoveredData({
              open: value,
              high: value,
              low: value,
              close: value,
              volume: volumeData.value || 0,
              time: date.toLocaleString(),
            })
          }
        }
      } catch (error) {
        console.warn('[AdvancedPriceChart] Error in crosshair handler:', error)
        setHoveredData(null)
      }
    })

    // Handle resize and layout changes
    const handleResize = () => {
      if (chartContainerRef.current && chart) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth })
      }
    }

    // Create a resize observer to handle sidebar expand/collapse
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.target === chartContainerRef.current && chart) {
          // Debounce the resize to avoid too frequent updates
          clearTimeout((window as any)._chartResizeTimeout)
          ;(window as any)._chartResizeTimeout = setTimeout(() => {
            chart.applyOptions({ width: entry.contentRect.width })
          }, 100)
        }
      }
    })

    if (chartContainerRef.current) {
      resizeObserver.observe(chartContainerRef.current)
    }

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      resizeObserver.disconnect()
      clearTimeout((window as any)._chartResizeTimeout)
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
            color: '#22c55e',      // Bright green consistent with candlesticks
            lineWidth: 2,          // Medium thickness
            priceFormat,
            crosshairMarkerVisible: true,
            crosshairMarkerRadius: 6,
            crosshairMarkerBorderColor: '#22c55e',
            crosshairMarkerBackgroundColor: '#22c55e',
            lastValueVisible: true,
            priceLineVisible: false,
          })
          break
        case 'area':
          newSeries = chartRef.current.addSeries(AreaSeries, {
            topColor: 'rgba(34, 197, 94, 0.6)',    // Brighter green gradient
            bottomColor: 'rgba(34, 197, 94, 0.05)', // Subtle fade to transparent
            lineColor: '#22c55e',
            lineWidth: 2,
            priceFormat,
            crosshairMarkerVisible: true,
            crosshairMarkerRadius: 6,
            crosshairMarkerBorderColor: '#22c55e',
            crosshairMarkerBackgroundColor: '#22c55e',
            lastValueVisible: true,
            priceLineVisible: false,
          })
          break
        case 'columns':
          newSeries = chartRef.current.addSeries(HistogramSeries, {
            color: '#22c55e',       // Bright green color
            priceFormat,
            priceScaleId: 'right',
            lastValueVisible: true,
            priceLineVisible: false,
          })
          break
        case 'candlestick':
        default:
          newSeries = chartRef.current.addSeries(CandlestickSeries, {
            upColor: '#22c55e',     // Bright green for bullish candles
            downColor: '#ef4444',   // Bright red for bearish candles
            borderVisible: true,
            borderUpColor: '#22c55e',
            borderDownColor: '#ef4444',
            wickUpColor: '#22c55e',
            wickDownColor: '#ef4444',
            priceFormat,
            lastValueVisible: true,
            priceLineVisible: false,
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
    console.log('[AdvancedPriceChart] 🔄 Data update effect triggered', {
      hasPriceSeries: !!priceSeriesRef.current,
      hasVolumeSeries: !!volumeSeriesRef.current,
      filteredTxCount: filteredTransactions.length,
      chartType,
      priceMode,
      displayMetric,
      timeframe,
      asterUsdPrice,
      asterUsdPriceIsValid: asterUsdPrice > 0 && !isNaN(asterUsdPrice) && isFinite(asterUsdPrice),
      totalTokenSupply: TOTAL_TOKEN_SUPPLY
    })

    if (!priceSeriesRef.current || !volumeSeriesRef.current) {
      console.log('[AdvancedPriceChart] ⚠️ Missing series refs, skipping update')
      return
    }
    if (filteredTransactions.length === 0) {
      console.log('[AdvancedPriceChart] ⚠️ No transactions, skipping update')
      return
    }
    // In USD mode, ensure we have a valid ASTER price
    if (priceMode === 'USD' && (asterUsdPrice <= 0 || isNaN(asterUsdPrice) || !isFinite(asterUsdPrice))) {
      console.log('[AdvancedPriceChart] ⚠️ Invalid ASTER USD price for USD mode, using default')
      // Don't return - just use the default price which is set in state
    }

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
    console.log('[AdvancedPriceChart] 📊 Using candle interval:', intervalSeconds, 'seconds')

    // Aggregate transactions into candlesticks with proper USD conversion
    const candleMap = new Map<number, {open: number, high: number, low: number, close: number, volume: number, lastTimestamp: number}>()

    console.log('[AdvancedPriceChart] 🔍 Processing', filteredTransactions.length, 'transactions into candles...')

    filteredTransactions
      .filter(tx => tx.timestamp > 0)
      .sort((a, b) => a.timestamp - b.timestamp)
      .forEach((tx, index) => {
        // Handle null values and fallback to raw amounts if formatted ones are missing
        let asterAmount, tokenAmount

        if (tx.asterAmountFormatted && tx.tokenAmountFormatted) {
          asterAmount = Number(tx.asterAmountFormatted)
          tokenAmount = Number(tx.tokenAmountFormatted)
        } else if (tx.asterAmount && tx.tokenAmount) {
          // Convert from wei manually if formatted versions are missing
          asterAmount = Number(tx.asterAmount) / 1e18 // Convert from wei
          tokenAmount = Number(tx.tokenAmount) / 1e18 // Convert from wei
        } else {
          console.warn(`[AdvancedPriceChart] ⚠️ TX ${index}: Missing amount data, skipping`, tx)
          return // Skip transactions without proper amount data
        }

        console.log(`[AdvancedPriceChart] 📝 TX ${index}:`, {
          timestamp: new Date(tx.timestamp * 1000).toISOString(),
          asterAmount: asterAmount.toFixed(6),
          tokenAmount: tokenAmount.toFixed(6),
          type: tx.type
        })

        // Calculate ASTER per token (traditional way - chart goes UP with buys)
        const asterPerToken = tokenAmount > 0 ? asterAmount / tokenAmount : 0
        const usdPerToken = asterPerToken * asterUsdPrice

        // Calculate market cap (Price × Total Supply)
        const mcapAster = asterPerToken * TOTAL_TOKEN_SUPPLY
        const mcapUsd = usdPerToken * TOTAL_TOKEN_SUPPLY

        console.log(`[AdvancedPriceChart] 💰 TX ${index} prices:`, {
          asterPerToken: asterPerToken.toExponential(6),
          usdPerToken: usdPerToken.toExponential(6),
          mcapAster: mcapAster.toExponential(6),
          mcapUsd: mcapUsd.toExponential(6),
          displayMetric,
          isValidNumber: !isNaN(asterPerToken) && isFinite(asterPerToken),
          isPositive: asterPerToken > 0
        })

        // Determine display value based on displayMetric (Price or MCap) and priceMode (ASTER or USD)
        let rawDisplayPrice: number
        if (displayMetric === 'MCap') {
          rawDisplayPrice = priceMode === 'USD' ? mcapUsd : mcapAster
        } else {
          rawDisplayPrice = priceMode === 'USD' ? usdPerToken : asterPerToken
        }
        const displayPrice = isNaN(rawDisplayPrice) || !isFinite(rawDisplayPrice) || rawDisplayPrice <= 0 ? 0 : rawDisplayPrice

        console.log(`[AdvancedPriceChart] 🎯 TX ${index} display value (${displayMetric}/${priceMode}):`, {
          rawDisplayPrice: rawDisplayPrice.toExponential(6),
          displayPrice: displayPrice === 0 ? '0 (INVALID)' : displayPrice.toExponential(6),
          displayMetric,
          priceMode
        })

        // Skip this transaction if price is invalid
        if (displayPrice === 0) {
          console.error(`[AdvancedPriceChart] ❌ TX ${index}: Invalid price calculated, SKIPPING`, {
            asterAmount,
            tokenAmount,
            asterPerToken,
            usdPerToken,
            rawDisplayPrice,
            priceMode
          })
          return
        }

        // Round timestamp to interval
        const candleTime = Math.floor(tx.timestamp / intervalSeconds) * intervalSeconds

        console.log(`[AdvancedPriceChart] 🕐 TX ${index} candle time:`, {
          txTimestamp: tx.timestamp,
          candleTime,
          candleDate: new Date(candleTime * 1000).toISOString()
        })

        const existing = candleMap.get(candleTime)
        if (!existing) {
          console.log(`[AdvancedPriceChart] ✨ TX ${index}: Creating NEW candle at ${new Date(candleTime * 1000).toISOString()}`, {
            open: displayPrice,
            high: displayPrice,
            low: displayPrice,
            close: displayPrice,
            volume: asterAmount
          })
          candleMap.set(candleTime, {
            open: displayPrice,     // Keep full precision for small values
            high: displayPrice,
            low: displayPrice,
            close: displayPrice,
            volume: asterAmount,
            lastTimestamp: tx.timestamp,
          })
        } else {
          console.log(`[AdvancedPriceChart] 📊 TX ${index}: Updating EXISTING candle at ${new Date(candleTime * 1000).toISOString()}`, {
            oldHigh: existing.high,
            newHigh: Math.max(existing.high, displayPrice),
            oldLow: existing.low,
            newLow: Math.min(existing.low, displayPrice),
            oldClose: existing.close,
            newClose: tx.timestamp > existing.lastTimestamp ? displayPrice : existing.close,
            oldVolume: existing.volume,
            newVolume: existing.volume + asterAmount
          })
          existing.high = Math.max(existing.high, displayPrice)
          existing.low = Math.min(existing.low, displayPrice)
          if (tx.timestamp > existing.lastTimestamp) {
            existing.close = displayPrice
            existing.lastTimestamp = tx.timestamp
          }
          existing.volume += asterAmount
        }
      })

    console.log('[AdvancedPriceChart] 📦 Created', candleMap.size, 'candles from transactions')

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
          color: 'rgba(34, 197, 94, 0.5)',
        })
      }
    }
    
    // Add actual candle data with validation
    console.log('[AdvancedPriceChart] 🔍 Validating', sortedCandles.length, 'candles...')

    sortedCandles.forEach(([time, candle], index) => {
      console.log(`[AdvancedPriceChart] 🔎 Validating candle ${index}:`, {
        time: new Date(time * 1000).toISOString(),
        open: candle.open,
        high: candle.high,
        low: candle.low,
        close: candle.close,
        volume: candle.volume,
        openType: typeof candle.open,
        highType: typeof candle.high,
        lowType: typeof candle.low,
        closeType: typeof candle.close,
        openIsNaN: isNaN(candle.open),
        highIsNaN: isNaN(candle.high),
        lowIsNaN: isNaN(candle.low),
        closeIsNaN: isNaN(candle.close)
      })

      // Validate candle data before adding
      const isValidCandle =
        typeof candle.open === 'number' && !isNaN(candle.open) &&
        typeof candle.high === 'number' && !isNaN(candle.high) &&
        typeof candle.low === 'number' && !isNaN(candle.low) &&
        typeof candle.close === 'number' && !isNaN(candle.close) &&
        candle.open > 0 && candle.high > 0 && candle.low > 0 && candle.close > 0

      if (isValidCandle) {
        console.log(`[AdvancedPriceChart] ✅ Candle ${index} is VALID, adding to candleData`)
        candleData.push({
          time: time as UTCTimestamp,
          open: candle.open,   // Keep full precision
          high: candle.high,
          low: candle.low,
          close: candle.close,
        })
        volumeData.push({
          time: time as UTCTimestamp,
          value: candle.volume,
          color: candle.close >= candle.open ? 'rgba(34, 197, 94, 0.5)' : 'rgba(239, 68, 68, 0.5)',
        })
      } else {
        console.error(`[AdvancedPriceChart] ❌ Candle ${index} is INVALID, skipping:`, candle)
      }
    })

    console.log('[AdvancedPriceChart] 📊 Final arrays:', {
      candleDataLength: candleData.length,
      volumeDataLength: volumeData.length
    })

    if (candleData.length > 0) {
      try {
        console.log(`[AdvancedPriceChart] 🎨 Setting data on chart (type: ${chartType})`)

        // Set data based on chart type
        if (chartType === 'line' || chartType === 'area') {
          console.log('[AdvancedPriceChart] 📈 Transforming to line/area data...')

          // For line/area charts, we only need time and value (close price)
          // Additional validation to ensure no undefined/NaN values
          const lineData = candleData
            .filter((candle, i) => {
              const isValid = typeof candle.close === 'number' &&
                             !isNaN(candle.close) &&
                             isFinite(candle.close) &&
                             candle.close > 0
              console.log(`[AdvancedPriceChart] 🔍 Line data validation ${i}:`, {
                time: new Date(candle.time * 1000).toISOString(),
                close: candle.close,
                closeType: typeof candle.close,
                isNaN: isNaN(candle.close),
                isFinite: isFinite(candle.close),
                isPositive: candle.close > 0,
                isValid
              })
              if (!isValid) {
                console.error('[AdvancedPriceChart] ❌ Filtering out INVALID line data:', candle)
              }
              return isValid
            })
            .map((candle, i) => {
              const linePoint = {
                time: candle.time,
                value: candle.close,
              }
              console.log(`[AdvancedPriceChart] ✅ Line point ${i}:`, linePoint)
              return linePoint
            })

          console.log('[AdvancedPriceChart] 📊 Line data created:', {
            totalPoints: lineData.length,
            firstPoint: lineData[0],
            lastPoint: lineData[lineData.length - 1]
          })

          if (lineData.length === 0) {
            console.error('[AdvancedPriceChart] ❌ No valid line data after filtering, ABORTING')
            return
          }

          console.log('[AdvancedPriceChart] 🚀 Calling priceSeriesRef.current.setData() with', lineData.length, 'points')
          priceSeriesRef.current.setData(lineData)
          console.log('[AdvancedPriceChart] ✅ Line/area data set successfully!')
        } else if (chartType === 'columns') {
          console.log('[AdvancedPriceChart] 📊 Transforming to histogram/columns data...')

          // For columns/histogram charts, use close price with color based on trend
          // Additional validation to ensure no undefined/NaN values
          const histogramData = candleData
            .filter((candle, i) => {
              const isValid = typeof candle.close === 'number' &&
                             !isNaN(candle.close) &&
                             isFinite(candle.close) &&
                             candle.close > 0 &&
                             typeof candle.open === 'number' &&
                             !isNaN(candle.open) &&
                             isFinite(candle.open)
              console.log(`[AdvancedPriceChart] 🔍 Histogram validation ${i}:`, {
                time: new Date(candle.time * 1000).toISOString(),
                open: candle.open,
                close: candle.close,
                openType: typeof candle.open,
                closeType: typeof candle.close,
                openIsNaN: isNaN(candle.open),
                closeIsNaN: isNaN(candle.close),
                isValid
              })
              if (!isValid) {
                console.error('[AdvancedPriceChart] ❌ Filtering out INVALID histogram data:', candle)
              }
              return isValid
            })
            .map((candle, i) => {
              const histPoint = {
                time: candle.time,
                value: candle.close,
                color: candle.close >= candle.open ? '#22c55e' : '#ef4444',
              }
              console.log(`[AdvancedPriceChart] ✅ Histogram point ${i}:`, histPoint)
              return histPoint
            })

          console.log('[AdvancedPriceChart] 📊 Histogram data created:', {
            totalPoints: histogramData.length,
            firstPoint: histogramData[0],
            lastPoint: histogramData[histogramData.length - 1]
          })

          if (histogramData.length === 0) {
            console.error('[AdvancedPriceChart] ❌ No valid histogram data after filtering, ABORTING')
            return
          }

          console.log('[AdvancedPriceChart] 🚀 Calling priceSeriesRef.current.setData() with', histogramData.length, 'bars')
          priceSeriesRef.current.setData(histogramData)
          console.log('[AdvancedPriceChart] ✅ Histogram data set successfully!')
        } else {
          console.log('[AdvancedPriceChart] 🕯️ Using candlestick data directly (already validated)')

          // For candlestick charts, use full OHLC data
          // Data is already validated when added to candleData array
          console.log('[AdvancedPriceChart] 📊 Candlestick data:', {
            totalCandles: candleData.length,
            firstCandle: candleData[0],
            lastCandle: candleData[candleData.length - 1]
          })

          console.log('[AdvancedPriceChart] 🚀 Calling priceSeriesRef.current.setData() with', candleData.length, 'candles')
          priceSeriesRef.current.setData(candleData)
          console.log('[AdvancedPriceChart] ✅ Candlestick data set successfully!')
        }
        
        // Validate volume data before setting
        console.log('[AdvancedPriceChart] 📊 Validating volume data...')
        const validVolumeData = volumeData.filter((vol, i) => {
          const isValid = typeof vol.value === 'number' &&
                         !isNaN(vol.value) &&
                         isFinite(vol.value) &&
                         vol.value >= 0
          console.log(`[AdvancedPriceChart] 🔍 Volume ${i}:`, {
            time: new Date(vol.time * 1000).toISOString(),
            value: vol.value,
            valueType: typeof vol.value,
            isNaN: isNaN(vol.value),
            isFinite: isFinite(vol.value),
            isNonNegative: vol.value >= 0,
            isValid
          })
          if (!isValid) {
            console.error('[AdvancedPriceChart] ❌ Filtering out INVALID volume data:', vol)
          }
          return isValid
        })

        console.log('[AdvancedPriceChart] 📊 Volume validation complete:', {
          originalCount: volumeData.length,
          validCount: validVolumeData.length,
          filteredCount: volumeData.length - validVolumeData.length
        })

        if (validVolumeData.length > 0) {
          console.log('[AdvancedPriceChart] 🚀 Setting volume data with', validVolumeData.length, 'bars')
          volumeSeriesRef.current.setData(validVolumeData)
          console.log('[AdvancedPriceChart] ✅ Volume data set successfully!')
        } else {
          console.error('[AdvancedPriceChart] ❌ No valid volume data to set!')
        }

        // ALWAYS fit content after data changes to ensure chart is properly scaled
        // This is critical for mode switches (Price/MCap, USD/ASTER)
        if (!isInitialLoadRef.current && chartRef.current) {
          console.log('[AdvancedPriceChart] 🔄 Mode change detected - fitting content to rescale chart')
          setTimeout(() => {
            if (chartRef.current) {
              chartRef.current.timeScale().fitContent()
              console.log('[AdvancedPriceChart] ✅ Chart rescaled after mode change')
            }
          }, 50)
        }

        // Fit content on initial load to show all candles with OPTIMAL visibility
        if (isInitialLoadRef.current && chartRef.current) {
          console.log('[AdvancedPriceChart] Initial load - fitting all candles for full token history:', candleData.length)
          setTimeout(() => {
            if (chartRef.current) {
              try {
                // Set the timeframe to 'all' to ensure we're showing all available data
                if (timeframe !== 'all') {
                  console.log('[AdvancedPriceChart] Setting initial timeframe to "all" for complete history view')
                  setTimeframe('all')
                }
                
                // Fallback handling for edge cases
                if (candleData.length === 0) {
                  console.log('[AdvancedPriceChart] No candle data available, using default view')
                  chartRef.current.timeScale().fitContent()
                  return
                }
                
                // Get the full time range of all available data
                const firstTime = candleData[0].time
                const lastTime = candleData[candleData.length - 1].time
                const totalTimeRange = lastTime - firstTime
                
                // Handle edge case: very little data (< 1 hour)
                const minimumTimeRange = 3600 // 1 hour in seconds
                let effectiveTimeRange = totalTimeRange
                
                if (totalTimeRange < minimumTimeRange) {
                  console.log('[AdvancedPriceChart] Very little data detected, using minimum time range for better visibility')
                  effectiveTimeRange = minimumTimeRange
                }
                
                // Handle edge case: extensive history (> 30 days) - focus on recent data but still show all
                const maxRecommendedRange = 30 * 24 * 3600 // 30 days in seconds
                let timePaddingFactor = 0.10 // 10% padding by default
                
                if (totalTimeRange > maxRecommendedRange) {
                  console.log('[AdvancedPriceChart] Extensive history detected, using reduced padding for better focus')
                  timePaddingFactor = 0.05 // Reduce padding for very long histories
                }
                
                // Add time padding for better visibility
                const timePadding = Math.max(effectiveTimeRange * timePaddingFactor, 300) // Minimum 5 minutes padding
                const paddedStartTime = (firstTime - timePadding) as UTCTimestamp
                const paddedEndTime = (lastTime + (timePadding * 0.5)) as UTCTimestamp
                
                // Calculate price range for better visibility
                const allLows = candleData.map(c => c.low)
                const allHighs = candleData.map(c => c.high)
                const minPrice = Math.min(...allLows)
                const maxPrice = Math.max(...allHighs)
                const priceRange = maxPrice - minPrice
                
                // Handle edge case: all candles have the same price (flat line)
                let paddedMinPrice, paddedMaxPrice
                if (priceRange === 0) {
                  console.log('[AdvancedPriceChart] Flat price detected, using fixed padding around single price')
                  const singlePrice = minPrice
                  paddedMinPrice = singlePrice * 0.95 // 5% below
                  paddedMaxPrice = singlePrice * 1.05 // 5% above
                } else {
                  // Use moderate price padding for better readability (40% top, 30% bottom)
                  const pricePaddingTop = priceRange * 0.40
                  const pricePaddingBottom = priceRange * 0.30
                  paddedMinPrice = minPrice - pricePaddingBottom
                  paddedMaxPrice = maxPrice + pricePaddingTop
                }
                
                // Set the visible time range to show all data
                chartRef.current.timeScale().setVisibleRange({
                  from: paddedStartTime,
                  to: paddedEndTime,
                })
                
                // Apply price range scaling for optimal view
                priceSeriesRef.current?.applyOptions({
                  autoscaleInfoProvider: () => ({
                    priceRange: {
                      minValue: paddedMinPrice,
                      maxValue: paddedMaxPrice,
                    },
                  }),
                })
                
                // Log the improved chart state (inside try block to access variables)
                setTimeout(() => {
                  if (chartRef.current) {
                    const timeScale = chartRef.current.timeScale()
                    const visibleRange = timeScale.getVisibleRange()
                    
                    console.log('═══════════════════════════════════════════════════')
                    console.log('📊 IMPROVED INITIAL CHART STATE:')
                    console.log('═══════════════════════════════════════════════════')
                    console.log('Visible Time Range:', visibleRange)
                    console.log('From:', visibleRange ? new Date((visibleRange as any).from * 1000).toISOString() : 'N/A')
                    console.log('To:', visibleRange ? new Date((visibleRange as any).to * 1000).toISOString() : 'N/A')
                    console.log('Scale Margins (current):', {
                      top: 0.20,
                      bottom: 0.35
                    })
                    console.log('Chart Type:', chartType)
                    console.log('Timeframe:', timeframe)
                    console.log('Price Mode:', priceMode)
                    console.log('Transactions Count:', candleData.length)
                    console.log('Price Range:', {
                      minPrice: minPrice.toFixed(8),
                      maxPrice: maxPrice.toFixed(8),
                      paddedMinPrice: paddedMinPrice.toFixed(8),
                      paddedMaxPrice: paddedMaxPrice.toFixed(8),
                      paddingTop: '40%',
                      paddingBottom: '30%'
                    })
                    console.log('Time Range:', {
                      firstCandle: new Date(firstTime * 1000).toISOString(),
                      lastCandle: new Date(lastTime * 1000).toISOString(),
                      totalDuration: `${(totalTimeRange / 3600).toFixed(1)} hours`,
                      paddingAdded: `${(timePadding / 3600).toFixed(1)} hours`
                    })
                    console.log('✅ Chart now shows complete token trading history!')
                    console.log('═══════════════════════════════════════════════════')
                  }
                }, 300)
              } catch (error) {
                console.error('[AdvancedPriceChart] Error during chart initialization, falling back to fitContent:', error)
                // Graceful fallback to basic fitContent if anything goes wrong
                chartRef.current?.timeScale().fitContent()
              }
              
              isInitialLoadRef.current = false
            }
          }, 150)
        }
      } catch (error) {
        console.error('[AdvancedPriceChart] Error updating data:', error)
      }
    }
  }, [filteredTransactions, priceMode, chartType, asterUsdPrice, displayMetric])

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

  // Update price format when displayMetric changes (Price vs MCap)
  useEffect(() => {
    if (!priceSeriesRef.current) return

    console.log('[AdvancedPriceChart] 📐 Updating price format for displayMetric:', displayMetric)

    // Create a dynamic formatter based on whether we're showing Price or MCap
    const dynamicFormatter = (value: number) => {
      if (value === 0) return '0'

      // For MCap mode, values are large (millions, thousands)
      if (displayMetric === 'MCap') {
        if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(2)}B`
        if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`
        if (value >= 1_000) return `$${(value / 1_000).toFixed(2)}K`
        return `$${value.toFixed(2)}`
      }

      // For Price mode, values are very small
      if (Math.abs(value) < 0.0001) {
        const priceStr = value.toFixed(20)
        const match = priceStr.match(/^0\.0+/)

        if (match) {
          const leadingZeros = match[0].length - 2
          const significantDigits = priceStr.slice(match[0].length, match[0].length + 2)
          const subscriptDigits = ['₀', '₁', '₂', '₃', '₄', '₅', '₆', '₇', '₈', '₉']
          const subscriptCount = leadingZeros.toString().split('').map(d => subscriptDigits[parseInt(d)]).join('')
          return `$0.0${subscriptCount}${significantDigits}`
        }
      }

      if (Math.abs(value) < 0.01) return `$${value.toFixed(8)}`
      if (Math.abs(value) < 1) return `$${value.toFixed(6)}`
      return `$${value.toFixed(4)}`
    }

    try {
      priceSeriesRef.current.applyOptions({
        priceFormat: {
          type: 'custom',
          formatter: dynamicFormatter,
          minMove: displayMetric === 'MCap' ? 0.01 : 0.000000000001,
        },
      })
      console.log('[AdvancedPriceChart] ✅ Price format updated for', displayMetric, 'mode')
      // Note: fitContent is now called in the main data update effect after setData()
    } catch (error) {
      console.error('[AdvancedPriceChart] ❌ Error updating price format:', error)
    }
  }, [displayMetric])

  // CRITICAL: ALL useMemo hooks MUST be called BEFORE any early returns!
  // Get current OHLC data from hovered or latest
  const currentOHLC = useMemo(() => {
    if (hoveredData) {
      return hoveredData
    }
    // Get latest candle data with null handling
    if (filteredTransactions.length > 0) {
      const latest = filteredTransactions[filteredTransactions.length - 1]
      
      let asterAmount, tokenAmount
      if (latest.asterAmountFormatted && latest.tokenAmountFormatted) {
        asterAmount = Number(latest.asterAmountFormatted)
        tokenAmount = Number(latest.tokenAmountFormatted)
      } else if (latest.asterAmount && latest.tokenAmount) {
        asterAmount = Number(latest.asterAmount) / 1e18
        tokenAmount = Number(latest.tokenAmount) / 1e18
      } else {
        return null // No valid data
      }
      
      const asterPerToken = tokenAmount > 0 ? asterAmount / tokenAmount : 0
      const usdPerToken = asterPerToken * asterUsdPrice

      // Calculate price or mcap based on displayMetric
      let displayValue: number
      if (displayMetric === 'MCap') {
        const mcapAster = asterPerToken * TOTAL_TOKEN_SUPPLY
        const mcapUsd = usdPerToken * TOTAL_TOKEN_SUPPLY
        displayValue = priceMode === 'USD' ? mcapUsd : mcapAster
      } else {
        displayValue = priceMode === 'USD' ? usdPerToken : asterPerToken
      }

      return {
        open: displayValue,
        high: displayValue,
        low: displayValue,
        close: displayValue,
        volume: asterAmount,
        time: new Date(latest.timestamp * 1000).toLocaleString(),
      }
    }
    return null
  }, [hoveredData, filteredTransactions, priceMode, asterUsdPrice, displayMetric])

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
      
      // Find the transaction closest to the cutoff time (but before)
      const validTxs = transactions.filter(tx => {
        return (tx.asterAmountFormatted && tx.tokenAmountFormatted) || (tx.asterAmount && tx.tokenAmount)
      }).sort((a, b) => b.timestamp - a.timestamp) // Sort newest first
      
      const oldTx = validTxs.find(tx => tx.timestamp <= cutoff)
      
      if (oldTx && currentPrice > 0) {
        let asterAmount, tokenAmount
        if (oldTx.asterAmountFormatted && oldTx.tokenAmountFormatted) {
          asterAmount = Number(oldTx.asterAmountFormatted)
          tokenAmount = Number(oldTx.tokenAmountFormatted)
        } else if (oldTx.asterAmount && oldTx.tokenAmount) {
          asterAmount = Number(oldTx.asterAmount) / 1e18
          tokenAmount = Number(oldTx.tokenAmount) / 1e18
        } else {
          changes[period] = 0
          return
        }
        
        // Calculate ASTER per token for consistency
        const oldAsterPerToken = tokenAmount > 0 ? asterAmount / tokenAmount : 0
        if (oldAsterPerToken > 0) {
          changes[period] = ((currentPrice - oldAsterPerToken) / oldAsterPerToken) * 100
        } else {
          changes[period] = 0
        }
        
        // Debug period changes
        console.log(`[AdvancedPriceChart] 📊 ${period} change:`, {
          oldTimestamp: new Date(oldTx.timestamp * 1000).toLocaleString(),
          oldAsterPerToken: oldAsterPerToken.toExponential(3),
          currentAsterPerToken: currentPrice.toExponential(3),
          change: changes[period].toFixed(2) + '%'
        })
      } else {
        changes[period] = 0
        console.log(`[AdvancedPriceChart] ❌ No transaction found for ${period} period (cutoff: ${new Date(cutoff * 1000).toLocaleString()})`)
      }
    })

    return changes
  }, [transactions, stats.currentPrice])

  console.log('[AdvancedPriceChart] ✅ All hooks called, checking early return conditions...')

  // NOW we can safely do early returns AFTER all hooks
  if (isLoading && transactions.length === 0) {
    console.log('[AdvancedPriceChart] 🔄 Loading state - showing spinner')
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
    console.log('[AdvancedPriceChart] ❌ No data - showing empty state')
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

  console.log('[AdvancedPriceChart] ✅ Rendering main chart with', transactions.length, 'transactions')

  return (
    <div className="bg-secondary-light rounded-xl overflow-hidden">
      {/* Pump.fun Style Compact Header */}
      <div className="px-4 py-3 border-b border-gray-700">

        {/* Row 1: Market Cap (3-line format) + Progress Bar to ATH */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex flex-col">
            {/* Line 1: Market Cap title */}
            <span className="text-sm text-gray-400 font-normal">Market Cap</span>

            {/* Line 2: Market Cap value - USE BACKEND VALUE DIRECTLY, no frontend calculation! */}
            <span className="text-3xl font-bold text-white leading-none my-1">
              {formatMarketCap(parseFloat(backendStats?.marketCapUsd || '0') || backendMarketCapUsd, 'USD')}
            </span>

            {/* Line 3: 24h change with $ and % - USE BACKEND VALUE DIRECTLY */}
            {(() => {
              const mcapUsd = parseFloat(backendStats?.marketCapUsd || '0') || backendMarketCapUsd
              const change24h = parseFloat(backendStats?.priceChange24h || '0')
              const dollarChange = Math.abs(change24h * mcapUsd / 100)
              return (
                <span className="text-sm font-normal">
                  <span className={change24h >= 0 ? 'text-green-400' : 'text-red-400'}>
                    {change24h >= 0 ? '+' : ''}
                    {formatMarketCap(dollarChange, 'USD')}
                    {' '}({change24h >= 0 ? '+' : ''}{change24h.toFixed(2)}%)
                  </span>
                  {' '}
                  <span className="text-gray-400">24hr</span>
                </span>
              )
            })()}
          </div>

          {/* Progress Bar to ATH with ATH Value - All in USD */}
          <div className="flex items-center gap-2">
            {(() => {
              // USE BACKEND VALUES DIRECTLY - no frontend calculation!
              const currentMcapUsd = parseFloat(backendStats?.marketCapUsd || '0') || backendMarketCapUsd
              // ATH - use prop from parent, otherwise use current as baseline (backend should track ATH)
              const athMcapUsd = ath && ath > 0 ? ath : currentMcapUsd
              const progressPercent = athMcapUsd > 0 ? Math.min((currentMcapUsd / athMcapUsd) * 100, 100) : 0

              return (
                <>
                  <div className="w-32 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-300"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-400 font-medium">
                    ATH {formatMarketCap(athMcapUsd, 'USD')}
                  </span>
                </>
              )
            })()}
          </div>
        </div>
        
        {/* Row 2: Controls - Duration + Chart Type + Price/MCap + USD/BNB */}
        <div className="flex items-center gap-2 mb-2">
          {/* Duration Selector */}
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value as Timeframe)}
            className="bg-secondary text-white px-2 py-1 rounded text-xs border border-gray-700 hover:border-primary transition cursor-pointer"
          >
            <option value="1m">1m</option>
            <option value="5m">5m</option>
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
            className="bg-secondary text-white px-2 py-1 rounded text-xs border border-gray-700 hover:border-primary transition cursor-pointer"
          >
            <option value="line">Line</option>
            <option value="candlestick">Candles</option>
            <option value="area">Area</option>
            <option value="columns">Columns</option>
          </select>

          {/* Price/MCap Toggle */}
          <div className="flex bg-secondary rounded border border-gray-700">
            <button
              onClick={() => {
                console.log('🔘 [BUTTON] Price clicked - switching from', displayMetric, 'to Price')
                console.log('   → Will show:', priceMode === 'USD' ? backendStats?.priceUsd : backendStats?.price)
                setDisplayMetric('Price')
              }}
              className={`px-2 py-1 text-xs font-medium transition ${
                displayMetric === 'Price'
                  ? 'bg-primary text-black rounded'
                  : 'text-gray-400 hover:text-white'
              }`}
              title="Show token price per unit"
            >
              Price
            </button>
            <button
              onClick={() => {
                console.log('🔘 [BUTTON] MCap clicked - switching from', displayMetric, 'to MCap')
                console.log('   → Will show:', priceMode === 'USD' ? backendStats?.marketCapUsd : backendStats?.marketCap)
                setDisplayMetric('MCap')
              }}
              className={`px-2 py-1 text-xs font-medium transition ${
                displayMetric === 'MCap'
                  ? 'bg-primary text-black rounded'
                  : 'text-gray-400 hover:text-white'
              }`}
              title="Show market cap (liquidity value)"
            >
              MCap
            </button>
          </div>

          {/* USD/ASTER Toggle */}
          <div className="flex bg-secondary rounded border border-gray-700">
            <button
              onClick={() => {
                console.log('🔘 [BUTTON] ASTER clicked - switching from', priceMode, 'to ASTER')
                console.log('   → Price will be:', backendStats?.price, 'ASTER')
                console.log('   → MCap will be:', backendStats?.marketCap, 'ASTER')
                setPriceMode('ASTER')
              }}
              className={`px-2 py-1 text-xs font-medium transition ${
                priceMode === 'ASTER'
                  ? 'bg-primary text-black rounded'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              ASTER
            </button>
            <button
              onClick={() => {
                console.log('🔘 [BUTTON] USD clicked - switching from', priceMode, 'to USD')
                console.log('   → Price will be: $', backendStats?.priceUsd)
                console.log('   → MCap will be: $', backendStats?.marketCapUsd)
                console.log('   → ASTER/USD rate:', asterUsdPrice)
                setPriceMode('USD')
              }}
              className={`px-2 py-1 text-xs font-medium transition ${
                priceMode === 'USD'
                  ? 'bg-primary text-black rounded'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              USD
            </button>
          </div>
        </div>
        
        {/* Row 3: Token Price/MCap Info + Security Menu */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Price or Market Cap display based on toggle - USE BACKEND VALUES DIRECTLY */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-white">
                {displayMetric === 'MCap' ? 'Market Cap:' : 'Price:'}
              </span>
              <span className="text-lg font-bold text-primary">
                {displayMetric === 'MCap'
                  ? formatMarketCap(
                      priceMode === 'USD'
                        ? parseFloat(backendStats?.marketCapUsd || '0') || backendMarketCapUsd
                        : parseFloat(backendStats?.marketCap || '0'),
                      priceMode
                    )
                  : formatPrice(
                      priceMode === 'USD'
                        ? parseFloat(backendStats?.priceUsd || '0') || backendPriceUsd
                        : parseFloat(backendStats?.price || '0'),
                      priceMode
                    )
                }
              </span>
            </div>
          </div>
          
          {/* Debug Button - Temporary for development */}
          <button
            onClick={logDebugInfo}
            className="text-xs px-2 py-1 bg-yellow-600 hover:bg-yellow-500 text-black rounded transition font-medium"
            title="Log chart debug info to console"
          >
            DEBUG
          </button>

          {/* Security Menu with Three Dots */}
          <div className="relative">
            <button
              className="text-gray-400 hover:text-white transition p-1"
              title="More options"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
            </button>
          </div>
          
          {/* OHLC Values (Right Side) - Ultra Compact, no wrapping */}
          <div className="flex items-center gap-1 text-xs whitespace-nowrap">
            {(hoveredData || currentOHLC) ? (
              <div className="flex items-center gap-1">
                <span className="text-gray-400 text-xs">
                  O:{formatCompactPrice(hoveredData?.open ?? currentOHLC?.open ?? 0, priceMode)}
                </span>
                <span className="text-gray-400 text-xs">
                  H:{formatCompactPrice(hoveredData?.high ?? currentOHLC?.high ?? 0, priceMode)}
                </span>
                <span className="text-gray-400 text-xs">
                  L:{formatCompactPrice(hoveredData?.low ?? currentOHLC?.low ?? 0, priceMode)}
                </span>
                <span className="text-gray-400 text-xs">
                  C:{formatCompactPrice(hoveredData?.close ?? currentOHLC?.close ?? 0, priceMode)}
                </span>
                <span className={`text-xs font-medium ${
                  stats.change24h >= 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                  {stats.change24h >= 0 ? '+' : ''}{stats.change24h.toFixed(1)}%
                </span>
              </div>
            ) : (
              <span className="text-gray-500 text-xs">Hover for OHLC</span>
            )}
          </div>
        </div>
      </div>


      {/* Chart Container */}
      <div className="relative">
        <div ref={chartContainerRef} className="w-full transition-all duration-300" style={{ minHeight: '400px' }} />
      </div>

      {/* Stats Cards Row */}
      <div className="px-4 py-3 bg-secondary border-t border-gray-700">
        <div className="grid grid-cols-5 gap-3">
          {/* Volume Card - Use backendStats (source of truth) */}
          <div className="bg-secondary-light rounded-lg p-3 border border-gray-700">
            <div className="text-xs text-gray-400 mb-1">Volume 24h</div>
            <div className="text-sm font-semibold text-white">
              {priceMode === 'USD'
                ? `$${parseFloat(backendStats?.volume24hUsd || '0').toFixed(1)}`
                : `${parseFloat(backendStats?.volume24h || '0').toFixed(2)} ASTER`}
            </div>
          </div>

          {/* Price Card - Use backendStats (source of truth) */}
          <div className="bg-secondary-light rounded-lg p-3 border border-gray-700">
            <div className="text-xs text-gray-400 mb-1">Price</div>
            <div className={`text-sm font-semibold ${
              parseFloat(backendStats?.priceChange24h || '0') >= 0 ? 'text-green-400' : 'text-red-400'
            }`}>
              {formatPrice(
                priceMode === 'USD'
                  ? parseFloat(backendStats?.priceUsd || '0')
                  : parseFloat(backendStats?.price || '0'),
                priceMode
              )}
            </div>
          </div>

          {/* 5m Change Card */}
          <div className="bg-secondary-light rounded-lg p-3 border border-gray-700">
            <div className="text-xs text-gray-400 mb-1">5m Change</div>
            <div className={`text-sm font-semibold ${
              periodChanges['5m'] >= 0 ? 'text-green-400' : 'text-red-400'
            }`}>
              {periodChanges['5m'] >= 0 ? '+' : ''}{periodChanges['5m'].toFixed(1)}%
            </div>
          </div>

          {/* 1h Change Card */}
          <div className="bg-secondary-light rounded-lg p-3 border border-gray-700">
            <div className="text-xs text-gray-400 mb-1">1h Change</div>
            <div className={`text-sm font-semibold ${
              periodChanges['1h'] >= 0 ? 'text-green-400' : 'text-red-400'
            }`}>
              {periodChanges['1h'] >= 0 ? '+' : ''}{periodChanges['1h'].toFixed(1)}%
            </div>
          </div>

          {/* 6h Change Card */}
          <div className="bg-secondary-light rounded-lg p-3 border border-gray-700">
            <div className="text-xs text-gray-400 mb-1">6h Change</div>
            <div className={`text-sm font-semibold ${
              periodChanges['6h'] >= 0 ? 'text-green-400' : 'text-red-400'
            }`}>
              {periodChanges['6h'] >= 0 ? '+' : ''}{periodChanges['6h'].toFixed(1)}%
            </div>
          </div>
        </div>
      </div>

    </div>
  )
}

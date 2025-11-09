'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'

interface TradingViewChartProps {
  tokenSymbol: string
  marketCap?: string
  marketCapChange24h?: number
  ath?: number
}

interface TradeData {
  timestamp: string
  price: string
  isBuy: boolean
  tokenAmount: string
  asterAmount: string
}

// Custom chart component for tokens using real trading data
const CustomTokenChart = ({ symbol }: { symbol: string }) => {
  const params = useParams()
  const tokenAddress = params?.address as string
  const [trades, setTrades] = useState<TradeData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(false)
  const [priceChange, setPriceChange] = useState(0)

  useEffect(() => {
    const fetchTrades = async () => {
      if (!tokenAddress) return
      
      try {
        setIsLoading(true)
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://pumpbnb-backend.onrender.com'
        const response = await fetch(`${apiUrl}/api/v2/tokens/${tokenAddress}/trades?limit=50&sortBy=timestamp&sortOrder=asc`)
        const data = await response.json()
        
        if (data.success && data.data) {
          const tradesData = data.data.map((trade: any) => ({
            timestamp: trade.timestamp,
            price: trade.price || '0',
            isBuy: trade.isBuy,
            tokenAmount: trade.tokenAmount || trade.amountOut,
            asterAmount: trade.asterAmount || trade.amountIn
          })).filter((trade: TradeData) => parseFloat(trade.price) > 0)
          
          setTrades(tradesData)
          
          // Calculate price change
          if (tradesData.length >= 2) {
            const firstPrice = parseFloat(tradesData[0].price)
            const lastPrice = parseFloat(tradesData[tradesData.length - 1].price)
            const change = ((lastPrice - firstPrice) / firstPrice) * 100
            setPriceChange(change)
          }
        } else {
          setError(true)
        }
      } catch (error) {
        console.error('Failed to fetch trades for chart:', error)
        setError(true)
      } finally {
        setIsLoading(false)
      }
    }

    fetchTrades()
  }, [tokenAddress])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full bg-secondary-light">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mb-4"></div>
          <p className="text-gray-400">Loading chart data...</p>
        </div>
      </div>
    )
  }

  if (error || trades.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-secondary-light">
        <div className="text-center">
          <div className="text-4xl mb-3">📈</div>
          <h3 className="text-lg font-semibold text-white mb-2">{symbol} Chart</h3>
          <p className="text-gray-400 text-sm mb-4">
            {trades.length === 0 ? 'No trading data available yet' : 'Unable to load chart data'}
          </p>
          <p className="text-xs text-gray-500">
            Start trading to see the price chart
          </p>
        </div>
      </div>
    )
  }

  // Create chart data points
  const chartPoints = trades.slice(-20) // Show last 20 trades
  const maxPrice = Math.max(...chartPoints.map(t => parseFloat(t.price)))
  const minPrice = Math.min(...chartPoints.map(t => parseFloat(t.price)))
  const priceRange = maxPrice - minPrice || 1

  return (
    <div className="p-6 h-full bg-secondary-light">
      {/* Chart Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-lg font-semibold text-white">{symbol} Price Chart</h3>
          <p className="text-sm text-gray-400">{trades.length} trades • Real-time data</p>
        </div>
        <div className="text-right">
          <div className={`text-lg font-bold ${
            priceChange >= 0 ? 'text-green-400' : 'text-red-400'
          }`}>
            {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}%
          </div>
          <div className="text-xs text-gray-400">Price Change</div>
        </div>
      </div>

      {/* Price Chart */}
      <div className="relative h-64 bg-secondary rounded-lg p-4 mb-4">
        <svg width="100%" height="100%" className="overflow-visible">
          {/* Grid lines */}
          {[0, 25, 50, 75, 100].map((y) => (
            <line
              key={y}
              x1="0"
              y1={`${y}%`}
              x2="100%"
              y2={`${y}%`}
              stroke="#374151"
              strokeWidth="0.5"
              opacity="0.5"
            />
          ))}
          
          {/* Price line */}
          <polyline
            fill="none"
            stroke="#10b981"
            strokeWidth="2"
            points={chartPoints.map((trade, index) => {
              const x = (index / (chartPoints.length - 1)) * 100
              const y = 100 - ((parseFloat(trade.price) - minPrice) / priceRange) * 100
              return `${x},${y}`
            }).join(' ')}
          />
          
          {/* Data points */}
          {chartPoints.map((trade, index) => {
            const x = (index / (chartPoints.length - 1)) * 100
            const y = 100 - ((parseFloat(trade.price) - minPrice) / priceRange) * 100
            return (
              <circle
                key={index}
                cx={`${x}%`}
                cy={`${y}%`}
                r="3"
                fill={trade.isBuy ? '#10b981' : '#ef4444'}
                className="hover:r-4 transition-all cursor-pointer"
              >
                <title>
                  {trade.isBuy ? 'Buy' : 'Sell'}: {parseFloat(trade.price).toFixed(8)} ASTER
                  \nTime: {new Date(trade.timestamp).toLocaleTimeString()}
                </title>
              </circle>
            )
          })}
        </svg>
        
        {/* Y-axis labels */}
        <div className="absolute left-1 top-0 h-full flex flex-col justify-between text-xs text-gray-500 py-4">
          <span>{maxPrice.toFixed(8)}</span>
          <span>{((maxPrice + minPrice) / 2).toFixed(8)}</span>
          <span>{minPrice.toFixed(8)}</span>
        </div>
      </div>

      {/* Chart Stats */}
      <div className="grid grid-cols-3 gap-4 text-center">
        <div className="bg-secondary rounded-lg p-3">
          <div className="text-lg font-bold text-white">
            {parseFloat(chartPoints[chartPoints.length - 1]?.price || '0').toFixed(8)}
          </div>
          <div className="text-xs text-gray-400">Current Price</div>
        </div>
        <div className="bg-secondary rounded-lg p-3">
          <div className="text-lg font-bold text-green-400">
            {maxPrice.toFixed(8)}
          </div>
          <div className="text-xs text-gray-400">24h High</div>
        </div>
        <div className="bg-secondary rounded-lg p-3">
          <div className="text-lg font-bold text-red-400">
            {minPrice.toFixed(8)}
          </div>
          <div className="text-xs text-gray-400">24h Low</div>
        </div>
      </div>
    </div>
  )
}

// React-based TradingView component without DOM manipulation
const TradingViewWidget = ({ symbol }: { symbol: string }) => {
  const [showTradingView, setShowTradingView] = useState(false)
  const [widgetId] = useState(() => `tv_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`)
  const [scriptLoaded, setScriptLoaded] = useState(false)
  const [error, setError] = useState(false)

  // Check if this is a major token that exists on TradingView
  const getTradingViewSymbol = (tokenSymbol: string) => {
    const knownSymbols = ['BTC', 'ETH', 'BNB', 'ADA', 'DOT', 'LINK', 'UNI', 'CAKE', 'MATIC', 'AVAX']
    return knownSymbols.includes(tokenSymbol.toUpperCase()) ? `BINANCE:${tokenSymbol.toUpperCase()}USDT` : null
  }

  const tradingViewSymbol = getTradingViewSymbol(symbol)

  useEffect(() => {
    // Only show TradingView for major tokens
    if (tradingViewSymbol) {
      setShowTradingView(true)
    }
  }, [tradingViewSymbol])

  useEffect(() => {
    if (typeof window === 'undefined' || !showTradingView || !tradingViewSymbol) return

    const script = document.createElement('script')
    script.type = 'text/javascript'
    script.async = true
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js'
    
    const config = {
      "autosize": true,
      "width": "100%", 
      "height": "500",
      "symbol": tradingViewSymbol,
      "container_id": widgetId,
      "interval": "5",
      "timezone": "Etc/UTC",
      "theme": "dark",
      "style": "1",
      "locale": "en",
      "enable_publishing": false,
      "backgroundColor": "rgba(26, 27, 30, 1)",
      "gridColor": "rgba(43, 43, 67, 1)",
      "hide_top_toolbar": false,
      "hide_legend": false,
      "save_image": false,
      "calendar": false,
      "hide_volume": false,
      "support_host": "https://www.tradingview.com",
      "studies": ["Volume@tv-basicstudies"],
      "overrides": {
        "paneProperties.background": "#1a1b1e",
        "paneProperties.vertGridProperties.color": "#2b2b43",
        "paneProperties.horzGridProperties.color": "#2b2b43",
        "symbolWatermarkProperties.transparency": 90,
        "scalesProperties.textColor": "#d1d4dc",
        "mainSeriesProperties.candleStyle.upColor": "#26a69a",
        "mainSeriesProperties.candleStyle.downColor": "#ef5350",
        "mainSeriesProperties.candleStyle.borderUpColor": "#26a69a",
        "mainSeriesProperties.candleStyle.borderDownColor": "#ef5350",
        "mainSeriesProperties.candleStyle.wickUpColor": "#26a69a",
        "mainSeriesProperties.candleStyle.wickDownColor": "#ef5350",
        "volumePaneSize": "medium"
      },
      "studies_overrides": {
        "volume.volume.color.0": "#ef5350",
        "volume.volume.color.1": "#26a69a"
      },
      "disabled_features": [
        "use_localstorage_for_settings",
        "volume_force_overlay",
        "create_volume_indicator_by_default"
      ],
      "enabled_features": ["study_templates"]
    }

    script.innerHTML = JSON.stringify(config)
    script.onload = () => setScriptLoaded(true)
    script.onerror = () => setError(true)
    document.head.appendChild(script)

    return () => {
      try {
        if (script.parentNode) {
          script.parentNode.removeChild(script)
        }
      } catch (e) {
        // Ignore cleanup errors
      }
    }
  }, [showTradingView, tradingViewSymbol, widgetId])

  // Show custom chart with real data for meme tokens
  if (!showTradingView) {
    return <CustomTokenChart symbol={symbol} />
  }

  // Show TradingView for major tokens
  if (error) {
    return (
      <div className="flex items-center justify-center h-full bg-secondary-light text-red-400">
        <div className="text-center">
          <div className="text-2xl mb-2">📊</div>
          <div>Chart unavailable</div>
          <div className="text-xs opacity-70 mt-1">Please refresh the page</div>
        </div>
      </div>
    )
  }

  return (
    <>
      <div id={widgetId} className="w-full h-full relative" />
      {!scriptLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-secondary-light">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mb-4"></div>
            <p className="text-gray-400">Loading Professional Chart...</p>
          </div>
        </div>
      )}
    </>
  )
}

export function TradingViewChart({ 
  tokenSymbol, 
  marketCap, 
  marketCapChange24h = 0, 
  ath 
}: TradingViewChartProps) {
  const [key, setKey] = useState(0)

  // Reset component when symbol changes
  useEffect(() => {
    setKey(prev => prev + 1)
  }, [tokenSymbol])

  // Recalculate progress for ATH progress bar
  const progressToATH = ath && marketCap 
    ? Math.min((parseFloat(marketCap.replace(/[^\d.]/g, '')) / ath) * 100, 100)
    : 50 // Default 50% for demo

  return (
    <div className="bg-secondary-light rounded-xl overflow-hidden">
      {/* Pump.fun Style Compact Header */}
      <div className="px-4 py-2 border-b border-gray-700">
        
        {/* Row 1: Market Cap + 24h Change + Progress Bar to ATH */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-4">
            {/* Market Cap with 24h Change */}
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-white">
                ${marketCap || '4.4K'}
              </span>
              <span className={`text-sm font-medium ${
                marketCapChange24h >= 0 ? 'text-green-400' : 'text-red-400'
              }`}>
                {marketCapChange24h >= 0 ? '+' : ''}{marketCapChange24h.toFixed(2)}% 24h
              </span>
            </div>
          </div>
          
          {/* Progress Bar to ATH with ATH Value */}
          <div className="flex items-center gap-2">
            <div className="w-32 h-1.5 bg-gray-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary rounded-full transition-all duration-300"
                style={{ width: `${progressToATH}%` }}
              />
            </div>
            <span className="text-xs text-gray-400 font-medium">
              ATH ${ath?.toFixed(1)}K
            </span>
          </div>
        </div>
        
        {/* Row 2: Token Info */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <span className="text-sm font-medium text-white">
                {tokenSymbol}/USDT Price (USD)
              </span>
            </div>
          </div>
          
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
        </div>
      </div>

      {/* TradingView Chart Container */}
      <div key={key} className="relative w-full" style={{ height: '500px' }}>
        <TradingViewWidget symbol={tokenSymbol} />
      </div>
    </div>
  )
}
'use client'

import { useEffect, useState } from 'react'

interface TradingViewChartProps {
  tokenSymbol: string
  marketCap?: string
  marketCapChange24h?: number
  ath?: number
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

  // Show custom placeholder for meme tokens
  if (!showTradingView) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-secondary-light">
        <div className="text-center mb-6">
          <div className="text-4xl mb-3">📈</div>
          <h3 className="text-lg font-semibold text-white mb-2">{symbol} Token Chart</h3>
          <p className="text-gray-400 text-sm mb-4">
            Custom token charts coming soon!
          </p>
        </div>
        
        {/* Mock Chart Visualization */}
        <div className="w-full max-w-md bg-secondary rounded-lg p-4">
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs text-gray-400">Price Activity</span>
            <span className="text-xs text-green-400">↗ +12.5%</span>
          </div>
          
          {/* Mock chart bars */}
          <div className="flex items-end justify-between h-20 gap-1">
            {[40, 65, 45, 80, 55, 75, 90, 70, 85, 60, 95, 80].map((height, i) => (
              <div
                key={i}
                className={`w-2 rounded-t transition-all duration-300 ${
                  i < 6 ? 'bg-red-400' : 'bg-green-400'
                }`}
                style={{ height: `${height}%` }}
              />
            ))}
          </div>
          
          <div className="flex justify-between mt-2 text-xs text-gray-500">
            <span>24h ago</span>
            <span>Now</span>
          </div>
        </div>
        
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-500">
            Trade data is available in the Trades tab below
          </p>
        </div>
      </div>
    )
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
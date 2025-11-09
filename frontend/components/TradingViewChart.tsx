'use client'

import { useEffect, useRef, useState } from 'react'

interface TradingViewChartProps {
  tokenSymbol: string
  marketCap?: string
  marketCapChange24h?: number
  ath?: number
}

// TradingView widget configuration for crypto trading
const createTradingViewWidget = (container: HTMLElement, symbol: string) => {
  // Check if container exists and is mounted
  if (!container || !container.parentNode || !document.body.contains(container)) {
    console.warn('TradingView container not ready or not in DOM')
    return false
  }

  try {
    // Create a unique container div for the widget with ID
    const widgetId = `tradingview_${Math.random().toString(36).substr(2, 9)}`
    const widgetContainer = document.createElement('div')
    widgetContainer.id = widgetId
    widgetContainer.style.height = '100%'
    widgetContainer.style.width = '100%'
    widgetContainer.style.position = 'relative'
    
    // Clear container safely and add widget container
    while (container.firstChild) {
      container.removeChild(container.firstChild)
    }
    container.appendChild(widgetContainer)

    const script = document.createElement('script')
    script.type = 'text/javascript'
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js'
    script.async = true
    script.defer = true

    const config = {
      "autosize": true,
      "width": "100%",
      "height": "500",
      "symbol": `BINANCE:${symbol}USDT`, // Default to USDT pair, can be customized
      "container_id": widgetId,
    "interval": "5",
    "timezone": "Etc/UTC",
    "theme": "dark",
    "style": "1", // Candlestick
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
    "studies": [
      "Volume@tv-basicstudies"
    ],
    "overrides": {
      // Dark theme customization to match our design
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
    "enabled_features": [
      "study_templates"
    ]
  }

    script.innerHTML = JSON.stringify(config)
    
    // Add error handler
    script.onerror = (error) => {
      console.error('TradingView script load error:', error)
    }
    
    widgetContainer.appendChild(script)
    return true
  } catch (error) {
    console.error('TradingView widget creation error:', error)
    return false
  }
}

export function TradingViewChart({ 
  tokenSymbol, 
  marketCap, 
  marketCapChange24h = 0, 
  ath 
}: TradingViewChartProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [key, setKey] = useState(0) // Force re-render key

  useEffect(() => {
    let mounted = true
    let timer: NodeJS.Timeout | null = null
    
    if (containerRef.current && !isLoaded && typeof window !== 'undefined') {
      timer = setTimeout(() => {
        if (mounted && containerRef.current && document.body.contains(containerRef.current)) {
          const success = createTradingViewWidget(containerRef.current, tokenSymbol)
          if (mounted && success) {
            setIsLoaded(true)
          }
        }
      }, 300) // Increased delay for better stability
      
      return () => {
        mounted = false
        if (timer) clearTimeout(timer)
      }
    }
  }, [tokenSymbol, key])

  // Reset component when symbol changes
  useEffect(() => {
    setIsLoaded(false)
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
      <div 
        key={key}
        ref={containerRef}
        className="relative w-full"
        style={{ height: '500px' }}
      >
        {!isLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-secondary-light">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
              <p className="text-gray-400">Loading Professional Chart...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
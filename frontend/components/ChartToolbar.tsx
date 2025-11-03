'use client'

import { useState, useRef } from 'react'
import { IChartApi } from 'lightweight-charts'

interface ChartToolbarProps {
  chartRef: React.RefObject<IChartApi | null>
  onFullscreen?: () => void
  onScreenshot?: () => void
  onExport?: () => void
  className?: string
}

type ChartType = 'candlesticks' | 'line' | 'area' | 'bars'
type DrawingTool = 'none' | 'trend' | 'horizontal' | 'vertical' | 'rectangle' | 'fibonacci'
type Indicator = 'none' | 'ema' | 'sma' | 'rsi' | 'macd' | 'bollinger'

export function ChartToolbar({ 
  chartRef, 
  onFullscreen, 
  onScreenshot, 
  onExport,
  className = '' 
}: ChartToolbarProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [activeChartType, setActiveChartType] = useState<ChartType>('candlesticks')
  const [activeDrawingTool, setActiveDrawingTool] = useState<DrawingTool>('none')
  const [activeIndicators, setActiveIndicators] = useState<Set<Indicator>>(new Set())
  const [showSettings, setShowSettings] = useState(false)
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Chart type switcher
  const chartTypes: { type: ChartType; label: string; icon: string }[] = [
    { type: 'candlesticks', label: 'Candlesticks', icon: '📊' },
    { type: 'line', label: 'Line', icon: '📈' },
    { type: 'area', label: 'Area', icon: '🏔️' },
    { type: 'bars', label: 'Bars', icon: '📶' },
  ]

  // Drawing tools
  const drawingTools: { tool: DrawingTool; label: string; icon: string }[] = [
    { tool: 'none', label: 'Select', icon: '👆' },
    { tool: 'trend', label: 'Trend Line', icon: '📏' },
    { tool: 'horizontal', label: 'Horizontal Line', icon: '➖' },
    { tool: 'vertical', label: 'Vertical Line', icon: '|' },
    { tool: 'rectangle', label: 'Rectangle', icon: '⬜' },
    { tool: 'fibonacci', label: 'Fibonacci', icon: '🌀' },
  ]

  // Technical indicators
  const indicators: { indicator: Indicator; label: string; description: string }[] = [
    { indicator: 'ema', label: 'EMA', description: 'Exponential Moving Average' },
    { indicator: 'sma', label: 'SMA', description: 'Simple Moving Average' },
    { indicator: 'rsi', label: 'RSI', description: 'Relative Strength Index' },
    { indicator: 'macd', label: 'MACD', description: 'Moving Average Convergence Divergence' },
    { indicator: 'bollinger', label: 'Bollinger', description: 'Bollinger Bands' },
  ]

  const handleChartTypeChange = (type: ChartType) => {
    setActiveChartType(type)
    // Here you would implement actual chart type switching
    console.log('[ChartToolbar] Switching to chart type:', type)
  }

  const handleDrawingToolSelect = (tool: DrawingTool) => {
    setActiveDrawingTool(tool)
    // Here you would implement drawing tool activation
    console.log('[ChartToolbar] Activated drawing tool:', tool)
  }

  const handleIndicatorToggle = (indicator: Indicator) => {
    const newIndicators = new Set(activeIndicators)
    if (newIndicators.has(indicator)) {
      newIndicators.delete(indicator)
    } else {
      newIndicators.add(indicator)
    }
    setActiveIndicators(newIndicators)
    // Here you would implement indicator addition/removal
    console.log('[ChartToolbar] Toggled indicator:', indicator, 'Active:', newIndicators.has(indicator))
  }

  const handleScreenshot = async () => {
    try {
      if (chartRef.current && onScreenshot) {
        onScreenshot()
      } else {
        // Fallback screenshot using html2canvas or similar
        console.log('[ChartToolbar] Taking screenshot...')
      }
    } catch (error) {
      console.error('[ChartToolbar] Screenshot failed:', error)
    }
  }

  const handleExport = () => {
    if (onExport) {
      onExport()
    } else {
      // Fallback export functionality
      const dataUrl = chartRef.current?.takeScreenshot()
      if (dataUrl) {
        const link = document.createElement('a')
        link.download = 'chart-export.png'
        link.href = dataUrl
        link.click()
      }
    }
  }

  const handleImportSettings = () => {
    fileInputRef.current?.click()
  }

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const settings = JSON.parse(e.target?.result as string)
          console.log('[ChartToolbar] Imported settings:', settings)
          // Apply imported settings
        } catch (error) {
          console.error('[ChartToolbar] Failed to import settings:', error)
        }
      }
      reader.readAsText(file)
    }
  }

  return (
    <>
      <div className={`bg-gray-900 border-b border-gray-800 ${className}`}>
        <div className="flex items-center justify-between px-4 py-2">
          {/* Left Side - Chart Controls */}
          <div className="flex items-center gap-2">
            {/* Expand/Collapse */}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2 rounded-md bg-gray-800 hover:bg-gray-700 transition"
              title={isExpanded ? 'Collapse toolbar' : 'Expand toolbar'}
            >
              <svg className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
                   fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Chart Type Quick Switcher */}
            <div className="flex gap-1">
              {chartTypes.map(({ type, label, icon }) => (
                <button
                  key={type}
                  onClick={() => handleChartTypeChange(type)}
                  className={`px-3 py-2 rounded-md text-xs font-medium transition flex items-center gap-1 ${
                    activeChartType === type
                      ? 'bg-primary text-black'
                      : 'bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700'
                  }`}
                  title={label}
                >
                  <span>{icon}</span>
                  {isExpanded && <span>{label}</span>}
                </button>
              ))}
            </div>

            {isExpanded && (
              <>
                {/* Drawing Tools */}
                <div className="border-l border-gray-700 pl-2 ml-2">
                  <div className="flex gap-1">
                    {drawingTools.slice(0, 4).map(({ tool, label, icon }) => (
                      <button
                        key={tool}
                        onClick={() => handleDrawingToolSelect(tool)}
                        className={`px-2 py-2 rounded-md text-xs transition ${
                          activeDrawingTool === tool
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700'
                        }`}
                        title={label}
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Indicators */}
                <div className="border-l border-gray-700 pl-2 ml-2">
                  <div className="flex gap-1">
                    {indicators.slice(0, 3).map(({ indicator, label, description }) => (
                      <button
                        key={indicator}
                        onClick={() => handleIndicatorToggle(indicator)}
                        className={`px-2 py-1 rounded-md text-xs font-medium transition ${
                          activeIndicators.has(indicator)
                            ? 'bg-green-600 text-white'
                            : 'bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700'
                        }`}
                        title={description}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Right Side - Action Buttons */}
          <div className="flex items-center gap-2">
            {/* Screenshot */}
            <button
              onClick={handleScreenshot}
              className="p-2 rounded-md bg-gray-800 hover:bg-gray-700 transition"
              title="Take screenshot"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>

            {/* Export */}
            <button
              onClick={handleExport}
              className="p-2 rounded-md bg-gray-800 hover:bg-gray-700 transition"
              title="Export chart"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </button>

            {/* Settings */}
            <button
              onClick={() => setShowSettings(!showSettings)}
              className={`p-2 rounded-md transition ${
                showSettings ? 'bg-primary text-black' : 'bg-gray-800 hover:bg-gray-700'
              }`}
              title="Chart settings"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>

            {/* Fullscreen */}
            {onFullscreen && (
              <button
                onClick={onFullscreen}
                className="p-2 rounded-md bg-gray-800 hover:bg-gray-700 transition"
                title="Fullscreen"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Expanded Toolbar */}
        {isExpanded && (
          <div className="px-4 py-3 border-t border-gray-800 bg-gray-950">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Drawing Tools */}
              <div>
                <h3 className="text-sm font-semibold text-white mb-2">Drawing Tools</h3>
                <div className="grid grid-cols-3 gap-2">
                  {drawingTools.map(({ tool, label, icon }) => (
                    <button
                      key={tool}
                      onClick={() => handleDrawingToolSelect(tool)}
                      className={`p-2 rounded-md text-xs font-medium transition flex flex-col items-center gap-1 ${
                        activeDrawingTool === tool
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700'
                      }`}
                    >
                      <span className="text-lg">{icon}</span>
                      <span>{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Technical Indicators */}
              <div>
                <h3 className="text-sm font-semibold text-white mb-2">Technical Indicators</h3>
                <div className="space-y-2">
                  {indicators.map(({ indicator, label, description }) => (
                    <button
                      key={indicator}
                      onClick={() => handleIndicatorToggle(indicator)}
                      className={`w-full p-2 rounded-md text-xs text-left transition ${
                        activeIndicators.has(indicator)
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold">{label}</span>
                        {activeIndicators.has(indicator) && <span>✓</span>}
                      </div>
                      <div className="text-xs opacity-75 mt-1">{description}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick Actions */}
              <div>
                <h3 className="text-sm font-semibold text-white mb-2">Quick Actions</h3>
                <div className="space-y-2">
                  <button
                    onClick={() => chartRef.current?.timeScale().resetTimeScale()}
                    className="w-full p-2 bg-gray-800 hover:bg-gray-700 rounded-md text-xs text-left transition"
                  >
                    🔄 Reset Zoom
                  </button>
                  <button
                    onClick={() => chartRef.current?.timeScale().fitContent()}
                    className="w-full p-2 bg-gray-800 hover:bg-gray-700 rounded-md text-xs text-left transition"
                  >
                    📏 Fit Content
                  </button>
                  <button
                    onClick={handleImportSettings}
                    className="w-full p-2 bg-gray-800 hover:bg-gray-700 rounded-md text-xs text-left transition"
                  >
                    📁 Import Settings
                  </button>
                  <button
                    onClick={() => {
                      const settings = { chartType: activeChartType, indicators: Array.from(activeIndicators) }
                      const dataStr = JSON.stringify(settings, null, 2)
                      const dataBlob = new Blob([dataStr], { type: 'application/json' })
                      const url = URL.createObjectURL(dataBlob)
                      const link = document.createElement('a')
                      link.href = url
                      link.download = 'chart-settings.json'
                      link.click()
                      URL.revokeObjectURL(url)
                    }}
                    className="w-full p-2 bg-gray-800 hover:bg-gray-700 rounded-md text-xs text-left transition"
                  >
                    💾 Export Settings
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Settings Panel Overlay */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 rounded-xl border border-gray-700 w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-white">Chart Settings</h2>
                <button
                  onClick={() => setShowSettings(false)}
                  className="p-1 rounded-md hover:bg-gray-800 transition"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Chart Theme</label>
                  <select className="w-full p-2 bg-gray-800 border border-gray-600 rounded-md text-white">
                    <option value="dark">Dark</option>
                    <option value="light">Light</option>
                    <option value="auto">Auto</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Grid Lines</label>
                  <div className="flex items-center">
                    <input type="checkbox" className="mr-2" defaultChecked />
                    <span className="text-sm text-gray-400">Show grid lines</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Crosshair Style</label>
                  <select className="w-full p-2 bg-gray-800 border border-gray-600 rounded-md text-white">
                    <option value="normal">Normal</option>
                    <option value="magnet">Magnet</option>
                    <option value="hidden">Hidden</option>
                  </select>
                </div>

                <div className="flex gap-2 pt-4">
                  <button
                    onClick={() => setShowSettings(false)}
                    className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-md text-white transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      console.log('[ChartToolbar] Settings saved')
                      setShowSettings(false)
                    }}
                    className="flex-1 px-4 py-2 bg-primary hover:bg-primary-dark text-black rounded-md transition"
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hidden file input for settings import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileImport}
        className="hidden"
      />
    </>
  )
}
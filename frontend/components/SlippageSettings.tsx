'use client'

import { useState } from 'react'
import { SLIPPAGE_PRESETS, formatSlippage, getSlippageWarning, isValidSlippage } from '@/lib/utils/trading'

interface SlippageSettingsProps {
  slippage: number
  onSlippageChange: (slippage: number) => void
}

export function SlippageSettings({ slippage, onSlippageChange }: SlippageSettingsProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [customValue, setCustomValue] = useState('')
  const warning = getSlippageWarning(slippage)

  const handlePresetClick = (value: number) => {
    onSlippageChange(value)
    setCustomValue('')
  }

  const handleCustomChange = (value: string) => {
    setCustomValue(value)
    const numValue = parseFloat(value)
    if (!isNaN(numValue)) {
      const bpsValue = Math.round(numValue * 100)
      if (isValidSlippage(bpsValue)) {
        onSlippageChange(bpsValue)
      }
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        Slippage: {formatSlippage(slippage)}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-[100]" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-80 bg-secondary-light border border-gray-700 rounded-lg p-4 z-[101] shadow-xl transform">
            {/* Arrow pointing up */}
            <div className="absolute -top-2 right-4 w-0 h-0 border-l-[8px] border-r-[8px] border-b-[8px] border-l-transparent border-r-transparent border-b-secondary-light"></div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Slippage Tolerance</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Preset buttons */}
            <div className="grid grid-cols-4 gap-2 mb-4">
              <button
                onClick={() => handlePresetClick(SLIPPAGE_PRESETS.LOW)}
                className={`py-2 px-3 rounded-lg text-sm font-medium transition ${
                  slippage === SLIPPAGE_PRESETS.LOW
                    ? 'bg-primary text-black'
                    : 'bg-secondary hover:bg-secondary-light text-gray-400'
                }`}
              >
                0.1%
              </button>
              <button
                onClick={() => handlePresetClick(SLIPPAGE_PRESETS.MEDIUM)}
                className={`py-2 px-3 rounded-lg text-sm font-medium transition ${
                  slippage === SLIPPAGE_PRESETS.MEDIUM
                    ? 'bg-primary text-black'
                    : 'bg-secondary hover:bg-secondary-light text-gray-400'
                }`}
              >
                0.5%
              </button>
              <button
                onClick={() => handlePresetClick(SLIPPAGE_PRESETS.HIGH)}
                className={`py-2 px-3 rounded-lg text-sm font-medium transition ${
                  slippage === SLIPPAGE_PRESETS.HIGH
                    ? 'bg-primary text-black'
                    : 'bg-secondary hover:bg-secondary-light text-gray-400'
                }`}
              >
                1%
              </button>
              <button
                onClick={() => handlePresetClick(SLIPPAGE_PRESETS.VERY_HIGH)}
                className={`py-2 px-3 rounded-lg text-sm font-medium transition ${
                  slippage === SLIPPAGE_PRESETS.VERY_HIGH
                    ? 'bg-primary text-black'
                    : 'bg-secondary hover:bg-secondary-light text-gray-400'
                }`}
              >
                3%
              </button>
            </div>

            {/* Custom input */}
            <div>
              <label className="text-sm text-gray-400 mb-2 block">Custom</label>
              <div className="relative">
                <input
                  type="number"
                  value={customValue}
                  onChange={(e) => handleCustomChange(e.target.value)}
                  placeholder="0.50"
                  step="0.01"
                  min="0"
                  max="50"
                  className="w-full px-4 py-2 bg-secondary rounded-lg border border-gray-700 focus:border-primary focus:outline-none pr-8"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">%</span>
              </div>
            </div>

            {/* Warnings */}
            {warning === 'low' && (
              <div className="mt-3 p-2 bg-yellow-500/10 border border-yellow-500/50 rounded text-xs text-yellow-500">
                ⚠️ Your transaction may fail with low slippage
              </div>
            )}
            {warning === 'medium' && (
              <div className="mt-3 p-2 bg-orange-500/10 border border-orange-500/50 rounded text-xs text-orange-500">
                ⚠️ High slippage - you may get less than expected
              </div>
            )}
            {warning === 'high' && (
              <div className="mt-3 p-2 bg-red-500/10 border border-red-500/50 rounded text-xs text-red-500">
                🚨 Very high slippage - significant price impact possible
              </div>
            )}

            <p className="mt-3 text-xs text-gray-500">
              Slippage protects you from price changes during transaction confirmation.
            </p>
          </div>
        </>
      )}
    </div>
  )
}

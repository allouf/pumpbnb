'use client'

import { useEffect, useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { ClickableWalletAddress, ClickableTransactionHash } from './ClickableAddress'
import { formatTradeAmount, formatAsterAmount } from '@/lib/utils/formatNumbers'

interface Trade {
  id: string
  tokenAddress: string
  trader: string
  isBuy: boolean
  amountIn: string
  amountOut: string
  fee: string
  timestamp: string
  txHash: string
  blockNumber: number
  price?: string | null
  marketCap?: string | null
  asterAmount?: string | null
  tokenAmount?: string | null
}

interface RecentTradesProps {
  tokenAddress: string
  tokenSymbol: string
}

export function RecentTrades({ tokenAddress, tokenSymbol }: RecentTradesProps) {
  const [trades, setTrades] = useState<Trade[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [sizeFilter, setSizeFilter] = useState(false) // Filter by size >= 0.05 ASTER
  const [allTrades, setAllTrades] = useState<Trade[]>([])

  useEffect(() => {
    const fetchTrades = async () => {
      try {
        setIsLoading(true)
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://pumpbnb-backend.onrender.com'
        // Note: The backend doesn't support buy/sell filtering via type parameter
        // We'll filter on the frontend for now
        const url = `${apiUrl}/api/v2/tokens/${tokenAddress}/trades?sortBy=timestamp&sortOrder=desc`

        console.log('[RecentTrades] Fetching trades for token:', tokenAddress)
        console.log('[RecentTrades] API URL:', url)

        const response = await fetch(url)
        const data = await response.json()

        console.log('[RecentTrades] API Response:', data)

        if (data.success) {
          const allTradesData = data.data || []
          setAllTrades(allTradesData)
          
          // Apply size filtering if enabled
          let filteredTrades = allTradesData
          if (sizeFilter) {
            filteredTrades = allTradesData.filter((trade: Trade) => {
              const asterAmount = trade.isBuy ? trade.amountIn : trade.amountOut
              const asterValue = parseFloat(asterAmount) / 1e18 // Convert from wei
              return asterValue >= 0.05 // 0.05 ASTER minimum
            })
          }
          
          setTrades(filteredTrades)
          console.log('[RecentTrades] Loaded', filteredTrades.length, 'trades')
        } else {
          console.error('[RecentTrades] API returned error:', data.error || data.message)
          console.error('[RecentTrades] Full error response:', JSON.stringify(data, null, 2))
        }
        setIsLoading(false)
      } catch (error) {
        console.error('[RecentTrades] Failed to fetch trades:', error)
        setIsLoading(false)
      }
    }

    // Initial fetch only - no auto-refresh to prevent glitchy UX
    fetchTrades()
    
    // Remove auto-refresh to prevent glitchy UX
    // Users can manually refresh using the refresh button
  }, [tokenAddress]) // Simplified dependencies

  // Handle size filter changes
  useEffect(() => {
    if (allTrades.length > 0) {
      let filteredTrades = allTrades
      if (sizeFilter) {
        filteredTrades = allTrades.filter((trade: Trade) => {
          const asterAmount = trade.isBuy ? trade.amountIn : trade.amountOut
          const asterValue = parseFloat(asterAmount) / 1e18
          return asterValue >= 0.05
        })
      }
      
      setTrades(filteredTrades)
      console.log('[RecentTrades] Size filter changed - showing', filteredTrades.length, 'trades')
    }
  }, [sizeFilter, allTrades])

  // Format time like pump.fun (e.g., "2s ago")
  const formatTime = (timestamp: string) => {
    const now = new Date().getTime()
    const tradeTime = new Date(timestamp).getTime()
    const diffSeconds = Math.floor((now - tradeTime) / 1000)
    
    if (diffSeconds < 60) return `${diffSeconds}s ago`
    if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)}m ago`
    if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)}h ago`
    return `${Math.floor(diffSeconds / 86400)}d ago`
  }

  return (
    <div className="space-y-4">
      {/* Size Filter Checkbox */}
      <div className="flex items-center gap-2 mb-4">
        <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
          <input
            type="checkbox"
            checked={sizeFilter}
            onChange={(e) => setSizeFilter(e.target.checked)}
            className="w-4 h-4 text-primary bg-secondary border-gray-600 rounded focus:ring-primary focus:ring-2"
          />
          filter by size 0.05 ASTER
        </label>
      </div>

      {/* Trades Table - Pump.fun style */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-gray-400 border-b border-gray-700">
              <th className="text-left py-2 pl-2 font-medium">Account</th>
              <th className="text-left py-2 font-medium">Type</th>
              <th className="text-right py-2 font-medium">Amount (ASTER)</th>
              <th className="text-right py-2 font-medium">Amount ({tokenSymbol})</th>
              <th className="text-right py-2 font-medium">Time</th>
              <th className="text-right py-2 pr-2 font-medium">Txn</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              // Loading skeleton rows
              Array.from({ length: 10 }).map((_, i) => (
                <tr key={i} className="border-b border-gray-800 animate-pulse">
                  <td className="py-2 pl-2">
                    <div className="h-3 bg-gray-700 rounded w-20"></div>
                  </td>
                  <td className="py-2">
                    <div className="h-3 bg-gray-700 rounded w-10"></div>
                  </td>
                  <td className="py-2 text-right">
                    <div className="h-3 bg-gray-700 rounded w-12 ml-auto"></div>
                  </td>
                  <td className="py-2 text-right">
                    <div className="h-3 bg-gray-700 rounded w-16 ml-auto"></div>
                  </td>
                  <td className="py-2 text-right">
                    <div className="h-3 bg-gray-700 rounded w-10 ml-auto"></div>
                  </td>
                  <td className="py-2 pr-2 text-right">
                    <div className="h-3 bg-gray-700 rounded w-12 ml-auto"></div>
                  </td>
                </tr>
              ))
            ) : trades.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-8 text-gray-400">
                  No trades {sizeFilter ? 'above 0.05 ASTER ' : ''}found
                </td>
              </tr>
            ) : (
              trades.slice(0, 50).map((trade) => { // Limit to 50 most recent trades
                const tokenAmount = trade.isBuy ? trade.amountOut : trade.amountIn
                const asterAmount = trade.isBuy ? trade.amountIn : trade.amountOut
                const asterValue = parseFloat(asterAmount) / 1e18
                const tokenValue = parseFloat(tokenAmount) / 1e18
                
                return (
                  <tr key={trade.txHash} className="border-b border-gray-800 hover:bg-gray-800/50 transition">
                    <td className="py-2 pl-2">
                      <ClickableWalletAddress 
                        address={trade.trader} 
                        className="text-primary hover:text-primary-light text-xs font-mono"
                      />
                    </td>
                    <td className="py-2">
                      <span className={`text-xs font-medium ${
                        trade.isBuy ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {trade.isBuy ? 'Buy' : 'Sell'}
                      </span>
                    </td>
                    <td className="py-2 text-right text-xs font-mono">
                      {asterValue.toFixed(3)}
                    </td>
                    <td className="py-2 text-right text-xs font-mono">
                      {tokenValue > 1000 ? `${(tokenValue/1000).toFixed(1)}k` : tokenValue.toFixed(0)}
                    </td>
                    <td className="py-2 text-right text-xs text-gray-400">
                      {formatTime(trade.timestamp)}
                    </td>
                    <td className="py-2 pr-2 text-right">
                      <ClickableTransactionHash 
                        hash={trade.txHash} 
                        className="text-primary hover:text-primary-light text-xs font-mono"
                      />
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

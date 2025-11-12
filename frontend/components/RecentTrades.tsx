'use client'

import { useEffect, useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { ClickableWalletAddress, ClickableTransactionHash } from './ClickableAddress'
import { formatTradeAmount, formatAsterAmount } from '@/lib/utils/formatNumbers'
import { Pagination } from './Pagination'
import { useLocalTradeCache, LocalTrade } from '@/lib/hooks/useLocalTradeCache'

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
  refreshTrigger?: number
}

export function RecentTrades({ tokenAddress, tokenSymbol, refreshTrigger }: RecentTradesProps) {
  const [trades, setTrades] = useState<(Trade | LocalTrade)[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [sizeFilter, setSizeFilter] = useState(false) // Filter by size >= 0.05 ASTER
  const [allTrades, setAllTrades] = useState<(Trade | LocalTrade)[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(20) // Fixed items per page for table
  const { localTrades } = useLocalTradeCache(tokenAddress)

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
          const apiTrades = data.data || []
          
          // Merge API trades with local cached trades, removing duplicates
          const mergedTrades = [...localTrades, ...apiTrades].reduce((unique: (Trade | LocalTrade)[], trade) => {
            // Check if this trade already exists (by txHash)
            const existingIndex = unique.findIndex(t => t.txHash === trade.txHash)
            if (existingIndex >= 0) {
              // If API trade exists, prefer it over local trade (more complete data)
              if (!('isLocal' in trade)) {
                unique[existingIndex] = trade
              }
            } else {
              unique.push(trade)
            }
            return unique
          }, [])
          
          // Sort by timestamp (newest first)
          const sortedTrades = mergedTrades.sort((a, b) => {
            const aTime = new Date(a.timestamp).getTime()
            const bTime = new Date(b.timestamp).getTime()
            return bTime - aTime
          })
          
          setAllTrades(sortedTrades)
          
          // Apply size filtering if enabled
          let filteredTrades = sortedTrades
          if (sizeFilter) {
            filteredTrades = sortedTrades.filter((trade: Trade | LocalTrade) => {
              const asterAmount = trade.isBuy ? trade.amountIn : trade.amountOut
              const asterValue = parseFloat(asterAmount) / 1e18 // Convert from wei
              return asterValue >= 0.05 // 0.05 ASTER minimum
            })
          }
          
          setTrades(filteredTrades)
          console.log('[RecentTrades] Loaded', filteredTrades.length, 'trades (', localTrades.length, 'local +', apiTrades.length, 'API)')
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

    // Initial fetch and when refreshTrigger changes
    fetchTrades()
  }, [tokenAddress, refreshTrigger]) // Added refreshTrigger to trigger immediate refresh

  // Handle size filter changes or when local trades update
  useEffect(() => {
    if (allTrades.length > 0 || localTrades.length > 0) {
      // Re-merge trades when local trades change
      const mergedTrades = [...localTrades, ...allTrades].reduce((unique: (Trade | LocalTrade)[], trade) => {
        const existingIndex = unique.findIndex(t => t.txHash === trade.txHash)
        if (existingIndex >= 0) {
          if (!('isLocal' in trade)) {
            unique[existingIndex] = trade
          }
        } else {
          unique.push(trade)
        }
        return unique
      }, [])
      
      // Sort by timestamp (newest first)
      const sortedTrades = mergedTrades.sort((a, b) => {
        const aTime = new Date(a.timestamp).getTime()
        const bTime = new Date(b.timestamp).getTime()
        return bTime - aTime
      })
      
      let filteredTrades = sortedTrades
      if (sizeFilter) {
        filteredTrades = sortedTrades.filter((trade: Trade | LocalTrade) => {
          const asterAmount = trade.isBuy ? trade.amountIn : trade.amountOut
          const asterValue = parseFloat(asterAmount) / 1e18
          return asterValue >= 0.05
        })
      }
      
      setTrades(filteredTrades)
      console.log('[RecentTrades] Trades updated - showing', filteredTrades.length, 'trades (', localTrades.length, 'local)')
    }
  }, [sizeFilter, allTrades, localTrades])

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

  // Paginate trades
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedTrades = trades.slice(startIndex, endIndex)

  return (
    <div className="space-y-4">
      {/* Size Filter Checkbox */}
      <div className="mb-4">
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
              <th className="text-left py-3 pl-3 font-medium w-[25%]">Account</th>
              <th className="text-center py-3 font-medium w-[10%]">Type</th>
              <th className="text-right py-3 font-medium w-[15%]">Amount (ASTER)</th>
              <th className="text-right py-3 font-medium w-[20%]">Amount ({tokenSymbol})</th>
              <th className="text-right py-3 font-medium w-[15%]">Time</th>
              <th className="text-center py-3 pr-3 font-medium w-[15%]">Txn</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              // Loading skeleton rows
              Array.from({ length: itemsPerPage }).map((_, i) => (
                <tr key={i} className="border-b border-gray-800 animate-pulse">
                  <td className="py-3 pl-3">
                    <div className="h-3 bg-gray-700 rounded w-20"></div>
                  </td>
                  <td className="py-3 text-center">
                    <div className="h-3 bg-gray-700 rounded w-8 mx-auto"></div>
                  </td>
                  <td className="py-3 text-right">
                    <div className="h-3 bg-gray-700 rounded w-12 ml-auto"></div>
                  </td>
                  <td className="py-3 text-right">
                    <div className="h-3 bg-gray-700 rounded w-16 ml-auto"></div>
                  </td>
                  <td className="py-3 text-right">
                    <div className="h-3 bg-gray-700 rounded w-10 ml-auto"></div>
                  </td>
                  <td className="py-3 pr-3 text-right">
                    <div className="h-3 bg-gray-700 rounded w-12 ml-auto"></div>
                  </td>
                </tr>
              ))
            ) : paginatedTrades.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-8 text-gray-400">
                  No trades {sizeFilter ? 'above 0.05 ASTER ' : ''}found
                </td>
              </tr>
            ) : (
              paginatedTrades.map((trade) => {
                const tokenAmount = trade.isBuy ? trade.amountOut : trade.amountIn
                const asterAmount = trade.isBuy ? trade.amountIn : trade.amountOut
                const asterValue = parseFloat(asterAmount) / 1e18
                const tokenValue = parseFloat(tokenAmount) / 1e18
                
                return (
                  <tr key={trade.txHash} className="border-b border-gray-800 hover:bg-gray-800/30 transition">
                    <td className="py-3 pl-3">
                      <ClickableWalletAddress 
                        address={trade.trader} 
                        className="text-primary hover:text-primary-light text-xs font-mono"
                      />
                    </td>
                    <td className="py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <span className={`text-xs font-semibold px-2 py-1 rounded ${
                          trade.isBuy ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                        }`}>
                          {trade.isBuy ? 'Buy' : 'Sell'}
                        </span>
                        {('isLocal' in trade) && (
                          <span className="text-xs text-yellow-400" title="Cached locally (indexing failed)">
                            📱
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 text-right text-xs font-mono text-white">
                      {asterValue.toFixed(3)}
                    </td>
                    <td className="py-3 text-right text-xs font-mono text-white">
                      {tokenValue > 1000000 
                        ? `${(tokenValue/1000000).toFixed(1)}M` 
                        : tokenValue > 1000 
                        ? `${(tokenValue/1000).toFixed(1)}k` 
                        : tokenValue.toFixed(0)
                      }
                    </td>
                    <td className="py-3 text-right text-xs text-gray-400">
                      {formatTime(trade.timestamp)}
                    </td>
                    <td className="py-3 pr-3 text-center">
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
      
      {/* Pagination */}
      {trades.length > itemsPerPage && (
        <div className="mt-4 pt-4 border-t border-gray-700">
          <Pagination
            currentPage={currentPage}
            totalPages={Math.ceil(trades.length / itemsPerPage)}
            totalItems={trades.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={() => {}} // Fixed items per page
            itemsPerPageOptions={[20]} // Fixed options
            isLoading={isLoading}
          />
        </div>
      )}
    </div>
  )
}

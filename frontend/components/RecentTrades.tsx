'use client'

import { useEffect, useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { ClickableWalletAddress, ClickableTransactionHash } from './ClickableAddress'
import { Pagination, PaginationSkeleton } from './Pagination'
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
  const [filter, setFilter] = useState<'all' | 'buy' | 'sell'>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [totalItems, setTotalItems] = useState(0)
  const [allTrades, setAllTrades] = useState<Trade[]>([])

  useEffect(() => {
    const fetchTrades = async () => {
      try {
        setIsLoading(true)
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://pumpbnb-backend.onrender.com'
        // Note: The backend doesn't support buy/sell filtering via type parameter
        // We'll filter on the frontend for now
        const url = `${apiUrl}/api/v2/tokens/${tokenAddress}/trades?page=${currentPage}&limit=${itemsPerPage}&sortBy=timestamp&sortOrder=desc`

        console.log('[RecentTrades] Fetching trades for token:', tokenAddress)
        console.log('[RecentTrades] API URL:', url)

        const response = await fetch(url)
        const data = await response.json()

        console.log('[RecentTrades] API Response:', data)

        if (data.success) {
          const allTradesData = data.data || []
          setAllTrades(allTradesData)
          
          // Apply client-side buy/sell filtering since backend doesn't support it
          let filteredTrades = allTradesData
          if (filter === 'buy') {
            filteredTrades = allTradesData.filter((trade: Trade) => trade.isBuy === true)
          } else if (filter === 'sell') {
            filteredTrades = allTradesData.filter((trade: Trade) => trade.isBuy === false)
          }
          
          setTrades(filteredTrades)
          // For pagination: use actual total from API for 'all', filtered count for others
          const totalFromAPI = data.pagination?.total || 0
          const filteredTotal = filter === 'all' ? totalFromAPI : filteredTrades.length
          setTotalItems(filteredTotal)
          console.log('[RecentTrades] Loaded', filteredTrades.length, 'trades (filtered from', allTradesData.length, '), total:', filteredTotal)
          console.log('[RecentTrades] Pagination data:', data.pagination)
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
  }, [tokenAddress, currentPage, itemsPerPage]) // Removed filter from dependencies since it's handled separately

  // Handle filter changes with client-side filtering
  useEffect(() => {
    setCurrentPage(1)
    
    // Apply filtering to existing trades without API call
    if (allTrades.length > 0) {
      let filteredTrades = allTrades
      if (filter === 'buy') {
        filteredTrades = allTrades.filter((trade: Trade) => trade.isBuy === true)
      } else if (filter === 'sell') {
        filteredTrades = allTrades.filter((trade: Trade) => trade.isBuy === false)
      }
      
      setTrades(filteredTrades)
      // Update total count for pagination
      const totalFromAPI = totalItems // Keep the original total for 'all'
      const filteredTotal = filter === 'all' ? totalFromAPI : filteredTrades.length
      setTotalItems(filteredTotal)
      
      console.log('[RecentTrades] Filter changed to', filter, '- showing', filteredTrades.length, 'trades')
    }
  }, [filter]) // Removed allTrades from dependencies to prevent infinite loops

  // Pagination handlers
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage)
    setCurrentPage(1) // Reset to first page when changing items per page
  }

  const totalPages = Math.ceil(totalItems / itemsPerPage)

  return (
    <div className="space-y-4">
      {/* Filter Buttons and Refresh */}
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            filter === 'all' ? 'bg-primary text-black' : 'bg-secondary text-gray-400'
          }`}
        >
          All
        </button>
        <button
          onClick={() => setFilter('buy')}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            filter === 'buy' ? 'bg-green-500 text-white' : 'bg-secondary text-gray-400'
          }`}
        >
          Buys
        </button>
        <button
          onClick={() => setFilter('sell')}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            filter === 'sell' ? 'bg-red-500 text-white' : 'bg-secondary text-gray-400'
          }`}
        >
          Sells
        </button>
        </div>
        
        {/* Manual Refresh Button */}
        <button
          onClick={async () => {
            if (!isLoading) {
              setCurrentPage(1) // Reset to first page on refresh
              setIsLoading(true)
              
              try {
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://pumpbnb-backend.onrender.com'
                const url = `${apiUrl}/api/v2/tokens/${tokenAddress}/trades?page=1&limit=${itemsPerPage}&sortBy=timestamp&sortOrder=desc`
                
                const response = await fetch(url)
                const data = await response.json()
                
                if (data.success) {
                  const allTradesData = data.data || []
                  setAllTrades(allTradesData)
                  
                  // Apply client-side filtering for manual refresh too
                  let filteredTrades = allTradesData
                  if (filter === 'buy') {
                    filteredTrades = allTradesData.filter((trade: Trade) => trade.isBuy === true)
                  } else if (filter === 'sell') {
                    filteredTrades = allTradesData.filter((trade: Trade) => trade.isBuy === false)
                  }
                  
                  setTrades(filteredTrades)
                  const totalFromAPI = data.pagination?.total || 0
                  const filteredTotal = filter === 'all' ? totalFromAPI : filteredTrades.length
                  setTotalItems(filteredTotal)
                  console.log('[RecentTrades] Manual refresh loaded', filteredTrades.length, 'trades of total:', filteredTotal)
                } else {
                  console.error('[RecentTrades] Manual refresh error:', data.error || data.message)
                }
              } catch (error) {
                console.error('[RecentTrades] Manual refresh failed:', error)
              } finally {
                setIsLoading(false)
              }
            }
          }}
          disabled={isLoading}
          className={`px-3 py-2 rounded-lg text-sm font-medium transition disabled:opacity-50 ${
            isLoading 
              ? 'bg-gray-600 text-gray-300 cursor-not-allowed' 
              : 'bg-secondary text-gray-400 hover:bg-secondary-light hover:text-white'
          }`}
          title="Refresh trades"
        >
          {isLoading ? (
            <div className="w-4 h-4 border-2 border-gray-300 border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          )}
        </button>
      </div>

      {/* Trades List */}
      <div className="space-y-2">
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: itemsPerPage }).map((_, i) => (
              <div key={i} className="bg-secondary p-4 rounded-lg animate-pulse">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-gray-700"></div>
                    <div>
                      <div className="h-4 w-24 bg-gray-700 rounded mb-1"></div>
                      <div className="h-3 w-16 bg-gray-700 rounded"></div>
                    </div>
                  </div>
                  <div>
                    <div className="h-4 w-20 bg-gray-700 rounded mb-1"></div>
                    <div className="h-3 w-12 bg-gray-700 rounded"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : trades.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p>No {filter !== 'all' ? filter : ''} trades yet</p>
          </div>
        ) : (
          trades.map((trade) => {
            const tradeType = trade.isBuy ? 'buy' : 'sell'
            const tokenAmount = trade.isBuy ? trade.amountOut : trade.amountIn
            const asterAmount = trade.isBuy ? trade.amountIn : trade.amountOut
            
            return (
              <div
                key={trade.txHash}
                className="bg-secondary p-4 rounded-lg flex items-center justify-between hover:bg-secondary-light transition"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${trade.isBuy ? 'bg-green-500' : 'bg-red-500'}`} />
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">
                        <span className={trade.isBuy ? 'text-green-500' : 'text-red-500'}>
                          {tradeType.toUpperCase()}
                        </span>
                        {' '}
                        {formatTradeAmount(tokenAmount)} {tokenSymbol}
                      </p>
                      <ClickableTransactionHash hash={trade.txHash} className="text-xs" />
                    </div>
                    <div className="text-xs text-gray-400">
                      <ClickableWalletAddress address={trade.trader} className="text-xs" />
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">
                    {formatAsterAmount(asterAmount)} ASTER
                  </p>
                  <p className="text-xs text-gray-400">
                    {formatDistanceToNow(new Date(trade.timestamp), { addSuffix: true })}
                  </p>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Pagination - Show if we have more than one page of results */}
      {totalItems > itemsPerPage && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          itemsPerPage={itemsPerPage}
          onPageChange={handlePageChange}
          onItemsPerPageChange={handleItemsPerPageChange}
          itemsPerPageOptions={[5, 10, 20, 50]}
          isLoading={isLoading}
          className="border-t border-gray-700 mt-4 pt-4"
        />
      )}
      
    </div>
  )
}

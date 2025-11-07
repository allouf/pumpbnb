'use client'

import { useEffect, useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { ClickableWalletAddress, ClickableTransactionHash } from './ClickableAddress'
import { Pagination, PaginationSkeleton } from './Pagination'
import { formatTradeAmount, formatAsterAmount } from '@/lib/utils/formatNumbers'

interface Trade {
  transactionHash: string
  type: string
  user: string
  tokenAmount: string
  asterAmount: string
  timestamp: Date
  blockNumber: number
  bondingCurve: string
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

  useEffect(() => {
    const fetchTrades = async () => {
      try {
        setIsLoading(true)
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://pumpbnb-backend.onrender.com'
        const offset = (currentPage - 1) * itemsPerPage
        const typeFilter = filter !== 'all' ? `&type=${filter}` : ''
        const url = `${apiUrl}/api/trades/${tokenAddress}/history?limit=${itemsPerPage}&offset=${offset}${typeFilter}`

        console.log('[RecentTrades] Fetching trades for token:', tokenAddress)
        console.log('[RecentTrades] API URL:', url)

        const response = await fetch(url)
        const data = await response.json()

        console.log('[RecentTrades] API Response:', data)

        if (data.success) {
          setTrades(data.data)
          setTotalItems(data.pagination?.total || data.data.length)
          console.log('[RecentTrades] Loaded', data.data.length, 'trades of', data.pagination?.total || 'unknown total')
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

    fetchTrades()
    const interval = setInterval(fetchTrades, 10000) // Refresh every 10 seconds (less frequent for paginated data)
    return () => clearInterval(interval)
  }, [tokenAddress, currentPage, itemsPerPage, filter])

  // Reset to page 1 when filter changes
  useEffect(() => {
    setCurrentPage(1)
  }, [filter])

  // Pagination handlers
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage)
    setCurrentPage(1) // Reset to first page when changing items per page
  }

  const totalPages = Math.ceil(totalItems / itemsPerPage)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filter Buttons */}
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
          trades.map((trade) => (
            <div
              key={trade.transactionHash}
              className="bg-secondary p-4 rounded-lg flex items-center justify-between hover:bg-secondary-light transition"
            >
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${trade.type === 'buy' ? 'bg-green-500' : 'bg-red-500'}`} />
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">
                      <span className={trade.type === 'buy' ? 'text-green-500' : 'text-red-500'}>
                        {trade.type.toUpperCase()}
                      </span>
                      {' '}
                      {formatTradeAmount(trade.tokenAmount)} {tokenSymbol}
                    </p>
                    <ClickableTransactionHash hash={trade.transactionHash} className="text-xs" />
                  </div>
                  <div className="text-xs text-gray-400">
                    <ClickableWalletAddress address={trade.user} className="text-xs" />
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium">
                  {formatAsterAmount(trade.asterAmount)} ASTER
                </p>
                <p className="text-xs text-gray-400">
                  {formatDistanceToNow(new Date(trade.timestamp), { addSuffix: true })}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalItems > 0 && (
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

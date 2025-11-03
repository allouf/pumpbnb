'use client'

import { useEffect, useState } from 'react'
import { formatDistanceToNow } from 'date-fns'

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

  useEffect(() => {
    const fetchTrades = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://pumpbnb-backend.onrender.com'
        // Use the working /api/trades endpoint instead of /api/v2/tokens endpoint
        const url = `${apiUrl}/api/trades/${tokenAddress}/history?limit=50`

        console.log('[RecentTrades] Fetching trades for token:', tokenAddress)
        console.log('[RecentTrades] API URL:', url)

        const response = await fetch(url)
        const data = await response.json()

        console.log('[RecentTrades] API Response:', data)

        if (data.success) {
          setTrades(data.data)
          console.log('[RecentTrades] Loaded', data.data.length, 'trades')
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
    const interval = setInterval(fetchTrades, 5000) // Refresh every 5 seconds
    return () => clearInterval(interval)
  }, [tokenAddress])

  const filteredTrades = filter === 'all'
    ? trades
    : trades.filter(t => t.type === filter)

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
        {filteredTrades.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p>No {filter !== 'all' ? filter : ''} trades yet</p>
          </div>
        ) : (
          filteredTrades.map((trade) => (
            <div
              key={trade.transactionHash}
              className="bg-secondary p-4 rounded-lg flex items-center justify-between hover:bg-secondary-light transition"
            >
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${trade.type === 'buy' ? 'bg-green-500' : 'bg-red-500'}`} />
                <div>
                  <p className="text-sm font-medium">
                    <span className={trade.type === 'buy' ? 'text-green-500' : 'text-red-500'}>
                      {trade.type.toUpperCase()}
                    </span>
                    {' '}
                    {parseFloat(trade.tokenAmount).toFixed(2)} {tokenSymbol}
                  </p>
                  <p className="text-xs text-gray-400">
                    {trade.user.slice(0, 6)}...{trade.user.slice(-4)}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium">
                  {parseFloat(trade.asterAmount).toFixed(4)} ASTER
                </p>
                <p className="text-xs text-gray-400">
                  {formatDistanceToNow(new Date(trade.timestamp), { addSuffix: true })}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

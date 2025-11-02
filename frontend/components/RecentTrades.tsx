'use client'

import { useEffect, useState } from 'react'
import { formatDistanceToNow } from 'date-fns'

interface Trade {
  id: string
  trader: string
  isBuy: boolean
  asterAmount: string
  tokenAmount: string
  price: string
  timestamp: Date
  txHash: string
}

interface RecentTradesProps {
  bondingCurveAddress: string
  tokenSymbol: string
}

export function RecentTrades({ bondingCurveAddress, tokenSymbol }: RecentTradesProps) {
  const [trades, setTrades] = useState<Trade[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'buy' | 'sell'>('all')

  useEffect(() => {
    const fetchTrades = async () => {
      try {
        const response = await fetch(`/api/v2/tokens/${bondingCurveAddress}/trades?limit=50`)
        const data = await response.json()

        if (data.success) {
          setTrades(data.data)
        }
        setIsLoading(false)
      } catch (error) {
        console.error('Failed to fetch trades:', error)
        setIsLoading(false)
      }
    }

    fetchTrades()
    const interval = setInterval(fetchTrades, 5000) // Refresh every 5 seconds
    return () => clearInterval(interval)
  }, [bondingCurveAddress])

  const filteredTrades = filter === 'all'
    ? trades
    : trades.filter(t => t.isBuy === (filter === 'buy'))

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
              key={trade.id}
              className="bg-secondary p-4 rounded-lg flex items-center justify-between hover:bg-secondary-light transition"
            >
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${trade.isBuy ? 'bg-green-500' : 'bg-red-500'}`} />
                <div>
                  <p className="text-sm font-medium">
                    <span className={trade.isBuy ? 'text-green-500' : 'text-red-500'}>
                      {trade.isBuy ? 'BUY' : 'SELL'}
                    </span>
                    {' '}
                    {parseFloat(trade.tokenAmount).toFixed(2)} {tokenSymbol}
                  </p>
                  <p className="text-xs text-gray-400">
                    {trade.trader.slice(0, 6)}...{trade.trader.slice(-4)}
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

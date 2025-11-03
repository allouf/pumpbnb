'use client'

import { useEffect, useState } from 'react'

interface Holder {
  address: string
  balance: string
  percentage: number
}

interface TopHoldersProps {
  tokenAddress: string
  tokenSymbol: string
}

export function TopHolders({ tokenAddress, tokenSymbol }: TopHoldersProps) {
  const [holders, setHolders] = useState<Holder[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [totalSupply, setTotalSupply] = useState('0')

  useEffect(() => {
    const fetchHolders = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://pumpbnb-backend.onrender.com'
        const url = `${apiUrl}/api/v2/tokens/${tokenAddress}/holders?limit=10`

        console.log('[TopHolders] Fetching holders for token:', tokenAddress)
        console.log('[TopHolders] API URL:', url)

        const response = await fetch(url)
        const data = await response.json()

        console.log('[TopHolders] API Response:', data)

        if (data.success) {
          setHolders(data.data)
          console.log('[TopHolders] Loaded', data.data.length, 'holders')

          // Calculate total supply from holders
          const total = data.data.reduce((sum: number, h: Holder) => sum + parseFloat(h.balance), 0)
          setTotalSupply(total.toString())
        } else {
          console.error('[TopHolders] API returned error:', data.error)
        }
        setIsLoading(false)
      } catch (error) {
        console.error('[TopHolders] Failed to fetch holders:', error)
        setIsLoading(false)
      }
    }

    fetchHolders()
    const interval = setInterval(fetchHolders, 10000) // Refresh every 10 seconds
    return () => clearInterval(interval)
  }, [tokenAddress])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {holders.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p>No holders yet</p>
        </div>
      ) : (
        <>
          {/* Holders List */}
          {holders.map((holder, index) => (
            <div
              key={holder.address}
              className="bg-secondary p-4 rounded-lg flex items-center justify-between hover:bg-secondary-light transition"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center text-sm font-bold text-primary">
                  #{index + 1}
                </div>
                <div>
                  <p className="text-sm font-mono">
                    {holder.address.slice(0, 6)}...{holder.address.slice(-4)}
                  </p>
                  <p className="text-xs text-gray-400">
                    {parseFloat(holder.balance).toLocaleString()} {tokenSymbol}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-2">
                  <div className="w-24 bg-secondary-light rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full"
                      style={{ width: `${Math.min(holder.percentage, 100)}%` }}
                    />
                  </div>
                  <p className="text-sm font-bold text-primary w-12 text-right">
                    {holder.percentage.toFixed(2)}%
                  </p>
                </div>
              </div>
            </div>
          ))}

          {/* Generate Bubble Map Button */}
          <button className="w-full mt-4 bg-secondary hover:bg-secondary-light border border-gray-700 rounded-lg p-4 text-center transition group">
            <p className="font-medium group-hover:text-primary transition">
              📊 Generate Bubble Map
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Visualize holder distribution
            </p>
          </button>
        </>
      )}
    </div>
  )
}

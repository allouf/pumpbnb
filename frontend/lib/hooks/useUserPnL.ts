'use client'

import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { formatUnits } from 'viem'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export interface UserPnL {
  realizedPnL: bigint
  realizedPnLFormatted: string
  unrealizedPnL: bigint
  unrealizedPnLFormatted: string
  totalPnL: bigint
  totalPnLFormatted: string
  totalBuyVolume: bigint
  totalBuyVolumeFormatted: string
  totalSellVolume: bigint
  totalSellVolumeFormatted: string
  totalTrades: number
  profitLossPercent: number
}

export function useUserPnL() {
  const { address, isConnected } = useAccount()
  const [pnl, setPnL] = useState<UserPnL | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    async function fetchPnL() {
      if (!address || !isConnected) {
        setPnL(null)
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        setError(null)

        const response = await fetch(`${API_URL}/api/users/${address}/pnl`)

        if (!response.ok) {
          throw new Error(`Failed to fetch P&L: ${response.statusText}`)
        }

        const data = await response.json()

        if (!data.success) {
          throw new Error(data.message || 'Failed to fetch P&L')
        }

        const pnlData = data.data

        const realizedPnL = BigInt(pnlData.realizedPnL || 0)
        const unrealizedPnL = BigInt(pnlData.unrealizedPnL || 0)
        const totalPnL = BigInt(pnlData.totalPnL || 0)
        const totalBuyVolume = BigInt(pnlData.totalBuyVolume || 0)
        const totalSellVolume = BigInt(pnlData.totalSellVolume || 0)

        // Calculate profit/loss percentage
        const invested = totalBuyVolume
        const profitLossPercent = invested > 0n
          ? Number((totalPnL * 10000n) / invested) / 100
          : 0

        setPnL({
          realizedPnL,
          realizedPnLFormatted: formatUnits(realizedPnL, 18),
          unrealizedPnL,
          unrealizedPnLFormatted: formatUnits(unrealizedPnL, 18),
          totalPnL,
          totalPnLFormatted: formatUnits(totalPnL, 18),
          totalBuyVolume,
          totalBuyVolumeFormatted: formatUnits(totalBuyVolume, 18),
          totalSellVolume,
          totalSellVolumeFormatted: formatUnits(totalSellVolume, 18),
          totalTrades: pnlData.totalTrades || 0,
          profitLossPercent,
        })
      } catch (err) {
        console.error('Error fetching P&L:', err)
        setError(err as Error)
        setPnL(null)
      } finally {
        setIsLoading(false)
      }
    }

    fetchPnL()

    // Refetch every 30 seconds
    const interval = setInterval(fetchPnL, 30000)
    return () => clearInterval(interval)
  }, [address, isConnected])

  return {
    pnl,
    isLoading,
    error,
  }
}

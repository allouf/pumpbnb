'use client'

import { useState, useEffect } from 'react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export interface Transaction {
  hash: string
  type: 'buy' | 'sell'
  user: string
  tokenAmount: bigint
  tokenAmountFormatted: string
  asterAmount: bigint
  asterAmountFormatted: string
  timestamp: number
  blockNumber: bigint
  bondingCurve: string
}

export function useTransactionHistory(bondingCurveAddress?: string, userAddress?: string) {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    async function fetchTransactions() {
      // If no bondingCurveAddress and no userAddress, can't fetch anything
      if (!bondingCurveAddress && !userAddress) {
        console.log('[useTransactionHistory] Missing both bondingCurveAddress and userAddress')
        setIsLoading(false)
        return
      }

      console.log('[useTransactionHistory] Fetching from backend API...')
      console.log(`[useTransactionHistory] Bonding curve: ${bondingCurveAddress}`)
      console.log(`[useTransactionHistory] User filter: ${userAddress || 'none'}`)

      try {
        // Only show loading on initial fetch, not on polls
        if (transactions.length === 0) {
          setIsLoading(true)
        }

        const url = `${API_URL}/api/trades/${bondingCurveAddress}/history${userAddress ? `?userAddress=${userAddress}` : ''}`
        console.log(`[useTransactionHistory] Fetching: ${url}`)

        const response = await fetch(url)

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        const data = await response.json()
        console.log('[useTransactionHistory] API Response received:', {
          success: data.success,
          dataLength: data.data?.length || 0,
          bondingCurveAddress
        })

        if (!data.success) {
          console.error('[useTransactionHistory] API returned error:', data.message)
          throw new Error(data.message || 'Failed to fetch trade history')
        }

        // Convert backend data to Transaction format with null handling
        const trades = data.data
          .filter((trade: any) => trade.asterAmount !== null && trade.tokenAmount !== null) // Filter out null trades
          .map((trade: any) => ({
            hash: trade.transactionHash || trade.txHash,
            type: trade.isBuy ? 'buy' : 'sell',
            user: trade.trader,
            tokenAmount: BigInt(trade.tokenAmount),
            tokenAmountFormatted: (Number(trade.tokenAmount) / 1e18).toString(),
            asterAmount: BigInt(trade.asterAmount),
            asterAmountFormatted: (Number(trade.asterAmount) / 1e18).toString(),
            timestamp: new Date(trade.timestamp).getTime() / 1000,
            blockNumber: BigInt(trade.blockNumber),
            bondingCurve: trade.tokenAddress,
          }))

        // Only update state if there are new trades (avoid unnecessary re-renders)
        if (trades.length !== transactions.length ||
            trades.some((trade: Transaction, index: number) => trade.hash !== transactions[index]?.hash)) {
          console.log(`[useTransactionHistory] New trades detected: ${trades.length} (was ${transactions.length})`)
          setTransactions(trades)
        } else {
          console.log(`[useTransactionHistory] No new trades, skipping update`)
        }

        setError(null)
      } catch (err) {
        console.error('[useTransactionHistory] Error:', err)
        setError(err as Error)
      } finally {
        setIsLoading(false)
      }
    }

    // Initial fetch
    fetchTransactions()

    // Poll every 30 seconds for new trades (reduced from 5 seconds for smoother UX)
    const pollInterval = setInterval(() => {
      fetchTransactions()
    }, 30000)

    return () => clearInterval(pollInterval)
  }, [bondingCurveAddress, userAddress])

  return { transactions, isLoading, error }
}

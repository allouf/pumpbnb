'use client'

import { useState, useEffect, useCallback } from 'react'

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
  price?: string // Price at time of trade (ASTER per token with 18 decimals)
}

export function useTransactionHistory(bondingCurveAddress?: string, userAddress?: string, refreshTrigger?: number) {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [manualRefresh, setManualRefresh] = useState(0)

  // Function to manually trigger a refresh
  const refetch = useCallback(() => {
    console.log('[useTransactionHistory] 🔄 Manual refetch triggered')
    setManualRefresh(prev => prev + 1)
  }, [])

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

        // Convert backend data to Transaction format
        const trades = data.data
          .map((trade: any) => {
            // Backend always provides tokenAmount and asterAmount from amountIn/amountOut
            // No need to filter - all trades have valid amounts
            return {
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
              price: trade.price, // Price from backend (ASTER per token with 18 decimals)
            };
          })

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

    // Poll every 10 seconds for new trades
    const pollInterval = setInterval(() => {
      fetchTransactions()
    }, 10000)

    return () => clearInterval(pollInterval)
  }, [bondingCurveAddress, userAddress, refreshTrigger, manualRefresh])

  return { transactions, isLoading, error, refetch }
}

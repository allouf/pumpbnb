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
      if (!bondingCurveAddress) {
        console.log('[useTransactionHistory] Missing bondingCurveAddress')
        setIsLoading(false)
        return
      }

      console.log('[useTransactionHistory] Fetching from backend API...')
      console.log(`[useTransactionHistory] Bonding curve: ${bondingCurveAddress}`)
      console.log(`[useTransactionHistory] User filter: ${userAddress || 'none'}`)

      try {
        setIsLoading(true)

        const url = `${API_URL}/api/trades/${bondingCurveAddress}/history${userAddress ? `?userAddress=${userAddress}` : ''}`
        console.log(`[useTransactionHistory] Fetching: ${url}`)

        const response = await fetch(url)

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        const data = await response.json()
        console.log(`[useTransactionHistory] API response:`, data)

        if (!data.success) {
          throw new Error(data.message || 'Failed to fetch trade history')
        }

        // Convert backend data to Transaction format
        const trades = data.data.map((trade: any) => ({
          hash: trade.transactionHash,
          type: trade.type,
          user: trade.user,
          tokenAmount: BigInt(trade.tokenAmount),
          tokenAmountFormatted: (Number(trade.tokenAmount) / 1e18).toString(),
          asterAmount: BigInt(trade.asterAmount),
          asterAmountFormatted: (Number(trade.asterAmount) / 1e18).toString(),
          timestamp: new Date(trade.timestamp).getTime() / 1000,
          blockNumber: BigInt(trade.blockNumber),
          bondingCurve: trade.bondingCurve,
        }))

        console.log(`[useTransactionHistory] Processed ${trades.length} trades`)

        setTransactions(trades)
        setError(null)
      } catch (err) {
        console.error('[useTransactionHistory] Error:', err)
        setError(err as Error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchTransactions()
  }, [bondingCurveAddress, userAddress])

  return { transactions, isLoading, error }
}

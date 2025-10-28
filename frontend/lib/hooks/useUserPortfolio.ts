'use client'

import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { formatUnits } from 'viem'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export interface TokenHolding {
  tokenAddress: string
  bondingCurveAddress: string
  name: string
  symbol: string
  balance: bigint
  balanceFormatted: string
  valueInAster: bigint
  valueInAsterFormatted: string
  isGraduated: boolean
}

export function useUserPortfolio() {
  const { address, isConnected } = useAccount()
  const [holdings, setHoldings] = useState<TokenHolding[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    async function fetchPortfolio() {
      if (!address || !isConnected) {
        setHoldings([])
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        setError(null)

        // Fetch portfolio from backend API
        const response = await fetch(`${API_URL}/api/users/${address}/portfolio`)

        if (!response.ok) {
          throw new Error(`Failed to fetch portfolio: ${response.statusText}`)
        }

        const data = await response.json()

        if (!data.success) {
          throw new Error(data.message || 'Failed to fetch portfolio')
        }

        // Backend returns: { address, tokens: [...], totalValue, totalProfitLoss }
        // Transform backend data to match TokenHolding interface
        const portfolioData = data.data
        const tokens = portfolioData.tokens || []

        const portfolioHoldings: TokenHolding[] = tokens.map((item: any) => ({
          tokenAddress: item.tokenAddress,
          bondingCurveAddress: '', // Backend doesn't provide this yet
          name: item.name || 'Unknown',
          symbol: item.symbol || 'UNKNOWN',
          balance: BigInt(item.balance || 0),
          balanceFormatted: formatUnits(BigInt(item.balance || 0), 18),
          valueInAster: BigInt(item.value || 0),
          valueInAsterFormatted: formatUnits(BigInt(item.value || 0), 18),
          isGraduated: false, // Backend doesn't provide this in portfolio
        }))

        setHoldings(portfolioHoldings)
      } catch (err) {
        console.error('Error fetching portfolio:', err)
        setError(err as Error)
        // Set empty holdings on error
        setHoldings([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchPortfolio()
  }, [address, isConnected])

  // Calculate total portfolio value
  const totalValueInAster = holdings.reduce(
    (sum, holding) => sum + holding.valueInAster,
    BigInt(0)
  )

  return {
    holdings,
    totalValueInAster,
    totalValueFormatted: formatUnits(totalValueInAster, 18),
    isLoading,
    error,
  }
}

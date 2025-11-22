import { useState, useEffect } from 'react'

// TokenStats interface for single token data
interface TokenDataStats {
  price?: string           // ASTER per token
  priceUsd?: string        // USD per token
  marketCap?: string       // ASTER reserves
  marketCapUsd?: string    // USD market cap
  volume24h?: string       // 24h volume in ASTER
  volume24hUsd?: string    // 24h volume in USD
  trades24h?: number       // Number of trades in 24h
  holders?: number         // Number of holders
  priceChange24h?: string  // 24h price change percentage
  liquidity?: string       // Liquidity in ASTER
  liquidityUsd?: string    // Liquidity in USD
}

export interface TokenData {
  address: string
  bondingCurve: string
  creator: string
  name: string
  symbol: string
  description?: string
  imageUrl?: string
  isGraduated?: boolean
  createdAt: string
  // Social media links
  website?: string
  twitter?: string
  telegram?: string
  discord?: string
  // Token stats from backend
  stats?: TokenDataStats
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export function useTokenData(tokenAddress: string) {
  const [tokenData, setTokenData] = useState<TokenData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    async function fetchTokenData() {
      if (!tokenAddress) {
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)

        console.log('Fetching token from API:', `${API_URL}/api/tokens/${tokenAddress}`)

        // Fetch token data from backend API
        const response = await fetch(`${API_URL}/api/tokens/${tokenAddress}`)

        console.log('API Response status:', response.status, response.statusText)

        if (!response.ok) {
          throw new Error(`Failed to fetch token: ${response.statusText}`)
        }

        const data = await response.json()

        console.log('API Response data:', data)

        if (!data.success) {
          throw new Error(data.message || 'Failed to fetch token')
        }

        setTokenData(data.data)
        setError(null)
      } catch (err) {
        console.error('Error fetching token data:', err)
        setError(err as Error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchTokenData()
  }, [tokenAddress])

  return { tokenData, isLoading, error }
}

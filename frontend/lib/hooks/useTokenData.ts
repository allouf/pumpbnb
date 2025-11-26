import { useState, useEffect, useCallback } from 'react'

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
  priceChange1h?: string   // 1h price change percentage
  priceChange6h?: string   // 6h price change percentage
  priceChange24h?: string  // 24h price change percentage
  athMarketCapUsd?: string // All-time high market cap in USD (never decreases)
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

// Polling interval for real-time stats updates (15 seconds)
const POLLING_INTERVAL = 15000

export function useTokenData(tokenAddress: string, enablePolling: boolean = true) {
  const [tokenData, setTokenData] = useState<TokenData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  // Refetch function - can be called to refresh token data
  const refetch = useCallback(() => {
    console.log('[useTokenData] 🔄 Refetch triggered')
    setRefreshTrigger(prev => prev + 1)
  }, [])
  
  // Set up automatic polling for real-time updates
  useEffect(() => {
    if (!enablePolling || !tokenAddress) return
    
    const pollInterval = setInterval(() => {
      console.log('[useTokenData] 🔄 Auto-polling token data...')
      setRefreshTrigger(prev => prev + 1)
    }, POLLING_INTERVAL)
    
    return () => clearInterval(pollInterval)
  }, [tokenAddress, enablePolling])

  useEffect(() => {
    async function fetchTokenData() {
      if (!tokenAddress) {
        setIsLoading(false)
        return
      }

      try {
        // Only show loading on initial load, not on refetch
        if (refreshTrigger === 0) {
          setIsLoading(true)
        }

        console.log('[useTokenData] Fetching token from API:', `${API_URL}/api/tokens/${tokenAddress}`)

        // Fetch token data from backend API
        const response = await fetch(`${API_URL}/api/tokens/${tokenAddress}`)

        console.log('[useTokenData] API Response status:', response.status, response.statusText)

        if (!response.ok) {
          throw new Error(`Failed to fetch token: ${response.statusText}`)
        }

        const data = await response.json()

        console.log('[useTokenData] API Response data:', data)

        if (!data.success) {
          throw new Error(data.message || 'Failed to fetch token')
        }

        setTokenData(data.data)
        setError(null)
      } catch (err) {
        console.error('[useTokenData] Error fetching token data:', err)
        setError(err as Error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchTokenData()
  }, [tokenAddress, refreshTrigger])

  return { tokenData, isLoading, error, refetch }
}

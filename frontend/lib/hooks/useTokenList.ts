import { useState, useEffect, useCallback } from 'react'
import { cachedFetch } from '@/lib/utils/fetchWithRetry'

export interface Token {
  address: string
  bondingCurve: string
  creator: string
  name: string
  symbol: string
  timestamp: number
  description?: string
  imageUrl?: string
  isGraduated?: boolean
  isNsfw?: boolean
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export interface TokenListFilters {
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  isGraduated?: boolean
  isNsfw?: boolean
  minMarketCap?: number
  maxMarketCap?: number
  minVolume24h?: number
  maxVolume24h?: number
  limit?: number
}

export function useTokenList(options?: { pollingInterval?: number; filters?: TokenListFilters }) {
  const [tokens, setTokens] = useState<Token[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const pollingInterval = options?.pollingInterval || 10000 // Default: 10 seconds
  const filters = options?.filters || {}

  const fetchTokens = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) {
        setIsLoading(true)
      }

      // Build query string from filters
      const params = new URLSearchParams()
      params.append('limit', (filters.limit || 100).toString())
      params.append('sortBy', filters.sortBy || 'createdAt')
      params.append('sortOrder', filters.sortOrder || 'desc')

      if (filters.isGraduated !== undefined) {
        params.append('isGraduated', filters.isGraduated.toString())
      }
      if (filters.isNsfw !== undefined) {
        params.append('isNsfw', filters.isNsfw.toString())
      }
      if (filters.minMarketCap !== undefined) {
        params.append('minMarketCap', filters.minMarketCap.toString())
      }
      if (filters.maxMarketCap !== undefined) {
        params.append('maxMarketCap', filters.maxMarketCap.toString())
      }
      if (filters.minVolume24h !== undefined) {
        params.append('minVolume24h', filters.minVolume24h.toString())
      }
      if (filters.maxVolume24h !== undefined) {
        params.append('maxVolume24h', filters.maxVolume24h.toString())
      }

      const url = `${API_URL}/api/v2/tokens?${params.toString()}`
      console.log('[useTokenList] Fetching tokens from:', url)
      console.log('[useTokenList] Filters:', filters)

      // Fetch tokens from backend API with caching and retry
      const data = await cachedFetch(url, {
        cacheTTL: 5000, // Cache for 5 seconds
        retries: 3,
        retryDelay: 1000,
        bypassCache: !showLoading, // Bypass cache for background updates
        onRetry: (attempt, error) => {
          console.warn(`[useTokenList] Retry attempt ${attempt}:`, error)
        },
      })

      console.log('[useTokenList] Response data:', data)

      if (!data.success) {
        console.error('[useTokenList] API returned success=false:', data)
        throw new Error(data.message || 'Failed to fetch tokens')
      }

      console.log('[useTokenList] Raw token data:', data.data)

      // Transform backend data to match Token interface
      const tokenList: Token[] = data.data.map((token: any) => ({
        address: token.address,
        bondingCurve: token.bondingCurve,
        creator: token.creator,
        name: token.name,
        symbol: token.symbol,
        timestamp: new Date(token.createdAt).getTime() / 1000, // Convert to Unix timestamp
        description: token.description,
        imageUrl: token.imageUrl,
        isGraduated: token.isGraduated,
        isNsfw: token.isNsfw,
      }))

      console.log('[useTokenList] Transformed token list:', tokenList.length, 'tokens')
      setTokens(tokenList)
      setError(null)
    } catch (err) {
      console.error('[useTokenList] Error fetching tokens:', err)
      setError(err as Error)
    } finally {
      if (showLoading) {
        setIsLoading(false)
      }
    }
  }, [filters])

  // Initial fetch
  useEffect(() => {
    fetchTokens()
  }, [fetchTokens])

  // Polling for updates
  useEffect(() => {
    const interval = setInterval(() => {
      fetchTokens(false) // Don't show loading spinner for background updates
    }, pollingInterval)

    return () => clearInterval(interval)
  }, [fetchTokens, pollingInterval])

  const refetch = useCallback(() => {
    fetchTokens(true)
  }, [fetchTokens])

  return { tokens, isLoading, error, refetch }
}

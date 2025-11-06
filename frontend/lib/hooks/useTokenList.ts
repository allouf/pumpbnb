import { useState, useEffect, useCallback, useRef } from 'react'
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

export function useTokenList(options?: { pollingInterval?: number; filters?: TokenListFilters; disablePolling?: boolean }) {
  const [tokens, setTokens] = useState<Token[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const pollingInterval = options?.pollingInterval || 30000
  const disablePolling = options?.disablePolling || false
  const filters = options?.filters || {}
  const isMounted = useRef(true)
  const fetchTokensRef = useRef<() => Promise<void>>()

  // Single effect for initial fetch and optional polling
  useEffect(() => {
    console.log('[useTokenList] Effect triggered - filters changed')
    isMounted.current = true
    let interval: NodeJS.Timeout | null = null

    const fetchTokens = async (showLoading = true) => {
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

        // Fetch tokens from backend API with caching and retry
        const data = await cachedFetch(url, {
          cacheTTL: 30000, // Cache for 30 seconds
          retries: 2,
          retryDelay: 1000,
          bypassCache: !showLoading,
          onRetry: (attempt, error) => {
            console.warn(`[useTokenList] Retry attempt ${attempt}:`, error)
          },
        })

        if (!data.success) {
          throw new Error(data.message || 'Failed to fetch tokens')
        }

        // Transform backend data to match Token interface
        const tokenList: Token[] = data.data.map((token: any) => ({
          address: token.address,
          bondingCurve: token.bondingCurve,
          creator: token.creator,
          name: token.name,
          symbol: token.symbol,
          timestamp: new Date(token.createdAt).getTime() / 1000,
          description: token.description,
          imageUrl: token.imageUrl,
          isGraduated: token.isGraduated,
          isNsfw: token.isNsfw,
        }))

        console.log('[useTokenList] Loaded', tokenList.length, 'tokens')

        if (isMounted.current) {
          setTokens(tokenList)
          setError(null)
        }
      } catch (err) {
        console.error('[useTokenList] Error:', err)
        if (isMounted.current) {
          setError(err as Error)
        }
      } finally {
        if (showLoading && isMounted.current) {
          setIsLoading(false)
        }
      }
    }

    // Store reference
    fetchTokensRef.current = () => fetchTokens(true)

    // Initial fetch
    fetchTokens(true)

    // Setup polling only if not disabled
    if (!disablePolling) {
      interval = setInterval(() => {
        fetchTokens(false)
      }, pollingInterval)
    }

    // Cleanup
    return () => {
      isMounted.current = false
      if (interval) {
        clearInterval(interval)
      }
    }
    // Use JSON.stringify to properly detect filter changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(filters), pollingInterval, disablePolling])

  const refetch = useCallback(() => {
    fetchTokensRef.current?.()
  }, [])

  return { tokens, isLoading, error, refetch }
}

import { useState, useEffect, useCallback, useRef } from 'react'
import { cachedFetch } from '@/lib/utils/fetchWithRetry'

export interface TokenStats {
  price: string
  priceUsd?: string
  marketCap: string
  marketCapUsd?: string
  volume24h: string
  volume24hUsd?: string
  trades24h: number
  holders: number
  liquidity: string
  liquidityUsd?: string
  priceChange1h?: string
  priceChange6h?: string
  priceChange24h: string
  athMarketCapUsd?: string // All-time high market cap in USD
  transactions?: number
  currentPrice?: string
}

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
  stats?: TokenStats
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
  search?: string
  limit?: number
}

export function useTokenList(options?: { pollingInterval?: number; filters?: TokenListFilters; disablePolling?: boolean; bypassCache?: boolean }) {
  const [tokens, setTokens] = useState<Token[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [isOffline, setIsOffline] = useState(false)
  const [offlineMessage, setOfflineMessage] = useState<string | null>(null)
  const pollingInterval = options?.pollingInterval || 30000
  const disablePolling = options?.disablePolling || false
  const bypassCache = options?.bypassCache || false
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
        if (filters.search) {
          params.append('search', filters.search)
        }

        const url = `${API_URL}/api/v2/tokens?${params.toString()}`
        console.log('[useTokenList] Fetching tokens from:', url)

        // Fetch tokens from backend API with caching and retry
        // Bypass cache if explicitly requested (e.g., after creating a new token)
        const data = await cachedFetch(url, {
          cacheTTL: 30000, // Cache for 30 seconds
          retries: 2,
          retryDelay: 1000,
          bypassCache: bypassCache || !showLoading,
          onRetry: (attempt, error) => {
            console.warn(`[useTokenList] Retry attempt ${attempt}:`, error)
          },
        })

        if (!data.success) {
          throw new Error(data.message || 'Failed to fetch tokens')
        }

        // Check if response is offline mode
        const isOfflineResponse = data.offline === true
        
        // Transform backend data to match Token interface
        const tokenList: Token[] = data.data.map((token: any) => ({
          address: token.address,
          bondingCurve: token.bondingCurve,
          creator: token.creator,
          name: token.name,
          symbol: token.symbol,
          timestamp: token.timestamp || new Date(token.createdAt).getTime() / 1000,
          description: token.description,
          imageUrl: token.imageUrl,
          isGraduated: token.isGraduated,
          isNsfw: token.isNsfw,
          stats: token.stats ? {
            price: token.stats.price || '0',
            priceUsd: token.stats.priceUsd || '0',
            marketCap: token.stats.marketCap || '0',
            marketCapUsd: token.stats.marketCapUsd || '0',
            volume24h: token.stats.volume24h || '0',
            volume24hUsd: token.stats.volume24hUsd || '0',
            trades24h: token.stats.trades24h || 0,
            holders: token.stats.holders || 0,
            liquidity: token.stats.liquidity || '0',
            liquidityUsd: token.stats.liquidityUsd || '0',
            priceChange1h: token.stats.priceChange1h || '0',
            priceChange6h: token.stats.priceChange6h || '0',
            priceChange24h: token.stats.priceChange24h || '0',
            athMarketCapUsd: token.stats.athMarketCapUsd || '0',
            transactions: token.stats.trades24h || 0,
            currentPrice: token.stats.price || '0',
          } : undefined,
        }))

        console.log('[useTokenList] Loaded', tokenList.length, 'tokens', isOfflineResponse ? '(offline mode)' : '(online mode)')

        if (isMounted.current) {
          setTokens(tokenList)
          setError(null)
          setIsOffline(isOfflineResponse)
          setOfflineMessage(data.message || null)
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
  }, [JSON.stringify(filters), pollingInterval, disablePolling, bypassCache])

  const refetch = useCallback(() => {
    fetchTokensRef.current?.()
  }, [])

  return { tokens, isLoading, error, refetch, isOffline, offlineMessage }
}

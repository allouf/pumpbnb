import { useState, useEffect, useCallback } from 'react'

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

      // Fetch tokens from backend API
      const response = await fetch(`${API_URL}/api/tokens?${params.toString()}`)

      if (!response.ok) {
        throw new Error(`Failed to fetch tokens: ${response.statusText}`)
      }

      const data = await response.json()

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
        timestamp: new Date(token.createdAt).getTime() / 1000, // Convert to Unix timestamp
        description: token.description,
        imageUrl: token.imageUrl,
        isGraduated: token.isGraduated,
        isNsfw: token.isNsfw,
      }))

      setTokens(tokenList)
      setError(null)
    } catch (err) {
      console.error('Error fetching tokens:', err)
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

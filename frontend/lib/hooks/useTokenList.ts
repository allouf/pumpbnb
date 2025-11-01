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
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export function useTokenList(options?: { pollingInterval?: number }) {
  const [tokens, setTokens] = useState<Token[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const pollingInterval = options?.pollingInterval || 10000 // Default: 10 seconds

  const fetchTokens = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) {
        setIsLoading(true)
      }

      // Fetch tokens from backend API
      const response = await fetch(`${API_URL}/api/tokens?limit=100&sortBy=createdAt&sortOrder=desc`)

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
  }, [])

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

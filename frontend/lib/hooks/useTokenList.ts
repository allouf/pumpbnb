import { useState, useEffect } from 'react'

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

export function useTokenList() {
  const [tokens, setTokens] = useState<Token[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    async function fetchTokens() {
      try {
        setIsLoading(true)

        // Fetch tokens from backend API
        const response = await fetch(`${API_URL}/api/tokens?limit=100`)

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
        setIsLoading(false)
      }
    }

    fetchTokens()
  }, [])

  const refetch = () => {
    setIsLoading(true)
    setError(null)
    // Trigger re-fetch by updating state
    setTokens([])
  }

  return { tokens, isLoading, error, refetch }
}

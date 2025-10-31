import { useState, useEffect } from 'react'

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

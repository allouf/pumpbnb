'use client'

import { useState, useEffect, useCallback } from 'react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export interface WatchlistToken {
  tokenAddress: string
  addedAt: string
}

export function useWatchlist(userAddress?: string) {
  const [watchlist, setWatchlist] = useState<WatchlistToken[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  // Fetch watchlist from database
  const fetchWatchlist = useCallback(async () => {
    if (!userAddress) {
      setWatchlist([])
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`${API_URL}/api/users/${userAddress}/watchlist`)
      const data = await response.json()

      if (data.success) {
        setWatchlist(data.data || [])
      } else {
        throw new Error(data.message || 'Failed to fetch watchlist')
      }
    } catch (err) {
      console.error('[useWatchlist] Error fetching watchlist:', err)
      setError(err as Error)
      setWatchlist([])
    } finally {
      setIsLoading(false)
    }
  }, [userAddress])

  // Add token to watchlist
  const addToWatchlist = useCallback(async (tokenAddress: string): Promise<boolean> => {
    if (!userAddress) return false

    try {
      const response = await fetch(`${API_URL}/api/users/${userAddress}/watchlist`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tokenAddress }),
      })

      const data = await response.json()

      if (data.success) {
        // Refresh watchlist
        await fetchWatchlist()
        return true
      } else {
        throw new Error(data.message || 'Failed to add to watchlist')
      }
    } catch (err) {
      console.error('[useWatchlist] Error adding to watchlist:', err)
      return false
    }
  }, [userAddress, fetchWatchlist])

  // Remove token from watchlist
  const removeFromWatchlist = useCallback(async (tokenAddress: string): Promise<boolean> => {
    if (!userAddress) return false

    try {
      const response = await fetch(`${API_URL}/api/users/${userAddress}/watchlist/${tokenAddress}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (data.success) {
        // Refresh watchlist
        await fetchWatchlist()
        return true
      } else {
        throw new Error(data.message || 'Failed to remove from watchlist')
      }
    } catch (err) {
      console.error('[useWatchlist] Error removing from watchlist:', err)
      return false
    }
  }, [userAddress, fetchWatchlist])

  // Toggle watchlist (add if not in list, remove if in list)
  const toggleWatchlist = useCallback(async (tokenAddress: string): Promise<boolean> => {
    const isInWatchlist = watchlist.some(
      item => item.tokenAddress.toLowerCase() === tokenAddress.toLowerCase()
    )

    if (isInWatchlist) {
      return removeFromWatchlist(tokenAddress)
    } else {
      return addToWatchlist(tokenAddress)
    }
  }, [watchlist, addToWatchlist, removeFromWatchlist])

  // Check if token is in watchlist
  const isInWatchlist = useCallback((tokenAddress: string): boolean => {
    return watchlist.some(
      item => item.tokenAddress.toLowerCase() === tokenAddress.toLowerCase()
    )
  }, [watchlist])

  // Get list of token addresses in watchlist
  const getWatchlistAddresses = useCallback((): string[] => {
    return watchlist.map(item => item.tokenAddress)
  }, [watchlist])

  // Load watchlist on mount and when userAddress changes
  useEffect(() => {
    fetchWatchlist()
  }, [fetchWatchlist])

  return {
    watchlist,
    isLoading,
    error,
    addToWatchlist,
    removeFromWatchlist,
    toggleWatchlist,
    isInWatchlist,
    getWatchlistAddresses,
    refresh: fetchWatchlist,
  }
}

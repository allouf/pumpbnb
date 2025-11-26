'use client'

import { useState, useEffect, useCallback } from 'react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://pumpbnb-backend.onrender.com'

export interface Comment {
  id: string
  tokenAddress: string
  userAddress: string
  content: string
  createdAt: string
  likes: number
  replyTo?: string
}

export interface WatchlistItem {
  tokenAddress: string
  addedAt: string
}

// Hook for token comments - uses backend API
export function useComments(tokenAddress: string) {
  const [comments, setComments] = useState<Comment[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const loadComments = useCallback(async () => {
    try {
      setIsLoading(true)
      const res = await fetch(`${API_URL}/api/tokens/${tokenAddress}/comments`)
      if (res.ok) {
        const data = await res.json()
        setComments(data.data?.comments || [])
      }
    } catch (err) {
      console.error('Error loading comments:', err)
    } finally {
      setIsLoading(false)
    }
  }, [tokenAddress])

  useEffect(() => {
    if (tokenAddress) {
      loadComments()
    }
  }, [tokenAddress, loadComments])

  const addComment = async (userAddress: string, content: string) => {
    try {
      const res = await fetch(`${API_URL}/api/tokens/${tokenAddress}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userAddress, content }),
      })
      if (res.ok) {
        await loadComments()
        return true
      }
      return false
    } catch (err) {
      console.error('Error adding comment:', err)
      return false
    }
  }

  const likeComment = async (commentId: string, userAddress: string) => {
    try {
      const res = await fetch(`${API_URL}/api/v2/comments/${commentId}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userAddress }),
      })
      if (res.ok) {
        await loadComments()
        return true
      }
      return false
    } catch (err) {
      console.error('Error liking comment:', err)
      return false
    }
  }

  return { comments, isLoading, addComment, likeComment, refresh: loadComments }
}

// Hook for token favorites/watchlist - uses backend API
export function useTokenLikes(tokenAddress: string, userAddress?: string) {
  const [isLiked, setIsLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)

  const loadLikes = useCallback(async () => {
    if (!userAddress) {
      setIsLiked(false)
      return
    }

    try {
      const res = await fetch(`${API_URL}/api/user/${userAddress}/watchlist`)
      if (res.ok) {
        const data = await res.json()
        const watchlist: WatchlistItem[] = data.data?.watchlist || []
        const isInWatchlist = watchlist.some(
          item => item.tokenAddress.toLowerCase() === tokenAddress.toLowerCase()
        )
        setIsLiked(isInWatchlist)
        // Note: likeCount would need a separate endpoint to count all users who liked this token
        // For now, we just track if the current user liked it
      }
    } catch (err) {
      console.error('Error loading watchlist:', err)
    }
  }, [tokenAddress, userAddress])

  useEffect(() => {
    loadLikes()
  }, [loadLikes])

  const toggleLike = async () => {
    if (!userAddress) return false

    try {
      setIsLoading(true)
      
      if (isLiked) {
        // Remove from watchlist
        const res = await fetch(`${API_URL}/api/user/${userAddress}/watchlist/${tokenAddress}`, {
          method: 'DELETE',
        })
        if (res.ok) {
          setIsLiked(false)
          return true
        }
      } else {
        // Add to watchlist
        const res = await fetch(`${API_URL}/api/user/${userAddress}/watchlist`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tokenAddress }),
        })
        if (res.ok) {
          setIsLiked(true)
          return true
        }
      }
      return false
    } catch (err) {
      console.error('Error toggling watchlist:', err)
      return false
    } finally {
      setIsLoading(false)
    }
  }

  return { isLiked, likeCount, toggleLike, isLoading, refresh: loadLikes }
}

// Get user's favorite tokens from backend
export async function getFavoriteTokens(userAddress: string): Promise<string[]> {
  try {
    const res = await fetch(`${API_URL}/api/user/${userAddress}/watchlist`)
    if (!res.ok) return []

    const data = await res.json()
    const watchlist: WatchlistItem[] = data.data?.watchlist || []
    return watchlist.map(item => item.tokenAddress)
  } catch (err) {
    console.error('Error getting favorites:', err)
    return []
  }
}

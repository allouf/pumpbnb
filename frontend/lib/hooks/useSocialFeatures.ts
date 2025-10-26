'use client'

import { useState, useEffect } from 'react'

export interface Comment {
  id: string
  tokenAddress: string
  author: string
  content: string
  timestamp: number
  likes: number
}

export interface TokenLike {
  tokenAddress: string
  userAddress: string
  timestamp: number
}

const COMMENTS_KEY = 'pumpbnb_comments'
const LIKES_KEY = 'pumpbnb_likes'

export function useComments(tokenAddress: string) {
  const [comments, setComments] = useState<Comment[]>([])

  useEffect(() => {
    loadComments()
  }, [tokenAddress])

  const loadComments = () => {
    try {
      const stored = localStorage.getItem(COMMENTS_KEY)
      if (stored) {
        const allComments: Comment[] = JSON.parse(stored)
        const tokenComments = allComments.filter(c => c.tokenAddress.toLowerCase() === tokenAddress.toLowerCase())
        tokenComments.sort((a, b) => b.timestamp - a.timestamp)
        setComments(tokenComments)
      }
    } catch (err) {
      console.error('Error loading comments:', err)
    }
  }

  const addComment = (author: string, content: string) => {
    try {
      const newComment: Comment = {
        id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        tokenAddress,
        author,
        content,
        timestamp: Date.now(),
        likes: 0,
      }

      const stored = localStorage.getItem(COMMENTS_KEY)
      const allComments: Comment[] = stored ? JSON.parse(stored) : []
      allComments.push(newComment)
      localStorage.setItem(COMMENTS_KEY, JSON.stringify(allComments))

      loadComments()
      return true
    } catch (err) {
      console.error('Error adding comment:', err)
      return false
    }
  }

  const likeComment = (commentId: string) => {
    try {
      const stored = localStorage.getItem(COMMENTS_KEY)
      if (!stored) return false

      const allComments: Comment[] = JSON.parse(stored)
      const comment = allComments.find(c => c.id === commentId)
      if (comment) {
        comment.likes += 1
        localStorage.setItem(COMMENTS_KEY, JSON.stringify(allComments))
        loadComments()
        return true
      }
      return false
    } catch (err) {
      console.error('Error liking comment:', err)
      return false
    }
  }

  return { comments, addComment, likeComment, refresh: loadComments }
}

export function useTokenLikes(tokenAddress: string, userAddress?: string) {
  const [isLiked, setIsLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(0)

  useEffect(() => {
    loadLikes()
  }, [tokenAddress, userAddress])

  const loadLikes = () => {
    try {
      const stored = localStorage.getItem(LIKES_KEY)
      if (stored) {
        const allLikes: TokenLike[] = JSON.parse(stored)
        const tokenLikes = allLikes.filter(l => l.tokenAddress.toLowerCase() === tokenAddress.toLowerCase())
        setLikeCount(tokenLikes.length)

        if (userAddress) {
          const userLike = tokenLikes.some(l => l.userAddress.toLowerCase() === userAddress.toLowerCase())
          setIsLiked(userLike)
        }
      }
    } catch (err) {
      console.error('Error loading likes:', err)
    }
  }

  const toggleLike = () => {
    if (!userAddress) return false

    try {
      const stored = localStorage.getItem(LIKES_KEY)
      let allLikes: TokenLike[] = stored ? JSON.parse(stored) : []

      const existingIndex = allLikes.findIndex(
        l => l.tokenAddress.toLowerCase() === tokenAddress.toLowerCase() &&
             l.userAddress.toLowerCase() === userAddress.toLowerCase()
      )

      if (existingIndex >= 0) {
        // Unlike
        allLikes.splice(existingIndex, 1)
      } else {
        // Like
        allLikes.push({
          tokenAddress,
          userAddress,
          timestamp: Date.now(),
        })
      }

      localStorage.setItem(LIKES_KEY, JSON.stringify(allLikes))
      loadLikes()
      return true
    } catch (err) {
      console.error('Error toggling like:', err)
      return false
    }
  }

  return { isLiked, likeCount, toggleLike, refresh: loadLikes }
}

export function getFavoriteTokens(userAddress: string): string[] {
  try {
    const stored = localStorage.getItem(LIKES_KEY)
    if (!stored) return []

    const allLikes: TokenLike[] = JSON.parse(stored)
    const userLikes = allLikes
      .filter(l => l.userAddress.toLowerCase() === userAddress.toLowerCase())
      .sort((a, b) => b.timestamp - a.timestamp)
      .map(l => l.tokenAddress)

    return userLikes
  } catch (err) {
    console.error('Error getting favorites:', err)
    return []
  }
}

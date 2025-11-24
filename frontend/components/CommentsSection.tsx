'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import { useAccount } from 'wagmi'
import { useRouter } from 'next/navigation'
import { Pagination } from './Pagination'
import { ClickableWalletAddress } from './ClickableAddress'
import toast from 'react-hot-toast'
import Image from 'next/image'
import * as commentsAPI from '@/lib/api/comments'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://pumpbnb-backend.onrender.com'

// Helper function to convert IPFS URLs to gateway URLs
const getImageUrl = (url: string | undefined): string => {
  if (!url) return ''

  // If it's an IPFS path, convert to gateway URL
  if (url.startsWith('ipfs://')) {
    return url.replace('ipfs://', 'https://gateway.pinata.cloud/ipfs/')
  }

  // If it's just an IPFS hash (starts with Qm or bafy)
  if (url.startsWith('Qm') || url.startsWith('bafy')) {
    return `https://gateway.pinata.cloud/ipfs/${url}`
  }

  // If URL doesn't have a protocol, assume it needs https://
  if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('data:')) {
    return `https://gateway.pinata.cloud/ipfs/${url}`
  }

  return url
}

interface UserProfile {
  profileImage?: string
  username?: string
}

interface CommentsSectionProps {
  tokenAddress: string
}

export function CommentsSection({ tokenAddress }: CommentsSectionProps) {
  const router = useRouter()
  const { address, isConnected } = useAccount()
  const [comments, setComments] = useState<commentsAPI.Comment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [newComment, setNewComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest')
  const [userProfiles, setUserProfiles] = useState<Record<string, UserProfile>>({})
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const itemsPerPage = 20

  // Fetch comments from backend
  const fetchComments = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await commentsAPI.getTokenComments(tokenAddress, {
        sortBy: sortOrder,
        page: currentPage,
        limit: itemsPerPage,
        includeReplies: false,
      })

      setComments(response.data)
      setTotalPages(Math.ceil(response.pagination.total / itemsPerPage))
      setHasMore(response.pagination.hasMore)
    } catch (error) {
      console.error('Failed to fetch comments:', error)
      toast.error('Failed to load comments')
    } finally {
      setIsLoading(false)
    }
  }, [tokenAddress, sortOrder, currentPage])

  useEffect(() => {
    fetchComments()
  }, [fetchComments])

  // Fetch user profiles for comment authors
  useEffect(() => {
    const fetchProfiles = async () => {
      const uniqueAuthors = [...new Set(comments.map(c => c.userAddress))]
      const newProfiles: Record<string, UserProfile> = {}

      for (const author of uniqueAuthors) {
        // Skip if already fetched
        if (userProfiles[author.toLowerCase()]) continue

        try {
          const res = await fetch(`${API_URL}/api/profile/${author}`)
          const data = await res.json()

          if (data.success && data.data.user) {
            newProfiles[author.toLowerCase()] = {
              profileImage: data.data.user.profileImage,
              username: data.data.user.username
            }
          }
        } catch (error) {
          console.error(`Failed to fetch profile for ${author}:`, error)
        }
      }

      if (Object.keys(newProfiles).length > 0) {
        setUserProfiles(prev => ({ ...prev, ...newProfiles }))
      }
    }

    if (comments.length > 0) {
      fetchProfiles()
    }
  }, [comments])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim() || !isConnected || !address) {
      toast.error('Please connect wallet and enter a comment')
      return
    }

    try {
      setIsSubmitting(true)
      await commentsAPI.createComment(tokenAddress, address, newComment.trim())
      toast.success('Comment posted!')
      setNewComment('')
      // Refresh comments after posting
      await fetchComments()
    } catch (error) {
      console.error('Failed to post comment:', error)
      toast.error('Failed to post comment')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleLike = async (commentId: string) => {
    if (!isConnected || !address) {
      toast.error('Please connect wallet to like comments')
      return
    }

    try {
      await commentsAPI.likeComment(commentId, address)
      toast.success('Liked!')
      // Refresh comments to get updated like count
      await fetchComments()
    } catch (error) {
      console.error('Failed to like comment:', error)
      toast.error('Failed to like comment')
    }
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000)
    if (seconds < 60) return `${seconds}s ago`
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
    return `${Math.floor(seconds / 86400)}d ago`
  }

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 8)}...${addr.slice(-4)}`
  }

  const handleProfileClick = (userAddress: string) => {
    router.push(`/profile/${userAddress}`)
  }

  return (
    <div className="space-y-4">
      {/* Comment Input - Long textbox */}
      <div className="mb-6">
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Add a comment..."
          rows={3}
          className="w-full px-4 py-3 bg-secondary rounded-lg border border-gray-700 focus:border-primary focus:outline-none resize-none text-sm placeholder-gray-400"
          maxLength={1000}
          disabled={!isConnected}
        />
        {isConnected ? (
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-gray-500">
              {newComment.length}/1000
            </span>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !newComment.trim()}
              className="bg-primary text-black px-4 py-2 rounded-lg font-medium hover:bg-primary/90 transition disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {isSubmitting ? 'Posting...' : 'Post'}
            </button>
          </div>
        ) : (
          <p className="text-xs text-gray-500 mt-2">Connect wallet to comment</p>
        )}
      </div>

      {/* Sort Button */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-gray-400">
          {comments.length} comment{comments.length !== 1 ? 's' : ''}
        </span>
        <button
          onClick={() => {
            setSortOrder(sortOrder === 'newest' ? 'oldest' : 'newest')
            setCurrentPage(1) // Reset to first page when changing sort
          }}
          className="text-sm text-gray-400 hover:text-white transition flex items-center gap-1"
        >
          Sort: {sortOrder === 'newest' ? 'Newest' : 'Oldest'}
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
          </svg>
        </button>
      </div>

      {/* Comments List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="mt-2 text-gray-400">Loading comments...</p>
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-400">No comments yet</p>
            <p className="text-sm text-gray-500 mt-1">Be the first to share your thoughts!</p>
          </div>
        ) : (
          comments.map((comment) => {
            const userProfile = userProfiles[comment.userAddress.toLowerCase()]

            return (
              <div key={comment.id} className="border-b border-gray-800 pb-4 last:border-b-0">
                {/* Comment Header */}
                <div className="flex items-center gap-3 mb-2">
                  {/* User Avatar - Show profile image if available */}
                  <div
                    className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center cursor-pointer hover:opacity-80 transition overflow-hidden"
                    onClick={() => handleProfileClick(comment.userAddress)}
                  >
                    {userProfile?.profileImage ? (
                      <Image
                        src={getImageUrl(userProfile.profileImage)}
                        alt={userProfile.username || 'User'}
                        width={32}
                        height={32}
                        className="w-full h-full object-cover"
                        unoptimized
                      />
                    ) : (
                      <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>

                  {/* User Info */}
                  <div className="flex items-center gap-2">
                    <span
                      className="font-mono text-sm text-gray-300 hover:text-primary cursor-pointer transition"
                      onClick={() => handleProfileClick(comment.userAddress)}
                    >
                      {userProfile?.username || formatAddress(comment.userAddress)}
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatTime(comment.createdAt)}
                    </span>
                  </div>
                </div>

                {/* Comment Content */}
                <p className="text-sm text-gray-200 mb-3 pl-11">
                  {comment.content}
                </p>

                {/* Comment Actions */}
                <div className="flex items-center gap-4 pl-11">
                  <button
                    onClick={() => handleLike(comment.id)}
                    disabled={!isConnected}
                    className="text-xs text-gray-400 hover:text-primary transition disabled:opacity-50"
                  >
                    Reply
                  </button>
                  <button
                    onClick={() => handleLike(comment.id)}
                    disabled={!isConnected}
                    className="flex items-center gap-1 text-xs text-gray-400 hover:text-primary transition disabled:opacity-50"
                  >
                    <span>👍</span>
                    <span>{comment.likes || 0}</span>
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Pagination */}
      {!isLoading && comments.length > 0 && totalPages > 1 && (
        <div className="mt-4 pt-4 border-t border-gray-700">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={comments.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={() => {}} // Fixed items per page
            itemsPerPageOptions={[itemsPerPage]}
            isLoading={isLoading}
          />
        </div>
      )}
    </div>
  )
}

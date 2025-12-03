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

// Single Comment Component with reply support
function CommentItem({
  comment,
  tokenAddress,
  userProfile,
  isConnected,
  address,
  onLike,
  onReplySubmit,
  onProfileClick,
  formatTime,
  formatAddress,
  userProfiles,
  depth = 0,
}: {
  comment: commentsAPI.Comment
  tokenAddress: string
  userProfile?: UserProfile
  isConnected: boolean
  address?: string
  onLike: (commentId: string) => void
  onReplySubmit: (parentId: string, content: string) => Promise<void>
  onProfileClick: (address: string) => void
  formatTime: (timestamp: string) => string
  formatAddress: (addr: string) => string
  userProfiles: Record<string, UserProfile>
  depth?: number
}) {
  const [showReplyForm, setShowReplyForm] = useState(false)
  const [replyContent, setReplyContent] = useState('')
  const [isSubmittingReply, setIsSubmittingReply] = useState(false)
  const [replies, setReplies] = useState<commentsAPI.Comment[]>([])
  const [showReplies, setShowReplies] = useState(false)
  const [isLoadingReplies, setIsLoadingReplies] = useState(false)
  const [replyCount, setReplyCount] = useState(0)

  // Fetch reply count on mount
  useEffect(() => {
    const fetchReplyCount = async () => {
      try {
        const replyData = await commentsAPI.getCommentReplies(tokenAddress, comment.id)
        setReplyCount(replyData.length)
      } catch (error) {
        console.error('Failed to fetch reply count:', error)
      }
    }
    fetchReplyCount()
  }, [tokenAddress, comment.id])

  const handleToggleReplies = async () => {
    if (!showReplies && replies.length === 0) {
      setIsLoadingReplies(true)
      try {
        const replyData = await commentsAPI.getCommentReplies(tokenAddress, comment.id)
        setReplies(replyData)
        setReplyCount(replyData.length)
      } catch (error) {
        console.error('Failed to fetch replies:', error)
        toast.error('Failed to load replies')
      } finally {
        setIsLoadingReplies(false)
      }
    }
    setShowReplies(!showReplies)
  }

  const handleReplySubmit = async () => {
    if (!replyContent.trim()) return

    setIsSubmittingReply(true)
    try {
      await onReplySubmit(comment.id, replyContent.trim())
      setReplyContent('')
      setShowReplyForm(false)
      // Refresh replies
      const replyData = await commentsAPI.getCommentReplies(tokenAddress, comment.id)
      setReplies(replyData)
      setReplyCount(replyData.length)
      setShowReplies(true)
    } catch (error) {
      console.error('Failed to post reply:', error)
    } finally {
      setIsSubmittingReply(false)
    }
  }

  const maxDepth = 3 // Maximum nesting depth

  return (
    <div className={`${depth > 0 ? 'ml-6 border-l border-gray-700/50 pl-3' : ''}`} style={{ fontFamily: 'sans-serif', WebkitFontSmoothing: 'antialiased' }}>
      <div className="pb-4 last:border-b-0">
        {/* Comment Header */}
        <div className="flex items-start gap-2.5 mb-1.5">
          {/* User Avatar */}
          <div
            className="w-7 h-7 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center cursor-pointer hover:opacity-80 transition overflow-hidden flex-shrink-0 ring-1 ring-primary/20"
            onClick={() => onProfileClick(comment.userAddress)}
          >
            {userProfile?.profileImage ? (
              <Image
                src={getImageUrl(userProfile.profileImage)}
                alt={userProfile.username || 'User'}
                width={28}
                height={28}
                className="w-full h-full object-cover"
                unoptimized
              />
            ) : (
              <svg className="w-4 h-4 text-primary/60" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
            )}
          </div>

          {/* User Info & Comment Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-0.5">
              <span
                className="text-sm font-medium text-gray-200 hover:text-primary cursor-pointer transition"
                onClick={() => onProfileClick(comment.userAddress)}
                style={{ fontSize: '14px' }}
              >
                {userProfile?.username || formatAddress(comment.userAddress)}
              </span>
              <span className="text-xs text-gray-500" style={{ fontSize: '12px' }}>
                {formatTime(comment.createdAt)}
              </span>
            </div>

            {/* Comment Content - inline with header */}
            <p className="text-gray-300 break-words leading-relaxed" style={{ fontSize: '14px' }}>
              {comment.content}
            </p>

            {/* Comment Actions */}
            <div className="flex items-center gap-3 mt-2">
              {depth < maxDepth && (
                <button
                  onClick={() => setShowReplyForm(!showReplyForm)}
                  disabled={!isConnected}
                  className="text-xs text-gray-500 hover:text-primary transition disabled:opacity-50"
                  style={{ fontSize: '12px' }}
                >
                  reply
                </button>
              )}
              <button
                onClick={() => onLike(comment.id)}
                disabled={!isConnected}
                className="flex items-center gap-1 text-xs text-gray-500 hover:text-primary transition disabled:opacity-50"
                style={{ fontSize: '12px' }}
              >
                <span>👍</span>
                <span>{comment.likes || 0}</span>
              </button>
              {replyCount > 0 && (
                <button
                  onClick={handleToggleReplies}
                  className="text-xs text-primary/80 hover:text-primary transition flex items-center gap-1"
                  style={{ fontSize: '12px' }}
                >
                  {isLoadingReplies ? (
                    <span className="animate-pulse">Loading...</span>
                  ) : (
                    <>
                      <svg
                        className={`w-3 h-3 transition-transform ${showReplies ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                      <span>{replyCount} {replyCount === 1 ? 'reply' : 'replies'}</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Reply Form */}
        {showReplyForm && isConnected && (
          <div className="mt-3 pl-11">
            <textarea
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder={`Reply to ${userProfile?.username || formatAddress(comment.userAddress)}...`}
              rows={2}
              className="w-full px-3 py-2 bg-secondary rounded-lg border border-gray-700 focus:border-primary focus:outline-none resize-none text-sm placeholder-gray-400"
              maxLength={500}
            />
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-gray-500">{replyContent.length}/500</span>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShowReplyForm(false)
                    setReplyContent('')
                  }}
                  className="text-xs text-gray-400 hover:text-white transition px-3 py-1"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReplySubmit}
                  disabled={isSubmittingReply || !replyContent.trim()}
                  className="bg-primary text-black px-3 py-1 rounded text-xs font-medium hover:bg-primary/90 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmittingReply ? 'Posting...' : 'Reply'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Nested Replies */}
        {showReplies && replies.length > 0 && (
          <div className="mt-4 space-y-4">
            {replies.map((reply) => (
              <CommentItem
                key={reply.id}
                comment={reply}
                tokenAddress={tokenAddress}
                userProfile={userProfiles[reply.userAddress.toLowerCase()]}
                isConnected={isConnected}
                address={address}
                onLike={onLike}
                onReplySubmit={onReplySubmit}
                onProfileClick={onProfileClick}
                formatTime={formatTime}
                formatAddress={formatAddress}
                userProfiles={userProfiles}
                depth={depth + 1}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
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

      // Filter out replies (only show top-level comments)
      const topLevelComments = response.data.filter(c => !c.replyTo)
      setComments(topLevelComments)
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

  const handleReplySubmit = async (parentId: string, content: string) => {
    if (!isConnected || !address) {
      toast.error('Please connect wallet to reply')
      return
    }

    try {
      await commentsAPI.createComment(tokenAddress, address, content, parentId)
      toast.success('Reply posted!')
    } catch (error) {
      console.error('Failed to post reply:', error)
      toast.error('Failed to post reply')
      throw error
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
    <div className="space-y-3" style={{ fontFamily: 'sans-serif', WebkitFontSmoothing: 'antialiased' }}>
      {/* Comment Input - Compact pump.fun style */}
      <div className="mb-4">
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Add a comment..."
          rows={2}
          className="w-full px-3 py-2.5 bg-secondary/50 rounded-lg border border-gray-700/50 focus:border-primary/50 focus:outline-none resize-none placeholder-gray-500 transition"
          style={{ fontSize: '14px' }}
          maxLength={1000}
          disabled={!isConnected}
        />
        {isConnected ? (
          <div className="flex items-center justify-between mt-2">
            <span className="text-gray-500" style={{ fontSize: '12px' }}>
              {newComment.length}/1000
            </span>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !newComment.trim()}
              className="bg-primary text-black px-3 py-1.5 rounded-md font-medium hover:bg-primary/90 transition disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ fontSize: '13px' }}
            >
              {isSubmitting ? 'Posting...' : 'Post'}
            </button>
          </div>
        ) : (
          <p className="text-gray-500 mt-2" style={{ fontSize: '12px' }}>Connect wallet to comment</p>
        )}
      </div>

      {/* Sort Button */}
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-700/30">
        <span className="text-gray-400" style={{ fontSize: '13px' }}>
          {comments.length} comment{comments.length !== 1 ? 's' : ''}
        </span>
        <button
          onClick={() => {
            setSortOrder(sortOrder === 'newest' ? 'oldest' : 'newest')
            setCurrentPage(1) // Reset to first page when changing sort
          }}
          className="text-gray-400 hover:text-white transition flex items-center gap-1"
          style={{ fontSize: '13px' }}
        >
          {sortOrder === 'newest' ? 'Newest' : 'Oldest'}
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
          </svg>
        </button>
      </div>

      {/* Comments List */}
      <div className="space-y-3">
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
              <CommentItem
                key={comment.id}
                comment={comment}
                tokenAddress={tokenAddress}
                userProfile={userProfile}
                isConnected={isConnected}
                address={address}
                onLike={handleLike}
                onReplySubmit={handleReplySubmit}
                onProfileClick={handleProfileClick}
                formatTime={formatTime}
                formatAddress={formatAddress}
                userProfiles={userProfiles}
              />
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

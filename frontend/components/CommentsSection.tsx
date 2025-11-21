'use client'

import { useState, useMemo, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { useRouter } from 'next/navigation'
import { useComments } from '@/lib/hooks/useSocialFeatures'
import { Pagination } from './Pagination'
import { ClickableWalletAddress } from './ClickableAddress'
import toast from 'react-hot-toast'
import Image from 'next/image'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://pumpbnb-backend.onrender.com'

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
  const { comments, addComment, likeComment } = useComments(tokenAddress)
  const [newComment, setNewComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest')
  const [userProfiles, setUserProfiles] = useState<Record<string, UserProfile>>({})

  // Fetch user profiles for comment authors
  useEffect(() => {
    const fetchProfiles = async () => {
      const uniqueAuthors = [...new Set(comments.map(c => c.author))]
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

    setIsSubmitting(true)
    const success = addComment(address, newComment.trim())

    if (success) {
      toast.success('Comment posted!')
      setNewComment('')
    } else {
      toast.error('Failed to post comment')
    }
    setIsSubmitting(false)
  }

  const handleLike = (commentId: string) => {
    const success = likeComment(commentId)
    if (success) {
      toast.success('Liked!')
    }
  }

  const formatTime = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000)
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

  // Sort comments based on selected order
  const sortedComments = useMemo(() => {
    const sorted = [...comments]
    if (sortOrder === 'newest') {
      return sorted.sort((a, b) => b.timestamp - a.timestamp)
    } else {
      return sorted.sort((a, b) => a.timestamp - b.timestamp)
    }
  }, [comments, sortOrder])

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
          maxLength={500}
          disabled={!isConnected}
        />
        {isConnected ? (
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-gray-500">
              {newComment.length}/500
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
          onClick={() => setSortOrder(sortOrder === 'newest' ? 'oldest' : 'newest')}
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
        {comments.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-400">No comments yet</p>
            <p className="text-sm text-gray-500 mt-1">Be the first to share your thoughts!</p>
          </div>
        ) : (
          sortedComments.map((comment) => {
            const userProfile = userProfiles[comment.author.toLowerCase()]

            return (
              <div key={comment.id} className="border-b border-gray-800 pb-4 last:border-b-0">
                {/* Comment Header */}
                <div className="flex items-center gap-3 mb-2">
                  {/* User Avatar - Show profile image if available */}
                  <div
                    className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center cursor-pointer hover:opacity-80 transition overflow-hidden"
                    onClick={() => handleProfileClick(comment.author)}
                  >
                    {userProfile?.profileImage ? (
                      <Image
                        src={userProfile.profileImage}
                        alt={userProfile.username || 'User'}
                        width={32}
                        height={32}
                        className="w-full h-full object-cover"
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
                      onClick={() => handleProfileClick(comment.author)}
                    >
                      {userProfile?.username || formatAddress(comment.author)}
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatTime(comment.timestamp)}
                    </span>
                  </div>
                </div>
              
              {/* Comment Content */}
              <p className="text-sm text-gray-200 mb-3 pl-11">
                {comment.content}
              </p>
              
              {/* Comment Actions */}
              <div className="flex items-center gap-4 pl-11">
                <button className="text-xs text-gray-400 hover:text-primary transition">
                  Reply
                </button>
                <span className="text-xs text-gray-500">
                  {comment.likes || 0}
                </span>
              </div>
            </div>
            )
          })
        )}
      </div>
    </div>
  )
}

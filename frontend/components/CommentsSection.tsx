'use client'

import { useState } from 'react'
import { useAccount } from 'wagmi'
import { useComments } from '@/lib/hooks/useSocialFeatures'
import toast from 'react-hot-toast'

interface CommentsSectionProps {
  tokenAddress: string
}

export function CommentsSection({ tokenAddress }: CommentsSectionProps) {
  const { address, isConnected } = useAccount()
  const { comments, addComment, likeComment } = useComments(tokenAddress)
  const [newComment, setNewComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

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
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  return (
    <div className="bg-secondary-light rounded-xl p-6">
      <h2 className="text-xl font-bold mb-6">
        Comments ({comments.length})
      </h2>

      {/* Comment Form */}
      {isConnected ? (
        <form onSubmit={handleSubmit} className="mb-6">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Share your thoughts..."
            rows={3}
            className="w-full px-4 py-3 bg-secondary rounded-lg border border-gray-700 focus:border-primary focus:outline-none resize-none"
            maxLength={500}
          />
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-gray-400">
              {newComment.length}/500 characters
            </span>
            <button
              type="submit"
              disabled={isSubmitting || !newComment.trim()}
              className="bg-primary text-black px-6 py-2 rounded-lg font-semibold hover:bg-primary-dark transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Posting...' : 'Post Comment'}
            </button>
          </div>
        </form>
      ) : (
        <div className="bg-yellow-500/10 border border-yellow-500/50 rounded-lg p-4 mb-6">
          <p className="text-yellow-500 text-sm">Connect your wallet to post comments</p>
        </div>
      )}

      {/* Comments List */}
      <div className="space-y-4">
        {comments.length === 0 ? (
          <div className="text-center py-8">
            <svg className="w-12 h-12 text-gray-600 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p className="text-gray-400">No comments yet</p>
            <p className="text-sm text-gray-500 mt-1">Be the first to share your thoughts!</p>
          </div>
        ) : (
          comments.map((comment) => (
            <div
              key={comment.id}
              className="bg-secondary rounded-lg p-4 hover:bg-secondary-light transition"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center text-black font-bold text-sm">
                    {comment.author.slice(2, 4).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-mono text-sm text-gray-300">
                      {formatAddress(comment.author)}
                    </p>
                    <p className="text-xs text-gray-500">{formatTime(comment.timestamp)}</p>
                  </div>
                </div>
              </div>

              <p className="text-gray-200 mb-3 whitespace-pre-wrap">{comment.content}</p>

              <div className="flex items-center gap-4">
                <button
                  onClick={() => handleLike(comment.id)}
                  className="flex items-center gap-1 text-sm text-gray-400 hover:text-primary transition"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
                  </svg>
                  <span>{comment.likes}</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

'use client'

import { useAccount } from 'wagmi'
import { useTokenLikes } from '@/lib/hooks/useSocialFeatures'
import toast from 'react-hot-toast'

interface LikeButtonProps {
  tokenAddress: string
}

export function LikeButton({ tokenAddress }: LikeButtonProps) {
  const { address, isConnected } = useAccount()
  const { isLiked, toggleLike, isLoading } = useTokenLikes(tokenAddress, address)

  const handleClick = async () => {
    if (!isConnected) {
      toast.error('Connect wallet to add to favorites')
      return
    }

    const wasLiked = isLiked
    const success = await toggleLike()
    if (success) {
      toast.success(wasLiked ? 'Removed from favorites' : 'Added to favorites!')
    } else {
      toast.error('Failed to update favorites')
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={isLoading}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition disabled:opacity-50 ${
        isLiked
          ? 'bg-red-500/20 text-red-500 hover:bg-red-500/30'
          : 'bg-secondary text-gray-400 hover:text-red-500 hover:bg-secondary-light'
      }`}
    >
      <svg
        className={`w-5 h-5 ${isLiked ? 'fill-current' : 'stroke-current fill-none'}`}
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
        />
      </svg>
      {isLoading ? (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : (
        <span>{isLiked ? 'Saved' : 'Save'}</span>
      )}
    </button>
  )
}

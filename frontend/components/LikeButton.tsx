'use client'

import { useAccount } from 'wagmi'
import { useTokenLikes } from '@/lib/hooks/useSocialFeatures'
import toast from 'react-hot-toast'

interface LikeButtonProps {
  tokenAddress: string
}

export function LikeButton({ tokenAddress }: LikeButtonProps) {
  const { address, isConnected } = useAccount()
  const { isLiked, likeCount, toggleLike } = useTokenLikes(tokenAddress, address)

  const handleClick = () => {
    if (!isConnected) {
      toast.error('Connect wallet to like tokens')
      return
    }

    const success = toggleLike()
    if (success) {
      toast.success(isLiked ? 'Removed from favorites' : 'Added to favorites!')
    }
  }

  return (
    <button
      onClick={handleClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition ${
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
      <span>{likeCount}</span>
    </button>
  )
}

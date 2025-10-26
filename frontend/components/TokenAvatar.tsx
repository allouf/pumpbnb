'use client'

import { useState } from 'react'
import { generateTokenAvatar, getIpfsUrl } from '@/lib/utils/ipfs'

interface TokenAvatarProps {
  symbol: string
  imageHash?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

export function TokenAvatar({ symbol, imageHash, size = 'md', className = '' }: TokenAvatarProps) {
  const [imageError, setImageError] = useState(false)
  const imageUrl = imageHash ? getIpfsUrl(imageHash) : null

  const sizeClasses = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-12 h-12 text-lg',
    lg: 'w-16 h-16 text-2xl',
    xl: 'w-24 h-24 text-4xl',
  }

  const gradientClass = generateTokenAvatar(symbol)

  // Show gradient avatar if no image or image failed to load
  if (!imageUrl || imageError) {
    return (
      <div
        className={`rounded-full bg-gradient-to-br ${gradientClass} flex items-center justify-center text-white font-bold ${sizeClasses[size]} ${className}`}
      >
        {symbol.slice(0, 2).toUpperCase()}
      </div>
    )
  }

  // Show image if available
  return (
    <div className={`rounded-full overflow-hidden ${sizeClasses[size]} ${className}`}>
      <img
        src={imageUrl}
        alt={symbol}
        className="w-full h-full object-cover"
        onError={() => setImageError(true)}
      />
    </div>
  )
}

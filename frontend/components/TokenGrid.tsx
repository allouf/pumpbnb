'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { TokenAvatar } from './TokenAvatar'
import { useUsdPrice, asterToUsd, formatUsdPrice } from '@/lib/hooks/useUsdPrice'
import { getIpfsUrl } from '@/lib/utils/ipfs'

interface TokenCardData {
  address: string
  name: string
  symbol: string
  description?: string
  imageUrl?: string
  marketCap: number
  volume24h: number
  priceChange24h: number
  currentPrice: number
  holders: number
  replies: number
  creator?: string
  createdAt: string
  isGraduated: boolean
}

interface TokenGridProps {
  tokens: TokenCardData[]
  isLoading?: boolean
  sortBy?: 'marketCap' | 'volume24h' | 'priceChange24h' | 'createdAt'
  sortOrder?: 'asc' | 'desc'
  showFilters?: boolean
}

export function TokenGrid({ 
  tokens, 
  isLoading = false, 
  sortBy = 'marketCap',
  sortOrder = 'desc',
  showFilters = true 
}: TokenGridProps) {
  const { usdRate } = useUsdPrice()
  const [currentSortBy, setCurrentSortBy] = useState(sortBy)
  const [currentSortOrder, setCurrentSortOrder] = useState(sortOrder)
  const [showUsd, setShowUsd] = useState(false)
  const [filter, setFilter] = useState<'all' | 'graduated' | 'active'>('all')

  // Sort tokens
  const sortedTokens = [...tokens].sort((a, b) => {
    let aValue: number, bValue: number
    
    switch (currentSortBy) {
      case 'marketCap':
        aValue = a.marketCap
        bValue = b.marketCap
        break
      case 'volume24h':
        aValue = a.volume24h
        bValue = b.volume24h
        break
      case 'priceChange24h':
        aValue = a.priceChange24h
        bValue = b.priceChange24h
        break
      case 'createdAt':
        aValue = new Date(a.createdAt).getTime()
        bValue = new Date(b.createdAt).getTime()
        break
      default:
        return 0
    }

    return currentSortOrder === 'asc' ? aValue - bValue : bValue - aValue
  })

  // Filter tokens
  const filteredTokens = sortedTokens.filter(token => {
    switch (filter) {
      case 'graduated':
        return token.isGraduated
      case 'active':
        return !token.isGraduated
      default:
        return true
    }
  })

  const handleSort = (newSortBy: typeof currentSortBy) => {
    if (currentSortBy === newSortBy) {
      setCurrentSortOrder(currentSortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setCurrentSortBy(newSortBy)
      setCurrentSortOrder('desc')
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        {showFilters && (
          <div className="bg-secondary-light rounded-xl p-4">
            <div className="h-8 bg-gray-700 rounded animate-pulse" />
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="bg-secondary-light rounded-xl p-4 animate-pulse">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-gray-700 rounded-full" />
                <div className="flex-1">
                  <div className="h-4 bg-gray-700 rounded mb-2" />
                  <div className="h-3 bg-gray-700 rounded w-2/3" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-3 bg-gray-700 rounded" />
                <div className="h-3 bg-gray-700 rounded w-3/4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      {showFilters && (
        <div className="bg-secondary-light rounded-xl p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Filter Tabs */}
            <div className="flex gap-2">
              {(['all', 'active', 'graduated'] as const).map((filterOption) => (
                <button
                  key={filterOption}
                  onClick={() => setFilter(filterOption)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                    filter === filterOption
                      ? 'bg-primary text-black'
                      : 'bg-secondary text-gray-400 hover:text-white hover:bg-gray-700'
                  }`}
                >
                  {filterOption === 'all' && `All (${tokens.length})`}
                  {filterOption === 'active' && `Active (${tokens.filter(t => !t.isGraduated).length})`}
                  {filterOption === 'graduated' && `Graduated (${tokens.filter(t => t.isGraduated).length})`}
                </button>
              ))}
            </div>

            {/* Sort Options */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowUsd(!showUsd)}
                className="px-3 py-2 text-xs bg-gray-800 hover:bg-gray-700 rounded-md transition"
              >
                {showUsd ? 'USD' : 'ASTER'}
              </button>
              
              <div className="flex gap-2">
                {[
                  { key: 'marketCap' as const, label: 'Market Cap' },
                  { key: 'volume24h' as const, label: '24h Vol' },
                  { key: 'priceChange24h' as const, label: '24h %' },
                  { key: 'createdAt' as const, label: 'Newest' },
                ].map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => handleSort(key)}
                    className={`px-3 py-2 rounded-md text-xs font-medium transition flex items-center gap-1 ${
                      currentSortBy === key
                        ? 'bg-primary text-black'
                        : 'bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700'
                    }`}
                  >
                    {label}
                    {currentSortBy === key && (
                      <span className="text-xs">
                        {currentSortOrder === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Token Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
        {filteredTokens.map((token) => (
          <TokenCard
            key={token.address}
            token={token}
            showUsd={showUsd}
            usdRate={usdRate}
          />
        ))}
      </div>

      {filteredTokens.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-xl font-semibold text-gray-300 mb-2">No tokens found</h3>
          <p className="text-gray-500">Try adjusting your filters</p>
        </div>
      )}
    </div>
  )
}

interface TokenCardProps {
  token: TokenCardData
  showUsd: boolean
  usdRate: number
}

function TokenCard({ token, showUsd, usdRate }: TokenCardProps) {
  const [imageError, setImageError] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  const marketCapDisplay = showUsd 
    ? formatUsdPrice(asterToUsd(token.marketCap, usdRate))
    : `${token.marketCap.toFixed(2)} ASTER`

  const volumeDisplay = showUsd
    ? formatUsdPrice(asterToUsd(token.volume24h, usdRate))
    : `${token.volume24h.toFixed(2)} ASTER`

  const priceDisplay = showUsd
    ? formatUsdPrice(asterToUsd(token.currentPrice, usdRate))
    : token.currentPrice.toFixed(8)

  return (
    <Link href={`/token/${token.address}`}>
      <div 
        className={`bg-secondary-light rounded-xl p-4 border border-gray-800 hover:border-primary/50 transition-all duration-200 cursor-pointer group ${
          isHovered ? 'transform scale-[1.02] shadow-lg shadow-primary/10' : ''
        }`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Header */}
        <div className="flex items-center gap-3 mb-3">
          {token.imageUrl && !imageError ? (
            <img
              src={getIpfsUrl(token.imageUrl)}
              alt={token.name}
              className="w-12 h-12 rounded-full object-cover border-2 border-gray-700"
              onError={() => setImageError(true)}
            />
          ) : (
            <TokenAvatar symbol={token.symbol} size="lg" />
          )}
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-white truncate group-hover:text-primary transition-colors">
                {token.name}
              </h3>
              {token.isGraduated && (
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" title="Graduated to PancakeSwap" />
              )}
            </div>
            <p className="text-sm text-gray-400 truncate">${token.symbol}</p>
          </div>
        </div>

        {/* Description */}
        {token.description && (
          <p className="text-sm text-gray-300 mb-4 line-clamp-2 leading-relaxed">
            {token.description}
          </p>
        )}

        {/* Stats Grid */}
        <div className="space-y-3">
          {/* Market Cap & Price */}
          <div className="flex justify-between items-center">
            <div>
              <p className="text-xs text-gray-500">Market Cap</p>
              <p className="font-bold text-primary">{marketCapDisplay}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">Price</p>
              <p className="font-semibold text-white text-sm">{priceDisplay}</p>
            </div>
          </div>

          {/* Volume & Change */}
          <div className="flex justify-between items-center">
            <div>
              <p className="text-xs text-gray-500">24h Volume</p>
              <p className="font-semibold text-white text-sm">{volumeDisplay}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">24h Change</p>
              <p className={`font-bold text-sm ${
                token.priceChange24h >= 0 ? 'text-green-500' : 'text-red-500'
              }`}>
                {token.priceChange24h >= 0 ? '+' : ''}{token.priceChange24h.toFixed(2)}%
              </p>
            </div>
          </div>

          {/* Engagement Row */}
          <div className="flex justify-between items-center pt-2 border-t border-gray-800">
            <div className="flex items-center gap-3 text-xs text-gray-500">
              <div className="flex items-center gap-1">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
                {token.holders}
              </div>
              <div className="flex items-center gap-1">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                </svg>
                {token.replies}
              </div>
            </div>
            
            <div className="text-xs text-gray-500">
              {new Date(token.createdAt).toLocaleDateString()}
            </div>
          </div>
        </div>

        {/* Hover effect indicator */}
        <div className={`absolute inset-0 rounded-xl bg-primary/5 transition-opacity duration-200 pointer-events-none ${
          isHovered ? 'opacity-100' : 'opacity-0'
        }`} />
      </div>
    </Link>
  )
}

// Loading skeleton component
export function TokenGridSkeleton({ count = 12 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
      {[...Array(count)].map((_, i) => (
        <div key={i} className="bg-secondary-light rounded-xl p-4 animate-pulse">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 bg-gray-700 rounded-full" />
            <div className="flex-1">
              <div className="h-4 bg-gray-700 rounded mb-2" />
              <div className="h-3 bg-gray-700 rounded w-2/3" />
            </div>
          </div>
          <div className="space-y-2 mb-4">
            <div className="h-3 bg-gray-700 rounded" />
            <div className="h-3 bg-gray-700 rounded w-3/4" />
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <div className="h-8 bg-gray-700 rounded w-16" />
              <div className="h-8 bg-gray-700 rounded w-16" />
            </div>
            <div className="flex justify-between">
              <div className="h-6 bg-gray-700 rounded w-20" />
              <div className="h-6 bg-gray-700 rounded w-16" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
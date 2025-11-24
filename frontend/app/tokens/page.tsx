'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useTokenList } from '@/lib/hooks/useTokenList'
import { useWatchTokenCreated } from '@/lib/hooks/useTokenEvents'
import { useReadContract } from 'wagmi'
import { formatUnits } from 'viem'
import type { Abi } from 'viem'
import BondingCurveABIImport from '@/lib/abis/BondingCurve.json'

const BondingCurveABI = BondingCurveABIImport.abi as Abi
import { TokenAvatar } from '@/components/TokenAvatar'

function TokenCard({ token }: { token: any }) {
  // Read bonding curve reserves to get progress
  const { data: reserves } = useReadContract({
    address: token.bondingCurve as `0x${string}`,
    abi: BondingCurveABI,
    functionName: 'getReserves',
  })

  const reservesData = reserves as readonly [bigint, bigint] | undefined
  const asterReserves = reservesData ? reservesData[0] : BigInt(0)
  // Convert to ASTER and calculate progress percentage
  const asterAmount = Number(formatUnits(asterReserves, 18))
  const progress = asterAmount // Already out of 100, so this IS the percentage
  const marketCap = asterAmount.toFixed(2)

  return (
    <Link
      href={`/token/${token.address}`}
      className="bg-secondary-light p-4 sm:p-6 rounded-xl hover:bg-secondary-light/80 transition border border-gray-800 hover:border-primary/50 block"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 mb-4">
        <div className="flex items-center gap-2 sm:gap-3">
          {token.imageUrl ? (
            <img
              src={token.imageUrl.replace('ipfs://', 'https://ipfs.io/ipfs/')}
              alt={token.name}
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover"
            />
          ) : (
            <TokenAvatar symbol={token.symbol} size="md" />
          )}
          <div className="min-w-0">
            <h3 className="text-lg sm:text-xl font-bold truncate">{token.name}</h3>
            <p className="text-gray-400 text-sm">${token.symbol}</p>
          </div>
        </div>
        <div className="text-left sm:text-right">
          <div className="text-xl sm:text-2xl font-bold text-primary">{marketCap} ASTER</div>
          <p className="text-xs sm:text-sm text-gray-400">Market Cap</p>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-xs sm:text-sm">
          <span className="text-gray-400">Progress to Graduation</span>
          <span className="font-semibold">{progress.toFixed(1)}%</span>
        </div>
        <div className="w-full bg-secondary rounded-full h-2">
          <div
            className="bg-primary h-2 rounded-full transition-all"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-500">
          <span>0 ASTER</span>
          <span>100 ASTER</span>
        </div>
      </div>

      <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-700 flex flex-wrap items-center justify-between gap-2 text-xs sm:text-sm">
        <div>
          <span className="text-gray-400">Created by: </span>
          <span className="font-mono text-xs">{token.creator.slice(0, 6)}...{token.creator.slice(-4)}</span>
        </div>
        <div className="flex gap-2">
          <span className="bg-primary/10 text-primary px-2 sm:px-3 py-1 rounded-full text-xs font-semibold">
            Bonding Curve
          </span>
        </div>
      </div>
    </Link>
  )
}

export default function TokensPage() {
  const { tokens, isLoading, error } = useTokenList()
  const [allTokens, setAllTokens] = useState(tokens)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'recent' | 'marketcap'>('recent')

  // Update local state when tokens load
  useEffect(() => {
    setAllTokens(tokens)
  }, [tokens])

  // Watch for new tokens and add them to the list
  useWatchTokenCreated((event) => {
    const newToken = {
      address: event.token,
      bondingCurve: event.bondingCurve,
      creator: event.creator,
      name: event.name,
      symbol: event.symbol,
      timestamp: Number(event.timestamp),
      blockNumber: BigInt(0),
    }
    setAllTokens((prev) => [newToken, ...prev])
  })

  // Filter tokens by search query
  const filteredTokens = allTokens.filter((token) =>
    token.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    token.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
    token.address.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="min-h-screen py-6 sm:py-12">
      <div className="container mx-auto px-2 sm:px-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
          <div>
            <h1 className="text-2xl sm:text-4xl font-bold mb-1 sm:mb-2">Browse Tokens</h1>
            <p className="text-gray-400 text-sm sm:text-base">
              Discover and trade the latest meme coins on BNB Chain
            </p>
          </div>
          <Link
            href="/create"
            className="bg-primary text-black px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-bold hover:bg-primary-dark transition text-sm sm:text-base text-center"
          >
            Create Token
          </Link>
        </div>

        {/* Search and Filters */}
        <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row gap-2 sm:gap-4">
          <input
            type="text"
            placeholder="Search by name, symbol, or address..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 px-3 sm:px-4 py-2 sm:py-3 bg-secondary-light rounded-lg border border-gray-700 focus:border-primary focus:outline-none text-sm sm:text-base"
          />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 sm:px-4 py-2 sm:py-3 bg-secondary-light rounded-lg border border-gray-700 focus:border-primary focus:outline-none text-sm sm:text-base"
          >
            <option value="recent">Most Recent</option>
            <option value="marketcap">Market Cap</option>
          </select>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            <p className="mt-4 text-gray-400">Loading tokens...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 mb-6">
            <p className="text-red-500">Error loading tokens: {error.message}</p>
          </div>
        )}

        {/* Tokens Grid */}
        {!isLoading && filteredTokens.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {filteredTokens.map((token) => (
              <TokenCard key={token.address} token={token} />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && filteredTokens.length === 0 && !error && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🚀</div>
            <h3 className="text-xl font-semibold mb-2">
              {searchQuery ? 'No tokens found' : 'No tokens yet'}
            </h3>
            <p className="text-gray-400 mb-6">
              {searchQuery
                ? 'Try a different search term'
                : 'Be the first to create a token!'}
            </p>
            {!searchQuery && (
              <Link
                href="/create"
                className="inline-block bg-primary text-black px-8 py-3 rounded-lg font-bold hover:bg-primary-dark transition"
              >
                Create Token
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

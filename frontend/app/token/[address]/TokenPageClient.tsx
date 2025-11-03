'use client'

import { useState } from 'react'
import { useReadContract } from 'wagmi'
import { formatUnits } from 'viem'
import type { Abi } from 'viem'
import { CONTRACTS } from '@/lib/contracts'
import BondingCurveABIImport from '@/lib/abis/BondingCurve.json'
import PumpTokenABIImport from '@/lib/abis/PumpToken.json'
import TokenFactoryABIImport from '@/lib/abis/TokenFactory.json'

const BondingCurveABI = BondingCurveABIImport.abi as Abi
const PumpTokenABI = PumpTokenABIImport.abi as Abi
const TokenFactoryABI = TokenFactoryABIImport.abi as Abi

import { TokenAvatar } from '@/components/TokenAvatar'
import { AdvancedPriceChart } from '@/components/AdvancedPriceChart'
import { TradingPanel } from '@/components/TradingPanel'
import { CommentsSection } from '@/components/CommentsSection'
import { RecentTrades } from '@/components/RecentTrades'
import { TopHolders } from '@/components/TopHolders'
import { useTokenData } from '@/lib/hooks/useTokenData'
import { useWatchTradeEvents } from '@/lib/hooks/useTokenEvents'

type Tab = 'comments' | 'trades' | 'holders'

interface TokenPageClientProps {
  address: string
}

export function TokenPageClient({ address }: TokenPageClientProps) {
  const [activeTab, setActiveTab] = useState<Tab>('trades')
  const [isFavorite, setIsFavorite] = useState(false)

  // Fetch token data
  const { tokenData: apiData, isLoading: apiLoading, error: apiError } = useTokenData(address)

  // Blockchain fallback
  const { data: bondingCurveAddress, isLoading: loadingBC } = useReadContract({
    address: CONTRACTS.TokenFactory as `0x${string}`,
    abi: TokenFactoryABI,
    functionName: 'tokenToBondingCurve',
    args: [address],
    query: { enabled: !apiData },
  })

  const { data: tokenName } = useReadContract({
    address: address as `0x${string}`,
    abi: PumpTokenABI,
    functionName: 'name',
    query: { enabled: !apiData },
  })

  const { data: tokenSymbol } = useReadContract({
    address: address as `0x${string}`,
    abi: PumpTokenABI,
    functionName: 'symbol',
    query: { enabled: !apiData },
  })

  // Merge data
  const bondingCurve = apiData?.bondingCurve || (bondingCurveAddress as string | undefined)
  const name = apiData?.name || (tokenName as string | undefined)
  const symbol = apiData?.symbol || (tokenSymbol as string | undefined)
  const description = apiData?.description
  const imageUrl = apiData?.imageUrl
  const creator = apiData?.creator

  // Read bonding curve reserves
  const { data: reserves, refetch: refetchReserves } = useReadContract({
    address: bondingCurve as `0x${string}` | undefined,
    abi: BondingCurveABI,
    functionName: 'getReserves',
    query: {
      enabled: !!bondingCurve,
      refetchInterval: 10000,
    },
  })

  // Watch for trade events and immediately refetch reserves
  useWatchTradeEvents(
    bondingCurve || '',
    (event) => {
      console.log('[TokenPageClient] 🔄 Trade event detected, refetching reserves...', event)
      refetchReserves()
    }
  )

  const reservesData = reserves as readonly [bigint, bigint] | undefined
  const asterReserves = reservesData ? Number(formatUnits(reservesData[0], 18)) : 0
  const progress = (asterReserves / 100) * 100
  const marketCap = asterReserves.toFixed(2)

  // Share function
  const handleShare = () => {
    const url = window.location.href
    if (navigator.share) {
      navigator.share({
        title: `${name} ($${symbol})`,
        text: `Check out ${name} on ASTER FUN!`,
        url,
      })
    } else {
      navigator.clipboard.writeText(url)
      alert('Link copied to clipboard!')
    }
  }

  // Loading state
  if (apiLoading || loadingBC) {
    return (
      <div className="min-h-screen py-12 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary mb-4"></div>
          <p className="text-gray-400 text-lg">Loading token data...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (!bondingCurve || !name || !symbol) {
    return (
      <div className="min-h-screen py-12 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold mb-2">Token Not Found</h2>
          <p className="text-gray-400 mb-4">
            Unable to load token data.
          </p>
          <a
            href="/tokens"
            className="inline-block bg-primary text-black px-6 py-3 rounded-lg font-bold hover:bg-primary-dark transition"
          >
            Browse Tokens
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        {/* Token Header */}
        <div className="bg-secondary-light rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              {imageUrl ? (
                <img
                  src={imageUrl.replace('ipfs://', 'https://ipfs.io/ipfs/')}
                  alt={name}
                  className="w-20 h-20 rounded-full object-cover"
                />
              ) : (
                <TokenAvatar symbol={symbol} size="xl" />
              )}
              <div>
                <h1 className="text-4xl font-bold mb-1">{name}</h1>
                <p className="text-gray-400 text-xl">${symbol}</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleShare}
                className="px-4 py-2 bg-secondary hover:bg-secondary-light border border-gray-700 rounded-lg transition flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                Share
              </button>
              <button
                onClick={() => setIsFavorite(!isFavorite)}
                className={`px-4 py-2 rounded-lg transition flex items-center gap-2 ${
                  isFavorite
                    ? 'bg-primary text-black'
                    : 'bg-secondary hover:bg-secondary-light border border-gray-700'
                }`}
              >
                <svg className="w-5 h-5" fill={isFavorite ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                {isFavorite ? 'Favorited' : 'Favorite'}
              </button>
            </div>
          </div>

          {description && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2">About</h3>
              <p className="text-gray-300">{description}</p>
            </div>
          )}

          {creator && (
            <div className="mb-6 p-3 bg-secondary rounded-lg">
              <p className="text-sm text-gray-400 mb-1">Created by</p>
              <p className="text-sm font-mono text-primary break-all">{creator}</p>
            </div>
          )}

          {/* Stats Grid */}
          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-secondary p-4 rounded-lg">
              <p className="text-gray-400 text-sm mb-1">Market Cap</p>
              <p className="text-2xl font-bold text-primary">{marketCap} ASTER</p>
            </div>
            <div className="bg-secondary p-4 rounded-lg">
              <p className="text-gray-400 text-sm mb-1">Progress</p>
              <p className="text-2xl font-bold">{progress.toFixed(1)}%</p>
            </div>
            <div className="bg-secondary p-4 rounded-lg">
              <p className="text-gray-400 text-sm mb-1">Status</p>
              <p className="text-2xl font-bold text-green-500">
                {progress >= 100 ? 'Graduated' : 'Active'}
              </p>
            </div>
          </div>

          {/* Dual Progress Bars - Pump.fun Style */}
          <div className="mt-4 space-y-4">
            {/* Bonding Curve Progress */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-400 font-medium">🚀 Bonding Curve Progress</span>
                <span className="font-bold text-primary">{progress.toFixed(1)}%</span>
              </div>
              <div className="relative w-full bg-secondary rounded-full h-4 overflow-hidden shadow-inner">
                <div
                  className="absolute inset-0 bg-gradient-to-r from-primary via-yellow-400 to-green-500 h-4 transition-all duration-1000 ease-out"
                  style={{
                    width: `${Math.min(progress, 100)}%`,
                    boxShadow: progress >= 100
                      ? '0 0 20px rgba(34, 197, 94, 0.6)'
                      : '0 0 12px rgba(255, 215, 0, 0.4)'
                  }}
                >
                  {/* Animated sparkles for active progress */}
                  {progress > 5 && progress < 100 && (
                    <div className="absolute inset-0 overflow-hidden">
                      <div className="absolute top-1 left-1/4 w-1.5 h-1.5 bg-white rounded-full animate-ping"
                           style={{ animationDelay: '0s', animationDuration: '2s' }} />
                      <div className="absolute top-1.5 right-1/3 w-1 h-1 bg-white rounded-full animate-ping"
                           style={{ animationDelay: '0.7s', animationDuration: '2s' }} />
                      <div className="absolute top-1 left-1/2 w-0.5 h-0.5 bg-white rounded-full animate-ping"
                           style={{ animationDelay: '1.2s', animationDuration: '2s' }} />
                    </div>
                  )}
                  {/* Completion celebration effect */}
                  {progress >= 100 && (
                    <div className="absolute inset-0 animate-pulse">
                      <div className="w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>{asterReserves.toFixed(2)} ASTER</span>
                <span className="font-semibold">100 ASTER → PancakeSwap 🥞</span>
              </div>
            </div>

            {/* ATH Progress (All Time High) */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-400 font-medium">📈 Market Cap (ATH)</span>
                <span className="font-bold text-green-400">{marketCap} ASTER</span>
              </div>
              <div className="relative w-full bg-secondary rounded-full h-3 overflow-hidden shadow-inner">
                <div
                  className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 h-3 transition-all duration-1000 ease-out"
                  style={{
                    width: `${Math.min((asterReserves / Math.max(asterReserves, 1)) * 100, 100)}%`,
                    boxShadow: '0 0 10px rgba(168, 85, 247, 0.4)'
                  }}
                >
                  {/* Pulsing effect for ATH bar */}
                  <div className="absolute right-0 top-0 bottom-0 w-2 bg-white/40 animate-pulse"></div>
                </div>
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>Current: {asterReserves.toFixed(2)} ASTER</span>
                <span className="font-semibold text-green-400">ATH: {asterReserves.toFixed(2)} ASTER ⬆️</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid - 70/30 split like Pump.fun */}
        <div className="grid lg:grid-cols-10 gap-6">
          {/* Left Column - Chart + Tabs (70%) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Enhanced Price Chart */}
            {bondingCurve && (
              <div className="bg-gray-900 rounded-xl overflow-hidden">
                <AdvancedPriceChart
                  bondingCurveAddress={bondingCurve}
                  tokenSymbol={symbol}
                />
              </div>
            )}

            {/* Tabs */}
            <div className="bg-secondary-light rounded-xl overflow-hidden">
              {/* Tab Headers */}
              <div className="flex border-b border-gray-700">
                <button
                  onClick={() => setActiveTab('trades')}
                  className={`flex-1 px-6 py-4 font-semibold transition ${
                    activeTab === 'trades'
                      ? 'bg-secondary text-primary border-b-2 border-primary'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  🔄 Trades
                </button>
                <button
                  onClick={() => setActiveTab('holders')}
                  className={`flex-1 px-6 py-4 font-semibold transition ${
                    activeTab === 'holders'
                      ? 'bg-secondary text-primary border-b-2 border-primary'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  👥 Holders
                </button>
                <button
                  onClick={() => setActiveTab('comments')}
                  className={`flex-1 px-6 py-4 font-semibold transition ${
                    activeTab === 'comments'
                      ? 'bg-secondary text-primary border-b-2 border-primary'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  💬 Comments
                </button>
              </div>

              {/* Tab Content */}
              <div className="p-6">
                {activeTab === 'trades' && (
                  <RecentTrades tokenAddress={address} tokenSymbol={symbol} />
                )}

                {activeTab === 'holders' && (
                  <TopHolders tokenAddress={address} tokenSymbol={symbol} />
                )}

                {activeTab === 'comments' && (
                  <CommentsSection tokenAddress={address} />
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Trading Panel (30%) */}
          <div className="lg:col-span-3">
            <div className="sticky top-24">
              {bondingCurve ? (
                <TradingPanel
                  bondingCurveAddress={bondingCurve}
                  tokenSymbol={symbol}
                  tokenAddress={address}
                />
              ) : (
                <div className="bg-secondary-light p-6 rounded-xl">
                  <p className="text-gray-400 text-center">Loading trading panel...</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
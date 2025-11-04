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
        {/* Compact Token Header - Pump.fun Style */}
        <div className="bg-secondary-light rounded-xl p-4 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {imageUrl ? (
                <img
                  src={imageUrl.replace('ipfs://', 'https://ipfs.io/ipfs/')}
                  alt={name}
                  className="w-12 h-12 rounded-full object-cover"
                />
              ) : (
                <TokenAvatar symbol={symbol} size="lg" />
              )}
              <div>
                <h1 className="text-xl font-bold">{name}</h1>
                <p className="text-gray-400 text-sm">${symbol}</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <button
                onClick={handleShare}
                className="px-3 py-2 bg-secondary hover:bg-secondary-light border border-gray-700 rounded-lg transition flex items-center gap-2 text-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                Share
              </button>
              <button
                onClick={() => setIsFavorite(!isFavorite)}
                className={`px-3 py-2 rounded-lg transition flex items-center gap-2 text-sm ${
                  isFavorite
                    ? 'bg-primary text-black'
                    : 'bg-secondary hover:bg-secondary-light border border-gray-700'
                }`}
              >
                <svg className="w-4 h-4" fill={isFavorite ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* About Section - Separate if exists */}
        {description && (
          <div className="bg-secondary-light rounded-xl p-4 mb-4">
            <h3 className="text-sm font-semibold mb-2 text-gray-400">About</h3>
            <p className="text-sm text-gray-300">{description}</p>
          </div>
        )}

        {/* Creator Info - Compact */}
        {creator && (
          <div className="bg-secondary-light rounded-xl p-3 mb-4">
            <p className="text-xs text-gray-400 mb-1">Created by</p>
            <p className="text-xs font-mono text-primary break-all">{creator}</p>
          </div>
        )}

        {/* Main Content Grid - 70/30 split like Pump.fun */}
        <div className="grid lg:grid-cols-10 gap-6">
          {/* Left Column - Chart + Tabs (70%) */}
          <div className="lg:col-span-7 space-y-4">
            {/* Compact Market Cap Card - Above Chart */}
            <div className="bg-secondary-light rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-6">
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Market Cap</p>
                    <p className="text-lg font-bold text-primary">{marketCap} ASTER</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Progress</p>
                    <p className="text-lg font-bold">{progress.toFixed(1)}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Status</p>
                    <p className={`text-lg font-bold ${
                      progress >= 100 ? 'text-green-500' : 'text-yellow-500'
                    }`}>
                      {progress >= 100 ? '✓ Graduated' : '⚡ Active'}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Single Progress Bar */}
              <div className="space-y-2">
                <div className="relative w-full bg-secondary rounded-full h-3 overflow-hidden shadow-inner">
                  <div
                    className="absolute inset-0 bg-gradient-to-r from-primary via-yellow-400 to-green-500 h-3 transition-all duration-1000 ease-out"
                    style={{
                      width: `${Math.min(progress, 100)}%`,
                      boxShadow: progress >= 100
                        ? '0 0 20px rgba(34, 197, 94, 0.6)'
                        : '0 0 12px rgba(255, 215, 0, 0.4)'
                    }}
                  >
                    {progress > 5 && progress < 100 && (
                      <div className="absolute inset-0 overflow-hidden">
                        <div className="absolute top-0.5 left-1/4 w-1 h-1 bg-white rounded-full animate-ping"
                             style={{ animationDelay: '0s', animationDuration: '2s' }} />
                        <div className="absolute top-0.5 right-1/3 w-0.5 h-0.5 bg-white rounded-full animate-ping"
                             style={{ animationDelay: '0.7s', animationDuration: '2s' }} />
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>{asterReserves.toFixed(2)} ASTER</span>
                  <span className="font-semibold">100 ASTER to graduate</span>
                </div>
              </div>
            </div>
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
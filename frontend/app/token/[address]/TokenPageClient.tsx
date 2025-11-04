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
    <div className="min-h-screen py-6">
      <div className="container mx-auto px-4">
        {/* Back button */}
        <button
          onClick={() => window.history.back()}
          className="mb-4 text-gray-400 hover:text-white transition flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back
        </button>

        {/* Single Token Info Card - Pump.fun Style */}
        <div className="bg-secondary-light rounded-xl p-5 mb-4">
          <div className="flex items-start gap-4">
            {/* Token Image */}
            <div className="flex-shrink-0">
              {imageUrl ? (
                <img
                  src={imageUrl.replace('ipfs://', 'https://ipfs.io/ipfs/')}
                  alt={name}
                  className="w-16 h-16 rounded-lg object-cover border-2 border-gray-700"
                />
              ) : (
                <TokenAvatar symbol={symbol} size="xl" />
              )}
            </div>

            {/* Token Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h1 className="text-2xl font-bold mb-1">{name}</h1>
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <span className="font-medium">${symbol}</span>
                    <span>•</span>
                    <span className="font-mono text-xs truncate max-w-[200px]" title={address}>
                      {address.slice(0, 6)}...{address.slice(-4)}
                    </span>
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={handleShare}
                    className="px-4 py-2 bg-primary text-black hover:bg-primary/90 rounded-lg transition font-medium text-sm"
                  >
                    Share
                  </button>
                  <button
                    onClick={() => setIsFavorite(!isFavorite)}
                    className={`p-2 rounded-lg transition ${
                      isFavorite ? 'bg-primary text-black' : 'bg-secondary hover:bg-secondary-light border border-gray-700'
                    }`}
                  >
                    <svg className="w-5 h-5" fill={isFavorite ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Meta info row */}
              <div className="flex items-center gap-4 text-xs text-gray-400 mb-3">
                {creator && (
                  <div className="flex items-center gap-1">
                    <span>Created by</span>
                    <span className="font-mono text-primary">
                      {creator.slice(0, 6)}...{creator.slice(-4)}
                    </span>
                  </div>
                )}
                <span>•</span>
                <span>2h ago</span>
              </div>

              {/* Description */}
              {description && (
                <p className="text-sm text-gray-300 line-clamp-2 mb-3">{description}</p>
              )}
            </div>
          </div>
        </div>

        {/* Market Cap Card - Separate from chart */}
        <div className="bg-secondary-light rounded-xl p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm text-gray-400 mb-1">Market Cap</p>
              <p className="text-2xl font-bold text-primary">${marketCap}</p>
              <p className="text-xs text-green-500">+{progress >= 100 ? '100' : progress.toFixed(1)}% (+$2.9K) 24hr</p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-400 mb-1">ATH: <span className="text-primary font-bold">${marketCap}</span></div>
            </div>
          </div>
        </div>

        {/* Main Content Grid - 70/30 split */}
        <div className="grid lg:grid-cols-10 gap-6">
          {/* Left Column - Chart + Tabs (70%) */}
          <div className="lg:col-span-7 space-y-4">
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
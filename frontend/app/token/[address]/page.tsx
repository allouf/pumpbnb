'use client'

import { use, useState } from 'react'
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

type Tab = 'comments' | 'trades' | 'holders'

export default function CompleteTokenPage({ params }: { params: Promise<{ address: string }> }) {
  const { address } = use(params)
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
  const { data: reserves } = useReadContract({
    address: bondingCurve as `0x${string}` | undefined,
    abi: BondingCurveABI,
    functionName: 'getReserves',
    query: {
      enabled: !!bondingCurve,
      refetchInterval: 10000,
    },
  })

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

          {/* Progress Bar */}
          <div className="mt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Progress to PancakeSwap</span>
              <span className="font-semibold">{progress.toFixed(2)}%</span>
            </div>
            <div className="w-full bg-secondary rounded-full h-3">
              <div
                className="bg-gradient-to-r from-primary to-green-500 h-3 rounded-full transition-all"
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>0 ASTER</span>
              <span>100 ASTER (Graduation)</span>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Chart + Tabs */}
          <div className="lg:col-span-2 space-y-6">
            {/* Advanced Price Chart */}
            {bondingCurve && (
              <AdvancedPriceChart
                bondingCurveAddress={bondingCurve}
                tokenSymbol={symbol}
              />
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

          {/* Right Column - Trading Panel */}
          <div className="lg:col-span-1">
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

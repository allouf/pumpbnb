'use client'

import { use } from 'react'
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
import { PriceChart } from '@/components/PriceChart'
import { TradingPanel } from '@/components/TradingPanel'
import { LikeButton } from '@/components/LikeButton'
import { CommentsSection } from '@/components/CommentsSection'
import { useTokenData } from '@/lib/hooks/useTokenData'

export default function TokenPage({ params }: { params: Promise<{ address: string }> }) {
  // Unwrap params Promise using React's use() hook (Next.js 15+)
  const { address } = use(params)

  console.log('=== TOKEN PAGE LOADED ===')
  console.log('Token Address:', address)

  // Strategy: Try backend API first (fast + metadata), fallback to blockchain
  const { tokenData: apiData, isLoading: apiLoading, error: apiError } = useTokenData(address)

  // Blockchain fallback - only used if API fails or returns no data
  const { data: bondingCurveAddress, isLoading: loadingBC, error: errorBC } = useReadContract({
    address: CONTRACTS.TokenFactory as `0x${string}`,
    abi: TokenFactoryABI,
    functionName: 'tokenToBondingCurve',
    args: [address],
    query: {
      enabled: !apiData, // Only query blockchain if API data not available
    },
  })

  const { data: tokenName, isLoading: loadingName, error: errorName } = useReadContract({
    address: address as `0x${string}`,
    abi: PumpTokenABI,
    functionName: 'name',
    query: {
      enabled: !apiData, // Only query blockchain if API data not available
    },
  })

  const { data: tokenSymbol, isLoading: loadingSymbol, error: errorSymbol } = useReadContract({
    address: address as `0x${string}`,
    abi: PumpTokenABI,
    functionName: 'symbol',
    query: {
      enabled: !apiData, // Only query blockchain if API data not available
    },
  })

  // Merge API data with blockchain fallback
  const bondingCurve = apiData?.bondingCurve || (bondingCurveAddress as string | undefined)
  const name = apiData?.name || (tokenName as string | undefined)
  const symbol = apiData?.symbol || (tokenSymbol as string | undefined)
  const description = apiData?.description
  const imageUrl = apiData?.imageUrl
  const creator = apiData?.creator
  const createdAt = apiData?.createdAt

  // Debug logging
  console.log('=== DATA SOURCE STATUS ===')
  console.log('API - Loading:', apiLoading, 'Data:', apiData ? 'Available' : 'None', 'Error:', apiError?.message)
  console.log('Blockchain - Loading:', loadingBC || loadingName || loadingSymbol)
  console.log('Final Data - Name:', name, 'Symbol:', symbol, 'Bonding Curve:', bondingCurve)
  console.log('Metadata - Description:', description ? 'Available' : 'None', 'Image:', imageUrl ? 'Available' : 'None')

  // Read bonding curve state (only if we have the bonding curve address)
  // Poll every 10 seconds to catch new trades
  const { data: reserves } = useReadContract({
    address: bondingCurve as `0x${string}` | undefined,
    abi: BondingCurveABI,
    functionName: 'getReserves',
    query: {
      enabled: !!bondingCurve,
      refetchInterval: 10000, // Refetch every 10 seconds
    },
  })

  // Type-safe handling of reserves data
  const reservesData = reserves as readonly [bigint, bigint] | undefined
  // Convert ASTER reserves from wei to ASTER, then calculate progress percentage
  const asterReserves = reservesData ? Number(formatUnits(reservesData[0], 18)) : 0
  const progress = (asterReserves / 100) * 100 // Progress out of 100 ASTER
  const marketCap = asterReserves.toFixed(2)

  // Show loading state while data is being fetched
  const isLoading = apiLoading || loadingBC || loadingName || loadingSymbol
  if (isLoading) {
    return (
      <div className="min-h-screen py-12 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary mb-4"></div>
          <p className="text-gray-400 text-lg">
            {apiLoading ? 'Loading from database...' : 'Loading from blockchain...'}
          </p>
        </div>
      </div>
    )
  }

  // Show error state if both API and contract reads failed
  if (!bondingCurve || !name || !symbol) {
    return (
      <div className="min-h-screen py-12 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold mb-2">Token Not Found</h2>
          <p className="text-gray-400 mb-4">
            Unable to load token data. This token may not exist or hasn't been indexed yet.
          </p>
          {apiError && !errorBC && (
            <p className="text-sm text-yellow-500 mb-6">
              ℹ️ Backend indexer may be catching up. Try again in a few moments.
            </p>
          )}
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
    <div className="min-h-screen py-12">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Token Info */}
          <div className="lg:col-span-2">
            <div className="bg-secondary-light p-6 rounded-xl mb-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  {imageUrl ? (
                    <img
                      src={imageUrl.replace('ipfs://', 'https://ipfs.io/ipfs/')}
                      alt={name || 'Token'}
                      className="w-20 h-20 rounded-full object-cover"
                    />
                  ) : (
                    <TokenAvatar symbol={symbol || 'TOKEN'} size="xl" />
                  )}
                  <div>
                    <h1 className="text-4xl font-bold mb-1">{name || 'Loading...'}</h1>
                    <p className="text-gray-400 text-xl">${symbol || '...'}</p>
                  </div>
                </div>
                <LikeButton tokenAddress={address} />
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

              <div className="grid md:grid-cols-3 gap-4 mb-6">
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
                  <p className="text-2xl font-bold text-green-500">Active</p>
                </div>
              </div>

              <div className="space-y-2">
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

            {/* Price Chart */}
            {bondingCurve && (
              <PriceChart
                bondingCurveAddress={bondingCurve}
                tokenSymbol={symbol || 'TOKEN'}
              />
            )}

            {/* Comments Section */}
            <div className="mt-6">
              <CommentsSection tokenAddress={address} />
            </div>
          </div>

          {/* Trading Panel */}
          <div className="lg:col-span-1">
            {bondingCurve ? (
              <TradingPanel
                bondingCurveAddress={bondingCurve}
                tokenSymbol={symbol || 'TOKEN'}
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
  )
}

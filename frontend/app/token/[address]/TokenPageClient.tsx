'use client'

import { useState, useMemo, useEffect } from 'react'
import { useReadContract, useAccount } from 'wagmi'
import { formatUnits } from 'viem'
import type { Abi } from 'viem'
import { CONTRACTS } from '@/lib/contracts'
import BondingCurveABIImport from '@/lib/abis/BondingCurve.json'
import PumpTokenABIImport from '@/lib/abis/PumpToken.json'
import TokenFactoryABIImport from '@/lib/abis/TokenFactory.json'
import { useTransactionHistory } from '@/lib/hooks/useTransactionHistory'

const BondingCurveABI = BondingCurveABIImport.abi as Abi
const PumpTokenABI = PumpTokenABIImport.abi as Abi
const TokenFactoryABI = TokenFactoryABIImport.abi as Abi

import { TokenAvatar } from '@/components/TokenAvatar'
import { AdvancedPriceChart } from '@/components/AdvancedPriceChart'
import { TradingPanel } from '@/components/TradingPanel'
import { CommentsSection } from '@/components/CommentsSection'
import { RecentTrades } from '@/components/RecentTrades'
import { TopHolders } from '@/components/TopHolders'
import { SharePopup } from '@/components/SharePopup'
import { ClickableWalletAddress } from '@/components/ClickableAddress'
import { useTokenData } from '@/lib/hooks/useTokenData'
import { useWatchTradeEvents } from '@/lib/hooks/useTokenEvents'
import { useWatchlist } from '@/lib/hooks/useWatchlist'
import toast from 'react-hot-toast'

type Tab = 'comments' | 'trades'

interface TokenPageClientProps {
  address: string
}

export function TokenPageClient({ address }: TokenPageClientProps) {
  const { address: userAddress, isConnected } = useAccount()
  const [activeTab, setActiveTab] = useState<Tab>('trades')
  const [showSharePopup, setShowSharePopup] = useState(false)
  const [holdersRefreshTrigger, setHoldersRefreshTrigger] = useState(0)
  const [tradesRefreshTrigger, setTradesRefreshTrigger] = useState(0)

  // Watchlist from database
  const { isInWatchlist, toggleWatchlist, isLoading: watchlistLoading } = useWatchlist(userAddress)
  const isFavorite = isInWatchlist(address)

  // Fetch token data - includes refetch for refreshing after trades
  const { tokenData: apiData, isLoading: apiLoading, error: apiError, refetch: refetchTokenData } = useTokenData(address)

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

  // Merge data first (before using in hooks)
  const bondingCurve = apiData?.bondingCurve || (bondingCurveAddress as string | undefined)
  const name = apiData?.name || (tokenName as string | undefined)
  const symbol = apiData?.symbol || (tokenSymbol as string | undefined)
  const description = apiData?.description
  const imageUrl = apiData?.imageUrl
  const creator = apiData?.creator
  const createdAt = apiData?.createdAt

  // ALL HOOKS MUST BE CALLED BEFORE ANY CONDITIONAL RETURNS
  // Get transaction history - called unconditionally
  const { transactions } = useTransactionHistory(bondingCurve || '')

  // Read bonding curve reserves - called unconditionally
  const { data: reserves, refetch: refetchReserves } = useReadContract({
    address: (bondingCurve as `0x${string}`) || undefined,
    abi: BondingCurveABI,
    functionName: 'getReserves',
    query: {
      enabled: !!bondingCurve,
      refetchInterval: 10000,
    },
  })

  // Watch for trade events - called unconditionally
  useWatchTradeEvents(
    bondingCurve || '',
    (event) => {
      console.log('[TokenPageClient] 🔄 Trade event detected, refetching reserves...', event)
      refetchReserves()
    }
  )

  // Callback for when trades are successful
  const handleTradeSuccess = (tradeType: 'buy' | 'sell', txHash: string) => {
    console.log('[TokenPageClient] 🎯 Trade successful, triggering data refresh:', { tradeType, txHash })

    // Refetch reserves to update progress and market cap
    refetchReserves()

    // Refetch token data from backend API to get updated stats (price, mcap, volume, etc.)
    // Add a small delay to allow backend to process the new transaction
    setTimeout(() => {
      console.log('[TokenPageClient] 🔄 Refetching token data from backend...')
      refetchTokenData()
    }, 2000) // 2 second delay for backend to index the transaction

    // Trigger immediate holders and trades refresh
    setHoldersRefreshTrigger(prev => prev + 1)
    setTradesRefreshTrigger(prev => prev + 1)
  }

  // Calculate creation time - memoized
  const creationInfo = useMemo(() => {
    // Prioritize API data
    if (createdAt) {
      const createdDate = new Date(createdAt)
      const now = new Date()
      const diffMs = now.getTime() - createdDate.getTime()
      const diffMins = Math.floor(diffMs / 60000)
      const diffHours = Math.floor(diffMs / 3600000)
      const diffDays = Math.floor(diffMs / 86400000)
      
      let timeAgo = ''
      if (diffDays > 0) {
        timeAgo = `${diffDays}d ago`
      } else if (diffHours > 0) {
        timeAgo = `${diffHours}h ago`
      } else if (diffMins > 0) {
        timeAgo = `${diffMins}m ago`
      } else {
        timeAgo = 'just now'
      }
      
      return timeAgo
    }

    // Fallback to first transaction timestamp
    if (transactions.length > 0) {
      const firstTx = transactions.reduce((oldest, tx) => 
        tx.timestamp < oldest.timestamp ? tx : oldest
      )
      const createdDate = new Date(firstTx.timestamp * 1000)
      const now = new Date()
      const diffMs = now.getTime() - createdDate.getTime()
      const diffMins = Math.floor(diffMs / 60000)
      const diffHours = Math.floor(diffMs / 3600000)
      const diffDays = Math.floor(diffMs / 86400000)
      
      let timeAgo = ''
      if (diffDays > 0) {
        timeAgo = `${diffDays}d ago`
      } else if (diffHours > 0) {
        timeAgo = `${diffHours}h ago`
      } else if (diffMins > 0) {
        timeAgo = `${diffMins}m ago`
      } else {
        timeAgo = 'just now'
      }
      
      return timeAgo
    }

    return 'recently'
  }, [createdAt, transactions])

  const reservesData = reserves as readonly [bigint, bigint] | undefined
  const asterReserves = reservesData ? Number(formatUnits(reservesData[0], 18)) : 0
  const progress = (asterReserves / 100) * 100

  // Use backend stats for USD market cap (correct calculation)
  // Backend calculates: marketCapUsd = asterReserves × ASTER_USD_PRICE
  const marketCapUsd = apiData?.stats?.marketCapUsd ? parseFloat(apiData.stats.marketCapUsd) : 0
  const marketCap = marketCapUsd > 0 ? marketCapUsd.toFixed(2) : asterReserves.toFixed(2)
  const priceUsd = apiData?.stats?.priceUsd ? parseFloat(apiData.stats.priceUsd) : 0
  const priceChange24h = apiData?.stats?.priceChange24h ? parseFloat(apiData.stats.priceChange24h) : 0

  // Calculate 24hr market cap change from backend stats or transaction history
  const marketCapStats = useMemo(() => {
    // Use backend stats if available (most accurate)
    if (apiData?.stats) {
      const mcapUsd = parseFloat(apiData.stats.marketCapUsd || '0')
      const change = parseFloat(apiData.stats.priceChange24h || '0')
      const athEstimate = mcapUsd // Will be calculated properly in the chart
      return {
        change24hPercent: change,
        change24hDollar: mcapUsd * change / 100,
        ath: athEstimate
      }
    }

    if (transactions.length === 0) {
      return { change24hPercent: 0, change24hDollar: 0, ath: parseFloat(marketCap) }
    }

    const now = Math.floor(Date.now() / 1000)
    const oneDayAgo = now - 86400 // 24 hours in seconds

    // Helper function to calculate price from transaction
    const calculatePrice = (tx: typeof transactions[0]) => {
      const asterAmount = Number(tx.asterAmountFormatted)
      const tokenAmount = Number(tx.tokenAmountFormatted)
      return tokenAmount > 0 ? asterAmount / tokenAmount : 0
    }

    // Find transaction closest to 24h ago
    const oldTx = transactions
      .filter(tx => tx.timestamp <= oneDayAgo)
      .sort((a, b) => b.timestamp - a.timestamp)[0]

    let change24hPercent = 0
    let change24hDollar = 0

    if (oldTx) {
      const oldPrice = calculatePrice(oldTx)
      const currentTx = transactions[transactions.length - 1]
      const currentPrice = currentTx ? calculatePrice(currentTx) : oldPrice

      if (oldPrice > 0) {
        change24hPercent = ((currentPrice - oldPrice) / oldPrice) * 100

        // Calculate dollar change based on estimated market cap movement
        // Assuming market cap correlates with price
        const oldMarketCap = parseFloat(marketCap) / (currentPrice / oldPrice)
        change24hDollar = parseFloat(marketCap) - oldMarketCap
      }
    }

    // Calculate ATH from historical transactions
    const allPrices = transactions.map(calculatePrice).filter(p => p > 0)
    const athPrice = allPrices.length > 0 ? Math.max(...allPrices) : 0
    const currentTx = transactions[transactions.length - 1]
    const currentPrice = currentTx ? calculatePrice(currentTx) : 0
    const ath = currentPrice > 0 ? parseFloat(marketCap) * (athPrice / currentPrice) : parseFloat(marketCap)

    return { change24hPercent, change24hDollar, ath }
  }, [transactions, marketCap])

  // Share function
  const handleShare = () => {
    setShowSharePopup(true)
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
    <div className="h-full flex flex-col overflow-hidden">
      <div className="container mx-auto px-4 max-w-full flex-shrink-0">
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
      </div>

      {/* Pump.fun Style Layout - Chart Width Token Header */}
      <div className="flex-1 container mx-auto px-2 sm:px-4 max-w-full overflow-hidden">
        <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 h-full overflow-hidden">
          {/* Left Column - Chart + Tabs + Token Info - Independent scroll */}
          <div className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden lg:pr-2 h-full">
            {/* Token Info Header - Same Width as Chart - Larger Image Layout */}
            <div className="bg-secondary-light rounded-xl p-4 sm:p-6 mb-4 border border-gray-700">
              <div className="flex items-start sm:items-center gap-3 sm:gap-6">
                {/* Token Image - Larger with Pump.fun style gradient border */}
                <div className="flex-shrink-0 group relative">
                  <div className="relative w-16 h-16 sm:w-28 sm:h-28 md:w-32 md:h-32">
                    {/* Gradient border effect */}
                    <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-amber-600 via-yellow-400 to-amber-600 p-[2px]">
                      <div className="h-full w-full rounded-lg bg-secondary-light"></div>
                    </div>
                    {/* Image container */}
                    <div className="absolute inset-[2px] rounded-lg overflow-hidden">
                      {imageUrl ? (
                        <>
                          {/* Blurred background */}
                          <div className="absolute inset-0 z-0">
                            <img
                              src={imageUrl.replace('ipfs://', 'https://ipfs.io/ipfs/')}
                              alt={name}
                              className="h-full w-full scale-110 object-cover opacity-30 blur-md transition-transform duration-300 group-hover:scale-125"
                            />
                          </div>
                          {/* Main image */}
                          <div className="absolute inset-0 z-10 flex items-center justify-center p-2">
                            <img
                              src={imageUrl.replace('ipfs://', 'https://ipfs.io/ipfs/')}
                              alt={name}
                              className="h-full w-full object-contain transition-all duration-300 group-hover:scale-110"
                            />
                          </div>
                        </>
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <TokenAvatar symbol={symbol} size="xl" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Token Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-0">
                    <div className="flex-1 min-w-0">
                      <h1 className="text-lg sm:text-xl font-bold mb-1">{name}</h1>
                      <div className="flex flex-wrap items-center gap-1 sm:gap-2 text-xs text-gray-400 mb-1">
                        <span className="font-medium">${symbol}</span>
                        <span className="hidden sm:inline">•</span>
                        <ClickableWalletAddress address={address} />
                        {creator && (
                          <>
                            <span>•</span>
                            <span>by </span>
                            <ClickableWalletAddress address={creator} showUsername={true} />
                          </>
                        )}
                        <span className="hidden sm:inline">•</span>
                        <span>{creationInfo}</span>
                      </div>
                    </div>

                    {/* Action Buttons - Always visible */}
                    <div className="flex gap-2 flex-shrink-0 sm:ml-4">
                      <button
                        onClick={handleShare}
                        className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary text-black hover:bg-primary/90 rounded-lg transition font-inter font-semibold text-xs"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
                          <path d="M14.5563 7.7518L8.88865 2.6655C8.67404 2.47289 8.33268 2.62521 8.33268 2.91358V5.66655C2.66602 5.66655 1.16602 7.83322 1.16602 13.4999C2.16602 11.4999 2.66602 10.3332 8.33268 10.3332V13.0862C8.33268 13.3746 8.67404 13.5269 8.88865 13.3343L14.5562 8.24796C14.7038 8.11551 14.7038 7.88426 14.5563 7.7518Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
                        </svg>
                        Share
                      </button>
                      <button
                        onClick={async () => {
                          if (!isConnected) {
                            toast.error('Connect wallet to add to watchlist')
                            return
                          }
                          const success = await toggleWatchlist(address)
                          if (success) {
                            toast.success(isFavorite ? 'Removed from watchlist' : 'Added to watchlist!')
                          } else {
                            toast.error('Failed to update watchlist')
                          }
                        }}
                        disabled={watchlistLoading}
                        className={`p-2 rounded-lg transition flex items-center justify-center ${
                          isFavorite ? 'bg-primary text-black' : 'bg-[#2B313B] hover:bg-[#2B313B]/80 text-white'
                        } ${watchlistLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        title={isFavorite ? 'Remove from watchlist' : 'Add to watchlist'}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill={isFavorite ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5">
                          <path d="M7.69983 1.35512C7.82047 1.10363 8.17953 1.10363 8.30017 1.35512L10.0126 4.92472C10.0612 5.02597 10.1578 5.09587 10.2694 5.1105L14.2103 5.62721C14.488 5.66363 14.5991 6.00504 14.3957 6.19709L11.5139 8.91815C11.4319 8.99551 11.3949 9.109 11.4155 9.21962L12.1391 13.1067C12.1902 13.381 11.8996 13.5919 11.6535 13.459L8.15842 11.5722C8.05959 11.5188 7.94041 11.5188 7.84158 11.5722L4.34646 13.459C4.10042 13.5919 3.80982 13.381 3.86088 13.1067L4.5845 9.21962C4.6051 9.109 4.56807 8.99551 4.48614 8.91815L1.60434 6.19709C1.40094 6.00504 1.51202 5.66363 1.78975 5.62721L5.7306 5.1105C5.8422 5.09587 5.93882 5.02597 5.98739 4.92472L7.69983 1.35512Z" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Description - Hidden for compact layout */}
                  {/* {description && (
                    <p className="text-sm text-gray-300 line-clamp-1 mb-2">{description}</p>
                  )} */}

                  {/* Social Links */}
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                    {/* Website */}
                    {apiData?.website && (
                      <a
                        href={apiData.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 px-2 py-1 bg-secondary hover:bg-secondary-light border border-gray-700 rounded text-xs"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m-9 9a9 9 0 019-9" />
                        </svg>
                        Website
                      </a>
                    )}
                    
                    {/* Twitter */}
                    {apiData?.twitter && (
                      <a
                        href={`https://twitter.com/${apiData.twitter.replace('@', '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 px-2 py-1 bg-secondary hover:bg-secondary-light border border-gray-700 rounded text-xs"
                      >
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                        </svg>
                        Twitter
                      </a>
                    )}
                    
                    {/* Telegram */}
                    {apiData?.telegram && (
                      <a
                        href={apiData.telegram}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 px-2 py-1 bg-secondary hover:bg-secondary-light border border-gray-700 rounded text-xs"
                      >
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.295-.6.295-.002 0-.003 0-.005 0l.213-3.054 5.56-5.022c.24-.213-.054-.334-.373-.121L9.23 13.615l-2.97-.924c-.64-.203-.658-.64.135-.954l11.566-4.458c.538-.196 1.006.128.832.941z" />
                        </svg>
                        Telegram
                      </a>
                    )}

                    {/* Discord */}
                    {apiData?.discord && (
                      <a
                        href={apiData.discord}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 px-2 py-1 bg-secondary hover:bg-secondary-light border border-gray-700 rounded text-xs"
                      >
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                        </svg>
                        Discord
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Advanced Price Chart with Lightweight Charts */}
            <div className="bg-gray-900 rounded-xl overflow-hidden">
              <AdvancedPriceChart
                bondingCurveAddress={bondingCurve}
                tokenSymbol={symbol || 'BTC'}
                marketCap={marketCap}
                marketCapChange24h={marketCapStats.change24hPercent}
                ath={marketCapStats.ath}
                backendPriceUsd={priceUsd}
                backendMarketCapUsd={marketCapUsd}
                backendStats={apiData?.stats}
              />
            </div>

            {/* Tabs */}
            <div className="bg-secondary-light rounded-xl overflow-hidden mt-4">
              {/* Tab Headers */}
              <div className="flex border-b border-gray-700">
                <button
                  onClick={() => setActiveTab('trades')}
                  className={`flex-1 px-6 py-3 font-medium transition ${
                    activeTab === 'trades'
                      ? 'text-white border-b-2 border-primary'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Trades
                </button>
                <button
                  onClick={() => setActiveTab('comments')}
                  className={`flex-1 px-6 py-3 font-medium transition ${
                    activeTab === 'comments'
                      ? 'text-white border-b-2 border-primary'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Comments
                </button>
              </div>

              {/* Tab Content */}
              <div className="p-6">
                {activeTab === 'trades' && (
                  <RecentTrades tokenAddress={address} tokenSymbol={symbol} refreshTrigger={tradesRefreshTrigger} />
                )}

                {activeTab === 'comments' && (
                  <CommentsSection tokenAddress={address} />
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Trading Panel - Independent scroll */}
          <div className="w-full lg:w-80 flex-shrink-0 overflow-y-auto overflow-x-hidden lg:pl-2 h-auto lg:h-full">
            {/* Trading Panel - Aligned with token info header */}
            {bondingCurve ? (
              <TradingPanel
                bondingCurveAddress={bondingCurve}
                tokenSymbol={symbol}
                tokenAddress={address}
                onTradeSuccess={handleTradeSuccess}
              />
            ) : (
              <div className="bg-secondary-light p-6 rounded-xl">
                <p className="text-gray-400 text-center">Loading trading panel...</p>
              </div>
            )}
            
            <div className="space-y-4 mt-4">
              
              {/* Bonding Curve Progress Panel */}
              <div className="bg-secondary-light rounded-xl p-4">
                <div className="mb-3">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-semibold text-white">Bonding Curve Progress</h3>
                    <span className="text-xs text-gray-400">{progress.toFixed(1)}%</span>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="w-full bg-gray-700 rounded-full h-3 mb-3">
                    <div 
                      className="bg-gradient-to-r from-primary to-green-400 h-3 rounded-full transition-all duration-500 ease-out"
                      style={{ width: `${Math.min(progress, 100)}%` }}
                    >
                      <div className="h-full w-full bg-gradient-to-r from-transparent to-white/20 rounded-full"></div>
                    </div>
                  </div>
                  
                  {/* Progress Details */}
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Current Reserves</span>
                      <span className="text-white font-mono">{asterReserves.toFixed(2)} ASTER</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Target for Graduation</span>
                      <span className="text-primary font-mono">100.00 ASTER</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Remaining</span>
                      <span className="text-orange-400 font-mono">{Math.max(0, 100 - asterReserves).toFixed(2)} ASTER</span>
                    </div>
                  </div>
                </div>
                
                {/* Graduation Status */}
                {progress >= 100 ? (
                  <div className="bg-green-500/20 border border-green-500 rounded-lg p-3 text-center">
                    <div className="text-green-400 text-sm font-bold mb-1">🎉 Graduated!</div>
                    <div className="text-xs text-green-300">Token has graduated to DEX</div>
                  </div>
                ) : (
                  <div className="bg-gray-800 border border-gray-700 rounded-lg p-3 text-center">
                    <div className="text-gray-300 text-sm font-medium mb-1">Pre-Market Phase</div>
                    <div className="text-xs text-gray-400">
                      {(100 - asterReserves).toFixed(2)} ASTER needed for graduation
                    </div>
                  </div>
                )}
              </div>
              
              {/* Top Holders Panel */}
              <div className="bg-secondary-light rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-white">Top holders</h3>
                  <button className="text-xs text-gray-400 hover:text-primary transition">
                    Generate bubble map
                  </button>
                </div>
                
                {/* Liquidity Pool Holder */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="text-blue-400">💧</div>
                      <span className="text-sm text-white">Liquidity pool</span>
                    </div>
                    <span className="text-sm font-bold text-primary">
                      {progress >= 100 ? '15.00%' : Math.max(10, 80 - progress).toFixed(1) + '%'}
                    </span>
                  </div>
                  
                  {/* Top Individual Holders */}
                  <TopHolders tokenAddress={address} tokenSymbol={symbol} compact={true} refreshTrigger={holdersRefreshTrigger} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Share Popup */}
      <SharePopup
        isOpen={showSharePopup}
        onClose={() => setShowSharePopup(false)}
        tokenName={name || ''}
        tokenSymbol={symbol || ''}
        url={typeof window !== 'undefined' ? window.location.href : ''}
      />
    </div>
  )
}
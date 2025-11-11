'use client'

import { useState, useMemo } from 'react'
import { useReadContract } from 'wagmi'
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

type Tab = 'comments' | 'trades'

interface TokenPageClientProps {
  address: string
}

export function TokenPageClient({ address }: TokenPageClientProps) {
  const [activeTab, setActiveTab] = useState<Tab>('trades')
  const [isFavorite, setIsFavorite] = useState(false)
  const [showSharePopup, setShowSharePopup] = useState(false)

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
  const marketCap = asterReserves.toFixed(2)

  // Calculate 24hr market cap change from transaction history
  const marketCapStats = useMemo(() => {
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
    <div className="py-6 overflow-x-hidden">
      <div className="container mx-auto px-4 max-w-full">
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

        {/* Pump.fun Style Layout - Chart Width Token Header */}
        <div className="flex gap-6 overflow-x-hidden">
          {/* Left Column - Chart + Tabs + Token Info */}
          <div className="flex-1 min-w-0 overflow-x-hidden pr-2">
            {/* Token Info Header - Same Width as Chart - Compact Layout */}
            <div className="bg-secondary-light rounded-xl p-4 mb-4">
              <div className="flex items-start gap-4">
                {/* Token Image - Top Left */}
                <div className="flex-shrink-0">
                  {imageUrl ? (
                    <img
                      src={imageUrl.replace('ipfs://', 'https://ipfs.io/ipfs/')}
                      alt={name}
                      className="w-20 h-20 rounded-xl object-cover border-2 border-gray-600 shadow-lg"
                    />
                  ) : (
                    <TokenAvatar symbol={symbol} size="xl" />
                  )}
                </div>

                {/* Token Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h1 className="text-xl font-bold mb-1">{name}</h1>
                      <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
                        <span className="font-medium">${symbol}</span>
                        <span>•</span>
                        <ClickableWalletAddress address={address} />
                        {/* Hide creator address */}
                        {/* {creator && (
                          <>
                            <span>•</span>
                            <span>by </span>
                            <ClickableWalletAddress address={creator} />
                          </>
                        )} */}
                        <span>•</span>
                        <span>{creationInfo}</span>
                      </div>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex gap-2 flex-shrink-0 ml-4">
                      <button
                        onClick={handleShare}
                        className="px-3 py-1.5 bg-primary text-black hover:bg-primary/90 rounded-lg transition font-medium text-sm"
                      >
                        Share
                      </button>
                      <button
                        onClick={() => setIsFavorite(!isFavorite)}
                        className={`p-1.5 rounded-lg transition flex items-center justify-center ${
                          isFavorite ? 'bg-primary text-black' : 'bg-secondary hover:bg-secondary-light text-gray-400 border border-gray-700'
                        }`}
                        title={isFavorite ? 'Remove from watchlist' : 'Add to watchlist'}
                      >
                        <svg className="w-4 h-4" fill={isFavorite ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976-2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Description - Hidden for compact layout */}
                  {/* {description && (
                    <p className="text-sm text-gray-300 line-clamp-1 mb-2">{description}</p>
                  )} */}

                  {/* Social Links */}
                  <div className="flex items-center gap-2">
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
              />
            </div>

            {/* Tabs */}
            <div className="bg-secondary-light rounded-xl overflow-hidden mt-4">
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

                {activeTab === 'comments' && (
                  <CommentsSection tokenAddress={address} />
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Trading Panel */}
          <div className="w-80 flex-shrink-0 overflow-x-hidden pl-2">
            {/* Trading Panel - Aligned with token info header */}
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
                  <TopHolders tokenAddress={address} tokenSymbol={symbol} compact={true} />
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
'use client'

import { useAccount } from 'wagmi'
import Link from 'next/link'
import { useUserPortfolio } from '@/lib/hooks/useUserPortfolio'
import { useUserPnL } from '@/lib/hooks/useUserPnL'
import { useAsterBalance } from '@/lib/hooks/useAsterBalance'
import { TokenAvatar } from '@/components/TokenAvatar'
import { PortfolioHoldingCard } from '@/components/PortfolioHoldingCard'

export default function PortfolioPage() {
  const { address, isConnected } = useAccount()
  const { holdings, totalValueFormatted, isLoading, error } = useUserPortfolio()
  const { pnl, isLoading: pnlLoading } = useUserPnL()
  const { formatted: asterBalance, isLoading: asterLoading } = useAsterBalance()

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-secondary pt-24 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-secondary-light border border-gray-700 rounded-xl p-12 text-center">
            <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold mb-2">Connect Your Wallet</h2>
            <p className="text-gray-400">Connect your wallet to view your portfolio</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-secondary pt-24 px-4 pb-12">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Your Portfolio</h1>
          <p className="text-gray-400">
            {address?.slice(0, 6)}...{address?.slice(-4)}
          </p>
        </div>

        {/* ASTER Balance Card */}
        <div className="bg-gradient-to-r from-primary/20 to-primary/10 border border-primary/30 rounded-xl p-6 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400 mb-1">ASTER Balance</p>
              <p className="text-4xl font-bold text-primary">
                {asterLoading ? '...' : parseFloat(asterBalance).toLocaleString()} ASTER
              </p>
            </div>
            <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
              <span className="text-2xl">💰</span>
            </div>
          </div>
        </div>

        {/* P&L Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {/* Total P&L Card */}
          <div className={`border rounded-xl p-6 ${
            pnl && pnl.totalPnL >= 0n
              ? 'bg-green-500/10 border-green-500/30'
              : 'bg-red-500/10 border-red-500/30'
          }`}>
            <p className="text-sm text-gray-400 mb-1">Total P&L</p>
            {pnlLoading ? (
              <p className="text-2xl font-bold">...</p>
            ) : pnl ? (
              <>
                <p className={`text-2xl font-bold ${
                  pnl.totalPnL >= 0n ? 'text-green-500' : 'text-red-500'
                }`}>
                  {pnl.totalPnL >= 0n ? '+' : ''}{parseFloat(pnl.totalPnLFormatted).toFixed(4)} ASTER
                </p>
                <p className={`text-sm mt-1 ${
                  pnl.profitLossPercent >= 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                  {pnl.profitLossPercent >= 0 ? '+' : ''}{pnl.profitLossPercent.toFixed(2)}%
                </p>
              </>
            ) : (
              <p className="text-2xl font-bold">0.0000 ASTER</p>
            )}
          </div>

          {/* Realized P&L Card */}
          <div className="bg-secondary-light border border-gray-700 rounded-xl p-6">
            <p className="text-sm text-gray-400 mb-1">Realized P&L</p>
            {pnlLoading ? (
              <p className="text-2xl font-bold">...</p>
            ) : pnl ? (
              <p className={`text-2xl font-bold ${
                pnl.realizedPnL >= 0n ? 'text-green-500' : 'text-red-500'
              }`}>
                {pnl.realizedPnL >= 0n ? '+' : ''}{parseFloat(pnl.realizedPnLFormatted).toFixed(4)} ASTER
              </p>
            ) : (
              <p className="text-2xl font-bold">0.0000 ASTER</p>
            )}
          </div>

          {/* Unrealized P&L Card */}
          <div className="bg-secondary-light border border-gray-700 rounded-xl p-6">
            <p className="text-sm text-gray-400 mb-1">Unrealized P&L</p>
            {pnlLoading ? (
              <p className="text-2xl font-bold">...</p>
            ) : pnl ? (
              <p className={`text-2xl font-bold ${
                pnl.unrealizedPnL >= 0n ? 'text-green-500' : 'text-red-500'
              }`}>
                {pnl.unrealizedPnL >= 0n ? '+' : ''}{parseFloat(pnl.unrealizedPnLFormatted).toFixed(4)} ASTER
              </p>
            ) : (
              <p className="text-2xl font-bold">0.0000 ASTER</p>
            )}
          </div>
        </div>

        {/* Trading Stats Card */}
        <div className="bg-secondary-light border border-gray-700 rounded-xl p-6 mb-8">
          <h3 className="text-lg font-bold mb-4">Trading Statistics</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-gray-400 mb-1">Total Trades</p>
              <p className="text-xl font-bold">
                {pnlLoading ? '...' : pnl?.totalTrades || 0}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">Total Buy Volume</p>
              <p className="text-xl font-bold">
                {pnlLoading ? '...' : pnl ? parseFloat(pnl.totalBuyVolumeFormatted).toFixed(2) : '0.00'} ASTER
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">Total Sell Volume</p>
              <p className="text-xl font-bold">
                {pnlLoading ? '...' : pnl ? parseFloat(pnl.totalSellVolumeFormatted).toFixed(2) : '0.00'} ASTER
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">Holdings</p>
              <p className="text-xl font-bold">{holdings.length}</p>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-secondary-light border border-gray-700 rounded-xl p-6 animate-pulse">
                <div className="h-6 bg-gray-700 rounded w-1/4 mb-4"></div>
                <div className="h-4 bg-gray-700 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/50 rounded-xl p-6 text-center">
            <p className="text-red-500">Error loading portfolio: {error.message}</p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && holdings.length === 0 && (
          <div className="bg-secondary-light border border-gray-700 rounded-xl p-12 text-center">
            <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold mb-2">No Holdings Yet</h2>
            <p className="text-gray-400 mb-6">Start trading to build your portfolio</p>
            <Link
              href="/tokens"
              className="inline-block bg-primary text-black px-6 py-3 rounded-lg font-bold hover:bg-primary-dark transition"
            >
              Browse Tokens
            </Link>
          </div>
        )}

        {/* Holdings Grid */}
        {!isLoading && holdings.length > 0 && (
          <div className="space-y-4">
            {holdings.map((holding) => (
              <PortfolioHoldingCard key={holding.tokenAddress} holding={holding} />
            ))}
          </div>
        )}

        {/* Quick Actions */}
        {!isLoading && holdings.length > 0 && (
          <div className="mt-8 flex gap-4">
            <Link
              href="/tokens"
              className="flex-1 bg-secondary-light border border-gray-700 rounded-xl p-6 hover:border-primary transition text-center group"
            >
              <svg className="w-8 h-8 mx-auto mb-2 text-gray-400 group-hover:text-primary transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <h3 className="font-bold mb-1">Discover</h3>
              <p className="text-sm text-gray-400">Find new tokens</p>
            </Link>
            <Link
              href="/create"
              className="flex-1 bg-secondary-light border border-gray-700 rounded-xl p-6 hover:border-primary transition text-center group"
            >
              <svg className="w-8 h-8 mx-auto mb-2 text-gray-400 group-hover:text-primary transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <h3 className="font-bold mb-1">Create</h3>
              <p className="text-sm text-gray-400">Launch your token</p>
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

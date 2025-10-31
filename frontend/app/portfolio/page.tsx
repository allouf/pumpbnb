'use client'

import { useAccount } from 'wagmi'
import Link from 'next/link'
import { useUserPortfolio } from '@/lib/hooks/useUserPortfolio'
import { useAsterBalance } from '@/lib/hooks/useAsterBalance'
import { TokenAvatar } from '@/components/TokenAvatar'

export default function PortfolioPage() {
  const { address, isConnected } = useAccount()
  const { holdings, totalValueFormatted, isLoading, error } = useUserPortfolio()
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

        {/* Token Holdings Value Card */}
        <div className="bg-secondary-light border border-gray-700 rounded-xl p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400 mb-1">Token Holdings Value</p>
              <p className="text-2xl font-bold">
                {isLoading ? '...' : parseFloat(totalValueFormatted).toFixed(4)} ASTER
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-400 mb-1">Holdings</p>
              <p className="text-2xl font-bold">{holdings.length}</p>
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
          <div className="grid gap-4">
            {holdings.map((holding) => (
              <Link
                key={holding.tokenAddress}
                href={`/token/${holding.tokenAddress}`}
                className="bg-secondary-light border border-gray-700 rounded-xl p-6 hover:border-primary transition-all group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <TokenAvatar symbol={holding.symbol} size="md" />
                      <div>
                        <h3 className="text-xl font-bold group-hover:text-primary transition">
                          {holding.name}
                        </h3>
                        <p className="text-sm text-gray-400">{holding.symbol}</p>
                      </div>
                      {holding.isGraduated && (
                        <span className="bg-green-500/20 text-green-500 px-3 py-1 rounded-full text-xs font-semibold">
                          Graduated
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                      <div>
                        <p className="text-xs text-gray-400 mb-1">Balance</p>
                        <p className="font-semibold">
                          {parseFloat(holding.balanceFormatted).toFixed(2)} {holding.symbol}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 mb-1">Value</p>
                        <p className="font-semibold text-primary">
                          {parseFloat(holding.valueInAsterFormatted).toFixed(4)} ASTER
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 mb-1">Token Address</p>
                        <p className="font-mono text-xs text-gray-400">
                          {holding.tokenAddress.slice(0, 6)}...{holding.tokenAddress.slice(-4)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 mb-1">Bonding Curve</p>
                        <p className="font-mono text-xs text-gray-400">
                          {holding.bondingCurveAddress.slice(0, 6)}...{holding.bondingCurveAddress.slice(-4)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="ml-4">
                    <svg className="w-6 h-6 text-gray-400 group-hover:text-primary group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </Link>
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

'use client'

import { useAccount } from 'wagmi'
import Link from 'next/link'
import { useTokenList } from '@/lib/hooks/useTokenList'
import { useTransactionHistory } from '@/lib/hooks/useTransactionHistory'
import { TokenAvatar } from '@/components/TokenAvatar'
import { formatUnits } from 'viem'

export default function DashboardPage() {
  const { address, isConnected } = useAccount()
  const { tokens, isLoading } = useTokenList()

  // Filter tokens created by the connected user
  const myTokens = tokens.filter(token =>
    token.creator.toLowerCase() === address?.toLowerCase()
  )

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
            <p className="text-gray-400">Connect your wallet to view your creator dashboard</p>
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
          <h1 className="text-4xl font-bold mb-2">Creator Dashboard</h1>
          <p className="text-gray-400">
            Manage your tokens and track revenue
          </p>
        </div>

        {/* Summary Stats */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <div className="bg-secondary-light border border-gray-700 rounded-xl p-6">
            <p className="text-sm text-gray-400 mb-1">Tokens Created</p>
            <p className="text-3xl font-bold">{myTokens.length}</p>
          </div>
          <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-6">
            <p className="text-sm text-gray-400 mb-1">Total Volume</p>
            <p className="text-3xl font-bold text-green-500">
              {myTokens.length > 0 ? '...' : '0'} ASTER
            </p>
          </div>
          <div className="bg-primary/10 border border-primary/30 rounded-xl p-6">
            <p className="text-sm text-gray-400 mb-1">Total Revenue</p>
            <p className="text-3xl font-bold text-primary">
              {myTokens.length > 0 ? '...' : '0'} ASTER
            </p>
          </div>
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-6">
            <p className="text-sm text-gray-400 mb-1">Graduated</p>
            <p className="text-3xl font-bold text-blue-500">
              0
            </p>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            <p className="mt-4 text-gray-400">Loading your tokens...</p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && myTokens.length === 0 && (
          <div className="bg-secondary-light border border-gray-700 rounded-xl p-12 text-center">
            <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold mb-2">No Tokens Created Yet</h2>
            <p className="text-gray-400 mb-6">Launch your first token to get started!</p>
            <Link
              href="/create"
              className="inline-block bg-primary text-black px-6 py-3 rounded-lg font-bold hover:bg-primary-dark transition"
            >
              Create Token
            </Link>
          </div>
        )}

        {/* My Tokens */}
        {!isLoading && myTokens.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold mb-4">Your Tokens</h2>
            <div className="grid gap-4">
              {myTokens.map((token) => (
                <TokenCard key={token.address} token={token} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function TokenCard({ token }: { token: any }) {
  const { transactions, isLoading } = useTransactionHistory(token.bondingCurve)

  // Calculate stats from transactions
  const totalVolume = transactions.reduce((sum, tx) =>
    sum + Number(formatUnits(tx.asterAmount, 18)), 0
  )

  // Creator earns 0.3% (30 bps) of trading volume during bonding curve phase
  const creatorRevenue = totalVolume * 0.003

  const buyCount = transactions.filter(tx => tx.type === 'buy').length
  const sellCount = transactions.filter(tx => tx.type === 'sell').length

  return (
    <Link
      href={`/token/${token.address}`}
      className="bg-secondary-light border border-gray-700 rounded-xl p-6 hover:border-primary transition-all group"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4 flex-1">
          <TokenAvatar symbol={token.symbol} size="lg" />
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <h3 className="text-2xl font-bold group-hover:text-primary transition">
                {token.name}
              </h3>
              <span className="text-gray-400">${token.symbol}</span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-gray-400 mb-1">Trading Volume</p>
                <p className="font-semibold text-green-500">
                  {isLoading ? '...' : totalVolume.toFixed(2)} ASTER
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">Your Revenue</p>
                <p className="font-semibold text-primary">
                  {isLoading ? '...' : creatorRevenue.toFixed(4)} ASTER
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">Total Trades</p>
                <p className="font-semibold">
                  {isLoading ? '...' : transactions.length}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">Buy/Sell</p>
                <p className="font-semibold">
                  <span className="text-green-500">{buyCount}</span>
                  {' / '}
                  <span className="text-red-500">{sellCount}</span>
                </p>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-gray-700">
              <p className="text-xs text-gray-400">
                Created {new Date(token.timestamp * 1000).toLocaleDateString()}
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
  )
}

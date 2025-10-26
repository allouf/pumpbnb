'use client'

import { useState } from 'react'
import { useAccount } from 'wagmi'
import Link from 'next/link'
import { useTokenList } from '@/lib/hooks/useTokenList'
import { useTransactionHistory } from '@/lib/hooks/useTransactionHistory'

export default function HistoryPage() {
  const { address, isConnected } = useAccount()
  const { tokens } = useTokenList()
  const [selectedToken, setSelectedToken] = useState<string>('')
  const [filter, setFilter] = useState<'all' | 'buy' | 'sell'>('all')

  const { transactions, isLoading } = useTransactionHistory(
    selectedToken || undefined,
    isConnected ? address : undefined
  )

  const filteredTransactions = filter === 'all'
    ? transactions
    : transactions.filter(tx => tx.type === filter)

  const formatTime = (timestamp: number) => {
    if (!timestamp) return 'Unknown'
    const date = new Date(timestamp * 1000)
    return date.toLocaleString()
  }

  const formatTimeAgo = (timestamp: number) => {
    if (!timestamp) return 'Unknown'
    const seconds = Math.floor(Date.now() / 1000 - timestamp)
    if (seconds < 60) return `${seconds}s ago`
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
    return `${Math.floor(seconds / 86400)}d ago`
  }

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
            <p className="text-gray-400">Connect your wallet to view your transaction history</p>
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
          <h1 className="text-4xl font-bold mb-2">Transaction History</h1>
          <p className="text-gray-400">
            View all your buy and sell transactions
          </p>
        </div>

        {/* Filters */}
        <div className="bg-secondary-light rounded-xl p-6 mb-6">
          <div className="grid md:grid-cols-2 gap-4">
            {/* Token Filter */}
            <div>
              <label className="block text-sm font-medium mb-2">Filter by Token</label>
              <select
                value={selectedToken}
                onChange={(e) => setSelectedToken(e.target.value)}
                className="w-full px-4 py-3 bg-secondary rounded-lg border border-gray-700 focus:border-primary focus:outline-none"
              >
                <option value="">All Tokens</option>
                {tokens.map((token) => (
                  <option key={token.address} value={token.bondingCurve}>
                    {token.name} ({token.symbol})
                  </option>
                ))}
              </select>
            </div>

            {/* Type Filter */}
            <div>
              <label className="block text-sm font-medium mb-2">Transaction Type</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setFilter('all')}
                  className={`flex-1 py-3 rounded-lg font-semibold transition ${
                    filter === 'all'
                      ? 'bg-primary text-black'
                      : 'bg-secondary text-gray-400 hover:text-white'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setFilter('buy')}
                  className={`flex-1 py-3 rounded-lg font-semibold transition ${
                    filter === 'buy'
                      ? 'bg-green-500 text-white'
                      : 'bg-secondary text-gray-400 hover:text-white'
                  }`}
                >
                  Buys
                </button>
                <button
                  onClick={() => setFilter('sell')}
                  className={`flex-1 py-3 rounded-lg font-semibold transition ${
                    filter === 'sell'
                      ? 'bg-red-500 text-white'
                      : 'bg-secondary text-gray-400 hover:text-white'
                  }`}
                >
                  Sells
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            <p className="mt-4 text-gray-400">Loading transactions...</p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && filteredTransactions.length === 0 && (
          <div className="bg-secondary-light border border-gray-700 rounded-xl p-12 text-center">
            <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold mb-2">No Transactions Found</h2>
            <p className="text-gray-400 mb-6">Start trading to see your transaction history</p>
            <Link
              href="/tokens"
              className="inline-block bg-primary text-black px-6 py-3 rounded-lg font-bold hover:bg-primary-dark transition"
            >
              Browse Tokens
            </Link>
          </div>
        )}

        {/* Transactions List */}
        {!isLoading && filteredTransactions.length > 0 && (
          <div className="space-y-3">
            {filteredTransactions.map((tx) => (
              <div
                key={tx.hash}
                className="bg-secondary-light border border-gray-700 rounded-xl p-6 hover:border-primary/50 transition"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-semibold ${
                          tx.type === 'buy'
                            ? 'bg-green-500/20 text-green-500'
                            : 'bg-red-500/20 text-red-500'
                        }`}
                      >
                        {tx.type === 'buy' ? '↑ BUY' : '↓ SELL'}
                      </span>
                      <span className="text-gray-400 text-sm">{formatTimeAgo(tx.timestamp)}</span>
                    </div>

                    <div className="grid md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-xs text-gray-400 mb-1">Token Amount</p>
                        <p className="font-semibold">
                          {parseFloat(tx.tokenAmountFormatted).toFixed(4)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 mb-1">ASTER Amount</p>
                        <p className="font-semibold text-primary">
                          {parseFloat(tx.asterAmountFormatted).toFixed(4)} ASTER
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 mb-1">Time</p>
                        <p className="text-sm text-gray-300">{formatTime(tx.timestamp)}</p>
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-gray-700">
                      <p className="text-xs text-gray-400">Transaction Hash</p>
                      <a
                        href={`https://testnet.bscscan.com/tx/${tx.hash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-mono text-primary hover:underline"
                      >
                        {tx.hash.slice(0, 10)}...{tx.hash.slice(-8)}
                      </a>
                    </div>
                  </div>

                  <a
                    href={`https://testnet.bscscan.com/tx/${tx.hash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-4 text-gray-400 hover:text-primary transition"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Stats Summary */}
        {!isLoading && filteredTransactions.length > 0 && (
          <div className="mt-8 grid md:grid-cols-3 gap-4">
            <div className="bg-secondary-light border border-gray-700 rounded-xl p-6">
              <p className="text-sm text-gray-400 mb-1">Total Transactions</p>
              <p className="text-3xl font-bold">{filteredTransactions.length}</p>
            </div>
            <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-6">
              <p className="text-sm text-gray-400 mb-1">Total Buys</p>
              <p className="text-3xl font-bold text-green-500">
                {filteredTransactions.filter(tx => tx.type === 'buy').length}
              </p>
            </div>
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6">
              <p className="text-sm text-gray-400 mb-1">Total Sells</p>
              <p className="text-3xl font-bold text-red-500">
                {filteredTransactions.filter(tx => tx.type === 'sell').length}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

'use client'

import { useState, useMemo, useEffect } from 'react'
import { useAccount } from 'wagmi'
import Link from 'next/link'
import { useTokenList } from '@/lib/hooks/useTokenList'
import { useTransactionHistory } from '@/lib/hooks/useTransactionHistory'
import { TransactionCard } from '@/components/TransactionCard'

export default function HistoryPage() {
  const { address, isConnected } = useAccount()
  const { tokens } = useTokenList()
  const [selectedToken, setSelectedToken] = useState<string>('')
  const [filter, setFilter] = useState<'all' | 'buy' | 'sell'>('all')
  const [displayLimit, setDisplayLimit] = useState(10)

  // When a specific token is selected, fetch its transactions
  // When "All Tokens" is selected, fetch from all user tokens
  const { transactions: singleTokenTxs, isLoading: singleTokenLoading } = useTransactionHistory(
    selectedToken || undefined,
    isConnected && selectedToken ? address : undefined
  )

  // Fetch transactions from all tokens when no specific token is selected
  const [allTransactions, setAllTransactions] = useState<any[]>([])
  const [allTxsLoading, setAllTxsLoading] = useState(false)

  // Fetch all user transactions across all tokens
  useEffect(() => {
    async function fetchAllUserTransactions() {
      if (!isConnected || !address || selectedToken) {
        setAllTransactions([])
        return
      }

      setAllTxsLoading(true)
      try {
        // Fetch all transactions from all tokens for this user
        const allTxs: any[] = []
        
        for (const token of tokens) {
          if (token.bondingCurve) {
            const response = await fetch(
              `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/trades/${token.bondingCurve}/history?userAddress=${address}`
            )
            if (response.ok) {
              const data = await response.json()
              if (data.success && data.data) {
                const formattedTxs = data.data.map((trade: any) => ({
                  hash: trade.transactionHash,
                  type: trade.type,
                  user: trade.user,
                  tokenAmount: BigInt(trade.tokenAmount),
                  tokenAmountFormatted: (Number(trade.tokenAmount) / 1e18).toString(),
                  asterAmount: BigInt(trade.asterAmount),
                  asterAmountFormatted: (Number(trade.asterAmount) / 1e18).toString(),
                  timestamp: new Date(trade.timestamp).getTime() / 1000,
                  blockNumber: BigInt(trade.blockNumber),
                  bondingCurve: trade.bondingCurve,
                  tokenName: token.name,
                  tokenSymbol: token.symbol,
                }))
                allTxs.push(...formattedTxs)
              }
            }
          }
        }
        
        // Sort by timestamp descending
        allTxs.sort((a, b) => b.timestamp - a.timestamp)
        setAllTransactions(allTxs)
      } catch (error) {
        console.error('Error fetching all transactions:', error)
      } finally {
        setAllTxsLoading(false)
      }
    }

    fetchAllUserTransactions()
  }, [isConnected, address, selectedToken, tokens])

  // Use the appropriate transaction list
  const transactions = selectedToken ? singleTokenTxs : allTransactions
  const isLoading = selectedToken ? singleTokenLoading : allTxsLoading

  const filteredTransactions = filter === 'all'
    ? transactions
    : transactions.filter(tx => tx.type === filter)

  // Apply pagination
  const displayedTransactions = filteredTransactions.slice(0, displayLimit)
  const hasMore = filteredTransactions.length > displayLimit

  // Calculate total volumes
  const { totalBuyVolume, totalSellVolume, totalVolume } = useMemo(() => {
    let buyVol = 0
    let sellVol = 0

    filteredTransactions.forEach(tx => {
      const amount = parseFloat(tx.asterAmountFormatted)
      if (tx.type === 'buy') {
        buyVol += amount
      } else {
        sellVol += amount
      }
    })

    return {
      totalBuyVolume: buyVol,
      totalSellVolume: sellVol,
      totalVolume: buyVol + sellVol
    }
  }, [filteredTransactions])

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
          <>
            <div className="space-y-3">
              {displayedTransactions.map((tx) => (
                <TransactionCard
                  key={tx.hash}
                  transaction={tx}
                  formatTime={formatTime}
                  formatTimeAgo={formatTimeAgo}
                />
              ))}
            </div>

            {/* Load More Button */}
            {hasMore && (
              <div className="text-center mt-6">
                <button
                  onClick={() => setDisplayLimit(prev => prev + 10)}
                  className="px-6 py-3 bg-primary text-black rounded-lg font-bold hover:bg-primary/90 transition"
                >
                  Load More ({filteredTransactions.length - displayLimit} remaining)
                </button>
              </div>
            )}
          </>
        )}

        {/* Stats Summary */}
        {!isLoading && filteredTransactions.length > 0 && (
          <>
            {/* Transaction Count Stats */}
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

            {/* Volume Stats */}
            <div className="mt-4 grid md:grid-cols-3 gap-4">
              <div className="bg-secondary-light border border-gray-700 rounded-xl p-6">
                <p className="text-sm text-gray-400 mb-1">Total Volume</p>
                <p className="text-2xl font-bold text-primary">
                  {totalVolume.toFixed(4)} ASTER
                </p>
              </div>
              <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-6">
                <p className="text-sm text-gray-400 mb-1">Buy Volume</p>
                <p className="text-2xl font-bold text-green-500">
                  {totalBuyVolume.toFixed(4)} ASTER
                </p>
              </div>
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6">
                <p className="text-sm text-gray-400 mb-1">Sell Volume</p>
                <p className="text-2xl font-bold text-red-500">
                  {totalSellVolume.toFixed(4)} ASTER
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

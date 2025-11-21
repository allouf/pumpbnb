'use client'

import { useMemo } from 'react'
import { Transaction } from '@/lib/hooks/useTransactionHistory'

interface TransactionCardProps {
  transaction: Transaction
  formatTimeAgo: (timestamp: number) => string
  formatTime: (timestamp: number) => string
}

export function TransactionCard({ transaction, formatTimeAgo, formatTime }: TransactionCardProps) {
  const { type, hash, tokenAmountFormatted, asterAmountFormatted, timestamp, price } = transaction

  // Use price from backend if available, otherwise calculate
  const pricePerToken = useMemo(() => {
    // If backend provides price (with 18 decimals), use that
    if (price) {
      return Number(price) / 1e18
    }

    // Fallback: calculate from amounts
    const tokenAmount = parseFloat(tokenAmountFormatted)
    const asterAmount = parseFloat(asterAmountFormatted)

    if (tokenAmount === 0) return 0

    // For buy: ASTER spent / tokens received
    // For sell: ASTER received / tokens sold
    return asterAmount / tokenAmount
  }, [price, tokenAmountFormatted, asterAmountFormatted])

  // Calculate estimated fee (1% of trade)
  const estimatedFee = useMemo(() => {
    const asterAmount = parseFloat(asterAmountFormatted)
    return asterAmount * 0.01
  }, [asterAmountFormatted])

  const isBuy = type === 'buy'

  return (
    <div className="bg-secondary-light border border-gray-700 rounded-xl p-6 hover:border-primary/50 transition">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          {/* Transaction Type and Time */}
          <div className="flex items-center gap-3 mb-3">
            <span
              className={`px-3 py-1 rounded-full text-sm font-semibold ${
                isBuy ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'
              }`}
            >
              {isBuy ? '↑ BUY' : '↓ SELL'}
            </span>
            <span className="text-gray-400 text-sm">{formatTimeAgo(timestamp)}</span>
          </div>

          {/* Transaction Details Grid */}
          <div className="grid md:grid-cols-4 gap-4 mb-3">
            {/* Token Amount */}
            <div>
              <p className="text-xs text-gray-400 mb-1">Token Amount</p>
              <p className="font-semibold">
                {parseFloat(tokenAmountFormatted).toFixed(4)}
              </p>
            </div>

            {/* ASTER Amount */}
            <div>
              <p className="text-xs text-gray-400 mb-1">ASTER Amount</p>
              <p className="font-semibold text-primary">
                {parseFloat(asterAmountFormatted).toFixed(4)} ASTER
              </p>
            </div>

            {/* Price Per Token */}
            <div>
              <p className="text-xs text-gray-400 mb-1">Price Per Token</p>
              <p className="font-semibold text-gray-300">
                {pricePerToken.toFixed(8)} ASTER
              </p>
            </div>

            {/* Estimated Fee */}
            <div>
              <p className="text-xs text-gray-400 mb-1">Est. Fee (1%)</p>
              <p className="font-semibold text-gray-400">
                {estimatedFee.toFixed(6)} ASTER
              </p>
            </div>
          </div>

          {/* Trade Summary */}
          <div className="bg-secondary/50 rounded-lg p-3 mb-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">
                {isBuy ? 'Spent' : 'Received'}:
              </span>
              <span className={`font-semibold ${isBuy ? 'text-red-400' : 'text-green-400'}`}>
                {isBuy ? '-' : '+'}{parseFloat(asterAmountFormatted).toFixed(4)} ASTER
              </span>
            </div>
            <div className="flex items-center justify-between text-sm mt-1">
              <span className="text-gray-400">
                {isBuy ? 'Received' : 'Sent'}:
              </span>
              <span className={`font-semibold ${isBuy ? 'text-green-400' : 'text-red-400'}`}>
                {isBuy ? '+' : '-'}{parseFloat(tokenAmountFormatted).toFixed(4)} tokens
              </span>
            </div>
          </div>

          {/* Transaction Hash and Time */}
          <div className="pt-3 border-t border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400 mb-1">Transaction Hash</p>
                <a
                  href={`https://testnet.bscscan.com/tx/${hash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-mono text-primary hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  {hash.slice(0, 10)}...{hash.slice(-8)}
                </a>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-400 mb-1">Time</p>
                <p className="text-sm text-gray-300">{formatTime(timestamp)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* External Link Icon */}
        <a
          href={`https://testnet.bscscan.com/tx/${hash}`}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-4 text-gray-400 hover:text-primary transition"
          onClick={(e) => e.stopPropagation()}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
            />
          </svg>
        </a>
      </div>
    </div>
  )
}

'use client'

import Link from 'next/link'
import { Address } from 'viem'
import { TokenAvatar } from './TokenAvatar'
import { useTokenPrice } from '@/lib/hooks/useTokenPrice'
import { TokenHolding } from '@/lib/hooks/useUserPortfolio'

interface PortfolioHoldingCardProps {
  holding: TokenHolding
}

export function PortfolioHoldingCard({ holding }: PortfolioHoldingCardProps) {
  const {
    currentPriceFormatted,
    priceChange24hPercent,
    liquidityFormatted
  } = useTokenPrice(holding.bondingCurveAddress as Address, BigInt(1000000000 * 1e18)) // 1B supply

  const priceChange24hIsPositive = priceChange24hPercent >= 0

  return (
    <Link
      href={`/token/${holding.tokenAddress}`}
      className="bg-secondary-light border border-gray-700 rounded-xl p-6 hover:border-primary transition-all group"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <TokenAvatar symbol={holding.symbol} size="md" />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold group-hover:text-primary transition">
                  {holding.name}
                </h3>
                {holding.isGraduated && (
                  <span className="bg-green-500/20 text-green-500 px-2 py-0.5 rounded-full text-xs font-semibold">
                    Graduated
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 mt-1">
                <p className="text-sm text-gray-400">{holding.symbol}</p>
                {priceChange24hPercent !== 0 && (
                  <div className={`flex items-center gap-1 text-xs font-semibold ${
                    priceChange24hIsPositive ? 'text-green-500' : 'text-red-500'
                  }`}>
                    <span>{priceChange24hIsPositive ? '↑' : '↓'}</span>
                    <span>{Math.abs(priceChange24hPercent).toFixed(2)}%</span>
                    <span className="text-gray-500">24h</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4">
            {/* Balance */}
            <div>
              <p className="text-xs text-gray-400 mb-1">Balance</p>
              <p className="font-semibold">
                {parseFloat(holding.balanceFormatted).toFixed(2)} {holding.symbol}
              </p>
            </div>

            {/* Current Price */}
            <div>
              <p className="text-xs text-gray-400 mb-1">Price</p>
              <p className="font-semibold text-primary">
                {parseFloat(currentPriceFormatted).toFixed(8)} ASTER
              </p>
            </div>

            {/* Value */}
            <div>
              <p className="text-xs text-gray-400 mb-1">Value</p>
              <p className="font-semibold text-primary">
                {parseFloat(holding.valueInAsterFormatted).toFixed(4)} ASTER
              </p>
            </div>

            {/* Liquidity */}
            <div>
              <p className="text-xs text-gray-400 mb-1">Liquidity</p>
              <p className="font-semibold text-gray-300">
                {parseFloat(liquidityFormatted).toFixed(2)} ASTER
              </p>
            </div>

            {/* Token Address */}
            <div>
              <p className="text-xs text-gray-400 mb-1">Token</p>
              <p className="font-mono text-xs text-gray-400">
                {holding.tokenAddress.slice(0, 6)}...{holding.tokenAddress.slice(-4)}
              </p>
            </div>
          </div>
        </div>

        <div className="ml-4">
          <svg
            className="w-6 h-6 text-gray-400 group-hover:text-primary group-hover:translate-x-1 transition-all"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </Link>
  )
}

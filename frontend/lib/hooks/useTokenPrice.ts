'use client'

import { useEffect, useState, useMemo } from 'react'
import { Address, formatUnits, parseUnits } from 'viem'
import { useBondingCurveReserves } from './useContracts'

export interface TokenPriceData {
  // Current price (ASTER per token)
  currentPrice: number
  currentPriceFormatted: string

  // 24h price change
  priceChange24h: number
  priceChange24hPercent: number

  // Market cap in ASTER
  marketCapInAster: bigint
  marketCapFormatted: string

  // Liquidity
  liquidityInAster: bigint
  liquidityFormatted: string

  // Volume (would need backend data)
  volume24h?: number
}

interface PriceHistory {
  timestamp: number
  price: number
}

/**
 * Hook to fetch token price data from bonding curve reserves
 * Calculates current price and 24h change
 */
export function useTokenPrice(bondingCurveAddress?: Address, tokenSupply?: bigint) {
  const { data: reserves, refetch } = useBondingCurveReserves(bondingCurveAddress)
  const [priceHistory, setPriceHistory] = useState<PriceHistory[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Calculate current price
  const currentPrice = useMemo(() => {
    if (!reserves || !reserves[0] || !reserves[1]) return 0

    const [realAster, realTokens, virtualAster, virtualTokens] = reserves

    // Total reserves (real + virtual)
    const totalAster = realAster + virtualAster
    const totalTokens = realTokens + virtualTokens

    // Avoid division by zero
    if (totalTokens === 0n) return 0

    // Price = ASTER reserves / Token reserves
    // Convert to number for display (price in ASTER per token)
    const price = Number(formatUnits(totalAster, 18)) / Number(formatUnits(totalTokens, 18))

    return price
  }, [reserves])

  // Calculate market cap
  const marketCap = useMemo(() => {
    if (!tokenSupply || currentPrice === 0) return 0n

    // Market cap = total supply * current price
    const supply = Number(formatUnits(tokenSupply, 18))
    const mcap = supply * currentPrice

    return parseUnits(mcap.toFixed(18), 18)
  }, [tokenSupply, currentPrice])

  // Calculate liquidity (real ASTER in reserves)
  const liquidity = useMemo(() => {
    if (!reserves || !reserves[0]) return 0n
    return reserves[0] // realAster
  }, [reserves])

  // Store price history for 24h tracking
  useEffect(() => {
    if (currentPrice === 0) return

    const now = Date.now()

    setPriceHistory(prev => {
      const newHistory = [...prev, { timestamp: now, price: currentPrice }]

      // Keep only last 24 hours of data
      const cutoff = now - 24 * 60 * 60 * 1000
      return newHistory.filter(h => h.timestamp > cutoff)
    })
  }, [currentPrice])

  // Calculate 24h price change
  const priceChange24h = useMemo(() => {
    if (priceHistory.length < 2) return { change: 0, changePercent: 0 }

    const oldest = priceHistory[0]
    const newest = priceHistory[priceHistory.length - 1]

    const change = newest.price - oldest.price
    const changePercent = oldest.price > 0 ? (change / oldest.price) * 100 : 0

    return { change, changePercent }
  }, [priceHistory])

  // Auto-refetch every 10 seconds
  useEffect(() => {
    if (!bondingCurveAddress) return

    setIsLoading(false)
    const interval = setInterval(() => {
      refetch()
    }, 10000)

    return () => clearInterval(interval)
  }, [bondingCurveAddress, refetch])

  return {
    currentPrice,
    currentPriceFormatted: currentPrice.toFixed(8),
    priceChange24h: priceChange24h.change,
    priceChange24hPercent: priceChange24h.changePercent,
    marketCapInAster: marketCap,
    marketCapFormatted: formatUnits(marketCap, 18),
    liquidityInAster: liquidity,
    liquidityFormatted: formatUnits(liquidity, 18),
    isLoading,
    refetch,
  }
}

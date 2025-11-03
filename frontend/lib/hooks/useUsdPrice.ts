'use client'

import { useState, useEffect } from 'react'

interface UsdPriceData {
  usdRate: number
  isLoading: boolean
  error: string | null
  lastUpdated: Date | null
}

const CACHE_KEY = 'aster_usd_rate'
const CACHE_EXPIRY = 5 * 60 * 1000 // 5 minutes

interface CachedRate {
  rate: number
  timestamp: number
}

export function useUsdPrice(): UsdPriceData {
  const [data, setData] = useState<UsdPriceData>({
    usdRate: 0,
    isLoading: true,
    error: null,
    lastUpdated: null,
  })

  const fetchUsdRate = async () => {
    try {
      // Check cache first
      const cached = localStorage.getItem(CACHE_KEY)
      if (cached) {
        const parsedCache: CachedRate = JSON.parse(cached)
        if (Date.now() - parsedCache.timestamp < CACHE_EXPIRY) {
          setData({
            usdRate: parsedCache.rate,
            isLoading: false,
            error: null,
            lastUpdated: new Date(parsedCache.timestamp),
          })
          return
        }
      }

      setData(prev => ({ ...prev, isLoading: true, error: null }))

      // For now, we'll use a mock rate since ASTER isn't on major exchanges
      // In production, you'd integrate with an API that tracks ASTER price
      const mockAsterToUsd = 0.0025 // $0.0025 per ASTER

      // If ASTER were on CoinGecko, you'd use:
      // const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=astar&vs_currencies=usd')
      // const data = await response.json()
      // const rate = data.astar.usd

      const rate = mockAsterToUsd

      // Cache the result
      const cacheData: CachedRate = {
        rate,
        timestamp: Date.now(),
      }
      localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData))

      setData({
        usdRate: rate,
        isLoading: false,
        error: null,
        lastUpdated: new Date(),
      })
    } catch (error) {
      console.error('[useUsdPrice] Failed to fetch USD rate:', error)
      setData(prev => ({
        ...prev,
        isLoading: false,
        error: 'Failed to fetch USD price',
      }))
    }
  }

  useEffect(() => {
    fetchUsdRate()

    // Refresh every 5 minutes
    const interval = setInterval(fetchUsdRate, CACHE_EXPIRY)
    return () => clearInterval(interval)
  }, [])

  return data
}

// Utility function to convert ASTER to USD
export function asterToUsd(asterAmount: number, usdRate: number): number {
  return asterAmount * usdRate
}

// Utility function to format USD price
export function formatUsdPrice(usdAmount: number): string {
  if (usdAmount >= 1000000) {
    return `$${(usdAmount / 1000000).toFixed(2)}M`
  }
  if (usdAmount >= 1000) {
    return `$${(usdAmount / 1000).toFixed(2)}K`
  }
  if (usdAmount >= 1) {
    return `$${usdAmount.toFixed(2)}`
  }
  if (usdAmount >= 0.01) {
    return `$${usdAmount.toFixed(4)}`
  }
  return `$${usdAmount.toFixed(8)}`
}
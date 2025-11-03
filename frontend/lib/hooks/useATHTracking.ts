'use client'

import { useState, useEffect, useMemo } from 'react'

interface ATHData {
  price: number
  timestamp: number
  volume: number
  txHash?: string
}

interface ATHTrackingData {
  currentATH: ATHData | null
  previousATH: ATHData | null
  isNewATH: boolean
  athProgress: number
  daysFromATH: number
  percentFromATH: number
  historicalATHs: ATHData[]
  athCount: number
}

interface UseATHTrackingProps {
  tokenAddress: string
  currentPrice: number
  currentVolume: number
  transactions: any[]
}

const ATH_STORAGE_KEY = 'ath_tracking_'

export function useATHTracking({ 
  tokenAddress, 
  currentPrice, 
  currentVolume, 
  transactions 
}: UseATHTrackingProps): ATHTrackingData {
  const [athData, setAthData] = useState<ATHData[]>([])
  const [isNewATH, setIsNewATH] = useState(false)

  // Load stored ATH data
  useEffect(() => {
    const stored = localStorage.getItem(`${ATH_STORAGE_KEY}${tokenAddress}`)
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        setAthData(parsed)
      } catch (error) {
        console.error('[useATHTracking] Failed to parse stored ATH data:', error)
      }
    }
  }, [tokenAddress])

  // Calculate ATH data from transactions
  const calculatedATHs = useMemo(() => {
    if (transactions.length === 0) return []

    const athPoints: ATHData[] = []
    let currentHigh = 0

    // Sort transactions by timestamp
    const sortedTxs = [...transactions].sort((a, b) => a.timestamp - b.timestamp)

    sortedTxs.forEach(tx => {
      const asterAmount = Number(tx.asterAmountFormatted || 0)
      const tokenAmount = Number(tx.tokenAmountFormatted || 0)
      const price = tokenAmount > 0 ? asterAmount / tokenAmount : 0

      if (price > currentHigh && price > 0) {
        currentHigh = price
        athPoints.push({
          price,
          timestamp: tx.timestamp * 1000, // Convert to milliseconds
          volume: asterAmount,
          txHash: tx.hash,
        })
      }
    })

    return athPoints
  }, [transactions])

  // Merge calculated ATHs with stored data
  const allATHs = useMemo(() => {
    const merged = [...athData, ...calculatedATHs]
    
    // Remove duplicates and sort by timestamp
    const unique = merged.filter((ath, index, array) => 
      array.findIndex(a => Math.abs(a.timestamp - ath.timestamp) < 1000) === index
    )
    
    return unique.sort((a, b) => a.timestamp - b.timestamp)
  }, [athData, calculatedATHs])

  // Get current ATH
  const currentATH = useMemo(() => {
    if (allATHs.length === 0) return null
    return allATHs.reduce((highest, current) => 
      current.price > highest.price ? current : highest
    )
  }, [allATHs])

  // Check for new ATH
  useEffect(() => {
    if (currentPrice > 0 && currentATH && currentPrice > currentATH.price) {
      const newATH: ATHData = {
        price: currentPrice,
        timestamp: Date.now(),
        volume: currentVolume,
      }

      const updatedATHs = [...allATHs, newATH]
      setAthData(updatedATHs)
      setIsNewATH(true)

      // Store updated ATH data
      localStorage.setItem(
        `${ATH_STORAGE_KEY}${tokenAddress}`, 
        JSON.stringify(updatedATHs)
      )

      // Reset new ATH flag after 5 seconds
      const timer = setTimeout(() => setIsNewATH(false), 5000)
      return () => clearTimeout(timer)
    }
  }, [currentPrice, currentATH, currentVolume, tokenAddress, allATHs])

  // Calculate derived data
  const derivedData = useMemo(() => {
    const previousATH = allATHs.length > 1 
      ? allATHs[allATHs.length - 2] 
      : null

    const athProgress = currentATH && currentPrice > 0
      ? (currentPrice / currentATH.price) * 100
      : 0

    const daysFromATH = currentATH
      ? Math.floor((Date.now() - currentATH.timestamp) / (1000 * 60 * 60 * 24))
      : 0

    const percentFromATH = currentATH && currentPrice > 0
      ? ((currentATH.price - currentPrice) / currentATH.price) * 100
      : 0

    return {
      previousATH,
      athProgress,
      daysFromATH,
      percentFromATH,
    }
  }, [allATHs, currentATH, currentPrice])

  return {
    currentATH,
    previousATH: derivedData.previousATH,
    isNewATH,
    athProgress: derivedData.athProgress,
    daysFromATH: derivedData.daysFromATH,
    percentFromATH: derivedData.percentFromATH,
    historicalATHs: allATHs,
    athCount: allATHs.length,
  }
}

// Utility function to format ATH achievement message
export function formatATHMessage(athData: ATHData, isFirst: boolean = false): string {
  const timeAgo = Date.now() - athData.timestamp
  const hours = Math.floor(timeAgo / (1000 * 60 * 60))
  const days = Math.floor(hours / 24)

  if (isFirst) {
    return `🎉 First All-Time High reached: ${athData.price.toFixed(8)} ASTER!`
  }

  if (days > 0) {
    return `🚀 New ATH after ${days} day${days > 1 ? 's' : ''}!`
  } else if (hours > 0) {
    return `🚀 New ATH after ${hours} hour${hours > 1 ? 's' : ''}!`
  } else {
    return `🚀 New All-Time High reached!`
  }
}

// Utility to get ATH performance badge
export function getATHBadge(percentFromATH: number): {
  color: string
  text: string
  emoji: string
} {
  if (percentFromATH <= 0) {
    return { color: 'green', text: 'AT ATH', emoji: '👑' }
  } else if (percentFromATH <= 5) {
    return { color: 'yellow', text: 'Near ATH', emoji: '🔥' }
  } else if (percentFromATH <= 20) {
    return { color: 'orange', text: 'Below ATH', emoji: '📈' }
  } else if (percentFromATH <= 50) {
    return { color: 'red', text: 'Well Below ATH', emoji: '📉' }
  } else {
    return { color: 'gray', text: 'Far from ATH', emoji: '💤' }
  }
}
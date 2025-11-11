'use client'

import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'

export interface LocalTrade {
  id: string
  tokenAddress: string
  trader: string
  isBuy: boolean
  amountIn: string
  amountOut: string
  fee: string
  timestamp: string
  txHash: string
  blockNumber: number // Make this required with default 0
  price?: string | null
  marketCap?: string | null
  asterAmount?: string | null
  tokenAmount?: string | null
  isLocal: true // Flag to identify local trades
}

const CACHE_KEY = 'pumpbnb_local_trades'
const CACHE_EXPIRY = 24 * 60 * 60 * 1000 // 24 hours in milliseconds

interface CachedTradeData {
  trade: LocalTrade
  timestamp: number
}

export function useLocalTradeCache(tokenAddress: string) {
  const { address } = useAccount()
  const [localTrades, setLocalTrades] = useState<LocalTrade[]>([])

  // Load cached trades on mount
  useEffect(() => {
    try {
      const cached = localStorage.getItem(CACHE_KEY)
      if (cached) {
        const allCachedTrades: CachedTradeData[] = JSON.parse(cached)
        const now = Date.now()
        
        // Filter valid, non-expired trades for this token
        const validTrades = allCachedTrades
          .filter(item => {
            return item.timestamp + CACHE_EXPIRY > now && 
                   item.trade.tokenAddress === tokenAddress
          })
          .map(item => item.trade)
        
        setLocalTrades(validTrades)
        
        // Clean up expired trades
        const cleanedTrades = allCachedTrades.filter(item => 
          item.timestamp + CACHE_EXPIRY > now
        )
        localStorage.setItem(CACHE_KEY, JSON.stringify(cleanedTrades))
      }
    } catch (error) {
      console.error('[useLocalTradeCache] Error loading cached trades:', error)
    }
  }, [tokenAddress])

  const addLocalTrade = (tradeData: Omit<LocalTrade, 'id' | 'isLocal'>) => {
    try {
      const newTrade: LocalTrade = {
        ...tradeData,
        id: `local_${tradeData.txHash}`,
        isLocal: true,
      }

      // Add to current state
      setLocalTrades(prev => [newTrade, ...prev])

      // Save to localStorage
      const cached = localStorage.getItem(CACHE_KEY)
      const allCachedTrades: CachedTradeData[] = cached ? JSON.parse(cached) : []
      
      // Check if trade already exists
      const existingIndex = allCachedTrades.findIndex(item => 
        item.trade.txHash === tradeData.txHash
      )
      
      const cacheItem: CachedTradeData = {
        trade: newTrade,
        timestamp: Date.now()
      }

      if (existingIndex >= 0) {
        // Update existing trade
        allCachedTrades[existingIndex] = cacheItem
      } else {
        // Add new trade
        allCachedTrades.unshift(cacheItem)
      }

      // Keep only last 100 trades to prevent localStorage bloat
      const trimmedTrades = allCachedTrades.slice(0, 100)
      localStorage.setItem(CACHE_KEY, JSON.stringify(trimmedTrades))

      console.log('[useLocalTradeCache] ✅ Trade cached locally:', newTrade)
    } catch (error) {
      console.error('[useLocalTradeCache] Error saving trade to cache:', error)
    }
  }

  const removeLocalTrade = (txHash: string) => {
    try {
      // Remove from current state
      setLocalTrades(prev => prev.filter(trade => trade.txHash !== txHash))

      // Remove from localStorage
      const cached = localStorage.getItem(CACHE_KEY)
      if (cached) {
        const allCachedTrades: CachedTradeData[] = JSON.parse(cached)
        const filteredTrades = allCachedTrades.filter(item => 
          item.trade.txHash !== txHash
        )
        localStorage.setItem(CACHE_KEY, JSON.stringify(filteredTrades))
      }

      console.log('[useLocalTradeCache] ✅ Local trade removed:', txHash)
    } catch (error) {
      console.error('[useLocalTradeCache] Error removing cached trade:', error)
    }
  }

  const clearExpiredTrades = () => {
    try {
      const cached = localStorage.getItem(CACHE_KEY)
      if (cached) {
        const allCachedTrades: CachedTradeData[] = JSON.parse(cached)
        const now = Date.now()
        
        const validTrades = allCachedTrades.filter(item => 
          item.timestamp + CACHE_EXPIRY > now
        )
        
        localStorage.setItem(CACHE_KEY, JSON.stringify(validTrades))
        
        // Update state for current token
        const currentTokenTrades = validTrades
          .filter(item => item.trade.tokenAddress === tokenAddress)
          .map(item => item.trade)
        
        setLocalTrades(currentTokenTrades)
      }
    } catch (error) {
      console.error('[useLocalTradeCache] Error clearing expired trades:', error)
    }
  }

  return {
    localTrades,
    addLocalTrade,
    removeLocalTrade,
    clearExpiredTrades,
  }
}
'use client'

import { useState, useEffect, useMemo } from 'react'
import { useUsdPrice, asterToUsd, formatUsdPrice } from '@/lib/hooks/useUsdPrice'

interface Achievement {
  id: string
  title: string
  description: string
  icon: string
  category: 'trading' | 'social' | 'milestone' | 'special'
  condition: (data: TradeData) => boolean
  points: number
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  unlockedAt?: number
}

interface TradeData {
  totalVolume: number
  totalTrades: number
  biggestTrade: number
  currentPrice: number
  athPrice: number
  marketCap: number
  daysActive: number
  uniqueTraders: number
  consecutiveDaysWithTrades: number
}

interface Milestone {
  id: string
  title: string
  description: string
  targetValue: number
  currentValue: number
  icon: string
  color: string
  category: 'price' | 'volume' | 'market_cap' | 'holders'
}

interface GamificationSystemProps {
  tokenAddress: string
  tokenSymbol: string
  tradeData: TradeData
  onAchievementUnlocked?: (achievement: Achievement) => void
  className?: string
}

export function GamificationSystem({ 
  tokenAddress,
  tokenSymbol, 
  tradeData, 
  onAchievementUnlocked,
  className = '' 
}: GamificationSystemProps) {
  const { usdRate } = useUsdPrice()
  const [unlockedAchievements, setUnlockedAchievements] = useState<Set<string>>(new Set())
  const [showCelebration, setShowCelebration] = useState<Achievement | null>(null)
  const [recentlyUnlocked, setRecentlyUnlocked] = useState<Achievement[]>([])

  // Define all achievements
  const achievements: Achievement[] = useMemo(() => [
    // Trading Achievements
    {
      id: 'first_trade',
      title: 'First Steps',
      description: 'Make your first trade',
      icon: '🎯',
      category: 'trading',
      condition: (data) => data.totalTrades >= 1,
      points: 10,
      rarity: 'common'
    },
    {
      id: 'whale_trade',
      title: 'Whale Alert',
      description: 'Make a trade worth over 10 ASTER',
      icon: '🐋',
      category: 'trading',
      condition: (data) => data.biggestTrade >= 10,
      points: 50,
      rarity: 'rare'
    },
    {
      id: 'volume_king',
      title: 'Volume King',
      description: 'Generate 100 ASTER in total volume',
      icon: '👑',
      category: 'trading',
      condition: (data) => data.totalVolume >= 100,
      points: 100,
      rarity: 'epic'
    },
    {
      id: 'diamond_hands',
      title: 'Diamond Hands',
      description: 'Hold through 50% price swings',
      icon: '💎',
      category: 'trading',
      condition: (data) => data.daysActive >= 7 && data.currentPrice > 0,
      points: 75,
      rarity: 'rare'
    },

    // Milestone Achievements
    {
      id: 'moon_shot',
      title: 'To The Moon!',
      description: 'Reach new All-Time High',
      icon: '🚀',
      category: 'milestone',
      condition: (data) => data.currentPrice >= data.athPrice && data.athPrice > 0,
      points: 200,
      rarity: 'legendary'
    },
    {
      id: 'market_cap_million',
      title: 'Millionaire Status',
      description: 'Reach 1M ASTER market cap',
      icon: '💰',
      category: 'milestone',
      condition: (data) => data.marketCap >= 1000000,
      points: 500,
      rarity: 'legendary'
    },
    {
      id: 'community_builder',
      title: 'Community Builder',
      description: 'Attract 100 unique traders',
      icon: '🏘️',
      category: 'social',
      condition: (data) => data.uniqueTraders >= 100,
      points: 150,
      rarity: 'epic'
    },
    {
      id: 'early_adopter',
      title: 'Early Adopter',
      description: 'Trade within the first 24 hours',
      icon: '⏰',
      category: 'special',
      condition: (data) => data.daysActive <= 1 && data.totalTrades > 0,
      points: 25,
      rarity: 'rare'
    },

    // Special Achievements
    {
      id: 'phoenix',
      title: 'Phoenix Rising',
      description: 'Recover from a 70% drop',
      icon: '🔥',
      category: 'special',
      condition: (data) => data.currentPrice > 0 && data.athPrice > 0,
      points: 300,
      rarity: 'legendary'
    },
    {
      id: 'consistency',
      title: 'Consistent Trader',
      description: 'Trade for 7 consecutive days',
      icon: '📈',
      category: 'trading',
      condition: (data) => data.consecutiveDaysWithTrades >= 7,
      points: 100,
      rarity: 'epic'
    }
  ], [])

  // Define milestones
  const milestones: Milestone[] = useMemo(() => [
    {
      id: 'price_0001',
      title: 'Price Discovery',
      description: 'Reach 0.001 ASTER per token',
      targetValue: 0.001,
      currentValue: tradeData.currentPrice,
      icon: '💫',
      color: 'blue',
      category: 'price'
    },
    {
      id: 'volume_1000',
      title: 'Volume Milestone',
      description: 'Generate 1000 ASTER in volume',
      targetValue: 1000,
      currentValue: tradeData.totalVolume,
      icon: '📊',
      color: 'green',
      category: 'volume'
    },
    {
      id: 'market_cap_10k',
      title: 'Market Cap Growth',
      description: 'Reach 10,000 ASTER market cap',
      targetValue: 10000,
      currentValue: tradeData.marketCap,
      icon: '🎯',
      color: 'purple',
      category: 'market_cap'
    },
    {
      id: 'traders_50',
      title: 'Community Growth',
      description: 'Attract 50 unique traders',
      targetValue: 50,
      currentValue: tradeData.uniqueTraders,
      icon: '👥',
      color: 'orange',
      category: 'holders'
    }
  ], [tradeData])

  // Load unlocked achievements from storage
  useEffect(() => {
    const stored = localStorage.getItem(`achievements_${tokenAddress}`)
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        setUnlockedAchievements(new Set(parsed))
      } catch (error) {
        console.error('[GamificationSystem] Failed to load achievements:', error)
      }
    }
  }, [tokenAddress])

  // Check for new achievements
  useEffect(() => {
    const newAchievements: Achievement[] = []

    achievements.forEach(achievement => {
      if (!unlockedAchievements.has(achievement.id) && achievement.condition(tradeData)) {
        newAchievements.push({
          ...achievement,
          unlockedAt: Date.now()
        })
      }
    })

    if (newAchievements.length > 0) {
      const updatedUnlocked = new Set([...unlockedAchievements, ...newAchievements.map(a => a.id)])
      setUnlockedAchievements(updatedUnlocked)
      setRecentlyUnlocked(prev => [...prev, ...newAchievements])

      // Save to storage
      localStorage.setItem(`achievements_${tokenAddress}`, JSON.stringify(Array.from(updatedUnlocked)))

      // Show celebration for the first new achievement
      if (newAchievements[0]) {
        setShowCelebration(newAchievements[0])
        onAchievementUnlocked?.(newAchievements[0])
      }
    }
  }, [tradeData, achievements, unlockedAchievements, tokenAddress, onAchievementUnlocked])

  // Clear celebration after 5 seconds
  useEffect(() => {
    if (showCelebration) {
      const timer = setTimeout(() => setShowCelebration(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [showCelebration])

  const totalPoints = achievements
    .filter(a => unlockedAchievements.has(a.id))
    .reduce((sum, a) => sum + a.points, 0)

  const completedMilestones = milestones.filter(m => m.currentValue >= m.targetValue).length
  const totalMilestones = milestones.length

  const getRarityColor = (rarity: Achievement['rarity']) => {
    switch (rarity) {
      case 'common': return 'text-gray-400 border-gray-400'
      case 'rare': return 'text-blue-400 border-blue-400'
      case 'epic': return 'text-purple-400 border-purple-400'
      case 'legendary': return 'text-yellow-400 border-yellow-400'
    }
  }

  const getMilestoneColor = (color: string) => {
    switch (color) {
      case 'blue': return 'bg-blue-500'
      case 'green': return 'bg-green-500'
      case 'purple': return 'bg-purple-500'
      case 'orange': return 'bg-orange-500'
      default: return 'bg-gray-500'
    }
  }

  return (
    <>
      <div className={`bg-gray-900 rounded-xl border border-gray-800 p-6 ${className}`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-white mb-2">
              🏆 {tokenSymbol} Achievements
            </h2>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-yellow-400">⭐</span>
                <span className="text-gray-400">{totalPoints} points</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-primary">🎯</span>
                <span className="text-gray-400">{unlockedAchievements.size}/{achievements.length} unlocked</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-400">📊</span>
                <span className="text-gray-400">{completedMilestones}/{totalMilestones} milestones</span>
              </div>
            </div>
          </div>
          
          {recentlyUnlocked.length > 0 && (
            <div className="text-right">
              <div className="text-xs text-gray-500 mb-1">Recently Unlocked</div>
              <div className="flex -space-x-2">
                {recentlyUnlocked.slice(-3).map((achievement) => (
                  <div
                    key={achievement.id}
                    className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center border-2 border-gray-900 animate-bounce"
                  >
                    <span className="text-sm">{achievement.icon}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-400">Achievement Progress</span>
            <span className="text-primary font-semibold">
              {Math.round((unlockedAchievements.size / achievements.length) * 100)}%
            </span>
          </div>
          <div className="w-full bg-gray-800 rounded-full h-3 overflow-hidden">
            <div
              className="bg-gradient-to-r from-primary to-green-500 h-3 rounded-full transition-all duration-1000 ease-out"
              style={{ width: `${(unlockedAchievements.size / achievements.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Milestones */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-white mb-3">🎯 Milestones</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {milestones.map((milestone) => {
              const progress = Math.min((milestone.currentValue / milestone.targetValue) * 100, 100)
              const isCompleted = milestone.currentValue >= milestone.targetValue
              
              return (
                <div
                  key={milestone.id}
                  className={`p-3 rounded-lg border transition-all ${
                    isCompleted 
                      ? 'bg-green-500/10 border-green-500/50' 
                      : 'bg-gray-800 border-gray-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{milestone.icon}</span>
                      <span className="font-semibold text-white text-sm">{milestone.title}</span>
                    </div>
                    {isCompleted && <span className="text-green-400 text-sm">✓</span>}
                  </div>
                  <p className="text-xs text-gray-400 mb-2">{milestone.description}</p>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-gray-500">
                      {milestone.currentValue.toFixed(milestone.category === 'price' ? 8 : 0)} / {milestone.targetValue}
                    </span>
                    <span className="font-semibold">{progress.toFixed(0)}%</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-1.5">
                    <div
                      className={`h-1.5 rounded-full transition-all duration-500 ${getMilestoneColor(milestone.color)}`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Achievement Gallery */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-3">🏅 Achievement Gallery</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {achievements.map((achievement) => {
              const isUnlocked = unlockedAchievements.has(achievement.id)
              
              return (
                <div
                  key={achievement.id}
                  className={`p-3 rounded-lg border transition-all ${
                    isUnlocked
                      ? `bg-gray-800 ${getRarityColor(achievement.rarity)}`
                      : 'bg-gray-900 border-gray-700 opacity-50'
                  }`}
                >
                  <div className="text-center">
                    <div className={`text-3xl mb-2 ${isUnlocked ? '' : 'grayscale'}`}>
                      {achievement.icon}
                    </div>
                    <h4 className={`font-semibold text-sm mb-1 ${
                      isUnlocked ? 'text-white' : 'text-gray-500'
                    }`}>
                      {achievement.title}
                    </h4>
                    <p className={`text-xs mb-2 ${
                      isUnlocked ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      {achievement.description}
                    </p>
                    <div className="flex items-center justify-between text-xs">
                      <span className={`px-2 py-1 rounded ${getRarityColor(achievement.rarity)} bg-opacity-20`}>
                        {achievement.rarity}
                      </span>
                      <span className="text-yellow-400">
                        ⭐ {achievement.points}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Achievement Celebration Modal */}
      {showCelebration && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-gradient-to-br from-yellow-400/20 to-orange-500/20 rounded-xl border-2 border-yellow-400 p-8 text-center max-w-md mx-auto animate-bounce">
            <div className="text-6xl mb-4 animate-pulse">🎉</div>
            <div className="text-4xl mb-4">{showCelebration.icon}</div>
            <h2 className="text-2xl font-bold text-white mb-2">Achievement Unlocked!</h2>
            <h3 className="text-xl font-semibold text-yellow-400 mb-2">{showCelebration.title}</h3>
            <p className="text-gray-300 mb-4">{showCelebration.description}</p>
            <div className="flex items-center justify-center gap-2 mb-4">
              <span className="text-yellow-400">⭐</span>
              <span className="font-bold text-yellow-400">+{showCelebration.points} points</span>
            </div>
            <div className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getRarityColor(showCelebration.rarity)}`}>
              {showCelebration.rarity.toUpperCase()}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// Hook for achievement system
export function useGamification(tokenAddress: string, tradeData: TradeData) {
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [totalPoints, setTotalPoints] = useState(0)
  
  return {
    achievements,
    totalPoints,
    // Add more hook functionality as needed
  }
}
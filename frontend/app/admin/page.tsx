'use client'

import { useState, useEffect } from 'react'
import { useAccount, useReadContract, useBalance } from 'wagmi'
import { formatUnits } from 'viem'
import Link from 'next/link'
import { CONTRACTS } from '@/lib/contracts/addresses'
import PlatformConfigArtifact from '@/lib/abis/PlatformConfig.json'

const PlatformConfigABI = PlatformConfigArtifact.abi

interface PlatformStats {
  overview: {
    totalTokens: number
    graduatedTokens: number
    graduationRate: string
    totalTrades: number
    totalUsers: number
    uniqueTraders: number
    totalVolume: string
    totalPlatformFees: string
  }
  last24h: {
    trades: number
    tokensCreated: number
    newUsers: number
    volume: string
    platformFees: string
  }
  last7d: {
    trades: number
    tokensCreated: number
    newUsers: number
  }
  topTokensByVolume: Array<{
    address: string
    name: string
    symbol: string
    volume24h: string
    trades24h: number
  }>
  timestamp: string
}

// List of admin wallet addresses (platform owners)
const ADMIN_WALLETS = [
  '0x3e947EF8DAf4c9Ee1ef2904F642Cc7d6f4C8Fe86', // Add your admin wallets here
].map(addr => addr.toLowerCase())

export default function AdminPage() {
  const { address, isConnected } = useAccount()
  const [stats, setStats] = useState<PlatformStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Read fee recipient from PlatformConfig contract
  const { data: protocolFeeRecipient } = useReadContract({
    address: CONTRACTS.PLATFORM_CONFIG as `0x${string}`,
    abi: PlatformConfigABI,
    functionName: 'protocolFeeRecipient',
  })

  // Read fee configuration from contract
  const { data: bondingCurveFee } = useReadContract({
    address: CONTRACTS.PLATFORM_CONFIG as `0x${string}`,
    abi: PlatformConfigABI,
    functionName: 'bondingCurveFee',
  })

  const { data: bondingCurveProtocolFee } = useReadContract({
    address: CONTRACTS.PLATFORM_CONFIG as `0x${string}`,
    abi: PlatformConfigABI,
    functionName: 'bondingCurveProtocolFee',
  })

  const { data: bondingCurveCreatorFee } = useReadContract({
    address: CONTRACTS.PLATFORM_CONFIG as `0x${string}`,
    abi: PlatformConfigABI,
    functionName: 'bondingCurveCreatorFee',
  })

  const { data: graduationThreshold } = useReadContract({
    address: CONTRACTS.PLATFORM_CONFIG as `0x${string}`,
    abi: PlatformConfigABI,
    functionName: 'graduationThreshold',
  })

  // Get fee wallet balance
  const { data: feeWalletBalance } = useBalance({
    address: protocolFeeRecipient as `0x${string}`,
    token: CONTRACTS.ASTER_TOKEN as `0x${string}`,
  })

  const { data: feeWalletBnbBalance } = useBalance({
    address: protocolFeeRecipient as `0x${string}`,
  })

  // Check if connected wallet is admin
  const isAdmin = isConnected && address && ADMIN_WALLETS.includes(address.toLowerCase())

  // Fetch platform stats
  const fetchStats = async (showLoading = true) => {
    try {
      if (showLoading && !stats) setIsLoading(true)
      setError(null)
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/platform-stats`)
      if (!response.ok) throw new Error('Failed to fetch platform stats')
      const data = await response.json()
      setStats(data.data)
    } catch (err: any) {
      // Only show error if we have no data to display
      if (!stats) {
        setError(err.message)
      }
      console.error('[Admin] Fetch error:', err.message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
    // Refresh every 60 seconds (reduced frequency to avoid issues)
    const interval = setInterval(() => fetchStats(false), 60000)
    return () => clearInterval(interval)
  }, [])

  const formatAster = (wei: string) => {
    try {
      // Check if it's already a decimal number (not wei)
      if (wei.includes('.')) {
        const value = parseFloat(wei || '0')
        if (value >= 1000000) return `${(value / 1000000).toFixed(2)}M`
        if (value >= 1000) return `${(value / 1000).toFixed(2)}K`
        return value.toFixed(4)
      }
      // Otherwise treat as wei (BigInt)
      const value = Number(formatUnits(BigInt(wei || '0'), 18))
      if (value >= 1000000) return `${(value / 1000000).toFixed(2)}M`
      if (value >= 1000) return `${(value / 1000).toFixed(2)}K`
      return value.toFixed(4)
    } catch {
      return '0.0000'
    }
  }

  const formatBps = (bps: bigint | undefined) => {
    if (!bps) return '0%'
    return `${(Number(bps) / 100).toFixed(2)}%`
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-secondary pt-20 sm:pt-24 px-3 sm:px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-secondary-light border border-gray-700 rounded-xl p-8 sm:p-12 text-center">
            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 sm:w-8 sm:h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold mb-2">Connect Your Wallet</h2>
            <p className="text-gray-400 text-sm sm:text-base">Connect your wallet to view the admin dashboard</p>
          </div>
        </div>
      </div>
    )
  }

  // Note: We show stats to everyone but mark it if not admin
  // In production, you might want to completely restrict access

  return (
    <div className="min-h-screen bg-secondary pt-20 sm:pt-24 px-3 sm:px-4 pb-12">
      <div className="max-w-7xl mx-auto">
        {/* Header - Mobile optimized */}
        <div className="mb-6 sm:mb-8">
          {/* Title row */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
            <div className="min-w-0">
              <h1 className="text-2xl sm:text-4xl font-bold mb-1 sm:mb-2">Admin Dashboard</h1>
              <p className="text-gray-400 text-sm sm:text-base">
                Platform statistics and revenue tracking
              </p>
            </div>

            {/* Controls row - stacks on mobile */}
            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
              <button
                onClick={() => fetchStats()}
                disabled={isLoading}
                className="flex items-center gap-1.5 sm:gap-2 bg-secondary-light border border-gray-700 px-3 sm:px-4 py-2 rounded-lg hover:border-primary transition disabled:opacity-50 text-sm"
              >
                <svg className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span className="hidden xs:inline">Refresh</span>
              </button>

              {!isAdmin && (
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg px-2.5 sm:px-4 py-2">
                  <p className="text-yellow-500 text-xs sm:text-sm whitespace-nowrap">
                    <span className="hidden sm:inline">⚠️ </span>View-only
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Fee Wallet Section - Mobile optimized */}
        <div className="mb-6 sm:mb-8 bg-gradient-to-r from-primary/20 to-blue-500/20 border border-primary/30 rounded-xl p-4 sm:p-6">
          <div className="flex flex-col gap-3 sm:gap-4 mb-4 sm:mb-6">
            <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-primary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
              <span className="truncate">Platform Fee Wallet</span>
            </h2>
            {/* Wallet Address with Copy */}
            {(() => {
              const walletAddr = protocolFeeRecipient as string | undefined;
              return (
                <div className="flex items-center gap-2 bg-secondary/50 rounded-lg px-3 py-2 w-fit max-w-full">
                  <span className="font-mono text-xs sm:text-sm text-gray-300 truncate">
                    {walletAddr
                      ? `${walletAddr.slice(0, 6)}...${walletAddr.slice(-4)}`
                      : 'Loading...'}
                  </span>
                  {walletAddr && (
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(walletAddr)
                        alert('Address copied!')
                      }}
                      className="p-1 sm:p-1.5 hover:bg-gray-600 rounded transition flex-shrink-0"
                      title="Copy address"
                    >
                      <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400 hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                  )}
                </div>
              );
            })()}
          </div>
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <div className="bg-secondary/30 rounded-xl p-3 sm:p-4 min-w-0">
              <p className="text-xs sm:text-sm text-gray-400 mb-1 sm:mb-2">ASTER Balance</p>
              <p className="text-lg sm:text-2xl md:text-3xl font-bold text-primary truncate">
                {feeWalletBalance
                  ? Number(formatUnits(feeWalletBalance.value, 18)).toLocaleString(undefined, { maximumFractionDigits: 2 })
                  : '...'}
              </p>
              <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5 sm:mt-1">ASTER</p>
            </div>
            <div className="bg-secondary/30 rounded-xl p-3 sm:p-4 min-w-0">
              <p className="text-xs sm:text-sm text-gray-400 mb-1 sm:mb-2">BNB Balance</p>
              <p className="text-lg sm:text-2xl md:text-3xl font-bold text-yellow-500 truncate">
                {feeWalletBnbBalance
                  ? Number(formatUnits(feeWalletBnbBalance.value, 18)).toFixed(4)
                  : '...'}
              </p>
              <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5 sm:mt-1">BNB</p>
            </div>
          </div>
        </div>

        {/* Fee Configuration - Mobile optimized */}
        <div className="mb-6 sm:mb-8 bg-secondary-light border border-gray-700 rounded-xl p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4">Fee Configuration</h2>
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <div className="bg-secondary rounded-lg p-3 sm:p-4 min-w-0">
              <p className="text-xs sm:text-sm text-gray-400 mb-0.5 sm:mb-1">Total Trading Fee</p>
              <p className="text-base sm:text-xl font-bold truncate">{formatBps(bondingCurveFee as bigint)}</p>
            </div>
            <div className="bg-secondary rounded-lg p-3 sm:p-4 min-w-0">
              <p className="text-xs sm:text-sm text-gray-400 mb-0.5 sm:mb-1">Protocol Share</p>
              <p className="text-base sm:text-xl font-bold text-primary truncate">{formatBps(bondingCurveProtocolFee as bigint)}</p>
            </div>
            <div className="bg-secondary rounded-lg p-3 sm:p-4 min-w-0">
              <p className="text-xs sm:text-sm text-gray-400 mb-0.5 sm:mb-1">Creator Share</p>
              <p className="text-base sm:text-xl font-bold text-green-500 truncate">{formatBps(bondingCurveCreatorFee as bigint)}</p>
            </div>
            <div className="bg-secondary rounded-lg p-3 sm:p-4 min-w-0">
              <p className="text-xs sm:text-sm text-gray-400 mb-0.5 sm:mb-1">Graduation</p>
              <p className="text-base sm:text-xl font-bold text-blue-500 truncate">
                {graduationThreshold ? `${formatUnits(graduationThreshold as bigint, 18)}` : '...'}
              </p>
              <p className="text-[10px] text-gray-500">ASTER</p>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-8 sm:py-12">
            <div className="inline-block animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-t-2 border-b-2 border-primary"></div>
            <p className="mt-3 sm:mt-4 text-gray-400 text-sm sm:text-base">Loading platform statistics...</p>
          </div>
        ) : error ? (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 sm:p-6 text-center">
            <p className="text-red-500 mb-3 sm:mb-4 text-sm sm:text-base">{error}</p>
            <button
              onClick={() => fetchStats()}
              className="bg-red-500 text-white px-4 sm:px-6 py-2 rounded-lg hover:bg-red-600 transition text-sm sm:text-base"
            >
              Retry
            </button>
          </div>
        ) : stats ? (
          <>
            {/* Overview Stats */}
            <div className="mb-6 sm:mb-8">
              <h2 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4">Platform Overview</h2>
              {/* First row: 4 cards */}
              <div className="grid grid-cols-2 gap-2 sm:gap-4 mb-2 sm:mb-4">
                <StatCard
                  label="Total Tokens"
                  value={stats.overview.totalTokens.toLocaleString()}
                  icon="🪙"
                />
                <StatCard
                  label="Graduated"
                  value={stats.overview.graduatedTokens.toLocaleString()}
                  subValue={`${stats.overview.graduationRate}%`}
                  icon="🎓"
                  color="blue"
                />
                <StatCard
                  label="Total Trades"
                  value={stats.overview.totalTrades.toLocaleString()}
                  icon="📊"
                />
                <StatCard
                  label="Unique Traders"
                  value={stats.overview.uniqueTraders.toLocaleString()}
                  icon="👥"
                />
              </div>
              {/* Second row: 3 cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-4">
                <StatCard
                  label="Registered Users"
                  value={stats.overview.totalUsers.toLocaleString()}
                  icon="👤"
                />
                <StatCard
                  label="Total Volume"
                  value={formatAster(stats.overview.totalVolume)}
                  subValue="ASTER"
                  icon="💰"
                  color="green"
                />
                <StatCard
                  label="Platform Fees"
                  value={formatAster(stats.overview.totalPlatformFees)}
                  subValue="ASTER"
                  icon="💎"
                  color="primary"
                  className="col-span-2 sm:col-span-1"
                />
              </div>
            </div>

            {/* 24h Stats */}
            <div className="mb-6 sm:mb-8">
              <h2 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4">Last 24 Hours</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 sm:gap-4">
                <StatCard
                  label="Trades"
                  value={stats.last24h.trades.toLocaleString()}
                  icon="📈"
                  small
                />
                <StatCard
                  label="Tokens Created"
                  value={stats.last24h.tokensCreated.toLocaleString()}
                  icon="✨"
                  small
                />
                <StatCard
                  label="New Users"
                  value={stats.last24h.newUsers.toLocaleString()}
                  icon="🆕"
                  small
                />
                <StatCard
                  label="Volume"
                  value={formatAster(stats.last24h.volume)}
                  subValue="ASTER"
                  icon="💵"
                  color="green"
                  small
                />
                <StatCard
                  label="Fees"
                  value={formatAster(stats.last24h.platformFees)}
                  subValue="ASTER"
                  icon="💰"
                  color="primary"
                  small
                  className="col-span-2 sm:col-span-1"
                />
              </div>
            </div>

            {/* 7d Stats */}
            <div className="mb-6 sm:mb-8">
              <h2 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4">Last 7 Days</h2>
              <div className="grid grid-cols-3 gap-2 sm:gap-4">
                <StatCard
                  label="Trades"
                  value={stats.last7d.trades.toLocaleString()}
                  icon="📊"
                  small
                />
                <StatCard
                  label="Tokens"
                  value={stats.last7d.tokensCreated.toLocaleString()}
                  icon="🪙"
                  small
                />
                <StatCard
                  label="Users"
                  value={stats.last7d.newUsers.toLocaleString()}
                  icon="👥"
                  small
                />
              </div>
            </div>

            {/* Top Tokens */}
            <div className="mb-6 sm:mb-8">
              <h2 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4">Top Tokens by 24h Volume</h2>
              <div className="bg-secondary-light border border-gray-700 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[400px]">
                    <thead className="bg-secondary">
                      <tr>
                        <th className="text-left px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-400 font-medium">#</th>
                        <th className="text-left px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-400 font-medium">Token</th>
                        <th className="text-right px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-400 font-medium">Volume</th>
                        <th className="text-right px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-400 font-medium">Trades</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.topTokensByVolume.map((token, index) => (
                        <tr key={token.address} className="border-t border-gray-700 hover:bg-secondary/50">
                          <td className="px-3 sm:px-4 py-2 sm:py-3 text-gray-400 text-sm">{index + 1}</td>
                          <td className="px-3 sm:px-4 py-2 sm:py-3">
                            <Link href={`/token/${token.address}`} className="hover:text-primary">
                              <span className="font-medium text-sm">{token.name}</span>
                              <span className="text-gray-400 ml-1 sm:ml-2 text-xs sm:text-sm">${token.symbol}</span>
                            </Link>
                          </td>
                          <td className="px-3 sm:px-4 py-2 sm:py-3 text-right text-green-500 font-medium text-xs sm:text-sm">
                            {formatAster(token.volume24h)}
                          </td>
                          <td className="px-3 sm:px-4 py-2 sm:py-3 text-right text-gray-300 text-xs sm:text-sm">
                            {token.trades24h.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                      {stats.topTokensByVolume.length === 0 && (
                        <tr>
                          <td colSpan={4} className="px-3 sm:px-4 py-6 sm:py-8 text-center text-gray-400 text-sm">
                            No trading activity yet
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Last Updated */}
            <div className="text-center text-xs sm:text-sm text-gray-500">
              Last updated: {new Date(stats.timestamp).toLocaleString()}
            </div>
          </>
        ) : null}
      </div>
    </div>
  )
}

function StatCard({
  label,
  value,
  subValue,
  icon,
  color = 'default',
  small = false,
  className = '',
}: {
  label: string
  value: string
  subValue?: string
  icon: string
  color?: 'default' | 'primary' | 'green' | 'blue'
  small?: boolean
  className?: string
}) {
  const colorClasses = {
    default: 'bg-secondary-light border-gray-700',
    primary: 'bg-primary/10 border-primary/30',
    green: 'bg-green-500/10 border-green-500/30',
    blue: 'bg-blue-500/10 border-blue-500/30',
  }

  const valueColorClasses = {
    default: 'text-white',
    primary: 'text-primary',
    green: 'text-green-500',
    blue: 'text-blue-500',
  }

  return (
    <div className={`border rounded-xl ${small ? 'p-2.5 sm:p-4' : 'p-3 sm:p-4'} ${colorClasses[color]} min-w-0 overflow-hidden ${className}`}>
      <div className="flex items-center gap-1.5 sm:gap-2 mb-1 sm:mb-2">
        <span className={small ? 'text-base sm:text-lg' : 'text-lg sm:text-2xl'}>{icon}</span>
        <p className={`text-gray-400 truncate ${small ? 'text-[10px] sm:text-xs' : 'text-xs sm:text-sm'}`}>{label}</p>
      </div>
      <p className={`font-bold ${valueColorClasses[color]} truncate ${small ? 'text-sm sm:text-lg' : 'text-base sm:text-2xl'}`}>
        {value}
      </p>
      {subValue && (
        <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5 truncate">{subValue}</p>
      )}
    </div>
  )
}

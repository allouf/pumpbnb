'use client'

import { useState, useEffect } from 'react'
import { useAccount, useReadContract, useBalance } from 'wagmi'
import { formatUnits } from 'viem'
import Link from 'next/link'
import { CONTRACTS } from '@/lib/contracts/addresses'
import PlatformConfigABI from '@/lib/abis/PlatformConfig.json'

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
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setIsLoading(true)
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/platform-stats`)
        if (!response.ok) throw new Error('Failed to fetch platform stats')
        const data = await response.json()
        setStats(data.data)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setIsLoading(false)
      }
    }

    fetchStats()
    // Refresh every 30 seconds
    const interval = setInterval(fetchStats, 30000)
    return () => clearInterval(interval)
  }, [])

  const formatAster = (wei: string) => {
    const value = Number(formatUnits(BigInt(wei || '0'), 18))
    if (value >= 1000000) return `${(value / 1000000).toFixed(2)}M`
    if (value >= 1000) return `${(value / 1000).toFixed(2)}K`
    return value.toFixed(4)
  }

  const formatBps = (bps: bigint | undefined) => {
    if (!bps) return '0%'
    return `${(Number(bps) / 100).toFixed(2)}%`
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
            <p className="text-gray-400">Connect your wallet to view the admin dashboard</p>
          </div>
        </div>
      </div>
    )
  }

  // Note: We show stats to everyone but mark it if not admin
  // In production, you might want to completely restrict access

  return (
    <div className="min-h-screen bg-secondary pt-24 px-4 pb-12">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">Admin Dashboard</h1>
            <p className="text-gray-400">
              Platform statistics and revenue tracking
            </p>
          </div>
          {!isAdmin && (
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg px-4 py-2">
              <p className="text-yellow-500 text-sm">
                ⚠️ View-only mode (not admin)
              </p>
            </div>
          )}
        </div>

        {/* Fee Wallet Section */}
        <div className="mb-8 bg-gradient-to-r from-primary/20 to-blue-500/20 border border-primary/30 rounded-xl p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
            Platform Fee Wallet
          </h2>
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-400 mb-1">Wallet Address</p>
              <p className="font-mono text-sm bg-secondary/50 rounded px-3 py-2 break-all">
                {protocolFeeRecipient as string || 'Loading...'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-400 mb-1">ASTER Balance</p>
              <p className="text-2xl font-bold text-primary">
                {feeWalletBalance ? `${Number(formatUnits(feeWalletBalance.value, 18)).toFixed(4)} ASTER` : 'Loading...'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-400 mb-1">BNB Balance</p>
              <p className="text-2xl font-bold text-yellow-500">
                {feeWalletBnbBalance ? `${Number(formatUnits(feeWalletBnbBalance.value, 18)).toFixed(4)} BNB` : 'Loading...'}
              </p>
            </div>
          </div>
        </div>

        {/* Fee Configuration */}
        <div className="mb-8 bg-secondary-light border border-gray-700 rounded-xl p-6">
          <h2 className="text-xl font-bold mb-4">Fee Configuration</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-secondary rounded-lg p-4">
              <p className="text-sm text-gray-400 mb-1">Total Trading Fee</p>
              <p className="text-xl font-bold">{formatBps(bondingCurveFee as bigint)}</p>
            </div>
            <div className="bg-secondary rounded-lg p-4">
              <p className="text-sm text-gray-400 mb-1">Protocol Share</p>
              <p className="text-xl font-bold text-primary">{formatBps(bondingCurveProtocolFee as bigint)}</p>
            </div>
            <div className="bg-secondary rounded-lg p-4">
              <p className="text-sm text-gray-400 mb-1">Creator Share</p>
              <p className="text-xl font-bold text-green-500">{formatBps(bondingCurveCreatorFee as bigint)}</p>
            </div>
            <div className="bg-secondary rounded-lg p-4">
              <p className="text-sm text-gray-400 mb-1">Graduation Threshold</p>
              <p className="text-xl font-bold text-blue-500">
                {graduationThreshold ? `${formatUnits(graduationThreshold as bigint, 18)} ASTER` : 'Loading...'}
              </p>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            <p className="mt-4 text-gray-400">Loading platform statistics...</p>
          </div>
        ) : error ? (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 text-center">
            <p className="text-red-500">{error}</p>
          </div>
        ) : stats ? (
          <>
            {/* Overview Stats */}
            <div className="mb-8">
              <h2 className="text-xl font-bold mb-4">Platform Overview</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard
                  label="Total Tokens"
                  value={stats.overview.totalTokens.toLocaleString()}
                  icon="🪙"
                />
                <StatCard
                  label="Graduated"
                  value={stats.overview.graduatedTokens.toLocaleString()}
                  subValue={`${stats.overview.graduationRate}% rate`}
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
                <StatCard
                  label="Registered Users"
                  value={stats.overview.totalUsers.toLocaleString()}
                  icon="👤"
                />
                <StatCard
                  label="Total Volume"
                  value={`${formatAster(stats.overview.totalVolume)} ASTER`}
                  icon="💰"
                  color="green"
                />
                <StatCard
                  label="Total Platform Fees"
                  value={`${formatAster(stats.overview.totalPlatformFees)} ASTER`}
                  icon="💎"
                  color="primary"
                />
              </div>
            </div>

            {/* 24h Stats */}
            <div className="mb-8">
              <h2 className="text-xl font-bold mb-4">Last 24 Hours</h2>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
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
                  value={`${formatAster(stats.last24h.volume)} ASTER`}
                  icon="💵"
                  color="green"
                  small
                />
                <StatCard
                  label="Platform Fees"
                  value={`${formatAster(stats.last24h.platformFees)} ASTER`}
                  icon="💰"
                  color="primary"
                  small
                />
              </div>
            </div>

            {/* 7d Stats */}
            <div className="mb-8">
              <h2 className="text-xl font-bold mb-4">Last 7 Days</h2>
              <div className="grid grid-cols-3 gap-4">
                <StatCard
                  label="Trades"
                  value={stats.last7d.trades.toLocaleString()}
                  icon="📊"
                  small
                />
                <StatCard
                  label="Tokens Created"
                  value={stats.last7d.tokensCreated.toLocaleString()}
                  icon="🪙"
                  small
                />
                <StatCard
                  label="New Users"
                  value={stats.last7d.newUsers.toLocaleString()}
                  icon="👥"
                  small
                />
              </div>
            </div>

            {/* Top Tokens */}
            <div className="mb-8">
              <h2 className="text-xl font-bold mb-4">Top Tokens by 24h Volume</h2>
              <div className="bg-secondary-light border border-gray-700 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-secondary">
                      <tr>
                        <th className="text-left px-4 py-3 text-sm text-gray-400 font-medium">#</th>
                        <th className="text-left px-4 py-3 text-sm text-gray-400 font-medium">Token</th>
                        <th className="text-right px-4 py-3 text-sm text-gray-400 font-medium">Volume 24h</th>
                        <th className="text-right px-4 py-3 text-sm text-gray-400 font-medium">Trades 24h</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.topTokensByVolume.map((token, index) => (
                        <tr key={token.address} className="border-t border-gray-700 hover:bg-secondary/50">
                          <td className="px-4 py-3 text-gray-400">{index + 1}</td>
                          <td className="px-4 py-3">
                            <Link href={`/token/${token.address}`} className="hover:text-primary">
                              <span className="font-medium">{token.name}</span>
                              <span className="text-gray-400 ml-2">${token.symbol}</span>
                            </Link>
                          </td>
                          <td className="px-4 py-3 text-right text-green-500 font-medium">
                            {formatAster(token.volume24h)} ASTER
                          </td>
                          <td className="px-4 py-3 text-right text-gray-300">
                            {token.trades24h.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                      {stats.topTokensByVolume.length === 0 && (
                        <tr>
                          <td colSpan={4} className="px-4 py-8 text-center text-gray-400">
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
            <div className="text-center text-sm text-gray-500">
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
}: {
  label: string
  value: string
  subValue?: string
  icon: string
  color?: 'default' | 'primary' | 'green' | 'blue'
  small?: boolean
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
    <div className={`border rounded-xl ${small ? 'p-4' : 'p-6'} ${colorClasses[color]}`}>
      <div className="flex items-center gap-2 mb-2">
        <span className={small ? 'text-lg' : 'text-2xl'}>{icon}</span>
        <p className={`text-gray-400 ${small ? 'text-xs' : 'text-sm'}`}>{label}</p>
      </div>
      <p className={`font-bold ${valueColorClasses[color]} ${small ? 'text-lg' : 'text-2xl'}`}>
        {value}
      </p>
      {subValue && (
        <p className="text-xs text-gray-500 mt-1">{subValue}</p>
      )}
    </div>
  )
}

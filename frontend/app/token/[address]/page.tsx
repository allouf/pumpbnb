'use client'

import { useReadContract } from 'wagmi'
import { formatUnits } from 'viem'
import BondingCurveABI from '@/lib/abis/BondingCurve.json'
import PumpTokenABI from '@/lib/abis/PumpToken.json'
import { TokenAvatar } from '@/components/TokenAvatar'
import { PriceChart } from '@/components/PriceChart'
import { TradingPanel } from '@/components/TradingPanel'

export default function TokenPage({ params }: { params: { address: string } }) {
  // Sample bonding curve address - in production, fetch this from TokenFactory events
  const bondingCurveAddress = '0xCefD1ff0849AcDe7ebE6f0Ee26c96Bc17B490da9'

  // Read token info
  const { data: tokenName } = useReadContract({
    address: params.address as `0x${string}`,
    abi: PumpTokenABI,
    functionName: 'name',
  })

  const { data: tokenSymbol } = useReadContract({
    address: params.address as `0x${string}`,
    abi: PumpTokenABI,
    functionName: 'symbol',
  })

  // Read bonding curve state
  const { data: reserves } = useReadContract({
    address: bondingCurveAddress as `0x${string}`,
    abi: BondingCurveABI,
    functionName: 'getReserves',
  })

  // Type-safe handling of reserves data
  const reservesData = reserves as readonly [bigint, bigint] | undefined
  const progress = reservesData ? Number(reservesData[0]) / 100 : 0
  const marketCap = reservesData ? formatUnits(reservesData[0], 18) : '0'
  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Token Info */}
          <div className="lg:col-span-2">
            <div className="bg-secondary-light p-6 rounded-xl mb-6">
              <div className="flex items-center gap-4 mb-6">
                <TokenAvatar symbol={tokenSymbol as string || 'TOKEN'} size="xl" />
                <div>
                  <h1 className="text-4xl font-bold mb-1">{tokenName as string || 'Loading...'}</h1>
                  <p className="text-gray-400 text-xl">${tokenSymbol as string || '...'}</p>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-4 mb-6">
                <div className="bg-secondary p-4 rounded-lg">
                  <p className="text-gray-400 text-sm mb-1">Market Cap</p>
                  <p className="text-2xl font-bold text-primary">{marketCap} ASTER</p>
                </div>
                <div className="bg-secondary p-4 rounded-lg">
                  <p className="text-gray-400 text-sm mb-1">Progress</p>
                  <p className="text-2xl font-bold">{progress.toFixed(1)}%</p>
                </div>
                <div className="bg-secondary p-4 rounded-lg">
                  <p className="text-gray-400 text-sm mb-1">Status</p>
                  <p className="text-2xl font-bold text-green-500">Active</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Progress to PancakeSwap</span>
                  <span className="font-semibold">{progress.toFixed(2)}%</span>
                </div>
                <div className="w-full bg-secondary rounded-full h-3">
                  <div
                    className="bg-gradient-to-r from-primary to-green-500 h-3 rounded-full transition-all"
                    style={{ width: `${Math.min(progress, 100)}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>0 ASTER</span>
                  <span>100 ASTER (Graduation)</span>
                </div>
              </div>
            </div>

            {/* Price Chart */}
            <PriceChart
              bondingCurveAddress={bondingCurveAddress}
              tokenSymbol={tokenSymbol as string || 'TOKEN'}
            />
          </div>

          {/* Trading Panel */}
          <div className="lg:col-span-1">
            <TradingPanel
              bondingCurveAddress={bondingCurveAddress}
              tokenSymbol={tokenSymbol as string || 'TOKEN'}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

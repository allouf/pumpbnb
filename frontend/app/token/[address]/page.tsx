'use client'

import { useReadContract } from 'wagmi'
import { formatUnits } from 'viem'
import type { Abi } from 'viem'
import { CONTRACTS } from '@/lib/contracts'
import BondingCurveABIImport from '@/lib/abis/BondingCurve.json'
import PumpTokenABIImport from '@/lib/abis/PumpToken.json'
import TokenFactoryABIImport from '@/lib/abis/TokenFactory.json'

const BondingCurveABI = BondingCurveABIImport.abi as Abi
const PumpTokenABI = PumpTokenABIImport.abi as Abi
const TokenFactoryABI = TokenFactoryABIImport.abi as Abi
import { TokenAvatar } from '@/components/TokenAvatar'
import { PriceChart } from '@/components/PriceChart'
import { TradingPanel } from '@/components/TradingPanel'
import { LikeButton } from '@/components/LikeButton'
import { CommentsSection } from '@/components/CommentsSection'

export default function TokenPage({ params }: { params: { address: string } }) {
  // Fetch bonding curve address from TokenFactory
  const { data: bondingCurveAddress, error: bondingCurveError, isLoading: bondingCurveLoading } = useReadContract({
    address: CONTRACTS.TokenFactory as `0x${string}`,
    abi: TokenFactoryABI,
    functionName: 'tokenToBondingCurve',
    args: [params.address],
  })

  // Read token info
  const { data: tokenName, error: nameError } = useReadContract({
    address: params.address as `0x${string}`,
    abi: PumpTokenABI,
    functionName: 'name',
  })

  const { data: tokenSymbol, error: symbolError } = useReadContract({
    address: params.address as `0x${string}`,
    abi: PumpTokenABI,
    functionName: 'symbol',
  })

  // Type-safe handling of data
  const bondingCurve = bondingCurveAddress as string | undefined
  const name = tokenName as string | undefined
  const symbol = tokenSymbol as string | undefined

  // Debug logging
  console.log('Token Address:', params.address)
  console.log('TokenFactory Address:', CONTRACTS.TokenFactory)
  console.log('Bonding Curve Address:', bondingCurve)
  console.log('Bonding Curve Loading:', bondingCurveLoading)
  console.log('Bonding Curve Error:', bondingCurveError)
  console.log('Token Name:', name)
  console.log('Token Symbol:', symbol)
  console.log('Name Error:', nameError)
  console.log('Symbol Error:', symbolError)

  // Read bonding curve state (only if we have the bonding curve address)
  const { data: reserves } = useReadContract({
    address: bondingCurve as `0x${string}` | undefined,
    abi: BondingCurveABI,
    functionName: 'getReserves',
    query: {
      enabled: !!bondingCurve,
    },
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
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <TokenAvatar symbol={symbol || 'TOKEN'} size="xl" />
                  <div>
                    <h1 className="text-4xl font-bold mb-1">{name || 'Loading...'}</h1>
                    <p className="text-gray-400 text-xl">${symbol || '...'}</p>
                  </div>
                </div>
                <LikeButton tokenAddress={params.address} />
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
            {bondingCurve && (
              <PriceChart
                bondingCurveAddress={bondingCurve}
                tokenSymbol={symbol || 'TOKEN'}
              />
            )}

            {/* Comments Section */}
            <div className="mt-6">
              <CommentsSection tokenAddress={params.address} />
            </div>
          </div>

          {/* Trading Panel */}
          <div className="lg:col-span-1">
            {bondingCurve ? (
              <TradingPanel
                bondingCurveAddress={bondingCurve}
                tokenSymbol={symbol || 'TOKEN'}
              />
            ) : (
              <div className="bg-secondary-light p-6 rounded-xl">
                <p className="text-gray-400 text-center">Loading trading panel...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

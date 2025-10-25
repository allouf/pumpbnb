'use client'

import { useState } from 'react'
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { formatUnits, parseUnits } from 'viem'
import { CONTRACTS } from '@/lib/contracts'
import BondingCurveABI from '@/lib/abis/BondingCurve.json'
import PumpTokenABI from '@/lib/abis/PumpToken.json'

export default function TokenPage({ params }: { params: { address: string } }) {
  const { address: userAddress, isConnected } = useAccount()
  const [buyAmount, setBuyAmount] = useState('')
  const [sellAmount, setSellAmount] = useState('')
  const [activeTab, setActiveTab] = useState<'buy' | 'sell'>('buy')

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

  const { data: hash, isPending, writeContract } = useWriteContract()
  const { isLoading: isConfirming } = useWaitForTransactionReceipt({ hash })

  const handleBuy = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!buyAmount || !isConnected) return

    try {
      const asterAmount = parseUnits(buyAmount, 18)
      writeContract({
        address: bondingCurveAddress as `0x${string}`,
        abi: BondingCurveABI,
        functionName: 'buy',
        args: [asterAmount, 0], // minTokensOut = 0 for now, should calculate slippage
      })
    } catch (err) {
      console.error('Buy error:', err)
    }
  }

  const handleSell = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!sellAmount || !isConnected) return

    try {
      const tokenAmount = parseUnits(sellAmount, 18)
      writeContract({
        address: bondingCurveAddress as `0x${string}`,
        abi: BondingCurveABI,
        functionName: 'sell',
        args: [tokenAmount, 0], // minAsterOut = 0 for now, should calculate slippage
      })
    } catch (err) {
      console.error('Sell error:', err)
    }
  }

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
              <h1 className="text-4xl font-bold mb-2">{tokenName as string || 'Loading...'}</h1>
              <p className="text-gray-400 text-xl mb-6">${tokenSymbol as string || '...'}</p>

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

            {/* Chart Placeholder */}
            <div className="bg-secondary-light p-6 rounded-xl">
              <h3 className="text-xl font-semibold mb-4">Price Chart</h3>
              <div className="h-96 flex items-center justify-center bg-secondary rounded-lg">
                <p className="text-gray-500">Chart coming soon...</p>
              </div>
            </div>
          </div>

          {/* Trading Panel */}
          <div className="lg:col-span-1">
            <div className="bg-secondary-light p-6 rounded-xl sticky top-24">
              <div className="flex gap-2 mb-6">
                <button
                  onClick={() => setActiveTab('buy')}
                  className={`flex-1 py-2 rounded-lg font-semibold transition ${
                    activeTab === 'buy'
                      ? 'bg-primary text-black'
                      : 'bg-secondary text-gray-400 hover:text-white'
                  }`}
                >
                  Buy
                </button>
                <button
                  onClick={() => setActiveTab('sell')}
                  className={`flex-1 py-2 rounded-lg font-semibold transition ${
                    activeTab === 'sell'
                      ? 'bg-red-500 text-white'
                      : 'bg-secondary text-gray-400 hover:text-white'
                  }`}
                >
                  Sell
                </button>
              </div>

              {activeTab === 'buy' ? (
                <form onSubmit={handleBuy} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Amount (ASTER)
                    </label>
                    <input
                      type="number"
                      value={buyAmount}
                      onChange={(e) => setBuyAmount(e.target.value)}
                      placeholder="0.0"
                      step="0.01"
                      className="w-full px-4 py-3 bg-secondary rounded-lg border border-gray-700 focus:border-primary focus:outline-none"
                    />
                  </div>

                  <div className="bg-secondary rounded-lg p-4 text-sm">
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-400">You receive:</span>
                      <span className="font-semibold">~0 {tokenSymbol as string}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Trading fee (1%):</span>
                      <span className="font-semibold">~0 ASTER</span>
                    </div>
                  </div>

                  {!isConnected && (
                    <div className="bg-yellow-500/10 border border-yellow-500/50 rounded-lg p-3">
                      <p className="text-yellow-500 text-sm">Connect wallet to trade</p>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={!isConnected || isPending || isConfirming || !buyAmount}
                    className="w-full bg-primary text-black py-3 rounded-lg font-bold hover:bg-primary-dark transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isPending || isConfirming ? 'Buying...' : 'Buy'}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleSell} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Amount ({tokenSymbol as string})
                    </label>
                    <input
                      type="number"
                      value={sellAmount}
                      onChange={(e) => setSellAmount(e.target.value)}
                      placeholder="0.0"
                      step="0.01"
                      className="w-full px-4 py-3 bg-secondary rounded-lg border border-gray-700 focus:border-red-500 focus:outline-none"
                    />
                  </div>

                  <div className="bg-secondary rounded-lg p-4 text-sm">
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-400">You receive:</span>
                      <span className="font-semibold">~0 ASTER</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Trading fee (1%):</span>
                      <span className="font-semibold">~0 {tokenSymbol as string}</span>
                    </div>
                  </div>

                  {!isConnected && (
                    <div className="bg-yellow-500/10 border border-yellow-500/50 rounded-lg p-3">
                      <p className="text-yellow-500 text-sm">Connect wallet to trade</p>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={!isConnected || isPending || isConfirming || !sellAmount}
                    className="w-full bg-red-500 text-white py-3 rounded-lg font-bold hover:bg-red-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isPending || isConfirming ? 'Selling...' : 'Sell'}
                  </button>
                </form>
              )}

              <div className="mt-6 pt-6 border-t border-gray-700">
                <h4 className="font-semibold mb-3 text-sm">Token Info</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Contract:</span>
                    <a
                      href={`https://testnet.bscscan.com/address/${params.address}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-xs text-primary hover:underline"
                    >
                      {params.address.slice(0, 6)}...{params.address.slice(-4)}
                    </a>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Bonding Curve:</span>
                    <a
                      href={`https://testnet.bscscan.com/address/${bondingCurveAddress}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-xs text-primary hover:underline"
                    >
                      {bondingCurveAddress.slice(0, 6)}...{bondingCurveAddress.slice(-4)}
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

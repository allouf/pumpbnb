'use client'

import { useState, useEffect } from 'react'
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { formatUnits, parseUnits } from 'viem'
import type { Abi } from 'viem'
import toast from 'react-hot-toast'
import { SlippageSettings } from './SlippageSettings'
import { calculateExpectedOutput, calculateMinOutput, calculatePriceImpact, SLIPPAGE_PRESETS } from '@/lib/utils/trading'
import { CONTRACTS } from '@/lib/contracts'
import BondingCurveABIImport from '@/lib/abis/BondingCurve.json'
import { indexTrade } from '@/lib/api/indexer'

const BondingCurveABI = BondingCurveABIImport.abi as Abi

const ERC20_ABI = [
  {
    constant: true,
    inputs: [{ name: 'owner', type: 'address' }, { name: 'spender', type: 'address' }],
    name: 'allowance',
    outputs: [{ name: '', type: 'uint256' }],
    type: 'function',
  },
  {
    constant: false,
    inputs: [{ name: 'spender', type: 'address' }, { name: 'amount', type: 'uint256' }],
    name: 'approve',
    outputs: [{ name: '', type: 'bool' }],
    type: 'function',
  },
]

interface TradingPanelProps {
  bondingCurveAddress: string
  tokenAddress: string
  tokenSymbol: string
}

export function TradingPanel({ bondingCurveAddress, tokenSymbol, tokenAddress }: TradingPanelProps) {
  const { address, isConnected } = useAccount()
  const [activeTab, setActiveTab] = useState<'buy' | 'sell'>('buy')
  const [amount, setAmount] = useState('')
  const [slippage, setSlippage] = useState(SLIPPAGE_PRESETS.MEDIUM)

  // Calculate amount early so we can use it in contract reads
  const amountBigInt = amount ? parseUnits(amount, 18) : BigInt(0)

  // Read bonding curve reserves
  const { data: reserves, refetch: refetchReserves } = useReadContract({
    address: bondingCurveAddress as `0x${string}`,
    abi: BondingCurveABI,
    functionName: 'getReserves',
  })

  // Get actual buy/sell amounts from contract (includes virtual reserves and fees)
  const { data: buyAmountData } = useReadContract({
    address: bondingCurveAddress as `0x${string}`,
    abi: BondingCurveABI,
    functionName: 'getBuyAmount',
    args: activeTab === 'buy' && amountBigInt > 0 ? [amountBigInt] : undefined,
    query: { enabled: activeTab === 'buy' && amountBigInt > 0 },
  })

  const { data: sellAmountData } = useReadContract({
    address: bondingCurveAddress as `0x${string}`,
    abi: BondingCurveABI,
    functionName: 'getSellAmount',
    args: activeTab === 'sell' && amountBigInt > 0 ? [amountBigInt] : undefined,
    query: { enabled: activeTab === 'sell' && amountBigInt > 0 },
  })

  // Read ASTER allowance
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: CONTRACTS.MockASTER as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: address && isConnected ? [address, bondingCurveAddress] : undefined,
  })

  const { data: hash, isPending, writeContract, error: writeError } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  const reservesData = reserves as readonly [bigint, bigint] | undefined
  const asterReserves = reservesData ? reservesData[0] : BigInt(0)
  const tokenReserves = reservesData ? reservesData[1] : BigInt(0)

  // Use contract's actual calculations (includes virtual reserves and correct fees)
  const buyData = buyAmountData as readonly [bigint, bigint, bigint] | undefined
  const sellData = sellAmountData as readonly [bigint, bigint, bigint] | undefined

  const expectedOutput = activeTab === 'buy'
    ? (buyData ? buyData[0] : BigInt(0)) // tokensOut from getBuyAmount
    : (sellData ? sellData[0] : BigInt(0)) // asterOut from getSellAmount

  const minOutput = calculateMinOutput(expectedOutput, slippage)

  // Simple price impact: compare expected output to naive calculation
  const priceImpact = activeTab === 'buy'
    ? calculatePriceImpact(amountBigInt, asterReserves, expectedOutput, tokenReserves)
    : calculatePriceImpact(amountBigInt, tokenReserves, expectedOutput, asterReserves)

  const currentAllowance = (allowance as bigint) || BigInt(0)
  const needsApproval = activeTab === 'buy' && currentAllowance < amountBigInt

  // Handle transaction success
  useEffect(() => {
    if (isSuccess && hash) {
      toast.success('Transaction successful!')

      // Immediately index the trade for instant chart updates
      indexTrade({
        txHash: hash,
        tokenAddress: tokenAddress,
      }).then(() => {
        console.log('[TradingPanel] Trade indexed successfully')
      }).catch((error) => {
        console.error('[TradingPanel] Failed to index trade:', error)
      })

      setAmount('')
      refetchAllowance()
      // Refetch reserves to update market cap and progress
      refetchReserves()
    }
  }, [isSuccess, hash, tokenAddress, refetchAllowance, refetchReserves])

  // Handle transaction errors
  useEffect(() => {
    if (writeError) {
      toast.error(writeError.message || 'Transaction failed')
    }
  }, [writeError])

  const handleApprove = async () => {
    try {
      const toastId = toast.loading('Requesting approval...')
      writeContract({
        address: CONTRACTS.MockASTER as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [bondingCurveAddress, parseUnits('1000000', 18)], // Approve 1M ASTER
      }, {
        onSuccess: () => {
          toast.success('Approval granted!', { id: toastId })
        },
        onError: (error) => {
          toast.error('Approval failed', { id: toastId })
        },
      })
    } catch (err) {
      console.error('Approve error:', err)
    }
  }

  const handleTrade = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!amount || !isConnected) return

    try {
      const toastId = toast.loading(activeTab === 'buy' ? 'Buying tokens...' : 'Selling tokens...')

      if (activeTab === 'buy') {
        writeContract({
          address: bondingCurveAddress as `0x${string}`,
          abi: BondingCurveABI,
          functionName: 'buyWithAster',
          args: [amountBigInt, minOutput],
        }, {
          onSuccess: () => {
            toast.success('Buy successful!', { id: toastId })
          },
          onError: () => {
            toast.error('Buy failed', { id: toastId })
          },
        })
      } else {
        writeContract({
          address: bondingCurveAddress as `0x${string}`,
          abi: BondingCurveABI,
          functionName: 'sellForAster',
          args: [amountBigInt, minOutput],
        }, {
          onSuccess: () => {
            toast.success('Sell successful!', { id: toastId })
          },
          onError: () => {
            toast.error('Sell failed', { id: toastId })
          },
        })
      }
    } catch (err) {
      console.error('Trade error:', err)
    }
  }

  return (
    <div className="bg-secondary-light p-6 rounded-xl sticky top-24">
      <div className="flex items-center justify-between mb-6">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('buy')}
            className={`flex-1 py-2 px-4 rounded-lg font-semibold transition ${
              activeTab === 'buy'
                ? 'bg-primary text-black'
                : 'bg-secondary text-gray-400 hover:text-white'
            }`}
          >
            Buy
          </button>
          <button
            onClick={() => setActiveTab('sell')}
            className={`flex-1 py-2 px-4 rounded-lg font-semibold transition ${
              activeTab === 'sell'
                ? 'bg-red-500 text-white'
                : 'bg-secondary text-gray-400 hover:text-white'
            }`}
          >
            Sell
          </button>
        </div>
        <SlippageSettings slippage={slippage} onSlippageChange={setSlippage} />
      </div>

      <form onSubmit={handleTrade} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            Amount ({activeTab === 'buy' ? 'ASTER' : tokenSymbol})
          </label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.0"
            step="0.01"
            className="w-full px-4 py-3 bg-secondary rounded-lg border border-gray-700 focus:border-primary focus:outline-none"
          />
        </div>

        <div className="bg-secondary rounded-lg p-4 text-sm space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-400">You receive (min):</span>
            <span className="font-semibold">
              {amount ? formatUnits(minOutput, 18).slice(0, 10) : '0.0'} {activeTab === 'buy' ? tokenSymbol : 'ASTER'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Price impact:</span>
            <span className={`font-semibold ${priceImpact > 5 ? 'text-red-500' : 'text-gray-300'}`}>
              {amount ? `${priceImpact.toFixed(2)}%` : '0%'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Trading fee (1%):</span>
            <span className="font-semibold">
              {amount && (buyData || sellData)
                ? formatUnits((buyData ? buyData[1] + buyData[2] : sellData![1] + sellData![2]), 18).slice(0, 8)
                : '0'} {activeTab === 'buy' ? 'ASTER' : 'ASTER'}
            </span>
          </div>
        </div>

        {!isConnected && (
          <div className="bg-yellow-500/10 border border-yellow-500/50 rounded-lg p-3">
            <p className="text-yellow-500 text-sm">Connect wallet to trade</p>
          </div>
        )}

        {priceImpact > 10 && amount && (
          <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3">
            <p className="text-red-500 text-sm">⚠️ High price impact! Consider reducing trade size.</p>
          </div>
        )}

        {needsApproval ? (
          <button
            type="button"
            onClick={handleApprove}
            disabled={isPending || isConfirming}
            className="w-full bg-primary text-black py-3 rounded-lg font-bold hover:bg-primary-dark transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending || isConfirming ? 'Approving...' : 'Approve ASTER'}
          </button>
        ) : (
          <button
            type="submit"
            disabled={!isConnected || isPending || isConfirming || !amount || parseFloat(amount) <= 0}
            className={`w-full py-3 rounded-lg font-bold transition disabled:opacity-50 disabled:cursor-not-allowed ${
              activeTab === 'buy'
                ? 'bg-primary text-black hover:bg-primary-dark'
                : 'bg-red-500 text-white hover:bg-red-600'
            }`}
          >
            {isPending || isConfirming
              ? activeTab === 'buy' ? 'Buying...' : 'Selling...'
              : activeTab === 'buy' ? 'Buy' : 'Sell'}
          </button>
        )}
      </form>
    </div>
  )
}

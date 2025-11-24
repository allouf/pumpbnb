'use client'

import { useState, useEffect } from 'react'
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { formatUnits, parseUnits } from 'viem'
import type { Abi } from 'viem'
import toast from 'react-hot-toast'
import { SlippageSettings } from './SlippageSettings'
import { AsterLogo } from './AsterLogo'
import { calculateExpectedOutput, calculateMinOutput, calculatePriceImpact, SLIPPAGE_PRESETS } from '@/lib/utils/trading'
import { CONTRACTS } from '@/lib/contracts'
import BondingCurveABIImport from '@/lib/abis/BondingCurve.json'
import { indexTrade } from '@/lib/api/indexer'
import { useUsdPrice, asterToUsd, formatUsdPrice } from '@/lib/hooks/useUsdPrice'
import { formatAsterAmount, formatPercentage } from '@/lib/utils/formatNumbers'
import { useLocalTradeCache } from '@/lib/hooks/useLocalTradeCache'

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
  onTradeSuccess?: (tradeType: 'buy' | 'sell', txHash: string) => void
}

export function TradingPanel({ bondingCurveAddress, tokenSymbol, tokenAddress, onTradeSuccess }: TradingPanelProps) {
  const { address, isConnected } = useAccount()
  const [activeTab, setActiveTab] = useState<'buy' | 'sell'>('buy')
  const [amount, setAmount] = useState('')
  const [slippage, setSlippage] = useState(SLIPPAGE_PRESETS.MEDIUM)
  const { usdRate } = useUsdPrice()
  const { addLocalTrade } = useLocalTradeCache(tokenAddress)

  // Calculate amount early so we can use it in contract reads
  const getAsterAmount = () => {
    if (!amount || parseFloat(amount) <= 0) return BigInt(0)
    return parseUnits(amount, 18)
  }
  
  const amountBigInt = getAsterAmount()

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

  // Read ASTER allowance (for buy)
  const { data: asterAllowance, refetch: refetchAsterAllowance } = useReadContract({
    address: CONTRACTS.MockASTER as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: address && isConnected ? [address, bondingCurveAddress] : undefined,
  })

  // Read TOKEN allowance (for sell)
  const { data: tokenAllowance, refetch: refetchTokenAllowance } = useReadContract({
    address: tokenAddress as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: address && isConnected ? [address, bondingCurveAddress] : undefined,
  })

  // Read user's ASTER balance (for buy)
  const { data: asterBalance } = useReadContract({
    address: CONTRACTS.MockASTER as `0x${string}`,
    abi: [
      {
        constant: true,
        inputs: [{ name: 'account', type: 'address' }],
        name: 'balanceOf',
        outputs: [{ name: '', type: 'uint256' }],
        type: 'function',
      },
    ],
    functionName: 'balanceOf',
    args: address && isConnected ? [address] : undefined,
  })

  // Read user's TOKEN balance (for sell)
  const { data: tokenBalance } = useReadContract({
    address: tokenAddress as `0x${string}`,
    abi: [
      {
        constant: true,
        inputs: [{ name: 'account', type: 'address' }],
        name: 'balanceOf',
        outputs: [{ name: '', type: 'uint256' }],
        type: 'function',
      },
    ],
    functionName: 'balanceOf',
    args: address && isConnected ? [address] : undefined,
  })

  const { data: hash, isPending, writeContract, error: writeError } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  // Debug logging for transaction states
  useEffect(() => {
    console.log('[TradingPanel] 🔍 Transaction state changed:', {
      hash,
      isPending,
      isConfirming,
      isSuccess,
      activeTab,
      hasHash: !!hash,
    })
  }, [hash, isPending, isConfirming, isSuccess, activeTab])

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

  const currentAsterAllowance = (asterAllowance as bigint) || BigInt(0)
  const currentTokenAllowance = (tokenAllowance as bigint) || BigInt(0)
  const currentAsterBalance = (asterBalance as bigint) || BigInt(0)
  const currentTokenBalance = (tokenBalance as bigint) || BigInt(0)

  const needsApproval = activeTab === 'buy'
    ? currentAsterAllowance < amountBigInt
    : currentTokenAllowance < amountBigInt

  // Check if user has sufficient balance
  const insufficientBalance = activeTab === 'buy'
    ? currentAsterBalance < amountBigInt
    : currentTokenBalance < amountBigInt

  // Track if current transaction is a trade (not approval)
  const [pendingTradeHash, setPendingTradeHash] = useState<string | null>(null)
  const [isTradeSubmitted, setIsTradeSubmitted] = useState(false)

  // Track when any new transaction appears and check if it's a trade
  useEffect(() => {
    console.log('[TradingPanel] 🔔 Transaction hash effect triggered:', {
      hasHash: !!hash,
      hash,
      pendingTradeHash,
      isTradeSubmitted,
      activeTab,
      isPending,
      isConfirming
    })

    if (hash && !pendingTradeHash && isTradeSubmitted) {
      console.log('[TradingPanel] ═══════════════════════════════════════════')
      console.log('[TradingPanel] 🎯 TRADE TRANSACTION HASH RECEIVED')
      console.log('[TradingPanel] ═══════════════════════════════════════════')
      console.log('[TradingPanel] Transaction details:', {
        hash,
        activeTab,
        isTradeSubmitted,
        tokenAddress,
        bondingCurveAddress
      })
      setPendingTradeHash(hash)
      setIsTradeSubmitted(false) // Reset the flag
      console.log('[TradingPanel] ✅ Transaction marked as pending trade')
    } else if (hash && !pendingTradeHash && !isTradeSubmitted) {
      console.log('[TradingPanel] 📝 Non-trade transaction hash received (likely approval):', {
        hash,
        activeTab,
        isTradeSubmitted,
        reason: 'isTradeSubmitted is false'
      })
    }
  }, [hash, pendingTradeHash, activeTab, isTradeSubmitted, isPending, isConfirming, tokenAddress, bondingCurveAddress])

  // Track processed transactions to prevent duplicate handling
  const [processedHashes, setProcessedHashes] = useState<Set<string>>(new Set())

  // Handle transaction success
  useEffect(() => {
    console.log('[TradingPanel] 🔔 Transaction success effect triggered:', {
      isSuccess,
      hasHash: !!hash,
      hash,
      alreadyProcessed: hash ? processedHashes.has(hash) : false,
      pendingTradeHash,
      activeTab
    })

    if (isSuccess && hash && !processedHashes.has(hash)) {
      console.log('[TradingPanel] ═══════════════════════════════════════════')
      console.log('[TradingPanel] ✅ TRANSACTION SUCCESSFUL!')
      console.log('[TradingPanel] ═══════════════════════════════════════════')
      console.log('[TradingPanel] Success details:', {
        hash,
        tokenAddress,
        activeTab,
        isPendingTrade: pendingTradeHash === hash,
        amountTraded: amount,
        expectedOutput: expectedOutput.toString(),
        userAddress: address
      })

      // Mark this hash as processed
      setProcessedHashes(prev => new Set(prev).add(hash))
      console.log('[TradingPanel] ✅ Transaction marked as processed')

      toast.success('Transaction successful!')

      // Only index if this was a trade transaction (not approval)
      if (pendingTradeHash === hash) {
        console.log('[TradingPanel] ═══════════════════════════════════════════')
        console.log('[TradingPanel] 📊 STARTING TRADE INDEXING')
        console.log('[TradingPanel] ═══════════════════════════════════════════')
        console.log('[TradingPanel] Indexing parameters:', {
          txHash: hash,
          tokenAddress,
          tradeType: activeTab,
          bondingCurveAddress,
          trader: address
        })
        
        setPendingTradeHash(null) // Clear pending trade

        indexTrade({
          txHash: hash,
          tokenAddress: tokenAddress,
        }).then((result) => {
          console.log('[TradingPanel] ═══════════════════════════════════════════')
          console.log('[TradingPanel] ✅ TRADE INDEXED SUCCESSFULLY!')
          console.log('[TradingPanel] ═══════════════════════════════════════════')
          console.log('[TradingPanel] Indexing result:', result)
          console.log('[TradingPanel] 🔄 Now transaction should appear in chart and trades list')

          // Trigger callback for successful trade (to refresh holders, etc.)
          if (onTradeSuccess) {
            console.log('[TradingPanel] 📢 Triggering onTradeSuccess callback')
            onTradeSuccess(activeTab, hash)
          }
        }).catch((error) => {
          console.error('[TradingPanel] ═══════════════════════════════════════════')
          console.error('[TradingPanel] ❌ FAILED TO INDEX TRADE')
          console.error('[TradingPanel] ═══════════════════════════════════════════')
          console.error('[TradingPanel] Error details:', {
            error: error.message,
            stack: error.stack,
            txHash: hash,
            tokenAddress,
            tradeType: activeTab,
            bondingCurveAddress
          })

          // Cache trade locally as fallback when backend indexing fails
          console.log('[TradingPanel] 💾 Attempting local cache fallback...')
          try {
            const tradeData = {
              tokenAddress,
              trader: address!,
              isBuy: activeTab === 'buy',
              amountIn: activeTab === 'buy' ? amountBigInt.toString() : expectedOutput.toString(),
              amountOut: activeTab === 'buy' ? expectedOutput.toString() : amountBigInt.toString(),
              fee: '0', // We don't have fee data here, but it's not critical for display
              timestamp: new Date().toISOString(),
              txHash: hash,
              blockNumber: 0, // We don't have block number here
              asterAmount: activeTab === 'buy' ? amountBigInt.toString() : expectedOutput.toString(),
              tokenAmount: activeTab === 'buy' ? expectedOutput.toString() : amountBigInt.toString(),
            }

            console.log('[TradingPanel] 📝 Local cache trade data:', tradeData)

            addLocalTrade(tradeData)
            console.log('[TradingPanel] ✅ Trade cached locally successfully!')
            console.log('[TradingPanel] 🔄 Trade should now appear from local cache')
          } catch (cacheError) {
            console.error('[TradingPanel] ❌ Failed to cache trade locally:', {
              error: cacheError,
              message: (cacheError as Error).message,
              stack: (cacheError as Error).stack
            })
          }
        })
      }

      setAmount('')
      refetchAsterAllowance()
      refetchTokenAllowance()
      // Refetch reserves to update market cap and progress
      refetchReserves()
    }
  }, [isSuccess, hash, tokenAddress, refetchAsterAllowance, refetchTokenAllowance, refetchReserves, activeTab, address, amountBigInt, expectedOutput, addLocalTrade, pendingTradeHash, processedHashes, onTradeSuccess])

  // Handle transaction errors
  useEffect(() => {
    if (writeError) {
      toast.error(writeError.message || 'Transaction failed')
    }
  }, [writeError])

  const handleApprove = async () => {
    try {
      const toastId = toast.loading(`Requesting ${activeTab === 'buy' ? 'ASTER' : tokenSymbol} approval...`)

      const approveAddress = activeTab === 'buy' ? CONTRACTS.MockASTER : tokenAddress

      console.log('[TradingPanel] 📝 Approving token:', {
        activeTab,
        approveAddress,
        tokenSymbol,
        spender: bondingCurveAddress,
      })

      writeContract({
        address: approveAddress as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [bondingCurveAddress, parseUnits('1000000', 18)], // Approve 1M tokens
      }, {
        onSuccess: () => {
          toast.success(`${activeTab === 'buy' ? 'ASTER' : tokenSymbol} approval granted!`, { id: toastId })
        },
        onError: (error) => {
          toast.error('Approval failed', { id: toastId })
          console.error('[TradingPanel] ❌ Approval failed:', error)
        },
      })
    } catch (err) {
      console.error('[TradingPanel] ❌ Approve error:', err)
    }
  }

  const handleTrade = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!amount || !isConnected) {
      console.log('[TradingPanel] ⚠️ Trade prevented:', {
        hasAmount: !!amount,
        isConnected
      })
      return
    }

    console.log('[TradingPanel] ═══════════════════════════════════════════')
    console.log('[TradingPanel] 🎯 STARTING TRADE TRANSACTION')
    console.log('[TradingPanel] ═══════════════════════════════════════════')
    console.log('[TradingPanel] Trade parameters:', {
      activeTab,
      amount,
      amountBigInt: amountBigInt.toString(),
      tokenSymbol,
      bondingCurveAddress,
      tokenAddress,
      userAddress: address,
      expectedOutput: expectedOutput.toString(),
      minOutput: minOutput.toString(),
      slippage,
      priceImpact
    })

    console.log('[TradingPanel] Reserves state:', {
      asterReserves: asterReserves.toString(),
      tokenReserves: tokenReserves.toString(),
      asterFormatted: formatUnits(asterReserves, 18),
      tokenFormatted: formatUnits(tokenReserves, 18)
    })

    console.log('[TradingPanel] User balances:', {
      asterBalance: currentAsterBalance.toString(),
      tokenBalance: currentTokenBalance.toString(),
      asterFormatted: formatUnits(currentAsterBalance, 18),
      tokenFormatted: formatUnits(currentTokenBalance, 18)
    })

    try {
      const toastId = toast.loading(activeTab === 'buy' ? 'Buying tokens...' : 'Selling tokens...')

      // Mark that we're submitting a trade transaction
      setIsTradeSubmitted(true)
      console.log('[TradingPanel] ✅ Trade submission flag set to TRUE')

      if (activeTab === 'buy') {
        console.log('[TradingPanel] 💰 Executing BUY transaction:', {
          function: 'buyWithAster',
          asterAmountIn: amountBigInt.toString(),
          minTokensOut: minOutput.toString(),
          contract: bondingCurveAddress
        })

        writeContract({
          address: bondingCurveAddress as `0x${string}`,
          abi: BondingCurveABI,
          functionName: 'buyWithAster',
          args: [amountBigInt, minOutput],
        }, {
          onSuccess: () => {
            console.log('[TradingPanel] ✅ BUY transaction submitted to wallet successfully')
            toast.success('Buy successful!', { id: toastId })
          },
          onError: (error) => {
            console.error('[TradingPanel] ❌ BUY transaction failed:', error)
            setIsTradeSubmitted(false) // Reset on error
            toast.error('Buy failed', { id: toastId })
          },
        })
      } else {
        console.log('[TradingPanel] 💸 Executing SELL transaction:', {
          function: 'sellForAster',
          tokenAmountIn: amountBigInt.toString(),
          minAsterOut: minOutput.toString(),
          contract: bondingCurveAddress
        })

        writeContract({
          address: bondingCurveAddress as `0x${string}`,
          abi: BondingCurveABI,
          functionName: 'sellForAster',
          args: [amountBigInt, minOutput],
        }, {
          onSuccess: () => {
            console.log('[TradingPanel] ✅ SELL transaction submitted to wallet successfully')
            toast.success('Sell successful!', { id: toastId })
          },
          onError: (error) => {
            console.error('[TradingPanel] ❌ SELL transaction failed:', error)
            setIsTradeSubmitted(false) // Reset on error
            toast.error('Sell failed', { id: toastId })
          },
        })
      }

      console.log('[TradingPanel] 🔄 Waiting for wallet confirmation...')
    } catch (err) {
      console.error('[TradingPanel] ❌ CRITICAL ERROR in handleTrade:', {
        error: err,
        message: (err as Error).message,
        stack: (err as Error).stack
      })
    }
  }

  return (
    <div className="bg-secondary-light p-4 sm:p-6 rounded-xl">
      {/* Header with tabs and currency toggle */}
      <div className="flex items-center justify-between mb-4 sm:mb-6 gap-2">
        <div className="flex gap-2 flex-1">
          <button
            onClick={() => setActiveTab('buy')}
            className={`flex-1 py-2 px-3 sm:px-4 rounded-lg font-semibold transition text-sm sm:text-base ${
              activeTab === 'buy'
                ? 'bg-primary text-black'
                : 'bg-secondary text-gray-400 hover:text-white'
            }`}
          >
            Buy
          </button>
          <button
            onClick={() => setActiveTab('sell')}
            className={`flex-1 py-2 px-3 sm:px-4 rounded-lg font-semibold transition text-sm sm:text-base ${
              activeTab === 'sell'
                ? 'bg-red-500 text-white'
                : 'bg-secondary text-gray-400 hover:text-white'
            }`}
          >
            Sell
          </button>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <SlippageSettings slippage={slippage} onSlippageChange={setSlippage} />
        </div>
      </div>

      <form onSubmit={handleTrade} className="space-y-4">
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-medium">
              Amount ({activeTab === 'buy' ? 'ASTER' : tokenSymbol})
            </label>
            {amount && parseFloat(amount) > 0 && activeTab === 'buy' && (
              <div className="text-xs text-gray-400">
                ≈ {formatUsdPrice(asterToUsd(parseFloat(amount), usdRate))}
              </div>
            )}
          </div>
          <div className="relative">
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.0"
              step="0.01"
              className="w-full px-4 py-3 pr-12 bg-secondary rounded-lg border border-gray-700 focus:border-primary focus:outline-none
                        [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none
                        [-moz-appearance:textfield]"
              style={{ appearance: 'textfield' }}
            />
            {activeTab === 'buy' && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
                <AsterLogo size={20} />
                <span className="text-xs text-gray-400 font-medium">ASTER</span>
              </div>
            )}
          </div>
        </div>

        <div className="bg-secondary rounded-lg p-4 text-sm space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-400">You receive (min):</span>
            <div className="text-right">
              <span className="font-semibold">
                {amount ? formatAsterAmount(formatUnits(minOutput, 18)) : '0.0'} {activeTab === 'buy' ? tokenSymbol : 'ASTER'}
              </span>
              {amount && parseFloat(amount) > 0 && activeTab === 'sell' && (
                <div className="text-xs text-gray-500">
                  ≈ {formatUsdPrice(asterToUsd(parseFloat(formatUnits(minOutput, 18)), usdRate))}
                </div>
              )}
            </div>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Price impact:</span>
            <span className={`font-semibold ${priceImpact > 5 ? 'text-red-500' : 'text-gray-300'}`}>
              {amount ? formatPercentage(priceImpact) : '0%'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Trading fee (1%):</span>
            <div className="text-right">
              <span className="font-semibold">
                {amount && (buyData || sellData)
                  ? formatAsterAmount(formatUnits((buyData ? buyData[1] + buyData[2] : sellData![1] + sellData![2]), 18), { maxDecimals: 6 })
                  : '0'} ASTER
              </span>
              {amount && (buyData || sellData) && (
                <div className="text-xs text-gray-500">
                  ≈ {formatUsdPrice(asterToUsd(
                    parseFloat(formatUnits((buyData ? buyData[1] + buyData[2] : sellData![1] + sellData![2]), 18)), 
                    usdRate
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {!isConnected && (
          <div className="bg-yellow-500/10 border border-yellow-500/50 rounded-lg p-3">
            <p className="text-yellow-500 text-sm">Connect wallet to trade</p>
          </div>
        )}

        {insufficientBalance && amount && parseFloat(amount) > 0 && (
          <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3">
            <p className="text-red-500 text-sm">
              ⚠️ Insufficient balance. You have {formatAsterAmount(formatUnits(activeTab === 'buy' ? currentAsterBalance : currentTokenBalance, 18))} {activeTab === 'buy' ? 'ASTER' : tokenSymbol}
            </p>
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
            {isPending || isConfirming ? 'Approving...' : `Approve ${activeTab === 'buy' ? 'ASTER' : tokenSymbol}`}
          </button>
        ) : (
          <button
            type="submit"
            disabled={!isConnected || isPending || isConfirming || !amount || parseFloat(amount) <= 0 || insufficientBalance}
            className={`w-full py-3 rounded-lg font-bold transition disabled:opacity-50 disabled:cursor-not-allowed ${
              activeTab === 'buy'
                ? 'bg-primary text-black hover:bg-primary-dark'
                : 'bg-red-500 text-white hover:bg-red-600'
            }`}
          >
            {isPending || isConfirming
              ? activeTab === 'buy' ? 'Buying...' : 'Selling...'
              : insufficientBalance && amount && parseFloat(amount) > 0
              ? 'Insufficient Balance'
              : activeTab === 'buy' ? 'Buy' : 'Sell'}
          </button>
        )}
      </form>
    </div>
  )
}

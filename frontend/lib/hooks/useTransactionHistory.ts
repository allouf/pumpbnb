'use client'

import { useState, useEffect } from 'react'
import { usePublicClient } from 'wagmi'
import { formatUnits, type Abi } from 'viem'
import BondingCurveABI from '@/lib/abis/BondingCurve.json'

export interface Transaction {
  hash: string
  type: 'buy' | 'sell'
  user: string
  tokenAmount: bigint
  tokenAmountFormatted: string
  asterAmount: bigint
  asterAmountFormatted: string
  timestamp: number
  blockNumber: bigint
  bondingCurve: string
}

export function useTransactionHistory(bondingCurveAddress?: string, userAddress?: string) {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const publicClient = usePublicClient()

  useEffect(() => {
    async function fetchTransactions() {
      if (!publicClient || !bondingCurveAddress) {
        console.log('[useTransactionHistory] Missing publicClient or bondingCurveAddress')
        setIsLoading(false)
        return
      }

      console.log('[useTransactionHistory] Starting transaction fetch...')

      try {
        setIsLoading(true)

        const currentBlock = await publicClient.getBlockNumber()
        // Search last 50,000 blocks (~41 hours on BSC testnet) to catch more transactions
        const fromBlock = currentBlock - BigInt(50000)

        console.log(`[useTransactionHistory] Searching blocks ${fromBlock} to ${currentBlock}`)
        console.log(`[useTransactionHistory] Bonding curve: ${bondingCurveAddress}`)

        // Fetch Buy events
        const buyLogs = await publicClient.getContractEvents({
          address: bondingCurveAddress as `0x${string}`,
          abi: BondingCurveABI.abi as Abi,
          eventName: 'Buy',
          fromBlock,
          toBlock: 'latest',
        })

        console.log(`[useTransactionHistory] Found ${buyLogs.length} Buy events`)

        // Fetch Sell events
        const sellLogs = await publicClient.getContractEvents({
          address: bondingCurveAddress as `0x${string}`,
          abi: BondingCurveABI.abi as Abi,
          eventName: 'Sell',
          fromBlock,
          toBlock: 'latest',
        })

        console.log(`[useTransactionHistory] Found ${sellLogs.length} Sell events`)

        // Process Buy transactions
        const buyTransactions: Transaction[] = buyLogs.map((log: any, index: number) => {
          console.log(`[useTransactionHistory] Processing Buy event ${index + 1}:`, log.args)

          const buyer = log.args.buyer as string
          // Contract emits: Buy(buyer, asterIn, tokensOut, creatorFee, protocolFee, timestamp)
          const asterAmount = log.args.asterIn as bigint
          const tokenAmount = log.args.tokensOut as bigint

          console.log(`[useTransactionHistory]   Buyer: ${buyer}`)
          console.log(`[useTransactionHistory]   ASTER In: ${formatUnits(asterAmount, 18)}`)
          console.log(`[useTransactionHistory]   Tokens Out: ${formatUnits(tokenAmount, 18)}`)
          console.log(`[useTransactionHistory]   Block: ${log.blockNumber}`)

          return {
            hash: log.transactionHash,
            type: 'buy' as const,
            user: buyer,
            tokenAmount,
            tokenAmountFormatted: formatUnits(tokenAmount, 18),
            asterAmount,
            asterAmountFormatted: formatUnits(asterAmount, 18),
            timestamp: 0, // Will fetch from block
            blockNumber: log.blockNumber,
            bondingCurve: bondingCurveAddress,
          }
        })

        // Process Sell transactions
        const sellTransactions: Transaction[] = sellLogs.map((log: any) => {
          const seller = log.args.seller as string
          // Contract emits: Sell(seller, tokensIn, asterOut, creatorFee, protocolFee, timestamp)
          const tokenAmount = log.args.tokensIn as bigint
          const asterAmount = log.args.asterOut as bigint

          return {
            hash: log.transactionHash,
            type: 'sell' as const,
            user: seller,
            tokenAmount,
            tokenAmountFormatted: formatUnits(tokenAmount, 18),
            asterAmount,
            asterAmountFormatted: formatUnits(asterAmount, 18),
            timestamp: 0,
            blockNumber: log.blockNumber,
            bondingCurve: bondingCurveAddress,
          }
        })

        // Combine and fetch timestamps
        const allTransactions = [...buyTransactions, ...sellTransactions]

        // Fetch block timestamps
        console.log(`[useTransactionHistory] Fetching timestamps for ${allTransactions.length} transactions...`)
        const transactionsWithTimestamps = await Promise.all(
          allTransactions.map(async (tx, index) => {
            try {
              const block = await publicClient.getBlock({ blockNumber: tx.blockNumber })
              const timestamp = Number(block.timestamp)
              console.log(`[useTransactionHistory]   Transaction ${index + 1}: Block ${tx.blockNumber}, Timestamp: ${timestamp}`)
              return {
                ...tx,
                timestamp,
              }
            } catch (err) {
              console.error(`[useTransactionHistory] Error fetching block ${tx.blockNumber}:`, err)
              return tx
            }
          })
        )
        console.log(`[useTransactionHistory] Timestamps fetched successfully`)

        // Filter by user if provided
        const filteredTransactions = userAddress
          ? transactionsWithTimestamps.filter(tx =>
              tx.user.toLowerCase() === userAddress.toLowerCase()
            )
          : transactionsWithTimestamps

        // Sort by most recent first
        filteredTransactions.sort((a, b) => b.timestamp - a.timestamp)

        console.log(`[useTransactionHistory] Found ${filteredTransactions.length} transactions for bonding curve ${bondingCurveAddress}`)
        console.log('[useTransactionHistory] Transactions:', filteredTransactions)

        setTransactions(filteredTransactions)
        setError(null)
      } catch (err) {
        console.error('Error fetching transactions:', err)
        setError(err as Error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchTransactions()
  }, [publicClient, bondingCurveAddress, userAddress])

  return { transactions, isLoading, error }
}

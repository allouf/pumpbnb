'use client'

import { useState, useEffect } from 'react'
import { useAccount, usePublicClient, useReadContract } from 'wagmi'
import { formatUnits } from 'viem'
import { CONTRACTS } from '@/lib/contracts'
import TokenFactoryABI from '@/lib/abis/TokenFactory.json'
import BondingCurveABI from '@/lib/abis/BondingCurve.json'

const ERC20_ABI = [
  {
    constant: true,
    inputs: [{ name: 'owner', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    type: 'function',
  },
]

export interface TokenHolding {
  tokenAddress: string
  bondingCurveAddress: string
  name: string
  symbol: string
  balance: bigint
  balanceFormatted: string
  valueInAster: bigint
  valueInAsterFormatted: string
  isGraduated: boolean
}

export function useUserPortfolio() {
  const { address, isConnected } = useAccount()
  const publicClient = usePublicClient()
  const [holdings, setHoldings] = useState<TokenHolding[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    async function fetchPortfolio() {
      if (!address || !isConnected || !publicClient) {
        setHoldings([])
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        setError(null)

        // Get current block number
        const currentBlock = await publicClient.getBlockNumber()
        const fromBlock = currentBlock - BigInt(10000) // Last ~10,000 blocks

        // Fetch all TokenCreated events
        const logs = await publicClient.getContractEvents({
          address: CONTRACTS.TokenFactory as `0x${string}`,
          abi: TokenFactoryABI,
          eventName: 'TokenCreated',
          fromBlock,
          toBlock: 'latest',
        })

        // For each token, check if user has a balance
        const holdingsPromises = logs.map(async (log: any) => {
          if (!log.args) return null

          const tokenAddress = log.args.token as string
          const bondingCurveAddress = log.args.bondingCurve as string
          const name = log.args.name as string
          const symbol = log.args.symbol as string

          try {
            // Get user's token balance
            const balance = await publicClient.readContract({
              address: tokenAddress as `0x${string}`,
              abi: ERC20_ABI,
              functionName: 'balanceOf',
              args: [address],
            }) as bigint

            // Skip if user has zero balance
            if (balance === BigInt(0)) {
              return null
            }

            // Get bonding curve reserves to calculate value
            const reserves = await publicClient.readContract({
              address: bondingCurveAddress as `0x${string}`,
              abi: BondingCurveABI,
              functionName: 'getReserves',
            }) as readonly [bigint, bigint]

            const asterReserves = reserves[0]
            const tokenReserves = reserves[1]

            // Calculate value in ASTER using current bonding curve price
            // Price = asterReserves / tokenReserves
            // Value = balance * price = (balance * asterReserves) / tokenReserves
            let valueInAster = BigInt(0)
            if (tokenReserves > BigInt(0)) {
              valueInAster = (balance * asterReserves) / tokenReserves
            }

            // Check if token is graduated (when real ASTER reserves >= 100)
            const isGraduated = asterReserves >= BigInt(100) * BigInt(10 ** 18)

            const holding: TokenHolding = {
              tokenAddress,
              bondingCurveAddress,
              name,
              symbol,
              balance,
              balanceFormatted: formatUnits(balance, 18),
              valueInAster,
              valueInAsterFormatted: formatUnits(valueInAster, 18),
              isGraduated,
            }

            return holding
          } catch (err) {
            console.error(`Error fetching balance for ${symbol}:`, err)
            return null
          }
        })

        const results = await Promise.all(holdingsPromises)
        const validHoldings = results.filter((h): h is TokenHolding => h !== null)

        // Sort by value (highest first)
        validHoldings.sort((a, b) => {
          if (a.valueInAster > b.valueInAster) return -1
          if (a.valueInAster < b.valueInAster) return 1
          return 0
        })

        setHoldings(validHoldings)
      } catch (err) {
        console.error('Error fetching portfolio:', err)
        setError(err as Error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchPortfolio()
  }, [address, isConnected, publicClient])

  // Calculate total portfolio value
  const totalValueInAster = holdings.reduce(
    (sum, holding) => sum + holding.valueInAster,
    BigInt(0)
  )

  return {
    holdings,
    totalValueInAster,
    totalValueFormatted: formatUnits(totalValueInAster, 18),
    isLoading,
    error,
  }
}

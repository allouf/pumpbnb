import { useState, useEffect } from 'react'
import { usePublicClient } from 'wagmi'
import { CONTRACTS } from '@/lib/contracts'
import TokenFactoryABI from '@/lib/abis/TokenFactory.json'
import type { TokenCreatedEvent } from './useTokenEvents'

export interface Token {
  address: string
  bondingCurve: string
  creator: string
  name: string
  symbol: string
  timestamp: number
  blockNumber: bigint
}

export function useTokenList() {
  const [tokens, setTokens] = useState<Token[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const publicClient = usePublicClient()

  useEffect(() => {
    async function fetchTokens() {
      if (!publicClient) return

      try {
        setIsLoading(true)

        // Get TokenCreated events from the last 10000 blocks (adjust as needed)
        const currentBlock = await publicClient.getBlockNumber()
        const fromBlock = currentBlock - BigInt(10000)

        const logs = await publicClient.getContractEvents({
          address: CONTRACTS.TokenFactory as `0x${string}`,
          abi: TokenFactoryABI,
          eventName: 'TokenCreated',
          fromBlock,
          toBlock: 'latest',
        })

        const tokenList: Token[] = logs.map((log: any) => ({
          address: log.args.token as string,
          bondingCurve: log.args.bondingCurve as string,
          creator: log.args.creator as string,
          name: log.args.name as string,
          symbol: log.args.symbol as string,
          timestamp: Number(log.args.timestamp),
          blockNumber: log.blockNumber,
        }))

        // Sort by most recent first
        tokenList.sort((a, b) => b.timestamp - a.timestamp)

        setTokens(tokenList)
        setError(null)
      } catch (err) {
        console.error('Error fetching tokens:', err)
        setError(err as Error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchTokens()
  }, [publicClient])

  return { tokens, isLoading, error, refetch: () => setTokens([]) }
}

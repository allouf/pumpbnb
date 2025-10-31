'use client'

import { useAccount, useReadContract } from 'wagmi'
import { useConfig } from './useConfig'
import { formatUnits } from 'viem'

const ERC20_ABI = [
  {
    inputs: [{ name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const

/**
 * Hook to read ASTER balance directly from blockchain
 * Uses the asterToken address from backend config
 */
export function useAsterBalance() {
  const { address, isConnected } = useAccount()
  const { config, isLoading: configLoading } = useConfig()

  const { data: balance, isLoading, refetch } = useReadContract({
    address: config?.contracts?.asterToken as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && !!config?.contracts?.asterToken && isConnected,
      refetchInterval: 10000, // Refetch every 10 seconds
    },
  })

  const formatted = balance ? formatUnits(balance, 18) : '0'

  return {
    balance: balance || 0n,
    formatted,
    isLoading: isLoading || configLoading,
    refetch,
  }
}

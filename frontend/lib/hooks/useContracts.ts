/**
 * Contract interaction hooks using Wagmi
 */

import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { CONTRACTS } from '@/lib/contracts/addresses'
import { BONDING_CURVE_ABI } from '@/lib/contracts/BondingCurve.abi'
import { TOKEN_FACTORY_ABI } from '@/lib/contracts/TokenFactory.abi'
import { ERC20_ABI } from '@/lib/contracts/ERC20.abi'
import type { Address } from 'viem'

/**
 * Hook to read bonding curve reserves
 */
export function useBondingCurveReserves(bondingCurveAddress?: Address) {
  return useReadContract({
    address: bondingCurveAddress,
    abi: BONDING_CURVE_ABI,
    functionName: 'getReserves',
    query: {
      enabled: !!bondingCurveAddress,
      refetchInterval: 10000, // Refetch every 10 seconds
    },
  })
}

/**
 * Hook to calculate buy amount
 */
export function useCalculateBuy(bondingCurveAddress?: Address, asterAmount?: bigint) {
  return useReadContract({
    address: bondingCurveAddress,
    abi: BONDING_CURVE_ABI,
    functionName: 'calculateBuy',
    args: asterAmount ? [asterAmount] : undefined,
    query: {
      enabled: !!bondingCurveAddress && !!asterAmount && asterAmount > 0n,
    },
  })
}

/**
 * Hook to calculate sell amount
 */
export function useCalculateSell(bondingCurveAddress?: Address, tokenAmount?: bigint) {
  return useReadContract({
    address: bondingCurveAddress,
    abi: BONDING_CURVE_ABI,
    functionName: 'calculateSell',
    args: tokenAmount ? [tokenAmount] : undefined,
    query: {
      enabled: !!bondingCurveAddress && !!tokenAmount && tokenAmount > 0n,
    },
  })
}

/**
 * Hook to read ERC20 balance
 */
export function useTokenBalance(tokenAddress?: Address, userAddress?: Address) {
  return useReadContract({
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: userAddress ? [userAddress] : undefined,
    query: {
      enabled: !!tokenAddress && !!userAddress,
      refetchInterval: 5000, // Refetch every 5 seconds
    },
  })
}

/**
 * Hook to read ERC20 allowance
 */
export function useTokenAllowance(
  tokenAddress?: Address,
  ownerAddress?: Address,
  spenderAddress?: Address
) {
  return useReadContract({
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: ownerAddress && spenderAddress ? [ownerAddress, spenderAddress] : undefined,
    query: {
      enabled: !!tokenAddress && !!ownerAddress && !!spenderAddress,
    },
  })
}

/**
 * Hook to approve ERC20 spending
 */
export function useApproveToken() {
  const { writeContract, data: hash, isPending, error } = useWriteContract()

  const approve = async (tokenAddress: Address, spenderAddress: Address, amount: bigint) => {
    writeContract({
      address: tokenAddress,
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [spenderAddress, amount],
    })
  }

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  })

  return {
    approve,
    hash,
    isPending,
    isConfirming,
    isConfirmed,
    error,
  }
}

/**
 * Hook to buy tokens from bonding curve
 */
export function useBuyTokens() {
  const { writeContract, data: hash, isPending, error } = useWriteContract()

  const buy = async (
    bondingCurveAddress: Address,
    asterAmount: bigint,
    minTokensOut: bigint
  ) => {
    writeContract({
      address: bondingCurveAddress,
      abi: BONDING_CURVE_ABI,
      functionName: 'buy',
      args: [asterAmount, minTokensOut],
    })
  }

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  })

  return {
    buy,
    hash,
    isPending,
    isConfirming,
    isConfirmed,
    error,
  }
}

/**
 * Hook to sell tokens to bonding curve
 */
export function useSellTokens() {
  const { writeContract, data: hash, isPending, error } = useWriteContract()

  const sell = async (
    bondingCurveAddress: Address,
    tokenAmount: bigint,
    minAsterOut: bigint
  ) => {
    writeContract({
      address: bondingCurveAddress,
      abi: BONDING_CURVE_ABI,
      functionName: 'sell',
      args: [tokenAmount, minAsterOut],
    })
  }

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  })

  return {
    sell,
    hash,
    isPending,
    isConfirming,
    isConfirmed,
    error,
  }
}

/**
 * Hook to create a new token
 */
export function useCreateToken() {
  const { writeContract, data: hash, isPending, error } = useWriteContract()

  const createToken = async (
    salt: string,
    name: string,
    symbol: string,
    metadataURI: string
  ) => {
    writeContract({
      address: CONTRACTS.TOKEN_FACTORY as Address,
      abi: TOKEN_FACTORY_ABI,
      functionName: 'createToken',
      args: [salt as `0x${string}`, name, symbol, metadataURI],
    })
  }

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  })

  return {
    createToken,
    hash,
    isPending,
    isConfirming,
    isConfirmed,
    error,
  }
}

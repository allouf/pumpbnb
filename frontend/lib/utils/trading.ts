import { formatUnits, parseUnits } from 'viem'

/**
 * Calculate expected output from bonding curve using constant product formula
 * Formula: (reserveIn + amountIn) * (reserveOut - amountOut) = k
 * Solving for amountOut: amountOut = (reserveOut * amountIn) / (reserveIn + amountIn)
 */
export function calculateExpectedOutput(
  amountIn: bigint,
  reserveIn: bigint,
  reserveOut: bigint,
  feeBps: number = 100 // 1% fee in basis points
): bigint {
  if (amountIn === BigInt(0) || reserveIn === BigInt(0) || reserveOut === BigInt(0)) {
    return BigInt(0)
  }

  // Apply fee: amountInWithFee = amountIn * (10000 - feeBps) / 10000
  const amountInWithFee = (amountIn * BigInt(10000 - feeBps)) / BigInt(10000)

  // Calculate output: (reserveOut * amountInWithFee) / (reserveIn + amountInWithFee)
  const numerator = reserveOut * amountInWithFee
  const denominator = reserveIn + amountInWithFee
  const amountOut = numerator / denominator

  return amountOut
}

/**
 * Calculate minimum output with slippage tolerance
 */
export function calculateMinOutput(
  expectedOutput: bigint,
  slippageBps: number // Slippage in basis points (e.g., 50 = 0.5%)
): bigint {
  const minOutput = (expectedOutput * BigInt(10000 - slippageBps)) / BigInt(10000)
  return minOutput
}

/**
 * Calculate price impact percentage
 */
export function calculatePriceImpact(
  amountIn: bigint,
  reserveIn: bigint,
  expectedOutput: bigint,
  reserveOut: bigint
): number {
  if (reserveIn === BigInt(0) || reserveOut === BigInt(0)) {
    return 0
  }

  // Current price: reserveOut / reserveIn
  const currentPrice = Number(formatUnits(reserveOut, 18)) / Number(formatUnits(reserveIn, 18))

  // Execution price: expectedOutput / amountIn
  const executionPrice = Number(formatUnits(expectedOutput, 18)) / Number(formatUnits(amountIn, 18))

  // Price impact: (executionPrice - currentPrice) / currentPrice * 100
  const priceImpact = ((executionPrice - currentPrice) / currentPrice) * 100

  return Math.abs(priceImpact)
}

/**
 * Format slippage for display
 */
export function formatSlippage(slippageBps: number): string {
  return `${(slippageBps / 100).toFixed(2)}%`
}

/**
 * Common slippage presets
 */
export const SLIPPAGE_PRESETS = {
  LOW: 10, // 0.1%
  MEDIUM: 50, // 0.5%
  HIGH: 100, // 1%
  VERY_HIGH: 300, // 3%
}

/**
 * Validate slippage value
 */
export function isValidSlippage(slippageBps: number): boolean {
  return slippageBps >= 0 && slippageBps <= 5000 // Max 50%
}

/**
 * Get warning level for slippage
 */
export function getSlippageWarning(slippageBps: number): 'none' | 'low' | 'medium' | 'high' {
  if (slippageBps <= 50) return 'none'
  if (slippageBps <= 100) return 'low'
  if (slippageBps <= 300) return 'medium'
  return 'high'
}

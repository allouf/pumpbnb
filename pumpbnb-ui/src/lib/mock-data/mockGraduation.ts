/**
 * Mock Graduation Utility
 * Simulates the ASTER -> WBNB graduation process for tokens reaching 100 ASTER threshold
 */

export interface GraduationStep {
  id: number;
  message: string;
  description: string;
  duration: number;
  status: 'pending' | 'in_progress' | 'completed' | 'error';
}

export interface GraduationResult {
  success: boolean;
  pancakeswapPair?: string;
  wbnbAmount?: number;
  asterAmount?: number;
  lpTokens?: string;
  timestamp?: string;
  error?: string;
}

/**
 * Graduation steps as defined in the spec
 */
export const GRADUATION_STEPS: Omit<GraduationStep, 'status'>[] = [
  {
    id: 1,
    message: 'Extracting 100 ASTER from bonding curve...',
    description: 'Removing accumulated ASTER reserves from the bonding curve contract',
    duration: 1000,
  },
  {
    id: 2,
    message: 'Swapping ASTER → WBNB on PancakeSwap...',
    description: 'Converting 100 ASTER to WBNB for DEX liquidity pairing',
    duration: 1500,
  },
  {
    id: 3,
    message: 'Creating Token/WBNB pair...',
    description: 'Deploying new Token/WBNB liquidity pair on PancakeSwap V2',
    duration: 1000,
  },
  {
    id: 4,
    message: 'Adding liquidity to PancakeSwap...',
    description: 'Adding WBNB and token reserves to the new liquidity pool',
    duration: 1000,
  },
  {
    id: 5,
    message: 'Burning LP tokens for permanent lock...',
    description: 'Burning liquidity provider tokens to ensure permanent liquidity',
    duration: 1000,
  },
  {
    id: 6,
    message: '✅ Graduation complete!',
    description: 'Token successfully graduated and now tradable on PancakeSwap',
    duration: 500,
  },
];

/**
 * Simulates the graduation process with step-by-step callbacks
 */
export async function simulateGraduation(
  tokenAddress: string,
  onStepUpdate: (step: GraduationStep) => void,
  onComplete: (result: GraduationResult) => void
): Promise<void> {
  try {
    // Initialize all steps as pending
    const steps: GraduationStep[] = GRADUATION_STEPS.map((step) => ({
      ...step,
      status: 'pending' as const,
    }));

    // Execute each step
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];

      // Mark current step as in_progress
      step.status = 'in_progress';
      onStepUpdate(step);

      // Simulate step execution time
      await new Promise((resolve) => setTimeout(resolve, step.duration));

      // Mark step as completed
      step.status = 'completed';
      onStepUpdate(step);
    }

    // Generate mock PancakeSwap pair address
    const pancakeswapPair = generateMockPairAddress(tokenAddress);

    // Calculate mock conversion
    const asterAmount = 100; // Always 100 ASTER at graduation
    const wbnbAmount = calculateMockWBNBAmount(asterAmount);

    // Return success result
    onComplete({
      success: true,
      pancakeswapPair,
      wbnbAmount,
      asterAmount,
      lpTokens: '1000000000000000000', // 1 LP token (18 decimals)
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    // Handle any errors
    onComplete({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error during graduation',
    });
  }
}

/**
 * Generate a mock PancakeSwap pair address
 */
function generateMockPairAddress(tokenAddress: string): string {
  // Create a deterministic "pair" address based on token address
  const hash = tokenAddress.slice(2); // Remove 0x
  const pairHash = hash.split('').reverse().join('').substring(0, 40);
  return `0x${pairHash}`;
}

/**
 * Calculate mock WBNB amount from ASTER
 * Mock exchange rate: 1 ASTER = 0.005 WBNB
 */
function calculateMockWBNBAmount(asterAmount: number): number {
  const MOCK_ASTER_TO_WBNB_RATE = 0.005;
  return asterAmount * MOCK_ASTER_TO_WBNB_RATE;
}

/**
 * Check if a token is ready to graduate
 */
export function isReadyToGraduate(graduationProgress: number): boolean {
  return graduationProgress >= 100;
}

/**
 * Get graduation status message
 */
export function getGraduationStatusMessage(graduationProgress: number): {
  message: string;
  urgency: 'low' | 'medium' | 'high' | 'ready';
} {
  if (graduationProgress >= 100) {
    return {
      message: '🎉 Ready to graduate to PancakeSwap!',
      urgency: 'ready',
    };
  }

  if (graduationProgress >= 95) {
    return {
      message: `🔥 Almost there! Only ${(100 - graduationProgress).toFixed(1)} ASTER needed!`,
      urgency: 'high',
    };
  }

  if (graduationProgress >= 75) {
    return {
      message: `📈 Getting close! ${(100 - graduationProgress).toFixed(1)} ASTER to graduation`,
      urgency: 'medium',
    };
  }

  return {
    message: `${graduationProgress.toFixed(1)} ASTER raised of 100 ASTER goal`,
    urgency: 'low',
  };
}

/**
 * Generate mock graduation event
 */
export interface GraduationEvent {
  tokenAddress: string;
  tokenName: string;
  tokenSymbol: string;
  timestamp: string;
  asterRaised: number;
  wbnbConverted: number;
  pancakeswapPair: string;
  initialLiquidity: string;
}

export function generateMockGraduationEvent(
  tokenAddress: string,
  tokenName: string,
  tokenSymbol: string
): GraduationEvent {
  return {
    tokenAddress,
    tokenName,
    tokenSymbol,
    timestamp: new Date().toISOString(),
    asterRaised: 100,
    wbnbConverted: 0.5, // 100 ASTER * 0.005 = 0.5 WBNB
    pancakeswapPair: generateMockPairAddress(tokenAddress),
    initialLiquidity: '$625', // 0.5 WBNB * $1250 = $625
  };
}

/**
 * PancakeSwap URLs
 */
export const PANCAKESWAP_URLS = {
  BASE: 'https://pancakeswap.finance',
  SWAP: (pairAddress: string) =>
    `https://pancakeswap.finance/swap?outputCurrency=${pairAddress}`,
  LIQUIDITY: (pairAddress: string) =>
    `https://pancakeswap.finance/liquidity/${pairAddress}`,
  INFO: (pairAddress: string) =>
    `https://pancakeswap.finance/info/v2/pairs/${pairAddress}`,
};

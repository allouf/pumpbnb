/**
 * Configuration fetched from backend API
 * This replaces hardcoded contract addresses in environment variables
 */

export interface PlatformConfig {
  chainId: number;
  networkName: string;
  rpcUrl: string;
  contracts: {
    tokenFactory: string;
    platformConfig: string;
    graduationManager: string;
    asterToken: string;
    sampleToken: string;
    pancakeRouter: string;
    pancakeFactory: string;
    wbnb: string;
  };
  fees: {
    bondingCurve: {
      total: number;
      creator: number;
      protocol: number;
    };
    postGraduation: {
      total: number;
      creator: number;
      protocol: number;
    };
  };
  tokenConfig: {
    totalSupply: string;
    creatorAllocation: string;
    bondingCurveAllocation: string;
    virtualAsterReserve: string;
    graduationThreshold: string;
  };
}

// Cache config in memory (refresh every 5 minutes)
let cachedConfig: PlatformConfig | null = null;
let lastFetch = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Fetch configuration from backend API
 */
async function fetchConfig(): Promise<PlatformConfig> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  try {
    const response = await fetch(`${apiUrl}/api/config`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store', // Always fetch fresh data
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch config: ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message || 'Failed to fetch config');
    }

    return data.data;
  } catch (error) {
    console.error('Error fetching config:', error);
    throw error;
  }
}

/**
 * Get platform configuration (cached)
 * Automatically refreshes cache every 5 minutes
 */
export async function getConfig(): Promise<PlatformConfig> {
  const now = Date.now();

  // Return cached config if still valid
  if (cachedConfig && (now - lastFetch) < CACHE_TTL) {
    return cachedConfig;
  }

  // Fetch fresh config
  cachedConfig = await fetchConfig();
  lastFetch = now;

  return cachedConfig;
}

/**
 * Force refresh config (ignores cache)
 */
export async function refreshConfig(): Promise<PlatformConfig> {
  cachedConfig = null;
  lastFetch = 0;
  return getConfig();
}

/**
 * Get config synchronously (returns null if not cached)
 * Useful for components that need config immediately
 */
export function getConfigSync(): PlatformConfig | null {
  return cachedConfig;
}

/**
 * Clear cached config
 */
export function clearConfigCache(): void {
  cachedConfig = null;
  lastFetch = 0;
}

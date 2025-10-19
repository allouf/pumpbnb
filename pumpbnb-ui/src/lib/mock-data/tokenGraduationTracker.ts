/**
 * Token Graduation Progress Tracker
 * Tracks ASTER accumulated in bonding curve reserves for each token
 */

const STORAGE_KEY = 'asterfun_token_graduation';

export interface TokenGraduationData {
  [tokenAddress: string]: {
    asterAccumulated: number; // Total ASTER in bonding curve reserves
    lastUpdated: string;
  };
}

// Initialize with some tokens already having progress
const INITIAL_DATA: TokenGraduationData = {
  '0x1234567890abcdef1234567890abcdef12345678': { asterAccumulated: 5.5, lastUpdated: new Date().toISOString() }, // FlipDip
  '0x2345678901bcdef12345678901bcdef123456789': { asterAccumulated: 10.0, lastUpdated: new Date().toISOString() }, // RWA
  '0x3456789012cdef123456789012cdef1234567890': { asterAccumulated: 3.0, lastUpdated: new Date().toISOString() }, // GirlfwifStyle
  '0x4567890123def1234567890123def12345678901': { asterAccumulated: 64.8, lastUpdated: new Date().toISOString() }, // DogeVader
  '0x5678901234ef12345678901234ef123456789012': { asterAccumulated: 57.0, lastUpdated: new Date().toISOString() }, // STAKE
  '0x6789012345f123456789012345f1234567890123': { asterAccumulated: 52.1, lastUpdated: new Date().toISOString() }, // NVIDIA
  '0x7890123456f1234567890123456f12345678901234': { asterAccumulated: 100, lastUpdated: new Date().toISOString() }, // Depressol (graduated)
  '0x8901234567f12345678901234567f123456789012': { asterAccumulated: 100, lastUpdated: new Date().toISOString() }, // JesusSSS (graduated)
  '0x9012345678f123456789012345678f1234567890': { asterAccumulated: 100, lastUpdated: new Date().toISOString() }, // UmayRobots (graduated)
};

/**
 * Load graduation data from localStorage
 */
export function loadGraduationData(): TokenGraduationData {
  if (typeof window === 'undefined') return INITIAL_DATA;

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error loading graduation data:', error);
  }

  // Initialize with default data
  saveGraduationData(INITIAL_DATA);
  return INITIAL_DATA;
}

/**
 * Save graduation data to localStorage
 */
export function saveGraduationData(data: TokenGraduationData): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving graduation data:', error);
  }
}

/**
 * Get graduation progress for a specific token
 */
export function getTokenGraduationProgress(tokenAddress: string): number {
  const data = loadGraduationData();
  const tokenData = data[tokenAddress.toLowerCase()];

  if (!tokenData) return 0;

  // Return progress as percentage of 100 ASTER goal
  return Math.min((tokenData.asterAccumulated / 100) * 100, 100);
}

/**
 * Get ASTER accumulated for a specific token
 */
export function getTokenAsterAccumulated(tokenAddress: string): number {
  const data = loadGraduationData();
  const tokenData = data[tokenAddress.toLowerCase()];
  return tokenData?.asterAccumulated || 0;
}

/**
 * Add ASTER to token's bonding curve reserves (when user buys tokens)
 */
export function addAsterToToken(tokenAddress: string, asterAmount: number): number {
  const data = loadGraduationData();
  const normalizedAddress = tokenAddress.toLowerCase();

  // Get current data or create new entry
  const currentData = data[normalizedAddress] || { asterAccumulated: 0, lastUpdated: new Date().toISOString() };

  // Add new ASTER (1.5% platform fee is deducted, rest goes to bonding curve)
  const platformFee = asterAmount * 0.015;
  const asterToBondingCurve = asterAmount - platformFee;

  const newAccumulated = Math.min(currentData.asterAccumulated + asterToBondingCurve, 100);

  // Update data
  data[normalizedAddress] = {
    asterAccumulated: newAccumulated,
    lastUpdated: new Date().toISOString(),
  };

  saveGraduationData(data);
  return newAccumulated;
}

/**
 * Remove ASTER from token's bonding curve reserves (when user sells tokens)
 */
export function removeAsterFromToken(tokenAddress: string, asterAmount: number): number {
  const data = loadGraduationData();
  const normalizedAddress = tokenAddress.toLowerCase();

  const currentData = data[normalizedAddress] || { asterAccumulated: 0, lastUpdated: new Date().toISOString() };

  // Remove ASTER from bonding curve
  const newAccumulated = Math.max(currentData.asterAccumulated - asterAmount, 0);

  data[normalizedAddress] = {
    asterAccumulated: newAccumulated,
    lastUpdated: new Date().toISOString(),
  };

  saveGraduationData(data);
  return newAccumulated;
}

/**
 * Mark token as graduated (sets ASTER to 100)
 */
export function graduateToken(tokenAddress: string): void {
  const data = loadGraduationData();
  const normalizedAddress = tokenAddress.toLowerCase();

  data[normalizedAddress] = {
    asterAccumulated: 100,
    lastUpdated: new Date().toISOString(),
  };

  saveGraduationData(data);
}

/**
 * Check if token is ready to graduate
 */
export function isTokenReadyToGraduate(tokenAddress: string): boolean {
  return getTokenAsterAccumulated(tokenAddress) >= 100;
}

/**
 * Reset all graduation data (for testing)
 */
export function resetGraduationData(): void {
  saveGraduationData(INITIAL_DATA);
}

/**
 * Get all tokens sorted by graduation progress
 */
export function getTokensByGraduationProgress(): Array<{
  address: string;
  asterAccumulated: number;
  progress: number;
}> {
  const data = loadGraduationData();

  return Object.entries(data)
    .map(([address, tokenData]) => ({
      address,
      asterAccumulated: tokenData.asterAccumulated,
      progress: Math.min((tokenData.asterAccumulated / 100) * 100, 100),
    }))
    .sort((a, b) => b.progress - a.progress);
}

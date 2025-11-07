// Utility functions for formatting prices and numbers

export function formatPrice(
  price: string | number | undefined,
  options: {
    currency?: 'USD' | 'ASTER' | 'BNB';
    minDecimals?: number;
    maxDecimals?: number;
    showSymbol?: boolean;
  } = {}
): string {
  const {
    currency = 'USD',
    minDecimals = 2,
    maxDecimals = 8,
    showSymbol = true
  } = options;

  if (!price || price === '0') {
    const symbol = showSymbol ? (currency === 'USD' ? '$' : ` ${currency}`) : '';
    return `${currency === 'USD' ? '$' : ''}0${currency !== 'USD' && showSymbol ? ` ${currency}` : ''}`;
  }

  const numPrice = typeof price === 'string' ? parseFloat(price) : price;
  
  if (isNaN(numPrice) || numPrice === 0) {
    const symbol = showSymbol ? (currency === 'USD' ? '$' : ` ${currency}`) : '';
    return `${currency === 'USD' ? '$' : ''}0${currency !== 'USD' && showSymbol ? ` ${currency}` : ''}`;
  }

  let formatted: string;
  const prefix = currency === 'USD' && showSymbol ? '$' : '';
  const suffix = currency !== 'USD' && showSymbol ? ` ${currency}` : '';

  // For very small numbers, use scientific notation or high precision
  if (numPrice < 0.000001) {
    formatted = numPrice.toExponential(2);
  }
  // For small numbers, use higher precision
  else if (numPrice < 0.01) {
    formatted = numPrice.toFixed(Math.min(maxDecimals, 8));
    // Remove trailing zeros after decimal
    formatted = parseFloat(formatted).toString();
  }
  // For normal numbers, use standard formatting
  else if (numPrice < 1) {
    formatted = numPrice.toFixed(Math.min(maxDecimals, 6));
  }
  // For larger numbers
  else {
    formatted = numPrice.toFixed(Math.min(maxDecimals, minDecimals));
  }

  return `${prefix}${formatted}${suffix}`;
}

export function formatNumber(
  num: string | number | undefined,
  options: {
    compact?: boolean;
    decimals?: number;
  } = {}
): string {
  const { compact = false, decimals = 2 } = options;

  if (!num || num === '0') return '0';
  
  const numValue = typeof num === 'string' ? parseFloat(num) : num;
  
  if (isNaN(numValue) || numValue === 0) return '0';

  if (compact) {
    if (numValue >= 1000000000) {
      return `${(numValue / 1000000000).toFixed(1)}B`;
    }
    if (numValue >= 1000000) {
      return `${(numValue / 1000000).toFixed(1)}M`;
    }
    if (numValue >= 1000) {
      return `${(numValue / 1000).toFixed(1)}K`;
    }
  }

  return numValue.toFixed(decimals);
}

export function formatPercent(
  percent: string | number | undefined,
  options: {
    showSign?: boolean;
    decimals?: number;
  } = {}
): string {
  const { showSign = true, decimals = 2 } = options;

  if (!percent || percent === '0') return '0%';
  
  const numPercent = typeof percent === 'string' ? parseFloat(percent) : percent;
  
  if (isNaN(numPercent)) return '0%';

  const sign = showSign && numPercent > 0 ? '+' : '';
  return `${sign}${numPercent.toFixed(decimals)}%`;
}

export function formatMarketCap(
  marketCap: string | number | undefined,
  currency: 'USD' | 'ASTER' = 'USD'
): string {
  if (!marketCap || marketCap === '0') {
    return currency === 'USD' ? '$0' : '0 ASTER';
  }
  
  const numMC = typeof marketCap === 'string' ? parseFloat(marketCap) : marketCap;
  
  if (isNaN(numMC) || numMC === 0) {
    return currency === 'USD' ? '$0' : '0 ASTER';
  }

  const prefix = currency === 'USD' ? '$' : '';
  const suffix = currency === 'ASTER' ? ' ASTER' : '';

  if (numMC >= 1000000) {
    return `${prefix}${(numMC / 1000000).toFixed(2)}M${suffix}`;
  }
  if (numMC >= 1000) {
    return `${prefix}${(numMC / 1000).toFixed(2)}K${suffix}`;
  }
  
  return `${prefix}${numMC.toFixed(2)}${suffix}`;
}

export function formatVolume(
  volume: string | number | undefined,
  currency: 'USD' | 'ASTER' = 'ASTER'
): string {
  if (!volume || volume === '0') {
    return currency === 'USD' ? '$0' : '0 ASTER';
  }
  
  const numVol = typeof volume === 'string' ? parseFloat(volume) : volume;
  
  if (isNaN(numVol) || numVol === 0) {
    return currency === 'USD' ? '$0' : '0 ASTER';
  }

  const prefix = currency === 'USD' ? '$' : '';
  const suffix = currency === 'ASTER' ? ' ASTER' : '';

  if (numVol >= 1000000) {
    return `${prefix}${(numVol / 1000000).toFixed(2)}M${suffix}`;
  }
  if (numVol >= 1000) {
    return `${prefix}${(numVol / 1000).toFixed(2)}K${suffix}`;
  }
  
  return `${prefix}${numVol.toFixed(2)}${suffix}`;
}

// Get color class for percentage changes
export function getPercentChangeColor(percent: string | number | undefined): string {
  if (!percent || percent === '0') return 'text-gray-400';
  
  const numPercent = typeof percent === 'string' ? parseFloat(percent) : percent;
  
  if (isNaN(numPercent) || numPercent === 0) return 'text-gray-400';
  
  return numPercent >= 0 ? 'text-green-500' : 'text-red-500';
}
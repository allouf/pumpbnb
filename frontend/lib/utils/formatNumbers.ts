/**
 * Comprehensive number formatting utilities for the ASTER FUN platform
 */

// Convert Wei (18 decimals) to ASTER
export function weiToAster(weiValue: string | number): number {
  const wei = typeof weiValue === 'string' ? parseFloat(weiValue) : weiValue
  return wei / 1e18
}

// Check if a number is likely in Wei format (very large number > 1e15)
export function isWeiFormat(value: string | number): boolean {
  const num = typeof value === 'string' ? parseFloat(value) : value
  return num > 1e15
}

// Smart conversion - automatically detect and convert Wei to ASTER if needed
export function smartConvertToAster(value: string | number): number {
  const num = typeof value === 'string' ? parseFloat(value) : value
  return isWeiFormat(num) ? weiToAster(num) : num
}

// Format ASTER amounts with appropriate precision
export function formatAsterAmount(
  amount: string | number, 
  options: {
    maxDecimals?: number
    minDecimals?: number
    autoConvert?: boolean
    compact?: boolean
  } = {}
): string {
  const {
    maxDecimals = 4,
    minDecimals = 2,
    autoConvert = true,
    compact = false
  } = options

  let num = typeof amount === 'string' ? parseFloat(amount) : amount
  
  // Auto-convert from Wei if needed
  if (autoConvert) {
    num = smartConvertToAster(num)
  }

  if (num === 0) return '0'
  
  // Handle very small numbers
  if (num < 0.0001) {
    return num.toExponential(2)
  }
  
  // Handle compact notation for large numbers
  if (compact && num >= 1000000) {
    return formatCompactNumber(num)
  }
  
  // Standard formatting
  const formatted = num.toLocaleString('en-US', {
    minimumFractionDigits: minDecimals,
    maximumFractionDigits: maxDecimals
  })
  
  return formatted
}

// Format USD amounts
export function formatUsdAmount(
  amount: string | number,
  options: {
    maxDecimals?: number
    compact?: boolean
    showSymbol?: boolean
  } = {}
): string {
  const {
    maxDecimals = 2,
    compact = false,
    showSymbol = true
  } = options

  const num = typeof amount === 'string' ? parseFloat(amount) : amount
  
  if (num === 0) return showSymbol ? '$0' : '0'
  
  let formatted: string
  
  if (compact && num >= 1000) {
    formatted = formatCompactNumber(num)
  } else if (num < 0.01) {
    formatted = num.toExponential(2)
  } else {
    formatted = num.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: maxDecimals
    })
  }
  
  return showSymbol ? `$${formatted}` : formatted
}

// Format percentages
export function formatPercentage(
  value: string | number,
  options: {
    decimals?: number
    showSign?: boolean
    showSymbol?: boolean
  } = {}
): string {
  const {
    decimals = 2,
    showSign = true,
    showSymbol = true
  } = options

  const num = typeof value === 'string' ? parseFloat(value) : value
  
  if (num === 0) return showSymbol ? '0%' : '0'
  
  const formatted = num.toFixed(decimals)
  const sign = showSign && num > 0 ? '+' : ''
  const symbol = showSymbol ? '%' : ''
  
  return `${sign}${formatted}${symbol}`
}

// Compact number formatting (1K, 1M, 1B, etc.)
export function formatCompactNumber(num: number): string {
  if (num === 0) return '0'
  
  const units = [
    { value: 1e12, suffix: 'T' },
    { value: 1e9, suffix: 'B' },
    { value: 1e6, suffix: 'M' },
    { value: 1e3, suffix: 'K' }
  ]
  
  for (const unit of units) {
    if (Math.abs(num) >= unit.value) {
      const formatted = (num / unit.value).toFixed(1)
      return `${formatted}${unit.suffix}`
    }
  }
  
  return num.toFixed(2)
}

// Format market cap with smart units
export function formatMarketCap(
  amount: string | number,
  currency: 'USD' | 'ASTER' = 'USD'
): string {
  let num = typeof amount === 'string' ? parseFloat(amount) : amount
  
  // Auto-convert from Wei if needed for ASTER
  if (currency === 'ASTER') {
    num = smartConvertToAster(num)
  }
  
  // Handle zero, NaN, undefined, or very small values (less than 0.01)
  if (isNaN(num) || num === undefined || num === null || num < 0.01) {
    return currency === 'USD' ? '$0' : '0 ASTER'
  }
  
  const compactNum = formatCompactNumber(num)
  return currency === 'USD' ? `$${compactNum}` : `${compactNum} ASTER`
}

// Format price with dynamic precision
export function formatPrice(
  price: string | number,
  options: {
    currency?: 'USD' | 'ASTER'
    autoConvert?: boolean
    maxDecimals?: number
  } = {}
): string {
  const {
    currency = 'USD',
    autoConvert = true,
    maxDecimals = 8
  } = options

  let num = typeof price === 'string' ? parseFloat(price) : price
  
  // Auto-convert from Wei if needed
  if (autoConvert && currency === 'ASTER') {
    num = smartConvertToAster(num)
  }
  
  if (num === 0) return currency === 'USD' ? '$0' : '0 ASTER'
  
  let decimals = maxDecimals
  
  // Dynamic precision based on price magnitude
  if (num >= 1) {
    decimals = Math.min(4, maxDecimals)
  } else if (num >= 0.01) {
    decimals = Math.min(6, maxDecimals)
  } else {
    decimals = maxDecimals
  }
  
  const formatted = num.toFixed(decimals)
  const suffix = currency === 'USD' ? '' : ' ASTER'
  const prefix = currency === 'USD' ? '$' : ''
  
  return `${prefix}${formatted}${suffix}`
}

// Format volume with smart units
export function formatVolume(
  volume: string | number,
  currency: 'USD' | 'ASTER' = 'ASTER'
): string {
  let num = typeof volume === 'string' ? parseFloat(volume) : volume
  
  // Auto-convert from Wei if needed for ASTER
  if (currency === 'ASTER') {
    num = smartConvertToAster(num)
  }
  
  if (num === 0) return currency === 'USD' ? '$0' : '0 ASTER'
  
  // Use compact notation for large volumes
  const compactNum = formatCompactNumber(num)
  return currency === 'USD' ? `$${compactNum}` : `${compactNum} ASTER`
}

// Format trade amounts for display in trades list
export function formatTradeAmount(
  amount: string | number,
  options: {
    autoConvert?: boolean
    maxDecimals?: number
  } = {}
): string {
  const { autoConvert = true, maxDecimals = 4 } = options
  
  let num = typeof amount === 'string' ? parseFloat(amount) : amount
  
  if (autoConvert) {
    num = smartConvertToAster(num)
  }
  
  return formatAsterAmount(num, { maxDecimals })
}
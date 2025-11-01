# TradingPanel Update Instructions

## Changes needed to enable immediate trade indexing:

### 1. Add import for indexTrade function (at top of file, line 11):
```typescript
import { indexTrade } from '@/lib/api/indexer'
```

### 2. Update TradingPanelProps interface (line 32-35):
```typescript
interface TradingPanelProps {
  bondingCurveAddress: string
  tokenSymbol: string
  tokenAddress: string  // ADD THIS LINE
}
```

### 3. Update function signature (line 37):
```typescript
export function TradingPanel({ bondingCurveAddress, tokenSymbol, tokenAddress }: TradingPanelProps) {
```

### 4. Update the useEffect for transaction success (line 104-112):
Replace the entire useEffect with:
```typescript
// Handle transaction success
useEffect(() => {
  if (isSuccess && hash) {
    toast.success('Transaction successful!')

    // Immediately index the trade
    indexTrade({
      txHash: hash,
      tokenAddress: tokenAddress,
    }).then(() => {
      console.log('[TradingPanel] Trade indexed successfully')
    }).catch((error) => {
      console.error('[TradingPanel] Failed to index trade:', error)
    })

    setAmount('')
    refetchAllowance()
    // Refetch reserves to update market cap and progress
    refetchReserves()
  }
}, [isSuccess, hash, tokenAddress, refetchAllowance, refetchReserves])
```

### 5. Update token page to pass tokenAddress prop

In `frontend/app/token/[address]/page.tsx`, update the TradingPanel component usage:
```typescript
<TradingPanel
  bondingCurveAddress={token.bondingCurve}
  tokenSymbol={token.symbol}
  tokenAddress={token.address}  // ADD THIS LINE
/>
```

## Summary

These changes will:
1. Import the immediate trade indexer API function
2. Accept token address as a prop
3. Call the indexer API immediately after a successful buy/sell transaction
4. Update the chart data without requiring page refresh or background indexer delay

# Portfolio RPC Fix

## Problem
Portfolio page showing same RPC error as tokens page:
```
Error loading portfolio: Request exceeds defined limit
eth_getLogs from block 70M+ to latest
```

## Solution
Updated `useUserPortfolio` hook to fetch from backend API instead of querying RPC directly.

## Changes

**File**: `frontend/lib/hooks/useUserPortfolio.ts`

**Before**:
- Used `publicClient.getContractEvents()` to fetch TokenCreated events
- Called `readContract()` for each token to check balances
- Multiple RPC calls causing rate limit errors

**After**:
- Single API call: `GET /api/users/:address/portfolio`
- Backend handles all blockchain queries
- Fast, reliable, no rate limits

## Deployment

**Commit**: 048a836 ✅ Pushed to main

Render will auto-deploy within 5 minutes.

## Testing

After deployment, visit:
```
https://pumpbnb-frontend.onrender.com/portfolio
```

Or test with your wallet address:
```
https://pumpbnb-frontend.onrender.com/portfolio
```

**Expected**:
- ✅ No RPC errors
- ✅ Shows portfolio (if user has holdings)
- ✅ Shows empty state (if no holdings)

## Related Fixes

This is the second page fixed today:
1. ✅ Tokens page (commit 3781b5f)
2. ✅ Portfolio page (commit 048a836)

**Architecture**: All frontend pages now use backend API, not direct RPC queries.

---

**Created**: 2025-10-28
**Status**: ✅ Pushed, deploying to Render
**ETA**: Live in ~5 minutes

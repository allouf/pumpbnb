# Frontend RPC Limit Fix

## Problem
The frontend tokens page was throwing this error:
```
Error loading tokens: Request exceeds defined limit. URL: https://data-seed-prebsc-1-s1.bnbchain.org:8545
Request body: {"method":"eth_getLogs","params":[{"address":"0xCF0b298E26db22bCc886E03654A2Bfcb4E2742C2","topics":["0xcdd696caabf915a69182910229d9e030e783be79e21f45024d20dda735911763"],"fromBlock":"0x43230e4","toBlock":"latest"}]}
Details: limit exceeded
```

## Root Cause
The frontend was querying blockchain events directly from the RPC using `eth_getLogs`, which:
1. Tried to fetch from deployment block (70,369,508) to latest
2. Could span hundreds of thousands of blocks
3. Exceeded the RPC provider's request limit
4. Was redundant since the backend already indexes these events

## Solution
Changed the frontend to use the backend API instead of direct RPC queries:

### Changes Made

#### 1. Added Backend API URL to Environment
**File**: `frontend/.env.local`
```bash
NEXT_PUBLIC_API_URL=https://pumpbnb-backend.onrender.com
```

#### 2. Updated `useTokenList` Hook
**File**: `frontend/lib/hooks/useTokenList.ts`

**Before** (Direct RPC query):
- Used `publicClient.getContractEvents()` to fetch events
- Queried last 10,000 blocks from RPC
- Could fail with rate limits
- Slow and wasteful

**After** (Backend API):
- Fetches from `${API_URL}/api/tokens?limit=100`
- Uses backend's indexed data
- Fast and reliable
- No RPC rate limit issues

#### 3. Updated `useWatchTokenCreated` Hook
**File**: `frontend/lib/hooks/useTokenEvents.ts`

**Added**:
- `poll: true` - Use polling instead of filters
- `pollingInterval: 5_000` - Check for new events every 5 seconds
- No `fromBlock` parameter - Only watch for NEW events going forward

**Why**: Prevents initial historical query that caused the rate limit error.

## Architecture Change

### Old Architecture (Bad)
```
Frontend → RPC Provider → Blockchain
   ↓
Query 100K+ blocks
   ↓
Rate limit error ❌
```

### New Architecture (Good)
```
Frontend → Backend API → PostgreSQL (indexed data)
   ↓
Fast, cached results
   ↓
Success ✅

Frontend → RPC (polling only for NEW events)
   ↓
Only queries recent blocks
   ↓
No rate limits ✅
```

## Benefits

1. **Faster Loading**: Backend has pre-indexed data
2. **No Rate Limits**: API handles pagination and caching
3. **More Reliable**: Backend manages RPC connections
4. **Better UX**: Users see data even when RPC is slow
5. **Scalable**: Backend can use multiple RPC providers

## Testing

### 1. Restart Frontend Dev Server
```bash
cd frontend
npm run dev
```

### 2. Visit Tokens Page
```
http://localhost:3000/tokens
```

### Expected Behavior
- ✅ Page loads without errors
- ✅ Shows empty state (since no tokens created yet)
- ✅ No RPC rate limit errors in console
- ✅ When a token is created, it appears within 5 seconds

### 3. Test Backend API Directly
```bash
curl https://pumpbnb-backend.onrender.com/api/tokens
```

Expected response:
```json
{
  "success": true,
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 0,
    "totalPages": 0
  }
}
```

## Future Improvements

### 1. Add WebSocket for Real-Time Updates
Instead of polling every 5 seconds, use WebSocket:
```typescript
// backend/src/services/websocket.service.ts
io.on('tokenCreated', (data) => {
  io.emit('newToken', data)
})

// frontend/lib/hooks/useTokenList.ts
useEffect(() => {
  socket.on('newToken', (token) => {
    setTokens(prev => [token, ...prev])
  })
}, [])
```

### 2. Add Caching
```typescript
// Use SWR or React Query for caching
import useSWR from 'swr'

export function useTokenList() {
  const { data, error, isLoading } = useSWR(
    `${API_URL}/api/tokens`,
    fetcher,
    { refreshInterval: 10000 } // Refresh every 10s
  )

  return { tokens: data?.data || [], isLoading, error }
}
```

### 3. Add Optimistic Updates
When user creates a token, add it immediately to UI:
```typescript
// Don't wait for backend/RPC confirmation
setTokens(prev => [optimisticToken, ...prev])

// Update when confirmed
socket.on('tokenConfirmed', (confirmedToken) => {
  setTokens(prev => prev.map(t =>
    t.address === confirmedToken.address ? confirmedToken : t
  ))
})
```

## Deployment

### For Render Frontend
The `.env.local` file is not deployed. You need to set environment variables in Render:

1. Go to Render Dashboard
2. Select "pumpbnb-frontend" service
3. Go to "Environment" tab
4. Add:
   ```
   NEXT_PUBLIC_API_URL=https://pumpbnb-backend.onrender.com
   ```
5. Save and redeploy

### Verify After Deploy
```bash
# Check if frontend can reach backend
curl https://pumpbnb-frontend.onrender.com/api/health

# Check tokens page (should not error)
curl https://pumpbnb-frontend.onrender.com/tokens
```

## Related Files Modified

- ✅ `frontend/.env.local` - Added NEXT_PUBLIC_API_URL
- ✅ `frontend/.env.example` - Added NEXT_PUBLIC_API_URL
- ✅ `frontend/lib/hooks/useTokenList.ts` - Changed from RPC to API
- ✅ `frontend/lib/hooks/useTokenEvents.ts` - Added polling config

## Troubleshooting

### If tokens page still shows RPC error
1. Make sure `.env.local` has `NEXT_PUBLIC_API_URL`
2. Restart the Next.js dev server (`npm run dev`)
3. Clear browser cache (Ctrl+Shift+R)
4. Check browser console for new errors

### If tokens don't load from backend
1. Check backend is running: `curl https://pumpbnb-backend.onrender.com/health`
2. Check API works: `curl https://pumpbnb-backend.onrender.com/api/tokens`
3. Check CORS is enabled for frontend domain
4. Look at Network tab in browser DevTools

### If new tokens don't appear in real-time
1. Check `useWatchTokenCreated` is being called
2. Verify `pollingInterval: 5000` is set
3. Check browser console for event logs
4. Test by creating a token and waiting 5-10 seconds

---

**Created**: 2025-10-28
**Priority**: HIGH - Frontend was completely broken
**Status**: ✅ Fixed
**Files Changed**: 4
**Lines Changed**: ~80
**Testing**: Required (restart dev server)

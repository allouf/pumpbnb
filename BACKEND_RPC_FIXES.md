# Backend RPC Issues - Fixed

## Issues Identified

### 1. Filter Not Found Error
**Error**: `"code": -32000, "message": "filter not found"`

**Cause**: The backend was using ethers.js `.on()` event listeners which create filters on the RPC node. BSC testnet RPC nodes expire these filters quickly (often within minutes), causing the error.

**Solution**: Replaced filter-based event listening with a **polling-based approach**:
- Polls for new events every 10 seconds
- Uses `queryFilter()` to fetch events between blocks
- No persistent filters that can expire

### 2. Request Exceeds Defined Limit
**Error**: `limit exceeded` when querying events from frontend

**Cause**:
- Initial indexing tried to query 5000 blocks at once
- Querying from deployment block to current block (potentially millions of blocks)
- BSC testnet RPC has strict rate limits

**Solution**: Reduced block range significantly:
- Changed chunk size: **5000 → 500 blocks**
- Limited initial indexing to **last 1000 blocks only**
- Added 100ms delay between chunk queries
- Better error handling (continues on chunk failure)

## Changes Made

### File: `backend/src/services/indexer.service.ts`

#### Before (Filter-based)
```typescript
// Used .on() listeners that create filters
tokenFactoryContract.on('TokenCreated', async (args) => {
  // Process event
});

bondingCurve.on('Buy', async (args) => {
  // Process event
});
```

#### After (Polling-based)
```typescript
// Poll every 10 seconds
pollingInterval = setInterval(async () => {
  await pollForNewEvents();
}, 10000);

// Query events without creating filters
const events = await tokenFactoryContract.queryFilter(
  filter,
  fromBlock,
  toBlock
);
```

### Key Implementation Details

1. **Polling Mechanism**:
   - Interval: 10 seconds
   - Tracks `lastIndexedBlock` to avoid re-processing
   - Graceful error handling

2. **Initial Indexing**:
   - Max range: 1000 blocks from current
   - Chunk size: 500 blocks
   - Delay: 100ms between chunks
   - Continues on chunk errors

3. **Event Processing**:
   - Checks for duplicate tokens before creating
   - Gets block timestamp for accurate creation time
   - Creates token and stats records atomically

## Deployment

### Changes Committed
```
commit 461e321
fix: Replace event filters with polling to avoid RPC filter expiration
```

### Deployment Trigger
- Pushed to `main` branch on BitBucket
- Render automatically detects and rebuilds
- Build process: ~2-5 minutes

## Testing After Deployment

### 1. Backend Health Check
```bash
curl https://pumpbnb-backend.onrender.com/health
```
Expected: `{"status":"ok","timestamp":"...","uptime":...}`

### 2. Tokens API (Previously Failing)
```bash
curl https://pumpbnb-backend.onrender.com/api/tokens
```
Expected: `{"success":true,"data":[],"pagination":{...}}`

### 3. Check Logs on Render
Look for:
- ✅ "Connected to BSC Testnet RPC"
- ✅ "Starting indexer from block X"
- ✅ "Indexing past events from block X to Y"
- ✅ "Started polling for new events every 10 seconds"
- ❌ No "filter not found" errors

### 4. Frontend Test
Visit: https://pumpbnb-frontend.onrender.com/tokens
- Should load without "request exceeds defined limit" error
- Should display empty array or any indexed tokens

## Why Polling is Better for This Use Case

### Advantages
1. **No Filter Expiration**: Filters can't expire if we don't create them
2. **Better Control**: We control polling frequency and block ranges
3. **Resilient**: Handles RPC node restarts/changes gracefully
4. **Debuggable**: Easy to see what blocks are being queried

### Trade-offs
1. **Slight Delay**: 10-second polling vs instant filter notifications
   - Acceptable for a launchpad (not high-frequency trading)
2. **More Queries**: Queries every 10s even when no events
   - Minimal cost on public RPC (small block ranges)

## Future Improvements

1. **Add Bonding Curve Event Polling**:
   - Currently only TokenCreated events are polled
   - Need to add Buy/Sell event polling for trade tracking

2. **Dynamic Polling Frequency**:
   - Slow down when network is idle
   - Speed up when detecting high activity

3. **WebSocket Alternative**:
   - Use WSS RPC endpoint if available
   - More efficient than polling for real-time data

4. **Database-based Block Tracking**:
   - Store last indexed block in database
   - Survives server restarts better

## Monitoring

Watch for these metrics after deployment:
- ✅ No "filter not found" errors in logs
- ✅ Tokens API returns 200 status
- ✅ Frontend loads token list
- ✅ New tokens appear within 10 seconds of creation
- ⚠️ RPC rate limit warnings (if any, increase delay between chunks)

## Render Deployment Status

Once pushed to main, monitor at:
- Render Dashboard: https://dashboard.render.com/
- Backend Service: Look for "Deploy succeeded" status
- Build time: ~2-5 minutes typically

---

**Status**: ✅ Code fixed and pushed to main branch
**Deployment**: 🔄 Waiting for Render to rebuild (auto-triggered)
**ETA**: 2-5 minutes from push time

# Quick Deployment Guide - PumpBNB Backend

## Current Situation

✅ **All fixes committed and pushed to main branch**
⏳ **Waiting for Render to deploy** (may need manual trigger)

## Quick Actions

### 1. Manual Deploy on Render (If auto-deploy doesn't work)

**Steps**:
1. Go to: https://dashboard.render.com/
2. Login with your account
3. Find service: **"pumpbnb-backend"**
4. Click: **"Manual Deploy"** button (top-right)
5. Select: **"Deploy latest commit"**
6. Wait: ~2-5 minutes for build + deployment

### 2. Verify Deployment is Live

```bash
# Run this to check backend uptime
curl -s https://pumpbnb-backend.onrender.com/health | grep uptime

# Uptime should be LOW (<100 seconds) if new deployment is live
# If uptime is HIGH (>900 seconds), deployment hasn't happened yet
```

### 3. Test All Endpoints

```bash
# Run comprehensive test
node test-api.js

# Expected result:
# ✅ Health Check: PASSED
# ✅ Get All Tokens: PASSED
# ✅ Get Trending Tokens: PASSED
# ✅ Get Recent Tokens: PASSED
```

## What Was Fixed (Summary)

### Round 1: Event Filter Issues
- ❌ Problem: "filter not found" errors
- ✅ Solution: Replaced `.on()` filters with polling
- ✅ Commit: `461e321`

### Round 2: Block Range & Database Issues
- ❌ Problem: "exceed maximum block range: 50000"
- ❌ Problem: "graduation_events table does not exist"
- ✅ Solution: Limit block range to 1000 max
- ✅ Solution: Handle missing DB tables gracefully
- ✅ Commit: `d9fcbe7`

## Expected Log Output (After Fix)

```
✅ Connected to BSC Testnet RPC
✅ Starting indexer from block X
✅ Indexing past events from block Y to Z
✅ Initialized lastIndexedBlock to current block: XXXXX
✅ Started polling for new events every 10 seconds
✅ Blockchain indexer started successfully
✅ Server running on http://0.0.0.0:3001

# Every 10 seconds:
✅ Polling blocks X to Y (where Y-X <= 1000)

# Should NOT see:
❌ "exceed maximum block range"
❌ "filter not found"
❌ "graduation_events table does not exist" (as error)
```

## Troubleshooting

### If Tests Still Fail

1. **Check Render Logs**:
   - Dashboard → pumpbnb-backend → Logs
   - Look for error messages
   - Verify deployment completed successfully

2. **Verify Correct Commit**:
   ```bash
   # Check deployed commit on Render
   # Should show: d9fcbe7 or later
   ```

3. **Check Environment Variables**:
   - Render Dashboard → Settings → Environment
   - Verify all required env vars are set
   - Especially: `DATABASE_URL`, `BSC_TESTNET_RPC`, `TOKEN_FACTORY_ADDRESS`

4. **Database Issues**:
   ```bash
   # If database tables are missing, run migration:
   # (In Render shell or locally with DATABASE_URL)
   npx prisma migrate deploy
   ```

### If Deployment Doesn't Start

- Check Render Dashboard for deployment queue
- Look for any error messages in Dashboard
- Verify BitBucket webhook is configured
- **Manual deploy is fastest solution**

## Success Criteria

### ✅ Deployment Successful When:
1. Render shows "Live" status with green checkmark
2. Health endpoint returns 200 OK
3. All `/api/tokens/*` endpoints return 200 OK
4. No error logs repeating every 10 seconds
5. Frontend can fetch token list without errors

## Next Steps After Success

1. 📝 Document the fixes in project documentation
2. 🧪 Create a test token to verify end-to-end flow
3. 🔍 Monitor logs for any other issues
4. 🎯 Consider implementing:
   - Bonding curve event polling (Buy/Sell)
   - Graduation event polling
   - Database migration automation

## Support

If issues persist, check:
- Render Status: https://status.render.com/
- BSC Testnet RPC: https://chainlist.org/chain/97
- Project Docs: `BACKEND_RPC_FIXES.md`

---

**Last Updated**: 2025-10-28 09:50 AM
**Status**: Fixes pushed, waiting for deployment
**Action**: Manual deploy on Render if needed

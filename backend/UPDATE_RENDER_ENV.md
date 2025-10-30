# 🔄 Update Render Environment Variables - October 30, 2025

**URGENT**: Update contract addresses on Render due to ASTER fix deployment

---

## What Changed

We redeployed all smart contracts with a fix for the ASTER token configuration. The old contracts won't work anymore because they had the mainnet ASTER address hardcoded.

**Old Deployment** (October 27, 2025) ❌:
- These contracts are now **deprecated**
- Trading will fail with ASTER address mismatch error

**New Deployment** (October 30, 2025) ✅:
- ASTER address is now configurable
- Trading works correctly on testnet
- All tests passing

---

## Contract Addresses to Update

### ❌ OLD Addresses (Remove These):
```
TOKEN_FACTORY_ADDRESS=0xCF0b298E26db22bCc886E03654A2Bfcb4E2742C2
GRADUATION_MANAGER_ADDRESS=0xeE147bc2307b645c59033B7A0b16EC5E68b2A5d3
PLATFORM_CONFIG_ADDRESS=0x0e4ED6983Bc8100936C42e5D98F9f1fEbF76b58E
ASTER_TOKEN_ADDRESS=0x2e5bEffE46eAADAb062ED2b520a0d95654CEdF5A
SAMPLE_TOKEN_ADDRESS=0xcFE6968c3427EcA3641d7132E03F53E7096d370e
```

### ✅ NEW Addresses (Use These):
```
TOKEN_FACTORY_ADDRESS=0x1c3a8Afb7DCA2479c7bC9546e54d6B5d01005d10
GRADUATION_MANAGER_ADDRESS=0x9aAF1512b9d74CdEb076F9b9756DA5588b7c0ED5
PLATFORM_CONFIG_ADDRESS=0xE98D020690F715EDb2dc1b48C4cfd678c9e2a3B5
ASTER_TOKEN_ADDRESS=0xB1c4267412EAc792973261CC450ce7902b33a42D
SAMPLE_TOKEN_ADDRESS=0x301F75A5B8DD75dA71a331CE36d752A1bFfc0723
```

---

## How to Update Render Environment Variables

### Step 1: Access Render Dashboard

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Find your backend service (likely named `pumpbnb-API` or `pumpbnb-backend`)
3. Click on the service name

### Step 2: Update Environment Variables

**Method A: Via Render Dashboard UI** (Recommended)

1. Click **"Environment"** tab in the left sidebar
2. Find each contract address variable
3. Click the **pencil icon** (Edit) next to each variable
4. Replace with new address
5. Click **"Save Changes"**

**Variables to Update**:

| Variable Name | New Value |
|---------------|-----------|
| `TOKEN_FACTORY_ADDRESS` | `0x1c3a8Afb7DCA2479c7bC9546e54d6B5d01005d10` |
| `GRADUATION_MANAGER_ADDRESS` | `0x9aAF1512b9d74CdEb076F9b9756DA5588b7c0ED5` |
| `PLATFORM_CONFIG_ADDRESS` | `0xE98D020690F715EDb2dc1b48C4cfd678c9e2a3B5` |
| `ASTER_TOKEN_ADDRESS` | `0xB1c4267412EAc792973261CC450ce7902b33a42D` |
| `SAMPLE_TOKEN_ADDRESS` | `0x301F75A5B8DD75dA71a331CE36d752A1bFfc0723` |

**Method B: Via Render CLI** (Advanced)

```bash
# Install Render CLI
npm install -g render-cli

# Login
render login

# Update variables (replace SERVICE_ID with your service ID)
render env set TOKEN_FACTORY_ADDRESS=0x1c3a8Afb7DCA2479c7bC9546e54d6B5d01005d10 --service=SERVICE_ID
render env set GRADUATION_MANAGER_ADDRESS=0x9aAF1512b9d74CdEb076F9b9756DA5588b7c0ED5 --service=SERVICE_ID
render env set PLATFORM_CONFIG_ADDRESS=0xE98D020690F715EDb2dc1b48C4cfd678c9e2a3B5 --service=SERVICE_ID
render env set ASTER_TOKEN_ADDRESS=0xB1c4267412EAc792973261CC450ce7902b33a42D --service=SERVICE_ID
render env set SAMPLE_TOKEN_ADDRESS=0x301F75A5B8DD75dA71a331CE36d752A1bFfc0723 --service=SERVICE_ID
```

### Step 3: Redeploy Service

After updating environment variables, you need to redeploy:

**Option 1: Automatic Redeploy** (Recommended)
1. Click **"Manual Deploy"** button at the top right
2. Select **"Clear build cache & deploy"**
3. Wait for deployment to complete (~5-10 minutes)

**Option 2: Git Push Redeploy**
1. Make a small change to trigger deployment (like update README)
2. Commit and push to main branch
3. Render will automatically detect and redeploy

### Step 4: Verify Deployment

Once redeployed, verify the new addresses are working:

```bash
# Test health endpoint
curl https://your-backend.onrender.com/health

# Test tokens endpoint (should use new contracts)
curl https://your-backend.onrender.com/api/tokens

# Check logs for any errors
# Go to Render Dashboard → Your Service → Logs
```

Look for these log messages:
```
✅ Connected to TokenFactory at 0x1c3a8Afb7DCA2479c7bC9546e54d6B5d01005d10
✅ Connected to ASTER token at 0xB1c4267412EAc792973261CC450ce7902b33a42D
✅ Blockchain indexer started
```

---

## Complete Environment Variables List

For reference, here's the complete list of environment variables your backend should have:

### Server Configuration
```env
NODE_ENV=production
PORT=3001
HOST=0.0.0.0
```

### Database URLs
```env
DATABASE_URL=<your-render-postgres-url>
MONGODB_URI=<your-mongodb-url-if-used>
REDIS_URL=<your-render-redis-url>
```

### Blockchain Configuration
```env
BSC_TESTNET_RPC=https://bsc-testnet-rpc.publicnode.com
BSC_MAINNET_RPC=https://bsc-dataseed1.binance.org
CHAIN_ID=97
```

### Contract Addresses (BSC Testnet) - ✅ UPDATED October 30, 2025
```env
TOKEN_FACTORY_ADDRESS=0x1c3a8Afb7DCA2479c7bC9546e54d6B5d01005d10
GRADUATION_MANAGER_ADDRESS=0x9aAF1512b9d74CdEb076F9b9756DA5588b7c0ED5
PLATFORM_CONFIG_ADDRESS=0xE98D020690F715EDb2dc1b48C4cfd678c9e2a3B5
ASTER_TOKEN_ADDRESS=0xB1c4267412EAc792973261CC450ce7902b33a42D
SAMPLE_TOKEN_ADDRESS=0x301F75A5B8DD75dA71a331CE36d752A1bFfc0723
```

### IPFS Configuration (Pinata)
```env
PINATA_API_KEY=<your-pinata-api-key>
PINATA_SECRET_KEY=<your-pinata-secret>
PINATA_JWT=<your-pinata-jwt>
```

### JWT Configuration
```env
JWT_SECRET=<your-jwt-secret>
JWT_EXPIRES_IN=7d
```

### Rate Limiting
```env
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### CORS Configuration
```env
CORS_ORIGIN=https://your-frontend.onrender.com
```

### Logging
```env
LOG_LEVEL=info
```

---

## What Happens After Update

### Expected Behavior:

✅ **Token Creation**:
- Tokens will be created via new TokenFactory
- FREE token creation will work correctly

✅ **Trading**:
- Users can buy/sell tokens with ASTER
- Bonding curve math works correctly
- Fees distributed properly (1% during bonding curve, 0.3% post-graduation)

✅ **Blockchain Indexer**:
- Will start indexing events from new contracts
- Old contract events will no longer be indexed

### Potential Issues:

⚠️ **Old Tokens**:
- Tokens created with old contracts may not appear
- Users should create new tokens with the updated contracts

⚠️ **Historical Data**:
- Trades from old contracts won't be visible
- This is expected - fresh start with fixed contracts

---

## Verification Checklist

After updating and redeploying, verify:

- [ ] Service redeployed successfully
- [ ] No errors in Render logs
- [ ] Health endpoint returns 200 OK
- [ ] `/api/tokens` endpoint works
- [ ] Contract addresses in logs match new deployment
- [ ] Can create new tokens via API
- [ ] Trading endpoints work correctly
- [ ] ASTER token address correct in database

---

## Testing Your Updated Backend

### 1. Test Health Endpoint
```bash
curl https://your-backend.onrender.com/health
```

Expected Response:
```json
{
  "status": "ok",
  "timestamp": "2025-10-30T...",
  "uptime": 123.45,
  "database": "connected",
  "redis": "connected",
  "blockchain": "synced"
}
```

### 2. Test Token Factory Connection
```bash
curl https://your-backend.onrender.com/api/config/contracts
```

Expected Response:
```json
{
  "tokenFactory": "0x1c3a8Afb7DCA2479c7bC9546e54d6B5d01005d10",
  "platformConfig": "0xE98D020690F715EDb2dc1b48C4cfd678c9e2a3B5",
  "graduationManager": "0x9aAF1512b9d74CdEb076F9b9756DA5588b7c0ED5",
  "asterToken": "0xB1c4267412EAc792973261CC450ce7902b33a42D",
  "chainId": 97,
  "network": "BSC Testnet"
}
```

### 3. Check Logs
Look for these success messages in Render logs:
```
[INFO] Starting PumpBNB API...
[INFO] PostgreSQL connected
[INFO] Redis connected
[INFO] TokenFactory initialized: 0x1c3a8Afb7DCA2479c7bC9546e54d6B5d01005d10
[INFO] Blockchain indexer started
[INFO] Server listening on port 3001
```

---

## Troubleshooting

### Issue: "Contract not found" errors

**Solution**:
- Double-check addresses are exactly correct (including 0x prefix)
- Verify CHAIN_ID=97 for BSC Testnet
- Restart service after updating env vars

### Issue: "ASTER token not found" errors

**Solution**:
- Verify ASTER_TOKEN_ADDRESS is the new Mock ASTER address
- Check BSC_TESTNET_RPC is accessible
- Verify contract exists on BSCScan Testnet

### Issue: Service won't start after update

**Solution**:
1. Check Render logs for specific error
2. Verify all required env vars are set
3. Try "Clear build cache & deploy"
4. Check if DATABASE_URL is still valid

### Issue: Old tokens still showing

**Expected Behavior**:
- Old tokens from previous contracts won't work with new system
- Users should create fresh tokens
- Update frontend to point users to new token creation

---

## Quick Update Script

Copy-paste this into Render Dashboard Environment tab (one variable at a time):

```
TOKEN_FACTORY_ADDRESS=0x1c3a8Afb7DCA2479c7bC9546e54d6B5d01005d10
GRADUATION_MANAGER_ADDRESS=0x9aAF1512b9d74CdEb076F9b9756DA5588b7c0ED5
PLATFORM_CONFIG_ADDRESS=0xE98D020690F715EDb2dc1b48C4cfd678c9e2a3B5
ASTER_TOKEN_ADDRESS=0xB1c4267412EAc792973261CC450ce7902b33a42D
SAMPLE_TOKEN_ADDRESS=0x301F75A5B8DD75dA71a331CE36d752A1bFfc0723
```

---

## Need Help?

**Issues with Render:**
- [Render Support](https://render.com/docs/support)
- [Render Status Page](https://status.render.com)

**Issues with Smart Contracts:**
- Check `ASTER_FIX_COMPLETE.md` for contract fix details
- Verify contracts on [BSCScan Testnet](https://testnet.bscscan.com)

**Backend Issues:**
- Check backend logs in Render Dashboard
- Review `backend/README.md` for troubleshooting
- Test locally first with updated `.env`

---

## Summary

**What to do:**
1. ✅ Update 5 contract address environment variables on Render
2. ✅ Redeploy backend service
3. ✅ Verify deployment with health check
4. ✅ Test API endpoints

**Time Required:** ~10 minutes

**Downtime:** ~5 minutes during redeploy

**Impact:** Critical - old addresses won't work for trading

---

**Updated**: October 30, 2025
**Deployment**: BSC Testnet
**Status**: Ready to Update
**Priority**: HIGH - Required for trading functionality

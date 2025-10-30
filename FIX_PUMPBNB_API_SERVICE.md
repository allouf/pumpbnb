# 🔧 Fix pumpbnb-api Service - Add Missing Contract Addresses

## Problem Found

You have **3 Render services**:
1. ✅ `pumpbnb-backend` - Has correct contract addresses but NOT being used
2. ❌ `pumpbnb-api` - Being used but MISSING contract addresses
3. `pumpbnb-frontend` - Frontend service

**Current situation**:
- Frontend is calling: `https://pumpbnb-api.onrender.com`
- But `pumpbnb-api` has NO contract addresses configured
- Result: API errors and empty token list

## Solution: Add Contract Addresses to pumpbnb-api

### Step 1: Go to Render Dashboard
```
https://dashboard.render.com
```

### Step 2: Select pumpbnb-api Service
Find and click on: **`pumpbnb-api`**

### Step 3: Go to Environment Tab
Click **"Environment"** in the left sidebar

### Step 4: Add These 5 New Environment Variables

Click **"Add Environment Variable"** for each:

| Variable Name | Value |
|---------------|-------|
| `TOKEN_FACTORY_ADDRESS` | `0x1c3a8Afb7DCA2479c7bC9546e54d6B5d01005d10` |
| `GRADUATION_MANAGER_ADDRESS` | `0x9aAF1512b9d74CdEb076F9b9756DA5588b7c0ED5` |
| `PLATFORM_CONFIG_ADDRESS` | `0xE98D020690F715EDb2dc1b48C4cfd678c9e2a3B5` |
| `ASTER_TOKEN_ADDRESS` | `0xB1c4267412EAc792973261CC450ce7902b33a42D` |
| `SAMPLE_TOKEN_ADDRESS` | `0x301F75A5B8DD75dA71a331CE36d752A1bFfc0723` |

### Step 5: Also Add These RPC Variables (if missing)

| Variable Name | Value |
|---------------|-------|
| `BSC_TESTNET_RPC` | `https://bsc-testnet-rpc.publicnode.com` |
| `BSC_MAINNET_RPC` | `https://bsc-dataseed1.binance.org` |
| `CHAIN_ID` | `97` |

### Step 6: Save All Changes
Click **"Save Changes"** button

### Step 7: Redeploy
Click **"Manual Deploy"** → **"Clear build cache & deploy"**

### Step 8: Wait for Deployment
Wait ~5 minutes for redeployment to complete

### Step 9: Verify

Test the API:
```bash
# Should return healthy
curl https://pumpbnb-api.onrender.com/health

# Should return tokens (not empty)
curl https://pumpbnb-api.onrender.com/api/tokens
```

---

## Alternative: Update Frontend to Use pumpbnb-backend

If you prefer to use the `pumpbnb-backend` service (which already has correct addresses):

### Option 1: Update Frontend API URL

In `pumpbnb-frontend` environment variables:
1. Find any variable pointing to API URL
2. Change from: `https://pumpbnb-api.onrender.com`
3. Change to: `https://pumpbnb-backend.onrender.com`

### Option 2: Update Frontend Code

If API URL is hardcoded in frontend code:
1. Check `frontend/lib/api.ts` or similar
2. Update API base URL to `https://pumpbnb-backend.onrender.com`
3. Redeploy frontend

---

## Recommended Solution

**Add contract addresses to `pumpbnb-api`** (follow steps above)

**Why?**
- Frontend is already configured to use `pumpbnb-api`
- Less changes needed
- Cleaner URL structure
- `pumpbnb-backend` might be for internal use

---

## Copy-Paste Values

```
TOKEN_FACTORY_ADDRESS=0x1c3a8Afb7DCA2479c7bC9546e54d6B5d01005d10
GRADUATION_MANAGER_ADDRESS=0x9aAF1512b9d74CdEb076F9b9756DA5588b7c0ED5
PLATFORM_CONFIG_ADDRESS=0xE98D020690F715EDb2dc1b48C4cfd678c9e2a3B5
ASTER_TOKEN_ADDRESS=0xB1c4267412EAc792973261CC450ce7902b33a42D
SAMPLE_TOKEN_ADDRESS=0x301F75A5B8DD75dA71a331CE36d752A1bFfc0723
BSC_TESTNET_RPC=https://bsc-testnet-rpc.publicnode.com
BSC_MAINNET_RPC=https://bsc-dataseed1.binance.org
CHAIN_ID=97
```

---

## After Update, Everything Will Work:

✅ `GET /api/tokens` - Will return Sample Token + TestCoin
✅ Frontend will show ASTER balance correctly
✅ Token creation will work
✅ Trading will work

---

**Time Required**: 10 minutes
**Priority**: HIGH
**Action**: Add 5 contract addresses to pumpbnb-api service

---

**Created**: October 30, 2025
**Service**: pumpbnb-api.onrender.com
**Status**: Ready to Fix

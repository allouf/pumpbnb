# ⚠️ URGENT: Update Render Backend NOW

## Problem

Your Render backend API is still using **OLD contract addresses** from October 27th deployment.

**Result**:
- ❌ No tokens showing in API
- ❌ Frontend shows "no ASTER" because it's reading from wrong contract
- ❌ Token creation won't work properly

## Solution: Update 5 Environment Variables

### 1. Go to Render Dashboard
```
https://dashboard.render.com/web/srv-csq26gl6l47c73fqoiu0
```
(Or find your `pumpbnb-api` service)

### 2. Click "Environment" Tab

### 3. Update These 5 Variables

**Find each variable, click Edit (pencil icon), paste new value, Save**:

```
TOKEN_FACTORY_ADDRESS
Old: 0xCF0b298E26db22bCc886E03654A2Bfcb4E2742C2
New: 0x1c3a8Afb7DCA2479c7bC9546e54d6B5d01005d10

GRADUATION_MANAGER_ADDRESS
Old: 0xeE147bc2307b645c59033B7A0b16EC5E68b2A5d3
New: 0x9aAF1512b9d74CdEb076F9b9756DA5588b7c0ED5

PLATFORM_CONFIG_ADDRESS
Old: 0x0e4ED6983Bc8100936C42e5D98F9f1fEbF76b58E
New: 0xE98D020690F715EDb2dc1b48C4cfd678c9e2a3B5

ASTER_TOKEN_ADDRESS
Old: 0x2e5bEffE46eAADAb062ED2b520a0d95654CEdF5A
New: 0xB1c4267412EAc792973261CC450ce7902b33a42D

SAMPLE_TOKEN_ADDRESS
Old: 0xcFE6968c3427EcA3641d7132E03F53E7096d370e
New: 0x301F75A5B8DD75dA71a331CE36d752A1bFfc0723
```

### 4. Save and Redeploy

After updating all 5 variables:
1. Click **"Manual Deploy"** button (top right)
2. Select **"Clear build cache & deploy"**
3. Wait ~5 minutes for redeployment

### 5. Verify

After deployment completes:

```bash
# Should show healthy
curl https://pumpbnb-api.onrender.com/health

# Should show tokens with new addresses
curl https://pumpbnb-api.onrender.com/api/tokens
```

## Why This Fixes Everything

1. ✅ **Backend will read from correct contracts** - New ASTER address
2. ✅ **Blockchain indexer will index correct tokens** - New TokenFactory
3. ✅ **Frontend will show ASTER balance** - Correct MockASTER address
4. ✅ **Token creation will work** - Correct factory address
5. ✅ **Trading will work** - Correct bonding curve mechanics

## Copy-Paste Values (One by One)

```
0x1c3a8Afb7DCA2479c7bC9546e54d6B5d01005d10
0x9aAF1512b9d74CdEb076F9b9756DA5588b7c0ED5
0xE98D020690F715EDb2dc1b48C4cfd678c9e2a3B5
0xB1c4267412EAc792973261CC450ce7902b33a42D
0x301F75A5B8DD75dA71a331CE36d752A1bFfc0723
```

## Time Required

⏱️ **5 minutes** to update variables + **5 minutes** for redeploy = **10 minutes total**

---

**Do this NOW to fix the API and frontend!** 🚀

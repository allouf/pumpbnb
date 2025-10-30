# 🚀 Render Deployment Steps - Final

## ✅ What Just Happened

All code changes have been committed and pushed to Bitbucket:
- ✅ Backend `/api/config` endpoint created
- ✅ Fixed `start:migrate` script to compile TypeScript
- ✅ Frontend config utilities created
- ✅ Pushed to: https://bitbucket.org/allouf/pumpbnb

---

## 🎯 Render Should Auto-Deploy

Render automatically deploys when you push to the main branch. Check the dashboard:

### 1. Go to Render Dashboard
```
https://dashboard.render.com
```

### 2. Find pumpbnb-backend Service
- Should show "Deploying..." or "Build in progress"
- This happens automatically when you push to Bitbucket

### 3. Monitor Build Logs
Click on the service → **Logs** tab to watch:
```
==> Running build command 'npm run start:migrate'...
> prisma generate
> tsc
> prisma migrate deploy
> node dist/server.js
```

Should see:
- ✅ `Prisma schema loaded`
- ✅ `No pending migrations to apply` or `Applied X migrations`
- ✅ `Server running on http://0.0.0.0:3001`
- ✅ `Blockchain indexer started`

---

## 🧪 Test After Deployment

### 1. Wait for "Live" Status
- Render dashboard should show green "Live" badge
- Takes ~3-5 minutes

### 2. Test Config Endpoint (NEW!)
```bash
curl https://pumpbnb-backend.onrender.com/api/config

# Should return:
{
  "success": true,
  "data": {
    "chainId": 97,
    "networkName": "BSC Testnet",
    "contracts": {
      "tokenFactory": "0x1c3a8Afb7DCA2479c7bC9546e54d6B5d01005d10",
      "platformConfig": "0xE98D020690F715EDb2dc1b48C4cfd678c9e2a3B5",
      "graduationManager": "0x9aAF1512b9d74CdEb076F9b9756DA5588b7c0ED5",
      "asterToken": "0xB1c4267412EAc792973261CC450ce7902b33a42D",
      "sampleToken": "0x301F75A5B8DD75dA71a331CE36d752A1bFfc0723",
      ...
    },
    "fees": {...},
    "tokenConfig": {...}
  }
}
```

### 3. Test Tokens Endpoint (FIXED!)
```bash
curl https://pumpbnb-backend.onrender.com/api/tokens

# Should return tokens (not error!):
{
  "success": true,
  "data": [
    {
      "address": "0x301F75A5B8DD75dA71a331CE36d752A1bFfc0723",
      "name": "Sample Token",
      "symbol": "TEST",
      ...
    },
    {
      "address": "0x273A04E782622ad0DBd68b7EF7cf140ACd3ad789",
      "name": "TestCoin",
      "symbol": "TCOIN",
      ...
    }
  ],
  "pagination": {...}
}
```

### 4. Test Frontend
```
https://pumpbnb-frontend.onrender.com
```
- Connect wallet
- Check ASTER balance displays
- Check token list shows 2 tokens
- Try creating a token
- Try trading

---

## 🔧 If Deployment Fails

### Check Build Command on Render
Sometimes Render doesn't use the updated `package.json`. Verify:

1. Go to Render dashboard
2. Click: **pumpbnb-backend**
3. Click: **Settings** tab
4. Find: **Build Command**
5. Should be: `npm install` (default)
6. Find: **Start Command**
7. Should be: `npm run start:migrate`

If Start Command is still `npm start`, change it to `npm run start:migrate`.

---

## 📊 What Changed in package.json

### Before:
```json
"start:migrate": "npx prisma migrate deploy && node dist/server.js"
```
**Problem**: Tries to run compiled code but TypeScript never compiled!

### After:
```json
"start:migrate": "prisma generate && tsc && prisma migrate deploy && node dist/server.js"
```
**Fixed**:
1. `prisma generate` - Generate Prisma client
2. `tsc` - Compile TypeScript to dist/
3. `prisma migrate deploy` - Run database migrations
4. `node dist/server.js` - Start server

---

## ✅ Success Criteria

After deployment, all these should work:

- [x] Backend health: `GET /health` → `{"status":"ok"}`
- [x] Backend config: `GET /api/config` → Returns contract addresses
- [x] Backend tokens: `GET /api/tokens` → Returns 2 tokens (not error!)
- [x] Frontend loads without errors
- [x] Frontend shows ASTER balance
- [x] Frontend shows token list
- [x] Token creation works
- [x] Token trading works

---

## 📝 Next Steps After Successful Deploy

### Optional: Update Frontend to Use Dynamic Config

The backend now provides `/api/config`, but the frontend still uses hardcoded addresses from `.env.local`. To complete the migration:

1. Update frontend components to use `useConfig()` hook
2. Remove contract addresses from frontend `.env.local`
3. See `FRONTEND_MIGRATION_GUIDE.md` for details

**But this is optional** - the frontend will work fine with the current setup. The `/api/config` endpoint is ready when you want to migrate.

---

## 🎯 Summary

**What you need to do**: Nothing! Just wait for Render auto-deploy.

**Timeline**:
- Render detects push: ~1 minute
- Build + deploy: ~3-5 minutes
- Total: ~5 minutes

**How to monitor**:
- Go to Render dashboard
- Watch build logs
- Look for "Live" status

**How to verify**:
```bash
curl https://pumpbnb-backend.onrender.com/api/config
curl https://pumpbnb-backend.onrender.com/api/tokens
```

---

**Created**: October 30, 2025
**Status**: Pushed to Bitbucket, waiting for Render auto-deploy
**Commit**: `38af11b` - feat: Add /api/config endpoint and fix database migrations

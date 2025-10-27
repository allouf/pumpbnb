# Deployment Checklist - pumpbnb-backend

**Track 2 Backend → Production Deployment**
**Estimated Time:** 50-60 minutes

---

## Pre-Deployment ✅

- [x] Backend code complete (Track 2)
- [x] All dependencies installed (396 packages)
- [x] Contract addresses updated (October 27, 2025)
- [x] Documentation complete
- [x] Git repo up to date

**Status: READY TO DEPLOY** ✅

---

## Step 1: Create Redis Cache (Key-Value Store) 🔴

**Time: 5 minutes**

### Tasks:
- [ ] Go to Render Dashboard
- [ ] Click **New** → **Key-Value Store** (this is Redis!)
- [ ] Name: `pumpbnb-redis`
- [ ] Plan: Free (Starter plan for production)
- [ ] Region: Oregon (same as database)
- [ ] Max Memory Policy: allkeys-lru
- [ ] Click **Create**
- [ ] Wait for status: "Available"
- [ ] Click on the store → **Connect** tab
- [ ] Copy **Internal Redis URL**

### Redis URL:
```
redis://default:XXXXX@red-xxxxx.oregon-redis.render.com:6379
```

**Paste URL here for reference:**
```
_________________________________________________
```

✅ **Redis created and URL saved**

---

## Step 2: Database Migrations 🗄️

**Time: 10 minutes**

### Get Database URL:
- [ ] Render Dashboard → **pumpbnb-db** → **Info**
- [ ] Copy **Internal Database URL**

**Paste URL here for reference:**
```
postgresql://____________________________________
```

### Run Migrations:
- [ ] Open PowerShell
- [ ] Navigate to backend: `cd F:\BNB_PumpFun\backend`
- [ ] Set DATABASE_URL: `$env:DATABASE_URL="<paste URL>"`
- [ ] Generate migration: `npx prisma migrate dev --name initial_schema`
- [ ] Deploy to production: `npx prisma migrate deploy`
- [ ] Generate client: `npx prisma generate`

### Verify:
- [ ] Run `npx prisma studio`
- [ ] Browser opens at localhost:5555
- [ ] See 7 tables: tokens, trades, token_stats, user_portfolios, watchlists, graduation_events, platform_stats

✅ **Database migrated successfully**

---

## Step 3: Get Pinata Credentials 🔑

**Time: 5 minutes**

### If you don't have Pinata account:
- [ ] Go to https://pinata.cloud
- [ ] Sign up (free tier)
- [ ] Go to Developers → API Keys
- [ ] Create new key
- [ ] Copy API Key, Secret Key, JWT

### Credentials:
```
PINATA_API_KEY = _______________________
PINATA_SECRET_KEY = ___________________
PINATA_JWT = ___________________________
```

✅ **Pinata credentials ready**

---

## Step 4: Generate JWT Secret 🔐

**Time: 1 minute**

### PowerShell:
```powershell
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | % {[char]$_})
```

**Copy output:**
```
JWT_SECRET = ______________________________
```

✅ **JWT secret generated**

---

## Step 5: Create Backend Service 🚀

**Time: 15 minutes**

### Create Service:
- [ ] Render Dashboard → **New** → **Web Service**
- [ ] Connect Git repository
- [ ] Select: **BNB_PumpFun** (or your repo name)

### Configure:
- [ ] Name: `pumpbnb-backend`
- [ ] Region: Oregon
- [ ] Branch: main
- [ ] Root Directory: `backend`
- [ ] Runtime: Node

### Build Settings:
- [ ] Build Command:
  ```
  npm install && npx prisma generate && npm run build
  ```
- [ ] Start Command:
  ```
  npm start
  ```
- [ ] Health Check Path: `/health`

- [ ] Click **Create Web Service** (don't deploy yet)

✅ **Service created**

---

## Step 6: Configure Environment Variables ⚙️

**Time: 10 minutes**

### On pumpbnb-backend → Environment Tab:

#### Server
- [ ] `NODE_ENV` = `production`
- [ ] `PORT` = `3001`
- [ ] `HOST` = `0.0.0.0`

#### Database
- [ ] `DATABASE_URL` = `<from Step 2>`

#### Redis
- [ ] `REDIS_URL` = `<from Step 1>`

#### Blockchain
- [ ] `BSC_TESTNET_RPC` = `https://bsc-testnet-rpc.publicnode.com`
- [ ] `BSC_MAINNET_RPC` = `https://bsc-dataseed1.binance.org`
- [ ] `CHAIN_ID` = `97`

#### Contract Addresses
- [ ] `TOKEN_FACTORY_ADDRESS` = `0xCF0b298E26db22bCc886E03654A2Bfcb4E2742C2`
- [ ] `GRADUATION_MANAGER_ADDRESS` = `0xeE147bc2307b645c59033B7A0b16EC5E68b2A5d3`
- [ ] `PLATFORM_CONFIG_ADDRESS` = `0x0e4ED6983Bc8100936C42e5D98F9f1fEbF76b58E`
- [ ] `ASTER_TOKEN_ADDRESS` = `0x2e5bEffE46eAADAb062ED2b520a0d95654CEdF5A`
- [ ] `SAMPLE_TOKEN_ADDRESS` = `0xcFE6968c3427EcA3641d7132E03F53E7096d370e`

#### IPFS (Pinata)
- [ ] `PINATA_API_KEY` = `<from Step 3>`
- [ ] `PINATA_SECRET_KEY` = `<from Step 3>`
- [ ] `PINATA_JWT` = `<from Step 3>`

#### Security
- [ ] `JWT_SECRET` = `<from Step 4>`
- [ ] `CORS_ORIGIN` = `https://pumpbnb-frontend.onrender.com`

#### Rate Limiting
- [ ] `RATE_LIMIT_WINDOW_MS` = `900000`
- [ ] `RATE_LIMIT_MAX_REQUESTS` = `100`

#### Logging
- [ ] `LOG_LEVEL` = `info`

### Save:
- [ ] Click **Save Changes**

✅ **Environment variables configured**

---

## Step 7: Deploy & Monitor 📡

**Time: 10 minutes**

### Deployment starts automatically after saving env vars

- [ ] Go to **Logs** tab
- [ ] Watch deployment progress

### Look for Success Messages:

**Build Phase:**
- [ ] `Installing dependencies`
- [ ] `Generated Prisma Client`
- [ ] `TypeScript compilation successful`

**Start Phase:**
- [ ] `PostgreSQL connected`
- [ ] `Redis connected`
- [ ] `Blockchain indexer started`
- [ ] `TokenFactory contract connected`
- [ ] `WebSocket server initialized`
- [ ] `Server running on port 3001`

**Deploy Complete:**
- [ ] `Your service is live 🎉`

**Service URL:**
```
https://pumpbnb-backend.onrender.com
```

✅ **Service deployed successfully**

---

## Step 8: Verify Deployment ✓

**Time: 5 minutes**

### Test Health Endpoint:
- [ ] Open browser
- [ ] Go to: `https://pumpbnb-backend.onrender.com/health`
- [ ] See response:
  ```json
  {
    "status": "ok",
    "database": "connected",
    "redis": "connected"
  }
  ```

### Test API Endpoints:

**Tokens List:**
- [ ] Go to: `https://pumpbnb-backend.onrender.com/api/tokens`
- [ ] See: `{"success": true, "data": [], "pagination": {...}}`

**Trending:**
- [ ] Go to: `https://pumpbnb-backend.onrender.com/api/tokens/trending`
- [ ] See: `{"success": true, "data": []}`

### Check Logs:
- [ ] Database connection: ✅
- [ ] Redis connection: ✅
- [ ] Blockchain indexer: ✅
- [ ] WebSocket server: ✅

✅ **All endpoints working**

---

## Step 9: Test Blockchain Indexer 🔗

**Time: 5 minutes**

### Check Indexer Status:
- [ ] Render Dashboard → pumpbnb-backend → Logs
- [ ] Look for: `Blockchain indexer started`
- [ ] Look for: `TokenFactory contract: 0xCF0b...`
- [ ] Look for: `Listening for real-time events`

### Optional - Test with Token Creation:
- [ ] Create test token on BSC Testnet
- [ ] Wait 30 seconds
- [ ] Check logs for: `New token created: 0x...`
- [ ] Query API: `/api/tokens`
- [ ] Should see new token in list

✅ **Indexer working**

---

## Step 10: Update Frontend (Optional) 🎨

**Time: 3 minutes**

### Add Production Backend URL:
- [ ] Render Dashboard → **pumpbnb-frontend**
- [ ] Environment tab
- [ ] Add variable:
  ```
  NEXT_PUBLIC_BACKEND_API_URL = https://pumpbnb-backend.onrender.com
  NEXT_PUBLIC_BACKEND_WS_URL = wss://pumpbnb-backend.onrender.com
  ```
- [ ] Save changes

**Note:** Keeps existing `NEXT_PUBLIC_API_URL` for test data

✅ **Frontend can access both APIs**

---

## Final Verification ✅

### Services Status:

- [ ] ✅ **pumpbnb-frontend** - Running
- [ ] ✅ **pumpbnb-API** - Running (test/mock data)
- [ ] ✅ **pumpbnb-backend** - Running (NEW - production)
- [ ] ✅ **pumpbnb-redis** - Running (NEW)
- [ ] ✅ **pumpbnb-db** - Running (7 tables)
- [ ] ✅ **pumpbnb** - Running (mock UI)

### Service URLs:

**Production Backend:**
```
https://pumpbnb-backend.onrender.com
```

**Test/Mock API:**
```
https://pumpbnb-api.onrender.com
```

**Frontend:**
```
https://pumpbnb-frontend.onrender.com
```

---

## Post-Deployment Tasks 📋

### Immediate (First Hour):
- [ ] Monitor logs for errors
- [ ] Test all 21 API endpoints
- [ ] Verify WebSocket connections
- [ ] Check blockchain indexer receiving events

### This Week:
- [ ] Set up Render alerts for downtime
- [ ] Configure database backups
- [ ] Test frontend integration
- [ ] Performance monitoring

### This Month:
- [ ] Add error tracking (Sentry)
- [ ] Optimize database queries
- [ ] Consider Starter plans ($26/mo for all services)
- [ ] Set up CI/CD pipeline

---

## Troubleshooting Guide 🔧

### Build Failed?
**Check:**
- [ ] Build command includes `npx prisma generate`
- [ ] All dependencies in package.json
- [ ] TypeScript compiles locally: `npm run build`

### Can't Connect to Database?
**Check:**
- [ ] DATABASE_URL is Internal URL (not External)
- [ ] pumpbnb-db is running
- [ ] Migrations were run successfully
- [ ] No typos in connection string

### Can't Connect to Redis?
**Check:**
- [ ] pumpbnb-redis is created and running
- [ ] REDIS_URL is Internal URL
- [ ] No typos in connection string

### Blockchain Indexer Not Working?
**Check:**
- [ ] All contract addresses correct
- [ ] BSC_TESTNET_RPC accessible
- [ ] CHAIN_ID = 97
- [ ] Check logs for specific errors

---

## Success Metrics 📊

**Deployment Complete When:**

- ✅ All services running (6 total)
- ✅ Health check returns "ok"
- ✅ Database connected (7 tables)
- ✅ Redis connected
- ✅ Blockchain indexer listening
- ✅ WebSocket server running
- ✅ All 21 API endpoints accessible
- ✅ No errors in logs

**Status:**
```
[  ] In Progress
[  ] Complete
```

---

## Time Tracking ⏱️

| Step | Estimated | Actual | Status |
|------|-----------|--------|--------|
| 1. Create Redis | 5 min | ___ min | ☐ |
| 2. Migrate DB | 10 min | ___ min | ☐ |
| 3. Get Pinata | 5 min | ___ min | ☐ |
| 4. JWT Secret | 1 min | ___ min | ☐ |
| 5. Create Service | 15 min | ___ min | ☐ |
| 6. Configure Env | 10 min | ___ min | ☐ |
| 7. Deploy | 10 min | ___ min | ☐ |
| 8. Verify | 5 min | ___ min | ☐ |
| 9. Test Indexer | 5 min | ___ min | ☐ |
| 10. Update Frontend | 3 min | ___ min | ☐ |
| **TOTAL** | **~60 min** | **___ min** | ☐ |

---

## Notes / Issues

```
_____________________________________________

_____________________________________________

_____________________________________________

_____________________________________________
```

---

**Ready?** Start with Step 1! 🚀

**Questions?** Check `DEPLOYMENT_STEPS.md` for detailed instructions.

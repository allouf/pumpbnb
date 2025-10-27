# Deployment Steps for pumpbnb-backend

**Service Strategy:** Create NEW service (pumpbnb-backend)
**Keeps:** pumpbnb-API (test/mock data) intact
**Date:** October 27, 2025

---

## Step 1: Create pumpbnb-redis (5 minutes)

### On Render Dashboard:

1. Click **Dashboard** → **New** → **Key-Value Store** (this is Redis!)

2. **Configuration:**
   ```
   Name: pumpbnb-redis
   Plan: Free (or Starter for production)
   Region: Oregon (or same as your database)
   Max Memory Policy: allkeys-lru
   ```

3. Click **Create**

4. **WAIT** for the Key-Value Store to be created (status shows "Available")

5. **Copy the Connection String:**
   - Click on **pumpbnb-redis** → **Connect** tab
   - Copy the **Internal Redis URL** (under "Redis Connection String")

   **Format:**
   ```
   redis://default:XXXXXXXXXXXXX@red-xxxxx.oregon-redis.render.com:6379
   ```

**✅ Save this URL** - You'll need it in Step 3

---

## Step 2: Run Database Migrations (10 minutes)

### Get Database Connection String:

1. Render Dashboard → **pumpbnb-db** → **Info**
2. Copy **Internal Database URL**

**Format:**
```
postgresql://pumpbnb_db_user:XXXXX@dpg-xxxxx.oregon-postgres.render.com/pumpbnb_db
```

### Run Migrations Locally:

Open PowerShell on your machine:

```powershell
# Navigate to backend folder
cd F:\BNB_PumpFun\backend

# Set the database URL (replace with YOUR actual URL)
$env:DATABASE_URL="postgresql://pumpbnb_db_user:XXXXX@dpg-xxxxx.oregon-postgres.render.com/pumpbnb_db"

# Generate migration files (if not already done)
npx prisma migrate dev --name initial_schema

# Deploy migrations to production
npx prisma migrate deploy

# Generate Prisma Client
npx prisma generate
```

### Expected Output:

```
✔ Generated Prisma Client (6.x.x)

The following migration(s) have been applied:

migrations/
  └─ 20251027xxxxxx_initial_schema/
    └─ migration.sql

✅ All migrations have been successfully applied.
```

### Verify Migration Success:

```powershell
# Open Prisma Studio to browse database
npx prisma studio
```

Should open browser at `http://localhost:5555` showing 7 tables:
- ✅ tokens
- ✅ trades
- ✅ token_stats
- ✅ user_portfolios
- ✅ watchlists
- ✅ graduation_events
- ✅ platform_stats

**✅ Database is ready!**

---

## Step 3: Create pumpbnb-backend Service (20 minutes)

### On Render Dashboard:

1. Click **Dashboard** → **New** → **Web Service**

2. **Connect Repository:**
   - Choose your Git provider (GitHub/GitLab/Bitbucket)
   - Select repository: **BNB_PumpFun** (or your repo name)
   - Click **Connect**

3. **Configure Service:**

   **Basic Settings:**
   ```
   Name: pumpbnb-backend
   Region: Oregon (same as database)
   Branch: main
   Root Directory: backend
   Runtime: Node
   ```

   **Build & Deploy Settings:**
   ```
   Build Command:
   npm install && npx prisma generate && npm run build

   Start Command:
   npm start
   ```

   **Advanced Settings:**
   ```
   Health Check Path: /health
   Auto-Deploy: Yes
   ```

4. Click **Create Web Service** (DON'T deploy yet - we need to add environment variables first)

---

## Step 4: Configure Environment Variables (10 minutes)

### On pumpbnb-backend Service Page:

1. Click **Environment** tab (left sidebar)

2. Click **Add Environment Variable** for each of these:

### Required Variables:

#### Server Configuration
```
NODE_ENV = production
PORT = 3001
HOST = 0.0.0.0
```

#### Database (from Step 2)
```
DATABASE_URL = <paste Internal Database URL from pumpbnb-db>
```

**Example:**
```
DATABASE_URL = postgresql://pumpbnb_db_user:XXXXX@dpg-xxxxx.oregon-postgres.render.com/pumpbnb_db
```

#### Redis (from Step 1)
```
REDIS_URL = <paste Internal Redis URL from pumpbnb-redis>
```

**Example:**
```
REDIS_URL = redis://default:XXXXX@red-xxxxx.oregon-redis.render.com:6379
```

#### Blockchain Configuration
```
BSC_TESTNET_RPC = https://bsc-testnet-rpc.publicnode.com
BSC_MAINNET_RPC = https://bsc-dataseed1.binance.org
CHAIN_ID = 97
```

#### Smart Contract Addresses (Updated October 27, 2025)
```
TOKEN_FACTORY_ADDRESS = 0xCF0b298E26db22bCc886E03654A2Bfcb4E2742C2
GRADUATION_MANAGER_ADDRESS = 0xeE147bc2307b645c59033B7A0b16EC5E68b2A5d3
PLATFORM_CONFIG_ADDRESS = 0x0e4ED6983Bc8100936C42e5D98F9f1fEbF76b58E
ASTER_TOKEN_ADDRESS = 0x2e5bEffE46eAADAb062ED2b520a0d95654CEdF5A
SAMPLE_TOKEN_ADDRESS = 0xcFE6968c3427EcA3641d7132E03F53E7096d370e
```

#### IPFS Configuration (Pinata)
**Get from:** https://app.pinata.cloud/developers/api-keys

```
PINATA_API_KEY = <your Pinata API key>
PINATA_SECRET_KEY = <your Pinata secret key>
PINATA_JWT = <your Pinata JWT token>
```

**Don't have Pinata?**
- Go to https://pinata.cloud
- Sign up (free tier available)
- Create API key
- Copy credentials

#### Security
```
JWT_SECRET = <generate random 32+ character string>
CORS_ORIGIN = https://pumpbnb-frontend.onrender.com
```

**Generate JWT_SECRET:**
```powershell
# PowerShell - generates random 32 character string
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | % {[char]$_})
```

#### Rate Limiting
```
RATE_LIMIT_WINDOW_MS = 900000
RATE_LIMIT_MAX_REQUESTS = 100
```

#### Logging
```
LOG_LEVEL = info
```

### Optional (if using MongoDB):
```
MONGODB_URI = <your MongoDB connection string>
```

**Skip MongoDB?** It's optional - backend works fine without it.

3. Click **Save Changes**

**✅ Environment variables configured!**

---

## Step 5: Deploy Service (Automatic)

After saving environment variables, Render will **automatically start deploying**.

### Monitor Deployment:

1. Click **Logs** tab (left sidebar)

2. Watch for these messages:

**Build Phase:**
```
==> Installing dependencies
==> Running: npm install && npx prisma generate && npm run build
✓ Generated Prisma Client
✓ TypeScript compilation successful
```

**Start Phase:**
```
==> Starting service with 'npm start'
✓ PostgreSQL connected
✓ Redis connected
✓ Blockchain indexer started
✓ TokenFactory contract connected at 0xCF0b298E26db22bCc886E03654A2Bfcb4E2742C2
✓ WebSocket server initialized
✓ Server running on http://0.0.0.0:3001
```

**Deploy Complete:**
```
==> Your service is live 🎉
https://pumpbnb-backend.onrender.com
```

**⏱️ First deploy takes 5-10 minutes**

---

## Step 6: Verify Deployment (5 minutes)

### Test Health Endpoint:

**In your browser:**
```
https://pumpbnb-backend.onrender.com/health
```

**Expected Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-10-27T13:30:00.000Z",
  "uptime": 45.123,
  "database": "connected",
  "redis": "connected"
}
```

✅ **If you see this, backend is LIVE!**

### Test API Endpoints:

**1. List All Tokens:**
```
https://pumpbnb-backend.onrender.com/api/tokens
```

**Expected:**
```json
{
  "success": true,
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 0,
    "totalPages": 0
  }
}
```

**2. Trending Tokens:**
```
https://pumpbnb-backend.onrender.com/api/tokens/trending
```

**Expected:**
```json
{
  "success": true,
  "data": []
}
```

**3. Platform Stats:**
```
https://pumpbnb-backend.onrender.com/api/users/platform-stats
```

### Check Logs for Success Messages:

**Render Dashboard → pumpbnb-backend → Logs:**

Look for:
- ✅ `PostgreSQL connected`
- ✅ `Redis connected`
- ✅ `Blockchain indexer started`
- ✅ `Listening for TokenCreated events`
- ✅ `WebSocket server initialized`
- ✅ `Server running on port 3001`

---

## Step 7: Update Frontend (Optional - for testing)

If you want to test the production backend with your frontend:

### On Render Dashboard:

1. Go to **pumpbnb-frontend** service
2. Click **Environment** tab
3. Add new variables:

```
NEXT_PUBLIC_BACKEND_API_URL = https://pumpbnb-backend.onrender.com
NEXT_PUBLIC_BACKEND_WS_URL = wss://pumpbnb-backend.onrender.com
```

**Keep existing:**
```
NEXT_PUBLIC_API_URL = https://pumpbnb-api.onrender.com (test/mock data)
```

Now your frontend can use either:
- `NEXT_PUBLIC_API_URL` - Test/mock data (existing)
- `NEXT_PUBLIC_BACKEND_API_URL` - Production blockchain data (new)

---

## Step 8: Test Blockchain Indexer (5 minutes)

The blockchain indexer should automatically start listening for events.

### Check Indexer Logs:

**Render Dashboard → pumpbnb-backend → Logs:**

Look for:
```
Blockchain indexer started
TokenFactory contract: 0xCF0b298E26db22bCc886E03654A2Bfcb4E2742C2
Starting to index past TokenCreated events...
Indexed events from block XXXXX to XXXXX
Now listening for real-time events...
```

### Test with New Token Creation:

1. Create a new token on BSC Testnet using TokenFactory
2. Wait 10-30 seconds
3. Check logs for: `New token created: 0x...`
4. Query API: `https://pumpbnb-backend.onrender.com/api/tokens`
5. Should see your new token in the list!

---

## Troubleshooting

### Build Fails - "Can't find module @prisma/client"

**Fix:** Check build command includes `npx prisma generate`:
```
npm install && npx prisma generate && npm run build
```

### Error: "Can't reach database server"

**Checklist:**
- ✅ DATABASE_URL uses **Internal** URL (not External)
- ✅ pumpbnb-db is running (check Render Dashboard)
- ✅ No typos in connection string
- ✅ Migrations were run successfully

### Error: "Redis connection refused"

**Checklist:**
- ✅ pumpbnb-redis is created and running
- ✅ REDIS_URL uses **Internal** URL
- ✅ No typos in connection string

### Error: "Blockchain indexer failed to start"

**Checklist:**
- ✅ All contract addresses are correct
- ✅ BSC_TESTNET_RPC is accessible
- ✅ CHAIN_ID is set to 97

### Service keeps restarting

**Check Logs for:**
- Database connection errors
- Missing environment variables
- Redis connection errors

**Common fix:** Ensure all required environment variables are set.

---

## What You Have Now

### Services Running:

1. ✅ **pumpbnb-frontend** - Frontend UI
   - URL: `https://pumpbnb-frontend.onrender.com`

2. ✅ **pumpbnb-API** - Test/mock data API (unchanged)
   - URL: `https://pumpbnb-api.onrender.com`

3. 🆕 **pumpbnb-backend** - Production blockchain API (NEW!)
   - URL: `https://pumpbnb-backend.onrender.com`

4. 🆕 **pumpbnb-redis** - Redis cache (NEW!)
   - Used by: pumpbnb-backend

5. ✅ **pumpbnb-db** - PostgreSQL database
   - Used by: pumpbnb-backend
   - Tables: 7 (tokens, trades, etc.)

6. ✅ **pumpbnb** - Mock UI

---

## Service URLs Summary

**Production Backend (NEW):**
```
Base URL: https://pumpbnb-backend.onrender.com
Health: https://pumpbnb-backend.onrender.com/health
API: https://pumpbnb-backend.onrender.com/api/tokens
WebSocket: wss://pumpbnb-backend.onrender.com
```

**Test/Mock API (Existing):**
```
Base URL: https://pumpbnb-api.onrender.com
API: https://pumpbnb-api.onrender.com/api/tokens
```

---

## Next Steps After Deployment

### Immediate (First Hour):
- [ ] Monitor logs for any errors
- [ ] Test all 21 API endpoints
- [ ] Verify WebSocket connections work
- [ ] Check blockchain indexer is receiving events

### Short Term (Week 1):
- [ ] Set up monitoring/alerts on Render
- [ ] Configure database backups
- [ ] Test with frontend integration
- [ ] Performance testing

### Medium Term (Month 1):
- [ ] Add error tracking (Sentry, etc.)
- [ ] Optimize database queries
- [ ] Consider upgrading to Starter plans ($7/mo)
- [ ] Set up CI/CD pipeline

---

## Cost Summary

**Current Setup (Free Tier):**
- pumpbnb-db: Free
- pumpbnb-redis: Free
- pumpbnb-backend: Free (spins down after 15 min)
- pumpbnb-api: Free (spins down)
- pumpbnb-frontend: Free (spins down)
- **Total: $0/month**

**Production Recommended:**
- pumpbnb-db: $7/mo (Starter - always on)
- pumpbnb-redis: $5/mo (Starter - more memory)
- pumpbnb-backend: $7/mo (Starter - always on)
- pumpbnb-frontend: $7/mo (Starter - always on)
- **Total: $26/month**

---

## Success Checklist

- [ ] ✅ pumpbnb-redis created and running
- [ ] ✅ Database migrations deployed (7 tables)
- [ ] ✅ pumpbnb-backend service created
- [ ] ✅ All environment variables configured
- [ ] ✅ Service deployed successfully
- [ ] ✅ Health check returns "ok"
- [ ] ✅ API endpoints return data
- [ ] ✅ Logs show database connected
- [ ] ✅ Logs show Redis connected
- [ ] ✅ Logs show blockchain indexer started
- [ ] ✅ WebSocket server initialized

---

## Need Help?

**Detailed Guides:**
- `QUICK_DEPLOY.md` - Quick reference
- `RENDER_DEPLOYMENT_SUMMARY.md` - Complete overview
- `backend/RENDER_DEPLOYMENT.md` - Full deployment guide
- `backend/DATABASE_MIGRATION_GUIDE.md` - Database setup

**Check Service Status:**
- Render Dashboard → Services → View logs
- Health endpoint: `/health`
- API documentation: `backend/README.md`

---

**Ready to deploy?** Follow these steps in order! 🚀

**Estimated Total Time:** 50-60 minutes

# Quick Deploy - 4 Steps to Production

**Time Required:** ~60 minutes
**Difficulty:** Medium

---

## Prerequisites

✅ Backend code complete (Track 2 ✅)
✅ Access to Render Dashboard
✅ pumpbnb-db exists on Render
✅ pumpbnb-frontend exists on Render
✅ Git repo connected to Render

---

## Step 1: Create Redis (5 min)

**Render Dashboard:**
1. Click **New** → **Key-Value Store** (this is Redis!)
2. Name: `pumpbnb-redis`
3. Plan: **Free** (or Starter for production)
4. Region: **Same as your database** (e.g., Oregon)
5. Max Memory Policy: **allkeys-lru**
6. Click **Create**
7. Wait for "Available" status
8. Click on store → **Connect** tab
9. **Copy the Internal Redis URL** (you'll need this)

**Redis URL Format:**
```
redis://default:password@red-xxxxx.oregon-redis.render.com:6379
```

✅ Done!

---

## Step 2: Run Database Migrations (10 min)

**Get Database URL:**
1. Render Dashboard → **pumpbnb-db** → **Info**
2. Copy **Internal Database URL**

**Run Migrations Locally:**

```powershell
# Windows PowerShell
cd F:\BNB_PumpFun\backend

# Set database URL (replace with your actual URL)
$env:DATABASE_URL="postgresql://user:pass@dpg-xxxxx.oregon-postgres.render.com/pumpbnb_db"

# Deploy migrations
npx prisma migrate deploy

# Verify - should show 7 tables created
npx prisma studio
```

**Expected Output:**
```
✔ Generated Prisma Client
The following migration(s) have been applied:
migrations/
  └─ 20251027_initial_schema/
    └─ migration.sql

✅ All migrations have been successfully applied.
```

✅ Done! Database now has 7 tables.

---

## Step 3: Deploy Backend (20 min)

### Option A: Update pumpbnb-API (Recommended)

**Render Dashboard:**
1. Go to **pumpbnb-API** service
2. Click **Settings**

**Build & Deploy:**
- Build Command:
  ```
  cd backend && npm install && npx prisma generate && npm run build
  ```
- Start Command:
  ```
  cd backend && npm start
  ```
- Health Check Path:
  ```
  /health
  ```

**Environment Variables** (Add these):

```env
# Database
DATABASE_URL=<paste Internal URL from pumpbnb-db>

# Redis
REDIS_URL=<paste URL from pumpbnb-redis>

# Blockchain
BSC_TESTNET_RPC=https://bsc-testnet-rpc.publicnode.com
CHAIN_ID=97

# Contracts
TOKEN_FACTORY_ADDRESS=0xCF0b298E26db22bCc886E03654A2Bfcb4E2742C2
GRADUATION_MANAGER_ADDRESS=0xeE147bc2307b645c59033B7A0b16EC5E68b2A5d3
PLATFORM_CONFIG_ADDRESS=0x0e4ED6983Bc8100936C42e5D98F9f1fEbF76b58E
ASTER_TOKEN_ADDRESS=0x2e5bEffE46eAADAb062ED2b520a0d95654CEdF5A
SAMPLE_TOKEN_ADDRESS=0xcFE6968c3427EcA3641d7132E03F53E7096d370e

# IPFS (get from https://pinata.cloud)
PINATA_API_KEY=your_key_here
PINATA_SECRET_KEY=your_secret_here
PINATA_JWT=your_jwt_here

# Security
JWT_SECRET=<generate random 32+ character string>
CORS_ORIGIN=https://pumpbnb-frontend.onrender.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Other
NODE_ENV=production
PORT=3001
HOST=0.0.0.0
LOG_LEVEL=info
```

**Click:** **Save Changes** → Service will redeploy

**Monitor Deploy:**
- Click **Logs** tab
- Wait for: `✅ Server running on port 3001`

✅ Done!

---

## Step 4: Verify Deployment (15 min)

### Check Logs

Look for these success messages:

```
✅ PostgreSQL connected
✅ Redis connected
✅ Blockchain indexer started
✅ TokenFactory contract connected
✅ WebSocket server initialized
✅ Server running on http://0.0.0.0:3001
```

### Test Health Endpoint

**Your Service URL:** (Get from Render Dashboard)
```
https://pumpbnb-api.onrender.com
```

**Test in Browser or curl:**
```bash
curl https://pumpbnb-api.onrender.com/health
```

**Expected Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-10-27T...",
  "uptime": 123.45,
  "database": "connected",
  "redis": "connected"
}
```

✅ If you see this → Backend is LIVE!

### Test API Endpoints

```bash
# List all tokens
curl https://pumpbnb-api.onrender.com/api/tokens

# Get trending tokens
curl https://pumpbnb-api.onrender.com/api/tokens/trending

# Both should return success:true
```

✅ Done!

---

## Step 5: Update Frontend (5 min)

**Render Dashboard:**
1. Go to **pumpbnb-frontend** service
2. Click **Environment**

**Add/Update Variables:**
```env
NEXT_PUBLIC_API_URL=https://pumpbnb-api.onrender.com
NEXT_PUBLIC_WS_URL=wss://pumpbnb-api.onrender.com
```

**Save** → Frontend will redeploy

✅ Done! Frontend now connected to backend.

---

## Troubleshooting

### Build Failed - "Can't find module @prisma/client"

**Fix:** Add `npx prisma generate` to build command:
```bash
cd backend && npm install && npx prisma generate && npm run build
```

### Error: "Can't reach database server"

**Fix:** Use **Internal Database URL** (not External):
```
postgresql://...@dpg-xxxxx.oregon-postgres.render.com/...
```

### Error: "Redis connection refused"

**Fix:** Verify Redis is created and URL is correct:
```
redis://default:password@red-xxxxx.oregon-redis.render.com:6379
```

### Service keeps spinning down

**Fix:** Upgrade to **Starter Plan** ($7/mo) for always-on service.

---

## After Successful Deployment

### Immediate Tasks:
- [ ] Monitor logs for errors (first hour)
- [ ] Test token creation on frontend
- [ ] Test trading functionality
- [ ] Check WebSocket real-time updates

### Next Week:
- [ ] Set up Render alerts for downtime
- [ ] Configure database backups
- [ ] Monitor performance and response times
- [ ] Plan for scaling (Starter plans)

---

## Cost Summary

**Free Tier (Development):**
- pumpbnb-db: Free
- pumpbnb-redis: Free
- pumpbnb-api: Free
- pumpbnb-frontend: Free
- **Total: $0/month**

**Limitations:**
- Services spin down after 15 min
- Limited storage/memory
- Slower cold starts

**Production (Recommended):**
- pumpbnb-db: $7/mo (Starter)
- pumpbnb-redis: $5/mo (Starter)
- pumpbnb-api: $7/mo (Starter)
- pumpbnb-frontend: $7/mo (Starter)
- **Total: $26/month**

**Benefits:**
- Always on (no spin down)
- Better performance
- More storage
- Production-ready

---

## Quick Command Reference

```bash
# Generate Prisma Client
npx prisma generate

# Deploy migrations
npx prisma migrate deploy

# Open database browser
npx prisma studio

# View migration status
npx prisma migrate status

# Test local backend
cd backend && npm run dev
```

---

## Need More Details?

**Comprehensive Guides:**
- `RENDER_DEPLOYMENT_SUMMARY.md` - Overview and checklist
- `backend/RENDER_DEPLOYMENT.md` - Full deployment guide
- `backend/DATABASE_MIGRATION_GUIDE.md` - Database setup
- `backend/README.md` - API documentation

**Infrastructure:**
- `render.yaml` - Infrastructure as code
- `backend/.env.example` - All environment variables

---

## Success Checklist

- [ ] ✅ pumpbnb-redis created
- [ ] ✅ Database migrations deployed (7 tables)
- [ ] ✅ Backend service configured with all env vars
- [ ] ✅ Backend deployed and running
- [ ] ✅ Health check returns "ok"
- [ ] ✅ API endpoints return data
- [ ] ✅ Logs show database connected
- [ ] ✅ Logs show Redis connected
- [ ] ✅ Logs show blockchain indexer started
- [ ] ✅ Frontend updated with API URL
- [ ] ✅ End-to-end testing complete

---

## Status

✅ **Track 2 Complete** - Backend infrastructure ready
✅ **Documentation Complete** - All guides written
🔲 **Redis Creation** - 5 minutes
🔲 **Database Migration** - 10 minutes
🔲 **Backend Deploy** - 20 minutes
🔲 **Testing** - 15 minutes

**Total Remaining:** ~50 minutes to production! 🚀

---

**Questions?** Check the detailed guides or ask for help!

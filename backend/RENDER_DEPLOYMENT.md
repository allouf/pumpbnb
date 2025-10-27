# Render Deployment Guide

## Current Render Infrastructure

**Existing Services:**
- `pumpbnb-frontend` - Frontend application
- `pumpbnb-API` - API service (needs update/replacement)
- `pumpbnb-db` - PostgreSQL database
- `pumpbnb` - Mock UI

---

## Deployment Strategy

### Option A: Update Existing pumpbnb-API Service (Recommended)

If `pumpbnb-API` is currently a placeholder or minimal service:

1. **Connect this backend codebase to pumpbnb-API service**
2. **Run database migrations on pumpbnb-db**
3. **Update environment variables**

### Option B: Create New Backend Service

If `pumpbnb-API` is already serving a different purpose:

1. **Create new Render service: `pumpbnb-backend`**
2. **Still connects to existing pumpbnb-db**
3. **Run database migrations on pumpbnb-db**

---

## Step 1: Database Migrations (REQUIRED)

### Connect to pumpbnb-db

The Prisma schema defines 7 new models that need to be created in your production database:

```
✅ Token
✅ Trade
✅ TokenStats
✅ UserPortfolio
✅ Watchlist
✅ GraduationEvent
✅ PlatformStats
```

### Migration Commands

**Generate Migration Files (Local):**
```bash
cd backend
npx prisma migrate dev --name init
```

**Deploy to Production Database:**
```bash
# Set DATABASE_URL to your Render PostgreSQL connection string
export DATABASE_URL="postgresql://user:password@dpg-xxxxx.render.com/pumpbnb_db"

# Run production migrations
npx prisma migrate deploy

# Generate Prisma Client
npx prisma generate
```

### Get Your DATABASE_URL from Render

1. Go to Render Dashboard → `pumpbnb-db`
2. Copy the **Internal Database URL** (for internal connections)
3. Or use **External Database URL** (for external access)

**Format:**
```
postgresql://username:password@hostname:port/database
```

---

## Step 2: Backend Service Configuration

### Environment Variables Required

Add these to your Render service environment:

#### Database & Cache
```env
NODE_ENV=production
PORT=3001
DATABASE_URL=<from pumpbnb-db internal URL>
REDIS_URL=<Redis connection string>
MONGODB_URI=<MongoDB connection string (optional)>
```

#### Blockchain Configuration
```env
BSC_TESTNET_RPC=https://bsc-testnet-rpc.publicnode.com
BSC_MAINNET_RPC=https://bsc-dataseed1.binance.org
CHAIN_ID=97

# Contract Addresses (Updated October 27, 2025)
TOKEN_FACTORY_ADDRESS=0xCF0b298E26db22bCc886E03654A2Bfcb4E2742C2
GRADUATION_MANAGER_ADDRESS=0xeE147bc2307b645c59033B7A0b16EC5E68b2A5d3
PLATFORM_CONFIG_ADDRESS=0x0e4ED6983Bc8100936C42e5D98F9f1fEbF76b58E
ASTER_TOKEN_ADDRESS=0x2e5bEffE46eAADAb062ED2b520a0d95654CEdF5A
SAMPLE_TOKEN_ADDRESS=0xcFE6968c3427EcA3641d7132E03F53E7096d370e
```

#### IPFS (Pinata)
```env
PINATA_API_KEY=<your-pinata-key>
PINATA_SECRET_KEY=<your-pinata-secret>
PINATA_JWT=<your-pinata-jwt>
```

#### Security
```env
JWT_SECRET=<generate-strong-random-string>
CORS_ORIGIN=https://pumpbnb-frontend.onrender.com
```

#### Rate Limiting
```env
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

---

## Step 3: Build Configuration

### Build Command
```bash
npm install && npx prisma generate && npm run build
```

### Start Command
```bash
npm start
```

### Health Check Path
```
/health
```

---

## Step 4: Redis Setup (REQUIRED)

You need Redis for:
- WebSocket pub/sub (horizontal scaling)
- Rate limiting
- Caching

### Options:

**Option 1: Render Redis**
1. Create new Redis instance on Render
2. Copy Redis URL
3. Add to environment as `REDIS_URL`

**Option 2: External Redis (Upstash/Redis Cloud)**
1. Create free Redis instance
2. Copy connection string
3. Add to environment as `REDIS_URL`

**Format:**
```
redis://default:password@hostname:port
```

---

## Step 5: MongoDB Setup (Optional)

MongoDB is optional in our architecture (used for flexible metadata storage).

If you want to use it:

**Option 1: MongoDB Atlas (Free Tier)**
1. Create free cluster
2. Copy connection string
3. Add to environment as `MONGODB_URI`

**Format:**
```
mongodb+srv://username:password@cluster.mongodb.net/pumpbnb
```

**Option 2: Skip MongoDB**
- Comment out MongoDB initialization in `src/services/database.service.ts:55-61`
- System will work fine without it (metadata stored in PostgreSQL)

---

## Step 6: Service Creation on Render

### If Using Existing pumpbnb-API:

1. **Update Repository Connection**
   - Settings → Connect to this repo
   - Build Command: `cd backend && npm install && npx prisma generate && npm run build`
   - Start Command: `cd backend && npm start`

2. **Update Environment Variables** (see Step 2)

3. **Deploy**

### If Creating New Service:

1. **Create New Web Service**
   - Name: `pumpbnb-backend`
   - Environment: Node
   - Region: Same as your database
   - Branch: main

2. **Build Settings**
   - Root Directory: `backend`
   - Build Command: `npm install && npx prisma generate && npm run build`
   - Start Command: `npm start`

3. **Environment Variables** (see Step 2)

4. **Deploy**

---

## Step 7: render.yaml (Infrastructure as Code)

Create `render.yaml` in project root for automated deployments:

```yaml
services:
  # Backend API Service
  - type: web
    name: pumpbnb-backend
    env: node
    region: oregon
    plan: starter
    buildCommand: cd backend && npm install && npx prisma generate && npm run build
    startCommand: cd backend && npm start
    healthCheckPath: /health
    envVars:
      - key: NODE_ENV
        value: production
      - key: DATABASE_URL
        fromDatabase:
          name: pumpbnb-db
          property: connectionString
      - key: REDIS_URL
        fromService:
          type: redis
          name: pumpbnb-redis
          property: connectionString
      # Add all other env vars as needed

  # Frontend Service
  - type: web
    name: pumpbnb-frontend
    env: node
    region: oregon
    plan: starter
    rootDir: frontend
    buildCommand: npm install && npm run build
    startCommand: npm start
    envVars:
      - key: NEXT_PUBLIC_API_URL
        value: https://pumpbnb-backend.onrender.com

databases:
  # PostgreSQL Database (existing)
  - name: pumpbnb-db
    plan: free
    region: oregon

  # Redis Cache
  - name: pumpbnb-redis
    plan: free
    region: oregon
```

---

## Step 8: Post-Deployment Verification

### 1. Check Service Logs
```
Render Dashboard → pumpbnb-backend → Logs
```

Look for:
```
✅ PostgreSQL connected
✅ Redis connected
✅ Blockchain indexer started
✅ Server running on port 3001
```

### 2. Test Health Endpoint
```bash
curl https://pumpbnb-backend.onrender.com/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2025-10-27T...",
  "uptime": 123.45,
  "database": "connected",
  "redis": "connected"
}
```

### 3. Test API Endpoints
```bash
# Get all tokens
curl https://pumpbnb-backend.onrender.com/api/tokens

# Get trending tokens
curl https://pumpbnb-backend.onrender.com/api/tokens/trending
```

### 4. Check Database Tables
```bash
# Connect to pumpbnb-db via Render shell or external client
psql $DATABASE_URL

# List tables
\dt

# Should see:
# tokens, trades, token_stats, user_portfolios, watchlists,
# graduation_events, platform_stats
```

---

## Step 9: Frontend Integration

Update frontend to connect to production backend:

### Frontend Environment Variables

In `pumpbnb-frontend` Render service:

```env
NEXT_PUBLIC_API_URL=https://pumpbnb-backend.onrender.com
NEXT_PUBLIC_WS_URL=wss://pumpbnb-backend.onrender.com
```

---

## Troubleshooting

### Migration Errors

**Error: "Can't reach database server"**
- ✅ Check DATABASE_URL is correct
- ✅ Verify database is running
- ✅ Use Internal Database URL for Render services

**Error: "Schema already exists"**
- Run `npx prisma migrate resolve --applied <migration_name>` to mark as applied

### Redis Connection Errors

**Error: "Redis connection refused"**
- ✅ Check REDIS_URL format
- ✅ Verify Redis instance is running
- ✅ Check region compatibility

### Build Failures

**Error: "Cannot find module '@prisma/client'"**
- Add `npx prisma generate` to build command

**Error: "TypeScript compilation failed"**
- Check TypeScript version compatibility
- Run `npm run build` locally first

---

## Cost Considerations

### Free Tier Services:
- ✅ pumpbnb-db (PostgreSQL): Free tier available
- ✅ pumpbnb-redis (Redis): Free tier available
- ✅ pumpbnb-backend: Free tier (spins down after inactivity)
- ✅ pumpbnb-frontend: Free tier (spins down after inactivity)

### Paid Plans to Consider:
- Backend/Frontend on **Starter Plan ($7/month each)**: Always on, faster
- Database on **Starter Plan ($7/month)**: Better performance, more storage
- Redis on **Starter Plan ($5/month)**: More memory

---

## Database Migration Checklist

Before deploying backend to production:

- [ ] Generate migration files locally: `npx prisma migrate dev --name init`
- [ ] Review migration SQL in `prisma/migrations/`
- [ ] Test migrations locally with test database
- [ ] Get production DATABASE_URL from Render
- [ ] Run `npx prisma migrate deploy` against production
- [ ] Verify tables created: `\dt` in psql
- [ ] Generate Prisma client: `npx prisma generate`
- [ ] Commit migration files to Git
- [ ] Deploy backend service

---

## Next Steps After Deployment

1. **Monitor Logs**: Watch for any errors in first 24 hours
2. **Test All Endpoints**: Verify all 21 API endpoints work
3. **Test WebSocket**: Verify real-time updates work
4. **Test Blockchain Indexer**: Verify events are being indexed
5. **Set Up Alerts**: Configure Render alerts for downtime
6. **Performance Testing**: Monitor response times and database queries
7. **Backup Strategy**: Set up automated database backups

---

## Quick Deploy Summary

**For Fast Deployment:**

```bash
# 1. Generate migrations locally
cd backend
npx prisma migrate dev --name init

# 2. Set production DATABASE_URL
export DATABASE_URL="<from-render-dashboard>"

# 3. Deploy migrations
npx prisma migrate deploy

# 4. Commit everything
git add .
git commit -m "feat: Backend ready for production deployment"
git push

# 5. Deploy on Render
# - Update pumpbnb-API service OR create new service
# - Add all environment variables
# - Deploy
```

---

**Need Help?**
- Render Documentation: https://render.com/docs
- Prisma Migrations: https://www.prisma.io/docs/concepts/components/prisma-migrate
- Our Backend README: `backend/README.md`

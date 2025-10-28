# Fix Database Schema Mismatch - CRITICAL

## Problem Identified

The backend is failing with database errors because the PostgreSQL database schema is out of sync with the Prisma schema.

### Error from Logs
```
ERROR: column tokens.address does not exist at character 32
STATEMENT: SELECT "public"."tokens"."id", "public"."tokens"."address", ...
```

### Root Cause
The `tokens` table exists in the database but is **missing columns** that are defined in the Prisma schema (backend/prisma/schema.prisma). This happened because:
1. The database was reset using `DROP DATABASE` or similar
2. Tables were recreated but the full schema was never applied
3. The `prisma db push` or `prisma migrate` commands were not run after the reset

### Current State
- ✅ Prisma schema is correct (backend/prisma/schema.prisma)
- ❌ Database tables are incomplete (missing columns like `address`, `name`, `symbol`, etc.)
- ❌ Backend API failing with 500 errors
- ❌ No migration files exist (backend/prisma/migrations folder is empty)

## Solution: Sync Schema to Database

We need to apply the Prisma schema to the database. There are two approaches:

### Option A: Use `prisma db push` (RECOMMENDED - Fastest)

This will sync the schema without creating migration files. Best for development/fixing issues.

**On Render (via Shell access or deployment script):**
```bash
cd backend
npx prisma db push --accept-data-loss
npx prisma generate
```

**Or update the Render start command to:**
```bash
npx prisma db push --accept-data-loss && npx prisma generate && node dist/server.js
```

### Option B: Create and Apply Migration (Better for Production)

This creates proper migration files for version control.

**Step 1: Create migration locally** (requires temp local DB or skip connection check)
```bash
cd backend
npx prisma migrate dev --name init --create-only
```

**Step 2: Apply on Render**
```bash
npx prisma migrate deploy
```

## Immediate Fix Steps

### 1. Update Render Build Command (if needed)
**Current:** `npm install && npm run build && npx prisma generate`
**Keep as is** (this is correct)

### 2. Update Render Start Command
**Change from:**
```bash
node dist/server.js
```

**To ONE of these options:**

**Option A - One-time fix (runs once, then remove):**
```bash
npx prisma db push --accept-data-loss && npx prisma generate && node dist/server.js
```

**Option B - Always sync on start (safe but slower):**
```bash
npx prisma db push && npx prisma generate && node dist/server.js
```

**Option C - Use migrations (best for production):**
```bash
npx prisma migrate deploy && node dist/server.js
```

### 3. Trigger Redeploy
After updating the start command on Render:
1. Go to Render Dashboard
2. Find "pumpbnb-backend" service
3. Click "Manual Deploy" → "Deploy latest commit"
4. Wait for deployment to complete (~2-5 minutes)

### 4. Verify Fix
```bash
# Test health endpoint
curl https://pumpbnb-backend.onrender.com/health

# Test tokens endpoint (should work now!)
curl https://pumpbnb-backend.onrender.com/api/tokens

# Should return:
{
  "success": true,
  "data": [],
  "pagination": {...}
}
```

## Why This Happened

Looking at the git commits and deployment history:
1. Commit: "fix: Add database reset to startCommand for one-time schema fix"
2. The database was reset but the schema sync didn't complete properly
3. The start command was changed back to just `node dist/server.js`
4. Tables exist but are empty shells (no columns)

## Prevention for Future

### Add to package.json
```json
{
  "scripts": {
    "start:prod": "npx prisma generate && node dist/server.js",
    "start:dev": "npx prisma db push && npx prisma generate && node dist/server.js",
    "db:sync": "npx prisma db push --accept-data-loss",
    "db:migrate": "npx prisma migrate deploy"
  }
}
```

### Use Environment-Specific Commands
- **Development**: `npm run start:dev` (always syncs schema)
- **Production**: `npm run start:prod` (assumes migrations are applied)

### Create Migration Workflow
1. Make schema changes locally
2. Run `npx prisma migrate dev --name description`
3. Commit migration files to git
4. Deploy to Render (migrations auto-apply via build command)

## Database Access Issue

The logs also show connection issues from the local machine:
```
Can't reach database server at dpg-d3qk5vali9vc73cej0mg-a.oregon-postgres.render.com:5432
```

This is expected for Render's PostgreSQL - it's only accessible from:
1. Render's internal network (other Render services)
2. Whitelisted IP addresses (requires manual configuration)

**To access from local machine:**
1. Get your public IP: `curl ifconfig.me`
2. Add to Render PostgreSQL → Settings → Allowed IP Addresses
3. Or use Render Shell to run commands directly on the server

## Recommended Next Steps

1. ✅ Update Render start command to: `npx prisma db push --accept-data-loss && npx prisma generate && node dist/server.js`
2. ✅ Trigger manual deploy on Render
3. ✅ Monitor logs for "Schema sync complete"
4. ✅ Test API endpoints
5. ✅ Once confirmed working, change start command to: `npx prisma generate && node dist/server.js`
6. 🔄 Create proper migration workflow for future schema changes

## Testing After Fix

```bash
# Windows PowerShell
# Test 1: Health
Invoke-RestMethod https://pumpbnb-backend.onrender.com/health

# Test 2: Tokens (should work!)
Invoke-RestMethod https://pumpbnb-backend.onrender.com/api/tokens

# Test 3: Create token (full end-to-end test)
$body = @{
  name = "Test Token"
  symbol = "TEST"
  description = "Testing schema fix"
  imageUrl = "https://example.com/image.png"
  creator = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
} | ConvertTo-Json

Invoke-RestMethod -Method Post -Uri "https://pumpbnb-backend.onrender.com/api/tokens" -Body $body -ContentType "application/json"
```

---

**Created**: 2025-10-28
**Priority**: CRITICAL - Backend completely non-functional
**Impact**: All API endpoints returning 500 errors
**Estimated Fix Time**: 5-10 minutes (update command + redeploy)

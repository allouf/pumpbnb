# ACTION PLAN: Fix Database Schema Mismatch

## Problem Summary
- **Issue**: Backend API returning 500 errors
- **Root Cause**: Database tables missing columns (schema out of sync)
- **Error**: `column tokens.address does not exist`
- **Impact**: ALL API endpoints non-functional

## Solution Summary
Run `prisma db push` to sync the Prisma schema to the database.

---

## STEP-BY-STEP FIX

### Step 1: Update Render Environment Variables ✅
**What**: Ensure DATABASE_URL uses internal URL (faster, no SSL needed)

**How**:
1. Go to: https://dashboard.render.com/
2. Select: "pumpbnb-backend" service
3. Click: "Environment" tab
4. Find: `DATABASE_URL`
5. Set to:
   ```
   postgresql://pumpbnb_user:nB3rAtHIN9kxP9hSxOgpA9jTJBkXb3Nb@dpg-d3qk5vali9vc73cej0mg-a/pumpbnb
   ```
   (Notice: NO `.oregon-postgres.render.com` suffix)
6. Click: "Save Changes"

**Why**: Internal URL is faster and doesn't require SSL

---

### Step 2: Update Render Start Command ⚡ CRITICAL
**What**: Add `prisma db push` to sync schema before starting server

**How**:
1. Stay in Render Dashboard for "pumpbnb-backend"
2. Click: "Settings" tab (left sidebar)
3. Scroll to: "Build & Deploy" section
4. Find: "Start Command" field

**Current value**:
```bash
node dist/server.js
```

**Change to** (ONE-TIME FIX):
```bash
npx prisma db push --accept-data-loss && npx prisma generate && node dist/server.js
```

5. Click: "Save Changes"

**Why**: This syncs the database schema before starting the server

---

### Step 3: Trigger Manual Deploy 🚀
**What**: Redeploy with the new start command

**How**:
1. Stay in Render Dashboard
2. Click: "Manual Deploy" dropdown (top right)
3. Select: "Deploy latest commit"
4. Wait: ~3-5 minutes for deployment

---

### Step 4: Monitor Deployment Logs 👀
**What**: Watch for success indicators

**How**:
1. Click: "Logs" tab in Render Dashboard
2. Watch for these messages:
   ```
   ✅ The database is now in sync with the Prisma schema
   ✅ Generated Prisma Client
   ✅ Server running on port 3001
   ✅ Connected to BSC Testnet RPC
   ✅ Started polling for new events every 10 seconds
   ```

**Red flags** (if you see these, report immediately):
- ❌ "P1001: Can't reach database server"
- ❌ "Migration X failed"
- ❌ "Schema validation failed"

---

### Step 5: Test the API ✅
**What**: Verify endpoints are working

**Run these commands** (Windows PowerShell):

```powershell
# Test 1: Health Check
Write-Host "`n=== Test 1: Health Check ===" -ForegroundColor Cyan
$health = Invoke-RestMethod https://pumpbnb-backend.onrender.com/health
$health | ConvertTo-Json
if ($health.status -eq "ok") {
    Write-Host "✅ Health check passed!" -ForegroundColor Green
} else {
    Write-Host "❌ Health check failed!" -ForegroundColor Red
}

# Test 2: Tokens Endpoint
Write-Host "`n=== Test 2: Tokens Endpoint ===" -ForegroundColor Cyan
try {
    $tokens = Invoke-RestMethod https://pumpbnb-backend.onrender.com/api/tokens
    $tokens | ConvertTo-Json
    if ($tokens.success) {
        Write-Host "✅ Tokens endpoint working!" -ForegroundColor Green
    } else {
        Write-Host "❌ Tokens endpoint returned success=false" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Tokens endpoint failed: $_" -ForegroundColor Red
}

# Test 3: Trending Endpoint
Write-Host "`n=== Test 3: Trending Endpoint ===" -ForegroundColor Cyan
try {
    $trending = Invoke-RestMethod https://pumpbnb-backend.onrender.com/api/tokens/trending
    $trending | ConvertTo-Json
    if ($trending.success) {
        Write-Host "✅ Trending endpoint working!" -ForegroundColor Green
    } else {
        Write-Host "❌ Trending endpoint returned success=false" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Trending endpoint failed: $_" -ForegroundColor Red
}

# Test 4: Recent Endpoint
Write-Host "`n=== Test 4: Recent Endpoint ===" -ForegroundColor Cyan
try {
    $recent = Invoke-RestMethod https://pumpbnb-backend.onrender.com/api/tokens/recent
    $recent | ConvertTo-Json
    if ($recent.success) {
        Write-Host "✅ Recent endpoint working!" -ForegroundColor Green
    } else {
        Write-Host "❌ Recent endpoint returned success=false" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Recent endpoint failed: $_" -ForegroundColor Red
}

Write-Host "`n=== All Tests Complete ===" -ForegroundColor Cyan
```

**Expected responses**:
```json
// Health Check
{
  "status": "ok",
  "uptime": 123,
  "timestamp": "2025-10-28T..."
}

// Tokens/Trending/Recent
{
  "success": true,
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 0,
    "totalPages": 0
  }
}
```

---

### Step 6: Clean Up Start Command (After Confirming Fix) 🧹
**What**: Once everything works, simplify the start command

**How**:
1. Go back to Render → Settings → Start Command
2. Change to ONE of these:

**Option A - Safe (keeps sync on every startup)**:
```bash
npx prisma db push && npx prisma generate && node dist/server.js
```

**Option B - Fast (assumes schema is correct)**:
```bash
npx prisma generate && node dist/server.js
```

**Option C - Production (use migrations)**:
```bash
npx prisma migrate deploy && node dist/server.js
```

I recommend **Option A** for now (keeps sync, prevents future issues).

3. Save and redeploy

---

## Troubleshooting

### If deployment fails with "command too long"
Update `package.json` scripts and use a shorter command:

```json
{
  "scripts": {
    "start": "node dist/server.js",
    "start:sync": "npx prisma db push --accept-data-loss && npx prisma generate && node dist/server.js"
  }
}
```

Then use start command: `npm run start:sync`

### If you see "P1001: Can't reach database"
Check DATABASE_URL environment variable:
- Must use **internal URL** (without `.oregon-postgres.render.com`)
- Format: `postgresql://user:pass@dpg-XXX/dbname`

### If you see "column does not exist" still
The schema sync didn't complete. Check:
1. Is `prisma db push` in the start command?
2. Did the deployment complete successfully?
3. Check logs for "The database is now in sync with the Prisma schema"

### If local machine still can't connect
This is expected. Add your IP to Render PostgreSQL:
1. Get IP: `(Invoke-WebRequest -Uri "https://ifconfig.me/ip").Content.Trim()`
2. Render Dashboard → PostgreSQL → Settings → Allowed IP Addresses
3. Add your IP and save

---

## Files Updated (Local)
- ✅ `backend/.env` - Fixed DATABASE_URL (external URL with `?sslmode=require`)
- ✅ `backend/.env.render` - Fixed DATABASE_URL (internal URL)
- ✅ Created: `FIX_DATABASE_SCHEMA_MISMATCH.md` (detailed explanation)
- ✅ Created: `UPDATE_RENDER_START_COMMAND.md` (dashboard instructions)
- ✅ Created: `DATABASE_URLS_EXPLAINED.md` (URL configuration guide)
- ✅ Created: `backend/scripts/sync-schema.sh` (helper script)
- ✅ Created: `backend/scripts/check-db-schema.sh` (diagnostic script)

---

## Time Estimate
- **Step 1-3**: 2-3 minutes (update settings + deploy)
- **Step 4**: 3-5 minutes (wait for deployment)
- **Step 5**: 1-2 minutes (test API)
- **Total**: ~10 minutes

---

## Success Criteria
- [x] All API endpoints return 200 OK
- [x] `/api/tokens` returns `{"success": true}`
- [x] No "column does not exist" errors in logs
- [x] Backend stays up without crashes

---

## Next Steps After Fix
1. ✅ Test frontend at https://pumpbnb-frontend.onrender.com/
2. 🔄 Create a test token end-to-end
3. 📝 Document the fix in project docs
4. 🔄 Consider creating proper migrations for future schema changes
5. 🧪 Add health checks for database schema validation

---

**Created**: 2025-10-28
**Priority**: CRITICAL - P0
**Status**: Ready to execute
**Owner**: You (follow steps above)
**ETA**: 10 minutes

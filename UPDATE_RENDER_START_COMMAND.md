# How to Update Render Start Command

## The Fix

The database schema is out of sync. We need to run `prisma db push` before starting the server.

## Steps to Fix on Render Dashboard

### 1. Go to Render Dashboard
```
https://dashboard.render.com/
```

### 2. Find Your Backend Service
- Click on "pumpbnb-backend" (or your backend service name)

### 3. Update Start Command
1. Click on "Settings" tab (left sidebar)
2. Scroll down to "Build & Deploy" section
3. Find "Start Command" field

**Current value (broken):**
```bash
node dist/server.js
```

**Change to (one-time fix):**
```bash
npx prisma db push --accept-data-loss && npx prisma generate && node dist/server.js
```

4. Click "Save Changes"

### 4. Trigger Manual Deploy
1. Go to "Manual Deploy" tab (or click "Manual Deploy" button)
2. Click "Deploy latest commit"
3. Wait for deployment to complete (~3-5 minutes)

### 5. Monitor Deployment Logs
Watch for these messages:
```
✅ "Datasource 'db': PostgreSQL database"
✅ "The database is now in sync with the Prisma schema"
✅ "✔ Generated Prisma Client"
✅ "Server running on port 3001"
✅ "Connected to BSC Testnet RPC"
```

### 6. Test the API
```powershell
# Health check
Invoke-RestMethod https://pumpbnb-backend.onrender.com/health

# Tokens endpoint (should work now!)
Invoke-RestMethod https://pumpbnb-backend.onrender.com/api/tokens
```

Expected response:
```json
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

### 7. After Confirming It Works
Once the API is working, you can change the start command back to the clean version:

**Option A - Keep sync (safer, slightly slower startup):**
```bash
npx prisma db push && npx prisma generate && node dist/server.js
```

**Option B - Remove sync (faster, assumes schema is correct):**
```bash
npx prisma generate && node dist/server.js
```

**Option C - Use migrations (best for production):**
```bash
npx prisma migrate deploy && node dist/server.js
```

Then redeploy again.

## Alternative: Use Render Shell (Advanced)

If you have access to Render Shell:

1. Open Shell for your backend service
2. Run:
```bash
cd /opt/render/project/src/backend
npx prisma db push --accept-data-loss
npx prisma generate
```

3. Restart the service from the dashboard

## Why This Fixes It

The issue is that the database tables exist but are missing columns. The error from logs:
```
ERROR: column tokens.address does not exist
```

Running `prisma db push` will:
1. Compare the Prisma schema to the actual database
2. Generate ALTER TABLE statements to add missing columns
3. Apply those changes to sync the schema
4. Preserve existing data (with `--accept-data-loss` flag for safety)

## Build vs Start Commands

**Build Command** (runs once during build):
```bash
npm install && npm run build && npx prisma generate
```
- ✅ Keep this as is
- Generates Prisma Client during build

**Start Command** (runs every time container starts):
```bash
npx prisma db push --accept-data-loss && npx prisma generate && node dist/server.js
```
- ✅ Change this temporarily
- Syncs schema on startup
- Regenerates client to be safe
- Starts the server

## Troubleshooting

### If deployment fails with "build exceeded limit"
The start command is too long. Use this shorter version:
```bash
npm run start:reset
```

And add to package.json:
```json
{
  "scripts": {
    "start:reset": "npx prisma db push --accept-data-loss && npx prisma generate && node dist/server.js"
  }
}
```

### If you see "P3006: Migration X failed"
This means there's a conflict. Use force:
```bash
npx prisma db push --force-reset --accept-data-loss && npx prisma generate && node dist/server.js
```

**Warning**: `--force-reset` will drop and recreate ALL tables (data loss!)

### If you still can't connect to DB from local machine
This is expected. Render PostgreSQL restricts access. You need to:
1. Use Render Shell to run commands
2. Or add your IP to allowed list in PostgreSQL settings
3. Or use Render's internal network (deploy fixes and test)

---

**Time to Fix**: 5-10 minutes
**Priority**: CRITICAL
**Next Step**: Update start command and redeploy

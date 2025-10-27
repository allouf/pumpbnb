# Database Migration Guide for pumpbnb-db

## Overview

This guide will help you deploy the Prisma schema to your **pumpbnb-db** PostgreSQL database on Render.

---

## Prerequisites

- ✅ Access to Render Dashboard
- ✅ `pumpbnb-db` PostgreSQL database exists on Render
- ✅ Prisma CLI installed locally: `npm install -g prisma`
- ✅ Backend dependencies installed: `cd backend && npm install`

---

## Step 1: Get Your Database Connection String

### From Render Dashboard:

1. Go to **Render Dashboard** → **pumpbnb-db**
2. Click on **Info** tab
3. Copy the **Internal Database URL**

**Internal URL Format:**
```
postgresql://pumpbnb_db_user:password@dpg-xxxxx-a.oregon-postgres.render.com/pumpbnb_db
```

**⚠️ Important:**
- Use **Internal Database URL** for services within Render
- Use **External Database URL** only for local testing or external connections

---

## Step 2: Set Environment Variable

### For Local Migration:

**Windows (PowerShell):**
```powershell
$env:DATABASE_URL="postgresql://pumpbnb_db_user:password@dpg-xxxxx.oregon-postgres.render.com/pumpbnb_db"
```

**Windows (CMD):**
```cmd
set DATABASE_URL=postgresql://pumpbnb_db_user:password@dpg-xxxxx.oregon-postgres.render.com/pumpbnb_db
```

**macOS/Linux:**
```bash
export DATABASE_URL="postgresql://pumpbnb_db_user:password@dpg-xxxxx.oregon-postgres.render.com/pumpbnb_db"
```

---

## Step 3: Generate Migration Files

### First Time Setup:

```bash
cd backend

# Create initial migration
npx prisma migrate dev --name initial_schema
```

This will:
- ✅ Create migration SQL files in `prisma/migrations/`
- ✅ Apply migrations to your local database (if using one)
- ✅ Generate Prisma Client

### Review Generated Migration:

Check `backend/prisma/migrations/<timestamp>_initial_schema/migration.sql`

Should contain CREATE TABLE statements for:
- ✅ tokens
- ✅ trades
- ✅ token_stats
- ✅ user_portfolios
- ✅ watchlists
- ✅ graduation_events
- ✅ platform_stats

---

## Step 4: Deploy to Production Database

### Apply Migrations to pumpbnb-db:

```bash
cd backend

# Deploy migrations to production
npx prisma migrate deploy
```

**Expected Output:**
```
✔ Generated Prisma Client (5.x.x) to ./node_modules/@prisma/client

The following migration(s) have been applied:

migrations/
  └─ 20251027120000_initial_schema/
    └─ migration.sql

All migrations have been successfully applied.
```

---

## Step 5: Verify Migration

### Option 1: Using Prisma Studio

```bash
cd backend
npx prisma studio
```

Opens web interface at `http://localhost:5555` - you can browse all tables and data.

### Option 2: Using SQL Client

Connect to database via any PostgreSQL client (pgAdmin, DBeaver, psql):

```sql
-- List all tables
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public';

-- Should show:
-- tokens
-- trades
-- token_stats
-- user_portfolios
-- watchlists
-- graduation_events
-- platform_stats
-- _prisma_migrations
```

### Option 3: Using Render Shell

1. Render Dashboard → **pumpbnb-db** → **Shell** tab
2. Run:
```sql
\dt
```

Should list all 7 tables plus `_prisma_migrations`.

---

## Step 6: Generate Prisma Client

After migrations, always regenerate the client:

```bash
cd backend
npx prisma generate
```

This creates TypeScript types based on your schema.

---

## Troubleshooting

### Error: "Can't reach database server"

**Cause:** Wrong connection string or database not accessible

**Fix:**
1. ✅ Verify DATABASE_URL is correct
2. ✅ Check database is running in Render
3. ✅ Use **Internal URL** (not external) if migrating from Render service
4. ✅ Check IP whitelist settings

### Error: "Migration already applied"

**Cause:** Migration was already run

**Fix:**
```bash
# Mark migration as applied without running
npx prisma migrate resolve --applied <migration_name>
```

### Error: "Schema lock timeout"

**Cause:** Another migration or query is holding a lock

**Fix:**
1. Wait a few minutes
2. Check for active connections:
```sql
SELECT * FROM pg_stat_activity
WHERE datname = 'pumpbnb_db';
```
3. Kill blocking connections if needed

### Error: "Permission denied"

**Cause:** Database user doesn't have CREATE TABLE permissions

**Fix:**
- Contact Render support (shouldn't happen with default setup)
- Or grant permissions:
```sql
GRANT ALL PRIVILEGES ON DATABASE pumpbnb_db TO pumpbnb_db_user;
```

---

## Common Migration Scenarios

### Scenario 1: Schema Changes During Development

When you update `schema.prisma`:

```bash
# Create and apply new migration
npx prisma migrate dev --name description_of_change

# Deploy to production when ready
npx prisma migrate deploy
```

### Scenario 2: Rollback Migration

Prisma doesn't support automatic rollbacks. Manual steps:

1. **Restore database backup** (if available)
2. Or **manually write down migration** in `migrations/` folder
3. Or **reset and re-migrate** (⚠️ DATA LOSS):
```bash
npx prisma migrate reset
```

### Scenario 3: Multiple Environments

Use different DATABASE_URL for each:

```bash
# Development
DATABASE_URL="postgresql://localhost:5432/pumpbnb_dev"
npx prisma migrate dev

# Staging
DATABASE_URL="postgresql://staging-db-url/pumpbnb_staging"
npx prisma migrate deploy

# Production
DATABASE_URL="postgresql://production-db-url/pumpbnb_production"
npx prisma migrate deploy
```

---

## Migration Best Practices

### Before Deploying:

- [ ] ✅ Test migrations locally first
- [ ] ✅ Review generated SQL in migration files
- [ ] ✅ Back up production database
- [ ] ✅ Run migrations during low-traffic period
- [ ] ✅ Have rollback plan ready

### During Deployment:

- [ ] ✅ Use `prisma migrate deploy` (not `migrate dev`)
- [ ] ✅ Monitor database logs for errors
- [ ] ✅ Verify tables created correctly
- [ ] ✅ Check application can connect after migration

### After Deployment:

- [ ] ✅ Verify all tables exist
- [ ] ✅ Test API endpoints
- [ ] ✅ Monitor application logs
- [ ] ✅ Commit migration files to Git

---

## Schema Overview

### Current Tables in pumpbnb-db:

**1. tokens** (Main token registry)
- Stores all created tokens
- Links to trades, stats

**2. trades** (Transaction history)
- All buy/sell transactions
- Links to tokens

**3. token_stats** (Real-time metrics)
- Price, volume, market cap
- Updated by blockchain indexer

**4. user_portfolios** (User holdings)
- Token balances per user
- P&L tracking

**5. watchlists** (User favorites)
- User's saved tokens

**6. graduation_events** (PancakeSwap migrations)
- Records of bonding curve graduations

**7. platform_stats** (Analytics)
- Daily platform metrics

---

## Quick Commands Reference

```bash
# Create migration (development)
npx prisma migrate dev --name <name>

# Deploy migration (production)
npx prisma migrate deploy

# Generate Prisma Client
npx prisma generate

# Open Prisma Studio
npx prisma studio

# View migration status
npx prisma migrate status

# Reset database (⚠️ deletes all data)
npx prisma migrate reset

# Format schema file
npx prisma format
```

---

## What Happens on Render Deploy?

When you deploy backend service on Render with our configuration:

1. **Build Command runs:**
   ```bash
   npm install && npx prisma generate && npm run build
   ```
   - Installs dependencies
   - Generates Prisma Client (uses DATABASE_URL from env)
   - Compiles TypeScript

2. **Start Command runs:**
   ```bash
   npm start
   ```
   - Starts Node.js server
   - Server connects to database using Prisma Client

**⚠️ Note:** Build command does NOT run migrations automatically. You must run `npx prisma migrate deploy` separately BEFORE deploying the service.

---

## Alternative: Run Migrations on Service Deploy

If you want migrations to run automatically on each deploy:

### Update Build Command in render.yaml:

```yaml
buildCommand: npm install && npx prisma migrate deploy && npx prisma generate && npm run build
```

**⚠️ Warning:** This runs migrations on EVERY deploy, which could:
- Slow down deployments
- Cause issues if migration fails
- Apply migrations before code is ready

**Recommended:** Run migrations manually for better control.

---

## Need Help?

- **Prisma Documentation:** https://www.prisma.io/docs/concepts/components/prisma-migrate
- **Render PostgreSQL Docs:** https://render.com/docs/databases
- **Check Migration Status:** `npx prisma migrate status`
- **View Schema:** Open `backend/prisma/schema.prisma`

---

## Migration Checklist

Before deploying backend to Render:

- [ ] ✅ Database connection string obtained from Render
- [ ] ✅ DATABASE_URL environment variable set
- [ ] ✅ Migration files generated: `npx prisma migrate dev --name initial_schema`
- [ ] ✅ Migrations deployed to pumpbnb-db: `npx prisma migrate deploy`
- [ ] ✅ Tables verified in database (7 tables created)
- [ ] ✅ Prisma Client generated: `npx prisma generate`
- [ ] ✅ Migration files committed to Git
- [ ] ✅ DATABASE_URL added to Render service environment
- [ ] ✅ Backend service deployed on Render
- [ ] ✅ Application logs show successful database connection

---

**Status:** Ready to deploy migrations to pumpbnb-db ✅

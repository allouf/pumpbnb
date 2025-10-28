# Connect to Render PostgreSQL Database

## Step 1: Get Database Connection String

1. Go to: https://dashboard.render.com/
2. Click on: **"pumpbnb-db"** (PostgreSQL database)
3. Scroll down to: **"Connections"** section
4. Copy: **"External Database URL"** (looks like: `postgres://user:pass@host:5432/dbname`)

## Step 2: Connect Using psql

### Install PostgreSQL Client (if not installed)

**Windows (using Chocolatey)**:
```cmd
choco install postgresql
```

**Or download from**: https://www.postgresql.org/download/windows/

### Connect to Database

Replace `YOUR_DATABASE_URL` with the URL from Step 1:

```cmd
psql "YOUR_DATABASE_URL"
```

Or separately:
```cmd
psql -h dpg-XXXXX.oregon-postgres.render.com -U username -d pumpbnb -p 5432
```

## Step 3: Check Current Tables

```sql
-- List all tables
\dt

-- Check if tokens table exists
\d tokens

-- If table exists, check its columns
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'tokens';

-- Check all tables and their row counts
SELECT schemaname, tablename, n_live_tup as row_count
FROM pg_stat_user_tables
ORDER BY tablename;
```

## Step 4: Fix the Database Schema

### Option A: Drop and Recreate (SAFEST)

```sql
-- Drop all tables in public schema
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;

-- Quit psql
\q
```

Then from CMD in your backend folder:
```cmd
cd F:\BNB_PumpFun\backend

-- Run migrations to recreate tables
npx prisma db push --force-reset --accept-data-loss
```

### Option B: Manual Table Creation (if migrations don't work)

In psql:
```sql
-- Create tokens table with correct schema
CREATE TABLE IF NOT EXISTS tokens (
    address VARCHAR(42) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    symbol VARCHAR(50) NOT NULL,
    description TEXT,
    "imageUrl" TEXT,
    creator VARCHAR(42) NOT NULL,
    "totalSupply" VARCHAR(78) NOT NULL,
    "bondingCurve" VARCHAR(42) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isGraduated" BOOLEAN NOT NULL DEFAULT false,
    "graduatedAt" TIMESTAMP(3),
    "ipfsHash" VARCHAR(255)
);

-- Create token_stats table
CREATE TABLE IF NOT EXISTS token_stats (
    "tokenAddress" VARCHAR(42) PRIMARY KEY,
    price VARCHAR(78) NOT NULL DEFAULT '0',
    "marketCap" VARCHAR(78) NOT NULL DEFAULT '0',
    "volume24h" VARCHAR(78) NOT NULL DEFAULT '0',
    liquidity VARCHAR(78) NOT NULL DEFAULT '0',
    "trades24h" INTEGER NOT NULL DEFAULT 0,
    holders INTEGER NOT NULL DEFAULT 0,
    "priceChange24h" VARCHAR(10) NOT NULL DEFAULT '0',
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_token FOREIGN KEY ("tokenAddress") REFERENCES tokens(address) ON DELETE CASCADE
);

-- Create trades table
CREATE TABLE IF NOT EXISTS trades (
    id SERIAL PRIMARY KEY,
    "tokenAddress" VARCHAR(42) NOT NULL,
    trader VARCHAR(42) NOT NULL,
    "isBuy" BOOLEAN NOT NULL,
    "amountIn" VARCHAR(78) NOT NULL,
    "amountOut" VARCHAR(78) NOT NULL,
    fee VARCHAR(78) NOT NULL,
    timestamp TIMESTAMP(3) NOT NULL,
    "txHash" VARCHAR(66) NOT NULL,
    "blockNumber" INTEGER NOT NULL,
    CONSTRAINT fk_token_trade FOREIGN KEY ("tokenAddress") REFERENCES tokens(address) ON DELETE CASCADE
);

-- Create graduation_events table
CREATE TABLE IF NOT EXISTS graduation_events (
    id SERIAL PRIMARY KEY,
    "tokenAddress" VARCHAR(42) NOT NULL,
    "asterAmount" VARCHAR(78) NOT NULL,
    "wbnbAmount" VARCHAR(78) NOT NULL,
    "lpTokens" VARCHAR(78) NOT NULL,
    "pancakeswapPair" VARCHAR(42) NOT NULL,
    timestamp TIMESTAMP(3) NOT NULL,
    "txHash" VARCHAR(66) NOT NULL,
    "blockNumber" INTEGER NOT NULL,
    CONSTRAINT fk_token_graduation FOREIGN KEY ("tokenAddress") REFERENCES tokens(address) ON DELETE CASCADE
);

-- Create user_portfolio table
CREATE TABLE IF NOT EXISTS user_portfolio (
    id SERIAL PRIMARY KEY,
    "userAddress" VARCHAR(42) NOT NULL,
    "tokenAddress" VARCHAR(42) NOT NULL,
    balance VARCHAR(78) NOT NULL,
    "averageBuyPrice" VARCHAR(78) NOT NULL,
    UNIQUE("userAddress", "tokenAddress")
);

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    address VARCHAR(42) PRIMARY KEY,
    nonce INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastLoginAt" TIMESTAMP(3)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_trades_token ON trades("tokenAddress");
CREATE INDEX IF NOT EXISTS idx_trades_timestamp ON trades(timestamp);
CREATE INDEX IF NOT EXISTS idx_graduation_token ON graduation_events("tokenAddress");
CREATE INDEX IF NOT EXISTS idx_portfolio_user ON user_portfolio("userAddress");
CREATE INDEX IF NOT EXISTS idx_portfolio_token ON user_portfolio("tokenAddress");

-- Verify tables created
\dt
```

## Step 5: Verify Tables Exist

```sql
-- Check tokens table structure
\d tokens

-- Should show all columns including 'address'
-- If it shows the columns, the fix worked!
```

## Step 6: Test from CMD

After fixing the database, test the API:

```cmd
cd F:\BNB_PumpFun
node test-api.js
```

## Alternative: Use Prisma Studio Locally

```cmd
cd F:\BNB_PumpFun\backend

# Set environment variable to connect to Render DB
set DATABASE_URL="postgres://user:pass@host:5432/dbname"

# Open Prisma Studio
npx prisma studio
```

This opens a GUI where you can see and edit the database!

## Quick Command Summary

```cmd
# 1. Connect to database
psql "YOUR_DATABASE_URL"

# 2. Check what exists
\dt
\d tokens

# 3. If broken, drop and recreate
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
\q

# 4. Apply migrations from local
cd F:\BNB_PumpFun\backend
npx prisma db push --force-reset --accept-data-loss

# 5. Test
cd F:\BNB_PumpFun
node test-api.js
```

## Environment Variable Approach (Easiest)

Instead of connecting to Render DB, you can run migrations locally that apply to Render:

```cmd
cd F:\BNB_PumpFun\backend

# Get DATABASE_URL from Render dashboard
set DATABASE_URL=postgres://user:pass@host.render.com:5432/dbname

# Reset and push schema
npx prisma db push --force-reset --accept-data-loss

# Check status
npx prisma migrate status
```

This applies the schema directly to the Render database without SSH/Shell access!

---

**Recommended Flow**:
1. Get DATABASE_URL from Render dashboard
2. Run `set DATABASE_URL=...` in CMD
3. Run `npx prisma db push --force-reset --accept-data-loss`
4. Restart backend on Render
5. Test with `node test-api.js`

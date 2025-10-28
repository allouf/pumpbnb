# How to Reset Database on Render

## Problem

The database schema is wrong - missing columns like `tokens.address`. The migrations haven't been applied correctly.

## Solution: Reset & Rebuild Database

### **Method 1: Using Render Shell (EASIEST)**

1. **Open Render Dashboard**: https://dashboard.render.com/
2. **Navigate to Backend**: Click on "pumpbnb-backend" service
3. **Open Shell**: Click the "Shell" tab at the top
4. **Run these commands ONE BY ONE**:

```bash
# Step 1: Reset database (deletes all data and recreates schema)
npx prisma migrate reset --force

# Step 2: Deploy all migrations
npx prisma migrate deploy

# Step 3: Generate Prisma Client
npx prisma generate
```

5. **Restart Service**: Go back to "Overview" tab and click "Manual Deploy" → "Deploy latest commit"

### **Method 2: Reset Database Directly**

1. **Open Render Dashboard**: https://dashboard.render.com/
2. **Navigate to Database**: Click on "pumpbnb-db" (PostgreSQL)
3. **Danger Zone**: Scroll down to "Danger Zone"
4. **Reset Database**: Click "Reset Database"
5. **Confirm**: Type the confirmation and click "Reset"
6. **Redeploy Backend**: Go to pumpbnb-backend → Manual Deploy

### **Method 3: Add Migration to Start Command (AUTOMATED)**

Update `render.yaml` to run migration on every start:

```yaml
startCommand: npx prisma migrate deploy && npm start
```

Then push and redeploy.

## What Will Happen

After reset, the database will have:

```sql
✅ tokens table
   - address (primary key)
   - name
   - symbol
   - description
   - imageUrl
   - creator
   - totalSupply
   - bondingCurve
   - createdAt
   - isGraduated
   - graduatedAt

✅ token_stats table
   - tokenAddress (primary key, foreign key)
   - price
   - marketCap
   - volume24h
   - liquidity
   - trades24h
   - holders
   - priceChange24h

✅ trades table
   - id (primary key)
   - tokenAddress (foreign key)
   - trader
   - isBuy
   - amountIn
   - amountOut
   - fee
   - timestamp
   - txHash
   - blockNumber

✅ graduation_events table
   - id (primary key)
   - tokenAddress (foreign key)
   - asterAmount
   - wbnbAmount
   - lpTokens
   - pancakeswapPair
   - timestamp
   - txHash
   - blockNumber

✅ user_portfolio table
   - id (primary key)
   - userAddress
   - tokenAddress
   - balance
   - averageBuyPrice

✅ users table
   - address (primary key)
   - nonce
   - createdAt
   - lastLoginAt
```

## Verify After Reset

Run this to test:

```bash
curl https://pumpbnb-backend.onrender.com/api/tokens
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

## Why This Happened

The `render.yaml` initially had:
```yaml
buildCommand: npm install && npx prisma generate && npm run build
```

It was missing `npx prisma migrate deploy`, so:
- ❌ Database was created but EMPTY
- ❌ Prisma Client expected tables that didn't exist
- ❌ All queries failed

Now it has:
```yaml
buildCommand: npm install && npx prisma migrate deploy && npx prisma generate && npm run build
```

But since the database already exists (empty/wrong), you need to **reset it once** to apply the schema.

---

**TLDR**: Go to Render → pumpbnb-backend → Shell → Run `npx prisma migrate reset --force` → Restart service

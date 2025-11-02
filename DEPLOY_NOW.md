# 🚀 Deploy Portfolio Enhancements - QUICK GUIDE

**Status**: ✅ Ready to Deploy
**Redis**: ✅ Already provisioned on Render
**Database**: ✅ Ready for migration
**Build**: ✅ Frontend & Backend verified

---

## 🎯 Quick Deployment (30 minutes)

### Step 1: Verify Redis Environment Variables (5 min)

1. Go to Render Dashboard: https://dashboard.render.com
2. Click on **pumpbnb-backend** service
3. Click **Environment** tab
4. **Verify these variables exist**:
   ```
   REDIS_HOST
   REDIS_PORT
   REDIS_PASSWORD
   REDIS_DB
   ```

**If missing, add them:**
1. Click on **pumpbnb-redis** service
2. Copy connection details (Internal Redis URL)
3. Go back to **pumpbnb-backend** → **Environment**
4. Add variables:
   - `REDIS_HOST` = (host from Internal Redis URL)
   - `REDIS_PORT` = `6379`
   - `REDIS_PASSWORD` = (password from connection string)
   - `REDIS_DB` = `0`

---

### Step 2: Run Database Migration (10 min)

**CRITICAL**: Run this BEFORE pushing to GitHub

```bash
# Navigate to backend folder
cd F:\BNB_PumpFun\backend

# Set your Render PostgreSQL connection string
set DATABASE_URL=postgresql://pumpbnb_user:nB3rAtHIN9kxP9hSxOgpA9jTJBkXb3Nb@dpg-d3qk5vali9vc73cej0mg-a.oregon-postgres.render.com/pumpbnb?sslmode=require

# Run migration
npx prisma migrate deploy

# You should see:
# ✓ The following migration(s) have been applied:
# migrations/
#   └─ 20251102000000_add_portfolio_history_features

# Verify status
npx prisma migrate status
# Should show: Database schema is up to date!
```

**If migration fails**, see troubleshooting section below.

---

### Step 3: Commit & Push to GitHub (5 min)

```bash
# From project root
cd F:\BNB_PumpFun

# Stage all changes
git add .

# Commit
git commit -m "feat: Add Portfolio & Transaction History enhancements

Features:
- Portfolio page with P&L tracking (realized/unrealized)
- Real-time token prices and 24h price changes
- Transaction history with per-trade P&L calculations
- Volume analytics and trading statistics
- New hooks: useUserPnL, useTokenPrice
- New components: PortfolioHoldingCard, TransactionCard

Backend:
- Database migration for token page features
- Redis configuration for caching
- Updated Trade model with price tracking

Docs:
- Comprehensive feature documentation
- Deployment guide

🤖 Generated with Claude Code"

# Push to GitHub
git push origin main
```

**Result**: Render will automatically detect the push and start deploying both frontend and backend.

---

### Step 4: Monitor Deployment (10 min)

#### Backend Deployment
1. Go to Render Dashboard → **pumpbnb-backend**
2. Click **Logs** tab
3. Watch for these success indicators:
   ```
   ✅ Prisma migration deployed
   ✅ Redis client connected
   ✅ Redis pub client connected
   ✅ Redis sub client connected
   🚀 Server listening on port 3001
   ```

**If you see Redis connection errors**, go back to Step 1 and verify environment variables.

#### Frontend Deployment
1. Go to Render Dashboard → **pumpbnb-frontend**
2. Click **Logs** tab
3. Watch for:
   ```
   ✓ Compiled successfully
   ✓ Generating static pages (8/8)
   ```

---

### Step 5: Verify Live Deployment (5 min)

#### Test Backend API
```bash
# Health check
curl https://pumpbnb-backend.onrender.com/health

# Test P&L endpoint (replace with real address after you have trades)
curl https://pumpbnb-backend.onrender.com/api/users/0x.../pnl
```

#### Test Frontend Pages

1. **Portfolio Page**:
   - Go to https://aster-fun.onrender.com/portfolio
   - Connect wallet (MetaMask/WalletConnect)
   - You should see:
     - ✅ ASTER Balance card
     - ✅ P&L Stats (Total, Realized, Unrealized)
     - ✅ Trading Statistics
     - ✅ Token Holdings (if you have any)

2. **History Page**:
   - Go to https://aster-fun.onrender.com/history
   - Connect wallet
   - You should see:
     - ✅ Transaction filter options
     - ✅ Transaction cards with price/fee details
     - ✅ Volume statistics at bottom

---

## ✅ Success Checklist

```
PRE-DEPLOYMENT:
[✓] Redis already provisioned
[ ] Redis environment variables verified/added
[ ] Database migration completed successfully

DEPLOYMENT:
[ ] Changes committed to git
[ ] Changes pushed to GitHub
[ ] Backend deploys successfully
[ ] Frontend deploys successfully
[ ] Logs show Redis connected
[ ] No deployment errors

POST-DEPLOYMENT:
[ ] Portfolio page loads
[ ] P&L stats display (even if 0)
[ ] History page loads
[ ] Transactions display (if you have trading history)
[ ] No console errors in browser
[ ] No server errors in backend logs
```

---

## 🔧 Troubleshooting

### Issue: Migration fails with "Can't reach database server"

**Solution**: Database might be sleeping. Try:
1. Go to Render Dashboard → **pumpbnb-db**
2. Check status - wake it up if sleeping
3. Wait 30 seconds
4. Re-run migration: `npx prisma migrate deploy`

### Issue: Migration fails with "relation already exists"

**This is SAFE to ignore!** The migration uses `IF NOT EXISTS` clauses.

**If it happens**:
- Tables already exist from previous work
- Migration will skip existing tables
- Only new columns will be added
- Everything will work correctly

### Issue: Backend shows Redis connection error

**Error in logs**:
```
❌ Redis client error: ECONNREFUSED
```

**Solution**:
1. Go to **pumpbnb-redis** in Render
2. Check it's **Available** (not sleeping)
3. Copy the Internal Redis URL
4. Parse it: `redis://:[password]@[host]:[port]`
5. Update backend environment variables:
   - `REDIS_HOST` = host from URL
   - `REDIS_PASSWORD` = password from URL
6. Redeploy backend (Manual Deploy button)

### Issue: Frontend shows no data

**Check**:
1. Backend is running and healthy
2. `NEXT_PUBLIC_API_URL` in frontend environment is correct
3. You have executed some trades (for portfolio to show data)

**Test Backend**:
```bash
curl https://pumpbnb-backend.onrender.com/api/users/YOUR_ADDRESS/pnl
```

Should return:
```json
{
  "success": true,
  "data": {
    "totalPnL": "0",
    "realizedPnL": "0",
    "unrealizedPnL": "0",
    ...
  }
}
```

---

## 📊 What Got Deployed

### New Frontend Features
✅ Portfolio page enhancements:
- P&L tracking (Total, Realized, Unrealized)
- Profit/Loss percentage
- Trading statistics (trades count, volumes)
- Real-time token prices from bonding curve
- 24-hour price change indicators (↑/↓)
- Enhanced holdings cards with live prices

✅ Transaction History enhancements:
- Price per token calculation
- Fee estimation (1% of trade)
- Trade summaries (spent/received)
- Volume statistics (total, buy, sell)
- Better transaction cards with details

### New Backend Features
✅ Database schema additions:
- 6 new tables for token page features
- 4 new fields in trades table
- Proper indexing for performance

✅ Redis integration:
- Caching layer configured
- Socket.io adapter ready
- Cache helper functions

### New Hooks & Components
✅ Hooks:
- `useUserPnL()` - Fetches P&L data from backend
- `useTokenPrice()` - Calculates real-time prices from bonding curve

✅ Components:
- `PortfolioHoldingCard` - Enhanced holding display
- `TransactionCard` - Detailed transaction display

---

## 📝 Database Schema Changes

### New Tables (6)
1. **token_holders** - Token holder distribution
2. **comments** - User comments on tokens
3. **comment_likes** - Comment likes
4. **user_favorites** - User chart preferences
5. **ohlcv_data** - Candlestick chart data
6. **user_sessions** - Authentication sessions

### Modified Tables (1)
**trades** - Added columns:
- `price` - Price at time of trade
- `marketCap` - Market cap at time of trade (nullable)
- `asterAmount` - ASTER amount in trade
- `tokenAmount` - Token amount in trade

---

## 🎉 After Deployment

Once deployed, you'll have:

1. **Enhanced Portfolio Page** (`/portfolio`)
   - Real P&L tracking
   - Live token prices
   - 24h price changes
   - Trading statistics

2. **Enhanced History Page** (`/history`)
   - Detailed transaction cards
   - Per-trade P&L
   - Volume analytics
   - Better filtering

3. **Better User Experience**
   - Auto-refresh every 5-30 seconds
   - Real-time price updates
   - Clear profit/loss indicators
   - Professional financial tracking

---

## 📞 Need Help?

**Check Logs**:
- Backend: https://dashboard.render.com → pumpbnb-backend → Logs
- Frontend: https://dashboard.render.com → pumpbnb-frontend → Logs
- Database: https://dashboard.render.com → pumpbnb-db → Logs
- Redis: https://dashboard.render.com → pumpbnb-redis → Info

**Documentation**:
- `docs/PORTFOLIO_AND_HISTORY_ENHANCEMENTS.md` - Full feature docs
- `docs/WALLET_INTEGRATION_GUIDE.md` - Wallet integration details

**Database Access**:
```bash
psql postgresql://pumpbnb_user:nB3rAtHIN9kxP9hSxOgpA9jTJBkXb3Nb@dpg-d3qk5vali9vc73cej0mg-a.oregon-postgres.render.com/pumpbnb?sslmode=require
```

---

## 🚀 Ready to Deploy!

**Total Time**: ~30 minutes

**Steps**:
1. ✅ Verify Redis env vars (5 min)
2. ✅ Run database migration (10 min)
3. ✅ Commit & push to GitHub (5 min)
4. ✅ Monitor deployment (10 min)
5. ✅ Verify live (5 min)

**Let's go! 🎯**

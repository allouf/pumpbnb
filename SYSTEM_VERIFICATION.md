# System Verification Checklist

**Date:** October 27, 2025
**Status:** Backend Deployed ✅

---

## 🎯 Quick Health Check

### 1. Backend Health Endpoint

**URL:** `https://pumpbnb-backend.onrender.com/health`

**Test:**
```bash
curl https://pumpbnb-backend.onrender.com/health
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

✅ **If you see this, backend is working!**

---

## 🗄️ Database Verification

### Check Database Tables

The database should have **7 tables** created by Prisma:

1. ✅ `tokens` - Token registry
2. ✅ `trades` - Transaction history
3. ✅ `token_stats` - Real-time metrics
4. ✅ `user_portfolios` - User holdings
5. ✅ `watchlists` - User favorites
6. ✅ `graduation_events` - PancakeSwap migrations
7. ✅ `platform_stats` - Platform analytics

### How to Check:

**Option 1: Via Render Dashboard**
1. Go to Render Dashboard → **pumpbnb-db**
2. Click **Shell** tab
3. Run: `\dt` (list tables)

**Option 2: Via Prisma Studio (Local)**
```bash
cd backend
npx prisma studio
```
Opens at `http://localhost:5555`

### Expected Result:
- All 7 tables listed
- Tables are empty (no data yet)

---

## 📡 API Endpoints Test

### Base URL
```
https://pumpbnb-backend.onrender.com
```

### Test All 21 Endpoints:

#### **Tokens API (9 endpoints)**

**1. Get All Tokens**
```bash
curl https://pumpbnb-backend.onrender.com/api/tokens
```
Expected: `{"success":true,"data":[],"pagination":{...}}`

**2. Get Trending Tokens**
```bash
curl https://pumpbnb-backend.onrender.com/api/tokens/trending
```
Expected: `{"success":true,"data":[]}`

**3. Get Recent Tokens**
```bash
curl https://pumpbnb-backend.onrender.com/api/tokens/recent
```

**4. Get Graduated Tokens**
```bash
curl https://pumpbnb-backend.onrender.com/api/tokens/graduated
```

**5. Search Tokens (requires query)**
```bash
curl "https://pumpbnb-backend.onrender.com/api/tokens/search?q=test"
```

**6. Get Token by Address** (use sample token)
```bash
curl https://pumpbnb-backend.onrender.com/api/tokens/0xcFE6968c3427EcA3641d7132E03F53E7096d370e
```

**7. Get Token Holders**
```bash
curl https://pumpbnb-backend.onrender.com/api/tokens/0xcFE6968c3427EcA3641d7132E03F53E7096d370e/holders
```

**8. Get Tokens by Creator**
```bash
curl https://pumpbnb-backend.onrender.com/api/tokens/creator/0x900333E7D9BFa2781308C8A4203BF2823c605Ef0
```

**9. Create Token Metadata (POST)**
```bash
curl -X POST https://pumpbnb-backend.onrender.com/api/tokens/metadata \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Token","symbol":"TEST","description":"Test","image":"https://example.com/image.png"}'
```

---

#### **Trading API (5 endpoints)**

**10. Get Token Trades**
```bash
curl https://pumpbnb-backend.onrender.com/api/trades/token/0xcFE6968c3427EcA3641d7132E03F53E7096d370e
```

**11. Get Chart Data**
```bash
curl "https://pumpbnb-backend.onrender.com/api/trades/chart/0xcFE6968c3427EcA3641d7132E03F53E7096d370e?interval=1h"
```

**12. Get Token Stats**
```bash
curl https://pumpbnb-backend.onrender.com/api/trades/stats/0xcFE6968c3427EcA3641d7132E03F53E7096d370e
```

**13. Estimate Trade**
```bash
curl "https://pumpbnb-backend.onrender.com/api/trades/estimate?tokenAddress=0xcFE6968c3427EcA3641d7132E03F53E7096d370e&amountIn=1000000000000000000&isBuy=true"
```

**14. Get User Trades**
```bash
curl https://pumpbnb-backend.onrender.com/api/trades/user/0x900333E7D9BFa2781308C8A4203BF2823c605Ef0
```

---

#### **User API (7 endpoints)**

**15. Get User Portfolio**
```bash
curl https://pumpbnb-backend.onrender.com/api/users/portfolio/0x900333E7D9BFa2781308C8A4203BF2823c605Ef0
```

**16. Get User History**
```bash
curl https://pumpbnb-backend.onrender.com/api/users/history/0x900333E7D9BFa2781308C8A4203BF2823c605Ef0
```

**17. Get User P&L**
```bash
curl https://pumpbnb-backend.onrender.com/api/users/pnl/0x900333E7D9BFa2781308C8A4203BF2823c605Ef0
```

**18. Get Watchlist**
```bash
curl https://pumpbnb-backend.onrender.com/api/users/watchlist/0x900333E7D9BFa2781308C8A4203BF2823c605Ef0
```

**19. Add to Watchlist (POST)**
```bash
curl -X POST https://pumpbnb-backend.onrender.com/api/users/watchlist \
  -H "Content-Type: application/json" \
  -d '{"userAddress":"0x900333E7D9BFa2781308C8A4203BF2823c605Ef0","tokenAddress":"0xcFE6968c3427EcA3641d7132E03F53E7096d370e"}'
```

**20. Remove from Watchlist (DELETE)**
```bash
curl -X DELETE "https://pumpbnb-backend.onrender.com/api/users/watchlist?userAddress=0x900333E7D9BFa2781308C8A4203BF2823c605Ef0&tokenAddress=0xcFE6968c3427EcA3641d7132E03F53E7096d370e"
```

**21. Platform Stats**
```bash
curl https://pumpbnb-backend.onrender.com/api/users/platform-stats
```

---

## 🔌 WebSocket Test

### Test Real-Time Connection

**Using JavaScript (Browser Console):**
```javascript
const socket = io('https://pumpbnb-backend.onrender.com');

socket.on('connect', () => {
  console.log('✅ WebSocket connected!');

  // Subscribe to new tokens
  socket.emit('subscribe:new-tokens');

  // Subscribe to specific token
  socket.emit('subscribe:token', '0xcFE6968c3427EcA3641d7132E03F53E7096d370e');
});

socket.on('token:created', (data) => {
  console.log('New token:', data);
});

socket.on('token:trade', (data) => {
  console.log('New trade:', data);
});

socket.on('disconnect', () => {
  console.log('❌ WebSocket disconnected');
});
```

### WebSocket Events Available:
- `token:created` - New token creation
- `token:trade` - New buy/sell trade
- `token:price-update` - Price update
- `token:graduated` - Token graduation event

---

## ⛓️ Blockchain Indexer Test

### Check Indexer is Running

**Look for in Render Logs:**
```
✅ Blockchain indexer started
✅ Connected to BSC Testnet RPC
✅ TokenFactory contract: 0xCF0b298E26db22bCc886E03654A2Bfcb4E2742C2
✅ Listening for TokenCreated events
```

### Test Indexer with Real Token Creation

**1. Create a test token on BSC Testnet:**
- Use TokenFactory contract at: `0xCF0b298E26db22bCc886E03654A2Bfcb4E2742C2`
- Call `createToken()` function via MetaMask

**2. Check if indexed:**
Wait 30 seconds, then:
```bash
curl https://pumpbnb-backend.onrender.com/api/tokens
```

**3. Should see your token in the response!**

---

## 📦 IPFS Test (Pinata)

### Test Metadata Upload

```bash
curl -X POST https://pumpbnb-backend.onrender.com/api/tokens/metadata \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Test Token",
    "symbol": "MTT",
    "description": "This is a test token for verification",
    "image": "https://via.placeholder.com/200",
    "website": "https://example.com",
    "twitter": "https://twitter.com/example"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "ipfsHash": "Qm...",
    "url": "https://gateway.pinata.cloud/ipfs/Qm..."
  }
}
```

✅ **If you get an IPFS hash, Pinata is working!**

---

## 🔍 Service Status Summary

### Services on Render:

| Service | Status | URL |
|---------|--------|-----|
| **pumpbnb-backend** | 🟢 Live | https://pumpbnb-backend.onrender.com |
| **pumpbnb-db** | 🟢 Running | PostgreSQL (Internal) |
| **pumpbnb-redis** | 🟢 Running | Redis (Internal) |
| **pumpbnb-frontend** | 🟡 Existing | https://pumpbnb-frontend.onrender.com |
| **pumpbnb-API** | 🟡 Test Data | https://pumpbnb-api.onrender.com |

---

## ✅ Verification Checklist

### Backend Services:
- [ ] Health endpoint returns 200 OK
- [ ] Database connection successful
- [ ] Redis connection successful
- [ ] All 7 database tables exist
- [ ] All 21 API endpoints accessible

### Integrations:
- [ ] Pinata IPFS upload works
- [ ] WebSocket connection successful
- [ ] Blockchain indexer running
- [ ] BSC Testnet RPC accessible

### Data Flow:
- [ ] Can create token metadata (IPFS)
- [ ] Can query tokens (empty OK)
- [ ] Can subscribe to WebSocket events
- [ ] Indexer listens for blockchain events

---

## 🚨 Common Issues & Fixes

### Issue: Health check returns error
**Fix:** Check Render logs for startup errors

### Issue: Database connection failed
**Fix:** Verify DATABASE_URL in environment variables

### Issue: Redis connection failed
**Fix:** Verify REDIS_URL in environment variables

### Issue: Blockchain indexer not starting
**Fix:**
- Check BSC_TESTNET_RPC is accessible
- Verify contract addresses are correct
- Check Render logs for specific errors

### Issue: IPFS upload fails
**Fix:** Verify Pinata credentials in environment variables

---

## 📊 Current Data Status

### Database:
- **Tables:** 7 tables created ✅
- **Data:** Empty (no tokens created yet) ✅ Expected
- **Status:** Ready for data ✅

### Blockchain:
- **Network:** BSC Testnet (Chain ID: 97) ✅
- **TokenFactory:** 0xCF0b298E26db22bCc886E03654A2Bfcb4E2742C2 ✅
- **Indexer:** Listening for events ✅

### IPFS:
- **Provider:** Pinata ✅
- **Credentials:** Configured ✅
- **Status:** Ready ✅

---

## 🎯 Next Steps

### 1. Test End-to-End Flow

**Create a Test Token:**
1. Connect MetaMask to BSC Testnet
2. Call TokenFactory.createToken()
3. Wait 30 seconds
4. Check API: Should appear in `/api/tokens`

**Execute a Test Trade:**
1. Get bonding curve address from token
2. Approve ASTER tokens
3. Call BondingCurve.buy()
4. Check API: Should appear in `/api/trades`

### 2. Update Frontend

Update frontend environment variables to point to production backend:
```env
NEXT_PUBLIC_API_URL=https://pumpbnb-backend.onrender.com
NEXT_PUBLIC_WS_URL=wss://pumpbnb-backend.onrender.com
```

### 3. Monitor Performance

**Watch Render Logs for:**
- Database query performance
- Blockchain RPC call times
- WebSocket connection counts
- Memory usage

### 4. Scale if Needed

**Free Tier Limitations:**
- Services spin down after 15 min inactivity
- Limited memory and CPU
- Shared database resources

**Upgrade to Starter ($7/mo per service) for:**
- Always-on services
- Better performance
- Dedicated resources

---

## 🔗 Quick Links

**Backend:**
- Health: https://pumpbnb-backend.onrender.com/health
- API Docs: See `backend/README.md`

**Render Dashboard:**
- Backend: https://dashboard.render.com
- Database: Check Shell tab for SQL access
- Redis: Check Connect tab for URL

**Blockchain:**
- BSC Testnet Explorer: https://testnet.bscscan.com
- TokenFactory: https://testnet.bscscan.com/address/0xCF0b298E26db22bCc886E03654A2Bfcb4E2742C2

**IPFS:**
- Pinata Dashboard: https://app.pinata.cloud
- Gateway: https://gateway.pinata.cloud/ipfs/

---

**Status:** ✅ Backend deployed and ready for testing!
**Last Updated:** October 27, 2025

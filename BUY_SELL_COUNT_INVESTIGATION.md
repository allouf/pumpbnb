# Buy/Sell Count Investigation

## Issue Reported
Dashboard shows **Buy/Sell = 12/0** for user's token, but user confirmed they made at least 1 sell transaction.

## User Details
- **Wallet Address**: `0x5f9ce34bb4909088bf2d3629249f2efa0d6a9f94`
- **Token Created**: 1 token
- **Expected**: Buy/Sell should show something like 11/1 or 12/1 (not 12/0)

---

## Code Analysis

### 1. Frontend Dashboard (`frontend/app/dashboard/page.tsx`)

**How buy/sell counts are calculated:**
```typescript
// Line 159-160
const buyCount = transactions.filter(tx => tx.type === 'buy').length
const sellCount = transactions.filter(tx => tx.type === 'sell').length
```

The dashboard filters transactions by `tx.type` which comes from the transaction history hook.

---

### 2. Transaction History Hook (`frontend/lib/hooks/useTransactionHistory.ts`)

**How transaction type is determined:**
```typescript
// Line 70
type: trade.isBuy ? 'buy' : 'sell',
```

The type is based on `trade.isBuy` field from the backend API response.

**API Endpoint Called:**
```
GET ${API_URL}/api/trades/${bondingCurveAddress}/history
```

---

### 3. Backend API (`backend/src/routes/trade.routes.ts`)

**Database query:**
```typescript
// Lines 41-60
const trades = await prisma.trade.findMany({
  where: {
    tokenAddress: token.address,
    ...(userAddress && { trader: (userAddress as string).toLowerCase() }),
  },
  select: {
    isBuy: true,  // ← This field determines buy vs sell
    // ... other fields
  },
});
```

The API reads `isBuy` directly from the database.

---

### 4. Trade Indexer (`backend/src/services/immediate-trade-indexer.service.ts`)

**How trades are indexed:**

**For Buy Transactions (Line 165):**
```typescript
const trade = await prisma.trade.create({
  data: {
    isBuy: true,  // ✅ Correctly set for buys
    // ...
  },
});
```

**For Sell Transactions (Line 224):**
```typescript
const trade = await prisma.trade.create({
  data: {
    isBuy: false,  // ✅ Correctly set for sells
    // ...
  },
});
```

**Event Detection (Lines 121-129):**
```typescript
if (parsed.name === 'Buy') {
  buyEvent = parsed;
  logger.info(`[Immediate Trade Indexer] ✅ Buy event found!`);
} else if (parsed.name === 'Sell') {
  sellEvent = parsed;
  logger.info(`[Immediate Trade Indexer] ✅ Sell event found!`);
}
```

The indexer correctly detects both Buy and Sell events from blockchain logs.

---

## Possible Causes

### 1. **Sell Transaction Not Indexed Yet** ⚠️
- Most likely cause
- Sell transaction may not have been processed by the indexer
- Indexer might have been offline or restarted
- Transaction might have failed on-chain

### 2. **Event Parsing Issue** ⚠️
- Sell event might not be emitted properly by smart contract
- Log parsing might have failed for that specific transaction
- Transaction might be pending or reverted

### 3. **Database Record Missing** ⚠️
- Sell trade record never created in database
- Or created with wrong `isBuy` value (unlikely based on code review)

### 4. **Caching Issue** ⚠️
- Frontend might be showing cached data
- API response might be stale

---

## Verification Steps

### Step 1: Check Database Directly

Run the debug script to see what's actually in the database:

```bash
cd backend
npx ts-node scripts/check-trades.ts
```

**This will show:**
- Total trades for your token
- Buy vs Sell count from database
- Your specific trades (including any sells)
- Transaction hashes for verification

**Expected Output:**
```
🔍 Checking trades for: 0x5f9ce34bb4909088bf2d3629249f2efa0d6a9f94

✅ Found 1 token(s):

📦 Token: [Your Token Name] ([SYMBOL])
   Address: 0x...
   Bonding Curve: 0x...

   📊 Total Trades: 12
   🟢 Buys: 11
   🔴 Sells: 1  ← Should see at least 1 sell here

   👤 Your Trades: X
   🟢 Your Buys: X
   🔴 Your Sells: 1  ← Your sell transaction should appear here
```

### Step 2: Verify on BSCScan

1. Go to your sell transaction on BSCScan Testnet
2. Check transaction status:
   - ✅ Success = Should be indexed
   - ❌ Failed = Won't be indexed
3. Look for "Sell" event in logs
4. Copy the transaction hash

### Step 3: Check Indexer Logs

Search backend logs for your sell transaction hash:
```
[Immediate Trade Indexer] ✅ Sell event found!
[Immediate Trade Indexer] ✅ Sell indexed successfully
```

If you see these logs, the sell was indexed. If not, the transaction wasn't processed.

### Step 4: Manual Re-Index (If Needed)

If sell transaction exists on-chain but not in database:

```bash
# Call indexer endpoint to manually index the transaction
curl -X POST https://pumpbnb-backend.onrender.com/api/indexer/index-trade \
  -H "Content-Type: application/json" \
  -d '{
    "tokenAddress": "YOUR_TOKEN_ADDRESS",
    "txHash": "YOUR_SELL_TX_HASH"
  }'
```

---

## Fix Recommendations

### If Sell is Missing from Database:

**Option 1: Wait for Auto-Indexing** (Recommended)
- The indexer runs automatically
- New trades are indexed immediately
- Historical trades may take time

**Option 2: Manual Re-Index**
- Use the manual indexing endpoint (shown above)
- Provide your token address and sell transaction hash

**Option 3: Clear Cache & Refresh**
- Clear browser cache
- Hard refresh the dashboard (Ctrl+Shift+R)
- Check if counts update

### If Sell Exists but Shows as Buy:

**Data Correction Script:**
```typescript
// Update incorrect isBuy values
await prisma.trade.update({
  where: { txHash: 'YOUR_SELL_TX_HASH' },
  data: { isBuy: false }
});
```

---

## Code is Correct ✅

After reviewing the entire codebase:
- ✅ Frontend correctly interprets `isBuy` field
- ✅ Backend correctly reads from database
- ✅ Indexer correctly sets `isBuy: false` for sells
- ✅ Event detection logic properly distinguishes Buy vs Sell

**Conclusion**: The code is working correctly. The issue is likely:
1. Sell transaction not indexed yet (timing issue)
2. Sell transaction failed on-chain
3. Indexer was offline when sell happened

---

## Next Steps

1. **Run the debug script** to see actual database state
2. **Find your sell transaction hash** on BSCScan
3. **Verify transaction status** (success/failed)
4. **Check if sell is in database**:
   - If YES → Clear cache and refresh
   - If NO → Re-index manually using the transaction hash
5. **Monitor indexer logs** for any errors

---

## How Dashboard Calculates Counts

```
User's Token
    ↓
Fetch all trades from database (via API)
    ↓
Filter by bondingCurve address
    ↓
Group by isBuy field:
    - isBuy = true  → Buy Count
    - isBuy = false → Sell Count
    ↓
Display: Buy/Sell = X/Y
```

**Your Case:**
- Total trades: 12
- Buy count: 12 (all have `isBuy: true`)
- Sell count: 0 (none have `isBuy: false`)

**This means**: Your sell transaction either:
- Wasn't indexed
- Failed on-chain
- Hasn't been processed yet

Run the debug script to confirm! 🔍

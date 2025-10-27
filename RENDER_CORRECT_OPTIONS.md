# Correct Render Dashboard Options

**Updated:** October 27, 2025

When you click **"New"** in Render Dashboard, you'll see:

---

## What You'll See vs What You Need

### Render Dashboard Options:

```
┌─────────────────────────────────────┐
│  New +                              │
├─────────────────────────────────────┤
│  • Static Site                      │
│  • Web Service         ← BACKEND    │
│  • Private Service                  │
│  • Background Worker                │
│  • Cron Job                         │
│  • PostgreSQL          ← DATABASE   │
│  • Key-Value Store     ← REDIS!     │
└─────────────────────────────────────┘
```

---

## What You Need for Deployment:

### 1. Key-Value Store (This is Redis!) ✅

**For:** `pumpbnb-redis`

**Click:** **New** → **Key-Value Store**

**Configuration:**
```
Name: pumpbnb-redis
Plan: Free (or Starter for production)
Region: Oregon (same as your database)
Max Memory Policy: allkeys-lru
```

**What it does:**
- Caching
- Rate limiting
- WebSocket pub/sub (horizontal scaling)

---

### 2. Web Service ✅

**For:** `pumpbnb-backend`

**Click:** **New** → **Web Service**

**Configuration:**
```
Name: pumpbnb-backend
Region: Oregon
Branch: main
Root Directory: backend
Runtime: Node
Build Command: npm install && npx prisma generate && npm run build
Start Command: npm start
```

**What it does:**
- Runs your Node.js backend API
- Serves 21 endpoints
- WebSocket server
- Blockchain indexer

---

### 3. PostgreSQL (Already exists) ✅

**Name:** `pumpbnb-db`

**What it does:**
- Stores tokens, trades, stats
- 7 tables after migration

---

## Visual Guide: Creating Key-Value Store

### Step-by-Step:

```
1. Dashboard → Click "New" button (top right)

2. Select "Key-Value Store"

3. Configure:
   ┌─────────────────────────────────┐
   │ Name: pumpbnb-redis             │
   │                                 │
   │ Plan: Free ▼                    │
   │                                 │
   │ Region: Oregon ▼                │
   │                                 │
   │ Max Memory Policy:              │
   │   allkeys-lru ▼                 │
   │                                 │
   │ [Create]                        │
   └─────────────────────────────────┘

4. Wait for "Available" status

5. Click on "pumpbnb-redis" → "Connect" tab

6. Copy "Internal Redis URL":
   redis://default:PASSWORD@red-xxxxx.oregon-redis.render.com:6379
```

---

## Visual Guide: Creating Web Service

### Step-by-Step:

```
1. Dashboard → Click "New" button

2. Select "Web Service"

3. Connect Repository:
   ┌─────────────────────────────────┐
   │ Connect Git Repository          │
   │                                 │
   │ • GitHub                        │
   │ • GitLab                        │
   │ • Bitbucket                     │
   │                                 │
   │ Select: BNB_PumpFun            │
   └─────────────────────────────────┘

4. Configure Service:
   ┌─────────────────────────────────┐
   │ Name: pumpbnb-backend           │
   │                                 │
   │ Region: Oregon ▼                │
   │                                 │
   │ Branch: main                    │
   │                                 │
   │ Root Directory: backend         │
   │                                 │
   │ Runtime: Node ▼                 │
   │                                 │
   │ Build Command:                  │
   │ npm install && npx prisma       │
   │ generate && npm run build       │
   │                                 │
   │ Start Command:                  │
   │ npm start                       │
   │                                 │
   │ [Create Web Service]            │
   └─────────────────────────────────┘
```

---

## Common Questions

### Q: I don't see "Redis" option?
**A:** Render renamed it! Look for **"Key-Value Store"** - that's Redis.

### Q: What's the difference between options?
**A:**
- **Static Site** - For HTML/CSS/JS only (like Create React App build)
- **Web Service** - For backend servers (Node.js, Python, etc.) ← **You need this**
- **Private Service** - Internal services (not accessible from internet)
- **Background Worker** - Long-running background tasks
- **Cron Job** - Scheduled tasks
- **PostgreSQL** - Database ← **You already have this**
- **Key-Value Store** - Redis cache ← **You need this**

### Q: Can I use Free tier?
**A:** Yes! All services have free tier:
- PostgreSQL: Free (1GB storage)
- Key-Value Store (Redis): Free (25MB)
- Web Service: Free (spins down after 15 min inactivity)

### Q: What's "Max Memory Policy"?
**A:**
- **allkeys-lru** (Recommended) - Removes least recently used keys when memory full
- **volatile-lru** - Only removes keys with expiry set
- **noeviction** - Returns errors when memory full

**Use:** `allkeys-lru` for our use case

---

## After Creating Services

### Key-Value Store (Redis):
```
Service Created ✅
↓
Status: Available ✅
↓
Click service name
↓
Go to "Connect" tab
↓
Copy "Internal Redis URL"
↓
Paste in pumpbnb-backend environment variables
```

### Web Service (Backend):
```
Service Created ✅
↓
Add environment variables (don't deploy yet!)
↓
Save changes
↓
Automatic deployment starts
↓
Monitor logs
↓
Check /health endpoint
```

---

## Service Dependencies

```
pumpbnb-backend (Web Service)
    ↓
    ├─→ pumpbnb-db (PostgreSQL) ← Already exists
    ├─→ pumpbnb-redis (Key-Value Store) ← Create new
    └─→ BSC Testnet RPC (External)
```

---

## Checklist

- [ ] ✅ Found "Key-Value Store" option (this is Redis!)
- [ ] ✅ Found "Web Service" option (for backend)
- [ ] ✅ Know pumpbnb-db already exists (PostgreSQL)
- [ ] ✅ Ready to create Key-Value Store
- [ ] ✅ Ready to create Web Service

---

## Next Steps

1. **Create Key-Value Store first** (pumpbnb-redis)
2. **Copy its Internal Redis URL**
3. **Create Web Service** (pumpbnb-backend)
4. **Add environment variables** (including Redis URL)
5. **Deploy and monitor**

---

**Visual Summary:**

```
What You Need:
┌────────────────────────┐
│ Key-Value Store        │ → pumpbnb-redis (NEW)
│ (Redis)                │
└────────────────────────┘

┌────────────────────────┐
│ Web Service            │ → pumpbnb-backend (NEW)
│ (Backend API)          │
└────────────────────────┘

┌────────────────────────┐
│ PostgreSQL             │ → pumpbnb-db (EXISTS)
│ (Database)             │
└────────────────────────┘
```

---

**Ready?** Now you know exactly what to click! 🎯

Start with: **New** → **Key-Value Store**

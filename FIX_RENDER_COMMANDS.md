# 🔧 Fix: Separate Build and Start Commands

## The Problem

We're using `npm run start:migrate` as the **Build Command**, which:
1. Generates Prisma client ✅
2. Compiles TypeScript ✅
3. Runs migrations ✅
4. **Starts the server** ❌ ← This never exits!

Render thinks the build never completes because the server keeps running!

## The Solution

Separate build and start:
- **Build Command**: Prepare everything (generate, compile, migrate)
- **Start Command**: Just start the server

## What to Change on Render

### Go to Render Dashboard:
1. Find **pumpbnb-backend** service
2. Click **Settings** tab
3. Update these fields:

### Build Command:
```
npx prisma generate && npx tsc && npx prisma migrate deploy
```

### Start Command:
```
node dist/server.js
```

### Save Changes
Click **Save Changes** at the bottom

### Redeploy
Click **Manual Deploy** → **Deploy**

---

## Why This Works

**Build phase (runs once):**
```
npx prisma generate    # Generate Prisma client
npx tsc                # Compile TypeScript
npx prisma migrate deploy  # Run migrations
# Build completes ✅
```

**Start phase (keeps running):**
```
node dist/server.js    # Start server (runs forever)
# Server keeps running ✅
```

Now Render will:
1. Run build command
2. Wait for it to complete (it will!)
3. Start the server with start command
4. Mark deployment as "Live" ✅

---

## Quick Steps

1. **Render Dashboard** → pumpbnb-backend → **Settings**
2. **Build Command**: `npx prisma generate && npx tsc && npx prisma migrate deploy`
3. **Start Command**: `node dist/server.js`
4. **Save Changes**
5. **Manual Deploy** → **Deploy**
6. Wait 3-5 minutes
7. Deployment will complete properly this time!

---

This is the correct way to deploy on Render!

# How to Manually Deploy on Render

## The Issue
Render's free tier sometimes doesn't auto-deploy immediately after pushing to BitBucket. The backend is still running the old code (uptime ~14 minutes when we need it to restart).

## Solution: Manual Deploy

### **Method 1: Via Dashboard (Easiest)**

1. **Login to Render**
   - Go to: https://dashboard.render.com/
   - Sign in with your account

2. **Find Your Backend Service**
   - Look for "pumpbnb-backend" in your services list
   - Click on it

3. **Trigger Manual Deploy**
   - Look for **"Manual Deploy"** button (usually top-right corner)
   - Click it and select **"Deploy latest commit"**
   - Or select **"Clear build cache & deploy"** if you want a fresh build

4. **Monitor Progress**
   - Watch the deployment logs
   - Look for "Started polling for new events every 10 seconds" in logs
   - Wait for "Live" status (usually 2-5 minutes)

### **Method 2: Enable Auto-Deploy (For Future)**

1. In Render Dashboard → pumpbnb-backend → **Settings**
2. Scroll to **"Build & Deploy"** section
3. Set **"Auto-Deploy"** to **"Yes"**
4. Verify **"Branch"** is **"main"**
5. Save changes

### **Method 3: Use Deploy Hook (API)**

If you have a deploy hook URL from Render:

```bash
# Get your deploy hook from Render Dashboard → Settings → Deploy Hook
# Then run:
curl -X POST https://api.render.com/deploy/srv-xxxxx?key=your-key
```

## **After Deployment Completes**

Run this to verify the fix worked:

```bash
node test-api.js
```

You should see:
```
✅ Health Check: PASSED
✅ Get All Tokens: PASSED  <-- This should now work!
✅ Get Trending Tokens: PASSED
✅ Get Recent Tokens: PASSED
```

## **Why This Happened**

1. **Free Tier Limitations**: Render's free tier doesn't guarantee instant auto-deploys
2. **Webhook Delays**: BitBucket → Render webhooks can have delays
3. **Build Queue**: Your build might be queued behind other users' builds

## **What to Expect**

Once manually deployed:
- ✅ Backend will restart with new code
- ✅ Uptime will reset to ~0-10 seconds
- ✅ No more "filter not found" errors
- ✅ All `/api/tokens/*` endpoints will work
- ✅ Frontend will be able to load token list

---

**Current Commit**: `461e321` - Fix RPC polling
**Status**: Code pushed, waiting for Render deployment
**Action Required**: Manual deploy via dashboard

# Render Environment Variable Setup - CRITICAL

## ⚠️ MUST DO THIS NOW

The frontend code is deployed but needs the backend API URL environment variable.

## Steps:

1. **Go to**: https://dashboard.render.com/
2. **Select**: "pumpbnb-frontend" service
3. **Click**: "Environment" tab (left sidebar)
4. **Click**: "Add Environment Variable"
5. **Add**:
   ```
   Key:   NEXT_PUBLIC_API_URL
   Value: https://pumpbnb-backend.onrender.com
   ```
6. **Click**: "Save Changes"
7. **Wait**: Render auto-redeploys (~3 minutes)

## Test After Deployment:

Visit: https://pumpbnb-frontend.onrender.com/tokens

**Expected**: No RPC errors, page loads successfully

**Commit Pushed**: 3781b5f ✅
**Status**: Waiting for env var + deployment

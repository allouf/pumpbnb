# 🚀 Render Update - Quick Reference Card

**Update Required**: October 30, 2025
**Time**: 10 minutes
**Downtime**: 5 minutes

---

## 📋 Step-by-Step Instructions

### 1. Login to Render
```
https://dashboard.render.com
```

### 2. Find Your Backend Service
Look for: `pumpbnb-API` or `pumpbnb-backend`

### 3. Go to Environment Tab
Click **"Environment"** in the left sidebar

### 4. Update These 5 Variables

Click edit (pencil icon) for each and replace with new value:

| Variable | New Value |
|----------|-----------|
| `TOKEN_FACTORY_ADDRESS` | `0x1c3a8Afb7DCA2479c7bC9546e54d6B5d01005d10` |
| `GRADUATION_MANAGER_ADDRESS` | `0x9aAF1512b9d74CdEb076F9b9756DA5588b7c0ED5` |
| `PLATFORM_CONFIG_ADDRESS` | `0xE98D020690F715EDb2dc1b48C4cfd678c9e2a3B5` |
| `ASTER_TOKEN_ADDRESS` | `0xB1c4267412EAc792973261CC450ce7902b33a42D` |
| `SAMPLE_TOKEN_ADDRESS` | `0x301F75A5B8DD75dA71a331CE36d752A1bFfc0723` |

### 5. Save Changes
Click **"Save Changes"** button

### 6. Redeploy
Click **"Manual Deploy"** → **"Clear build cache & deploy"**

### 7. Wait for Deployment
Status will show:
- ⏳ Building...
- ⏳ Deploying...
- ✅ Live

### 8. Verify
```bash
curl https://your-backend.onrender.com/health
```

Should return `{"status":"ok",...}`

---

## ✅ Done!

Your backend is now using the fixed smart contracts.

**See full details**: `backend/UPDATE_RENDER_ENV.md`

---

## 🆘 Need Help?

**Can't find your service?**
- Check all services in your Render dashboard
- Look for Node.js web services

**Variables not saving?**
- Make sure to click "Save Changes" after each edit
- Try refreshing the page

**Deployment failing?**
- Check logs in Render dashboard
- Verify all 5 addresses were updated correctly
- Try "Clear build cache & deploy" again

---

**Updated**: October 30, 2025
**Priority**: HIGH
**Status**: Ready to Apply

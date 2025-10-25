# PumpBNB Deployment Guide

This guide will help you deploy the PumpBNB application with complete instructions for both frontend and backend deployment.

## Current Setup

Your frontend is currently deployed on **two servers**:
- **Netlify**: `https://pumpbnb.netlify.app/` (Recommended - faster for static sites)
- **Render**: `https://pumpbnb.onrender.com/` (Alternative)

**Backend**: Needs to be deployed (recommended on Render)

## Recommendation: Use Netlify for Frontend

**Why Netlify is better for the frontend:**
- ⚡ Faster global CDN for static Next.js sites
- 🚀 Automatic deployments on git push
- 💰 More generous free tier
- 🔧 Better build performance for Next.js

**Primary URL**: `https://pumpbnb.netlify.app/`

You can keep the Render deployment as a backup, but use Netlify as your primary frontend.

---

## Backend Deployment (Render - Recommended)

### Why Render for Backend?

- ✅ Perfect for Express.js/Node.js applications (no refactoring needed)
- ✅ Free tier with 750 hours/month
- ✅ Built-in PostgreSQL database support
- ✅ Auto-deploy from Bitbucket
- ✅ Environment variable management
- ✅ HTTPS by default

### Step-by-Step: Deploy Backend to Render

#### 1. Create Render Account
- Go to https://render.com/
- Sign up with your Bitbucket account

#### 2. Create New Web Service
1. Click **"New +"** → **"Web Service"**
2. Connect your Bitbucket repository: `allouf/pumpbnb`
3. Configure the service:
   - **Name**: `pumpbnb-api`
   - **Root Directory**: `pumpbnb-api`
   - **Environment**: `Node`
   - **Region**: Choose closest to your users
   - **Branch**: `main`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Instance Type**: Free

#### 3. Add Environment Variables

Click **"Advanced"** → **"Add Environment Variable"** and add these:

```env
# Server Configuration
PORT=10000
NODE_ENV=production

# Frontend URLs (both Netlify and Render are whitelisted in CORS)
FRONTEND_URL_PRODUCTION=https://pumpbnb.netlify.app

# Database Configuration (create database first - see below)
DATABASE_URL=your-postgresql-connection-string

# JWT Configuration (IMPORTANT: Generate a strong random secret)
JWT_SECRET=your-super-secret-random-string-here-use-password-generator
JWT_EXPIRES_IN=7d

# BNB Chain Configuration
BNB_CHAIN_RPC_URL=https://bsc-dataseed1.binance.org/
BNB_CHAIN_TESTNET_RPC_URL=https://data-seed-prebsc-1-s1.binance.org:8545/
```

**Generate JWT_SECRET**: Use a password generator to create a long random string (32+ characters)

#### 4. Create PostgreSQL Database

1. In Render Dashboard, click **"New +"** → **"PostgreSQL"**
2. Configure:
   - **Name**: `pumpbnb-db`
   - **Database**: `pumpbnb`
   - **User**: `pumpbnb_user`
   - **Region**: Same as your web service
   - **Instance Type**: Free
3. Click **"Create Database"**
4. After creation, copy the **"Internal Database URL"** (starts with `postgresql://`)
5. Go back to your web service → **Environment** tab
6. Update `DATABASE_URL` with the copied connection string

#### 5. Deploy Backend

1. Click **"Create Web Service"**
2. Wait for deployment (5-10 minutes)
3. After deployment, you'll get a URL like: `https://pumpbnb-api.onrender.com`

#### 6. Run Database Migrations

After first deployment:
1. Go to your service → **Shell** tab
2. Run: `npm run db:push` or `npm run db:migrate`

---

## Frontend Configuration

Now that your backend is deployed, you need to update the frontend to use it.

### Update Netlify Environment Variable

#### Method 1: Netlify Dashboard
1. Go to https://app.netlify.com/
2. Select your site: `pumpbnb`
3. Go to **"Site settings"** → **"Environment variables"**
4. Click **"Add a variable"**
5. Add:
   - **Key**: `NEXT_PUBLIC_API_URL`
   - **Value**: `https://pumpbnb-api.onrender.com/api` (use your actual Render URL)
6. Click **"Save"**
7. Go to **"Deploys"** → Click **"Trigger deploy"** → **"Deploy site"**

#### Method 2: Netlify CLI
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Link to your site
cd pumpbnb-ui
netlify link

# Set environment variable
netlify env:set NEXT_PUBLIC_API_URL https://pumpbnb-api.onrender.com/api

# Trigger redeploy
netlify deploy --prod
```

### Update Render Frontend (Optional - if you want to keep it)

1. Go to Render dashboard
2. Select your frontend service
3. Go to **"Environment"** tab
4. Add variable:
   - `NEXT_PUBLIC_API_URL=https://pumpbnb-api.onrender.com/api`
5. Service will auto-redeploy

---

## Local Development

For local development, use these configurations:

### Backend (.env)
```env
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
DATABASE_URL="file:./dev.db"
JWT_SECRET=dev-secret-key-change-in-production
JWT_EXPIRES_IN=7d
BNB_CHAIN_RPC_URL=https://bsc-dataseed1.binance.org/
BNB_CHAIN_TESTNET_RPC_URL=https://data-seed-prebsc-1-s1.binance.org:8545/
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

### Start Local Development
```bash
# Terminal 1 - Backend
cd pumpbnb-api
npm run dev

# Terminal 2 - Frontend
cd pumpbnb-ui
npm run dev
```

Visit `http://localhost:3000`

---

## CORS Configuration

Your backend is already configured to accept requests from:
- ✅ `https://pumpbnb.netlify.app`
- ✅ `https://pumpbnb.onrender.com`
- ✅ `http://localhost:3000` (local development)
- ✅ `http://localhost:3001` (alternative local port)

This configuration is in `pumpbnb-api/src/index.ts:24-38`

---

## Verification Checklist

After deployment, verify everything works:

### Backend Health Check
Visit: `https://pumpbnb-api.onrender.com/api/health`

Expected response:
```json
{
  "success": true,
  "status": "healthy",
  "timestamp": "2025-10-19T...",
  "uptime": 123.45
}
```

### Frontend Tests
1. ✅ Visit `https://pumpbnb.netlify.app/`
2. ✅ Open browser console (F12)
3. ✅ Click "Connect Wallet"
4. ✅ No CORS errors should appear
5. ✅ Wallet connection should work

### Database Check
1. Go to Render → Your web service → **Shell**
2. Run: `npx prisma studio`
3. Access the database UI to verify tables were created

---

## Troubleshooting

### CORS Errors Still Appearing

**Problem**: "Access-Control-Allow-Origin" error in browser console

**Solutions**:
1. Verify `NEXT_PUBLIC_API_URL` is set correctly on Netlify
2. Check that backend is running: visit `/api/health` endpoint
3. Clear browser cache and hard refresh (Ctrl+Shift+R)
4. Check backend logs on Render for errors
5. Verify CORS configuration includes your frontend URL

### Backend Not Starting

**Problem**: Render deployment fails or crashes

**Solutions**:
1. Check Render logs: Service → **Logs** tab
2. Verify all environment variables are set
3. Ensure `DATABASE_URL` is correct
4. Check `package.json` has correct start command: `"start": "node dist/index.js"`
5. Verify build succeeds: `npm run build` should work locally

### Database Connection Errors

**Problem**: Backend can't connect to database

**Solutions**:
1. Use **Internal Database URL** (not External) in `DATABASE_URL`
2. Ensure database is in the same region as web service
3. Run migrations: `npm run db:push`
4. Check database is running in Render dashboard

### Frontend Shows "Failed to Fetch"

**Problem**: API requests failing

**Solutions**:
1. Check `NEXT_PUBLIC_API_URL` is set on Netlify
2. Verify URL has `/api` suffix
3. Test backend health endpoint directly
4. Check backend CORS allows your frontend domain
5. Redeploy frontend after setting env vars

---

## Architecture Diagram

```
Users (Browser)
      ↓
Frontend (Netlify)
https://pumpbnb.netlify.app
      ↓ API Calls
Backend (Render)
https://pumpbnb-api.onrender.com
      ↓
Database (Render PostgreSQL)
```

---

## Cost Breakdown (Free Tier)

| Service | Free Tier Limits | Cost After Free Tier |
|---------|-----------------|---------------------|
| **Netlify** (Frontend) | 100GB bandwidth/month, 300 build minutes | $19/month for Pro |
| **Render** (Backend) | 750 hours/month, sleeps after 15min inactive | $7/month for always-on |
| **Render** (Database) | 1GB storage, 97 hours/month active | $7/month for 256MB RAM |

**Total Monthly Cost**: $0 (within free tiers for small projects)

---

## Production Optimization Tips

### 1. Keep Backend Alive
Render free tier sleeps after 15 minutes of inactivity. Options:
- Use a cron service to ping your backend every 10 minutes
- Upgrade to paid tier for always-on ($7/month)
- Use UptimeRobot (free) to ping your health endpoint

### 2. Database Backups
- Render automatic daily backups (on paid plans)
- Manual backup: Export database from Render dashboard
- Use `pg_dump` for custom backup schedules

### 3. Environment-Specific Configs
- Development: SQLite, verbose logging
- Production: PostgreSQL, error logging only
- Use `NODE_ENV` to switch between configs

### 4. Monitoring
- Render built-in metrics (CPU, memory, requests)
- Add Sentry for error tracking
- Use Morgan logs to debug API issues

---

## Security Checklist

Before going live:

- ✅ Strong JWT_SECRET (32+ random characters)
- ✅ HTTPS enforced (automatic on Netlify/Render)
- ✅ Environment variables not committed to git
- ✅ CORS limited to your domains only
- ✅ Rate limiting enabled (already configured)
- ✅ Database credentials secure
- ✅ API endpoints validated (express-validator in place)
- ✅ Helmet.js security headers (already configured)

---

## Support & Resources

- **Netlify Docs**: https://docs.netlify.com/
- **Render Docs**: https://render.com/docs
- **Next.js Deployment**: https://nextjs.org/docs/deployment
- **Express.js Best Practices**: https://expressjs.com/en/advanced/best-practice-production.html

---

## Quick Commands Reference

```bash
# Local Development
cd pumpbnb-api && npm run dev          # Start backend
cd pumpbnb-ui && npm run dev           # Start frontend

# Database
npm run db:push                        # Push schema changes
npm run db:migrate                     # Run migrations
npm run db:studio                      # Open Prisma Studio

# Build
npm run build                          # Build for production
npm start                              # Start production server

# Deploy
git push                               # Auto-deploys to Netlify/Render
```

---

## Next Steps

1. ✅ Deploy backend to Render (follow steps above)
2. ✅ Set up PostgreSQL database on Render
3. ✅ Update `NEXT_PUBLIC_API_URL` on Netlify
4. ✅ Test wallet connection on production
5. ✅ Set up monitoring and alerts
6. 🚀 You're live!

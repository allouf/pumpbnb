# PumpBNB Deployment Guide

This guide will help you deploy the PumpBNB application with the frontend on Render and backend on Netlify.

## Current Setup

- **Frontend**: Deployed on Render at `https://pumpbnb.onrender.com`
- **Backend**: To be deployed on Netlify (from Bitbucket repository)

## Environment Variables

### Frontend (Render)

Set these environment variables in your Render dashboard:

```env
NEXT_PUBLIC_API_URL=https://your-backend-url.netlify.app/api
```

**Steps to set environment variables on Render:**
1. Go to your Render dashboard
2. Select your frontend service (pumpbnb-ui)
3. Go to "Environment" tab
4. Click "Add Environment Variable"
5. Add `NEXT_PUBLIC_API_URL` with your Netlify backend URL
6. Click "Save Changes"
7. Render will automatically redeploy with the new environment variable

### Backend (Netlify)

Set these environment variables in your Netlify dashboard:

```env
# Server Configuration
PORT=9000
NODE_ENV=production
FRONTEND_URL=https://pumpbnb.onrender.com
FRONTEND_URL_PRODUCTION=https://pumpbnb.onrender.com

# Database Configuration
DATABASE_URL=your-database-connection-string

# JWT Configuration
JWT_SECRET=your-secure-random-secret-key-here
JWT_EXPIRES_IN=7d

# BNB Chain Configuration
BNB_CHAIN_RPC_URL=https://bsc-dataseed1.binance.org/
BNB_CHAIN_TESTNET_RPC_URL=https://data-seed-prebsc-1-s1.binance.org:8545/
```

**Important Notes:**
- Generate a strong random string for `JWT_SECRET` (use a password generator)
- Set up a production database (PostgreSQL recommended) and update `DATABASE_URL`
- Do NOT use SQLite (`file:./dev.db`) in production

**Steps to set environment variables on Netlify:**
1. Go to your Netlify dashboard
2. Select your backend service
3. Go to "Site settings" → "Environment variables"
4. Click "Add a variable" for each environment variable listed above
5. Deploy your backend

### Deploying Backend to Netlify

**Option 1: Using Netlify CLI**
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Navigate to backend directory
cd pumpbnb-api

# Build the backend
npm run build

# Deploy to Netlify
netlify deploy --prod --dir=dist
```

**Option 2: Using Netlify Dashboard**
1. Go to Netlify dashboard
2. Click "Add new site" → "Import an existing project"
3. Connect to your Bitbucket repository
4. Select the `pumpbnb-api` folder as the base directory
5. Set build command: `npm run build`
6. Set publish directory: `dist`
7. Add all environment variables listed above
8. Click "Deploy site"

### netlify.toml Configuration

Create a `netlify.toml` file in your `pumpbnb-api` folder:

```toml
[build]
  base = "pumpbnb-api"
  command = "npm run build"
  publish = "dist"
  functions = "functions"

[build.environment]
  NODE_VERSION = "20"

[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/:splat"
  status = 200

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

## Local Development

For local development, both frontend and backend should run on localhost:

**Backend (.env):**
```env
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

**Frontend (.env.local):**
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

**Start local development:**
```bash
# Terminal 1 - Backend
cd pumpbnb-api
npm run dev

# Terminal 2 - Frontend
cd pumpbnb-ui
npm run dev
```

## Troubleshooting CORS Issues

If you encounter CORS errors after deployment:

1. **Verify environment variables** are set correctly on both Render and Netlify
2. **Check CORS configuration** in `pumpbnb-api/src/index.ts` - it should include your production frontend URL
3. **Redeploy both services** after updating environment variables
4. **Clear browser cache** and hard refresh (Ctrl+Shift+R)

## Database Setup for Production

For production, you'll need a PostgreSQL database:

**Recommended providers:**
- **Supabase** (Free tier available, PostgreSQL)
- **Neon** (Serverless PostgreSQL)
- **Railway** (PostgreSQL with free tier)
- **Render** (Managed PostgreSQL)

**After creating your database:**
1. Get the connection string (DATABASE_URL)
2. Add it to Netlify environment variables
3. Run migrations: `npm run db:push` or `npm run db:migrate`

## Verification Steps

After deployment:

1. ✅ Backend health check: `https://your-backend.netlify.app/api/health`
2. ✅ Frontend loads: `https://pumpbnb.onrender.com`
3. ✅ Wallet connection works (no CORS errors)
4. ✅ API requests complete successfully

## Getting Your Backend URL

After deploying to Netlify, you'll get a URL like:
- `https://your-site-name.netlify.app`

Use this URL (with `/api` suffix) in your Render environment variables:
- `NEXT_PUBLIC_API_URL=https://your-site-name.netlify.app/api`

## Security Notes

- Never commit `.env` files to version control
- Use strong, random JWT secrets in production
- Enable HTTPS only in production
- Use environment-specific configurations
- Regularly rotate JWT secrets and API keys

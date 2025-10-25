# Deploy PumpBNB Frontend to Render.com

## Prerequisites

✅ Frontend code committed and pushed to GitHub/Bitbucket
✅ Render.com account (sign up at https://render.com)
✅ Repository access configured

## Step-by-Step Deployment

### 1. Create New Web Service on Render

1. Go to https://dashboard.render.com
2. Click **"New +"** button
3. Select **"Web Service"**

### 2. Connect Your Repository

1. Click **"Connect a repository"**
2. Choose **Bitbucket** (or GitHub if you migrated)
3. Authorize Render to access your repositories
4. Select the **pumpbnb** repository

### 3. Configure the Service

Fill in the following details:

#### Basic Settings
- **Name**: `pumpbnb-frontend` (or any name you prefer)
- **Region**: Choose closest to your users (e.g., Oregon, Frankfurt, Singapore)
- **Branch**: `main`
- **Root Directory**: `frontend`

#### Build & Deploy Settings
- **Runtime**: `Node`
- **Build Command**:
  ```bash
  npm install && npm run build
  ```
- **Start Command**:
  ```bash
  npm start
  ```

#### Environment Variables (Optional)
Add these if you want to use WalletConnect:

| Key | Value |
|-----|-------|
| `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` | Your WalletConnect Project ID |

Get a WalletConnect Project ID from: https://cloud.walletconnect.com

### 4. Select Plan

- **Free Tier**: Perfect for testing
  - 750 hours/month (enough for 24/7 uptime)
  - Automatic deploys from Git
  - Custom domain support
  - HTTPS included

- **Starter ($7/month)**: For production
  - Better performance
  - No sleep on inactivity
  - More memory

For now, select **Free** to test.

### 5. Deploy!

1. Click **"Create Web Service"**
2. Render will start building your app
3. Wait 5-10 minutes for first deployment
4. You'll see build logs in real-time

### 6. Verify Deployment

Once deployed, you'll get a URL like:
```
https://pumpbnb-frontend.onrender.com
```

**Test the deployment:**
1. Click the URL
2. Verify home page loads
3. Try connecting wallet
4. Test navigation

## Post-Deployment Configuration

### Add Custom Domain (Optional)

1. Go to your service dashboard
2. Click **"Settings"** → **"Custom Domain"**
3. Add your domain (e.g., `app.pumpbnb.io`)
4. Follow DNS configuration instructions
5. Render will automatically provision SSL certificate

### Environment Variables

If you need to add/update environment variables:

1. Go to service dashboard
2. Click **"Environment"** tab
3. Add variables:
   ```
   NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id
   ```
4. Click **"Save Changes"**
5. Service will automatically redeploy

## Automatic Deployments

Render automatically deploys when you push to `main` branch:

```bash
# Make changes to your code
git add .
git commit -m "Update frontend"
git push

# Render will automatically detect and deploy!
```

## Build Settings Reference

**package.json** (already configured):
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  }
}
```

**next.config.ts** (already configured):
```typescript
const nextConfig = {
  reactStrictMode: true,
  turbopack: {},
};
```

## Troubleshooting

### Build Fails

**Problem**: Build fails with dependency errors

**Solution**:
```bash
# Locally test the build
cd frontend
npm run build

# If it works locally, check Render build logs
# Make sure all dependencies are in package.json
```

### App Doesn't Load

**Problem**: Deployed but shows blank page

**Solution**:
1. Check Render logs for runtime errors
2. Verify `start` command is correct
3. Check browser console for errors
4. Ensure environment variables are set

### Wallet Connection Issues

**Problem**: MetaMask won't connect

**Solution**:
1. Verify you're on BSC Testnet (Chain ID: 97)
2. Check contract addresses in `lib/contracts.ts`
3. Ensure WalletConnect project ID is set (if using WalletConnect)

### Slow Performance

**Problem**: App loads slowly

**Solution**:
1. Upgrade to Starter plan ($7/month) for better performance
2. Free tier has spin-down after inactivity
3. First request may be slow (wakes up service)

## Monitoring & Logs

### View Logs

1. Go to service dashboard
2. Click **"Logs"** tab
3. See real-time application logs
4. Filter by level (info, warning, error)

### Performance Metrics

1. Click **"Metrics"** tab
2. View:
   - CPU usage
   - Memory usage
   - Request count
   - Response times

## Scaling

### Horizontal Scaling

Free tier: 1 instance
Starter+: Multiple instances for redundancy

### Vertical Scaling

Upgrade instance size:
- Starter: 512MB RAM
- Standard: 2GB RAM
- Pro: 4GB+ RAM

## Cost Estimation

**Free Tier**:
- Cost: $0/month
- Limitations: Spins down after 15min inactivity
- Perfect for: Testing, demos

**Starter ($7/month)**:
- Always on (no spin-down)
- Better performance
- Perfect for: MVP, early users

**Standard ($25/month)**:
- More memory & CPU
- Multiple instances
- Perfect for: Production with traffic

## Alternative Deployment Options

If you prefer other platforms:

### Vercel (Recommended for Next.js)
```bash
npm install -g vercel
cd frontend
vercel
```

### Netlify
```bash
npm install -g netlify-cli
cd frontend
netlify deploy
```

### Railway
1. Go to railway.app
2. "New Project" → Import from repo
3. Configure as Node.js app

## Security Checklist

Before going to production:

- [ ] Enable HTTPS (automatic on Render)
- [ ] Set up custom domain with SSL
- [ ] Configure CORS if needed
- [ ] Set proper environment variables
- [ ] Review and limit API keys
- [ ] Set up monitoring/alerts
- [ ] Configure rate limiting
- [ ] Review smart contract addresses

## Next Steps After Deployment

1. **Test Everything**:
   - Wallet connection
   - Token creation
   - Trading functionality
   - Mobile responsiveness

2. **Share with Users**:
   - Share the Render URL
   - Get feedback
   - Monitor errors

3. **Iterate**:
   - Fix bugs
   - Add features
   - Push to GitHub
   - Auto-deploys!

4. **Monitor Performance**:
   - Check Render metrics
   - Review logs regularly
   - Upgrade plan if needed

## Support

- **Render Docs**: https://render.com/docs
- **Render Status**: https://status.render.com
- **Community**: https://community.render.com

## Success! 🎉

Your PumpBNB frontend is now live and accessible worldwide!

**Deployment URL**: `https://pumpbnb-frontend.onrender.com`

Share it with your team and start testing!

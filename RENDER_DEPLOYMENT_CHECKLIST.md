# Render.com Deployment Checklist

## Pre-Deployment ✅

- [x] Frontend code complete
- [x] All changes committed and pushed
- [x] WalletConnect Project ID configured (`2365a77b538750a5741bacd4891ac5cf`)
- [x] Contract addresses configured in `frontend/lib/contracts.ts`
- [x] Smart contracts deployed to BSC Testnet
- [x] Local testing completed (dev server works)

## Render.com Setup

### Step 1: Create Account
- [ ] Sign up at https://render.com
- [ ] Verify your email
- [ ] Connect payment method (for non-free plans later)

### Step 2: Connect Repository
- [ ] Click "New +" → "Web Service"
- [ ] Choose "Connect a repository"
- [ ] Select **Bitbucket** (or GitHub if migrated)
- [ ] Authorize Render to access repositories
- [ ] Select `pumpbnb` repository

### Step 3: Configure Service

**Basic Settings:**
```
Name: pumpbnb-frontend
Region: [Choose closest to users]
Branch: main
Root Directory: frontend
```

**Build Settings:**
```
Runtime: Node
Build Command: npm install && npm run build
Start Command: npm start
```

**Environment Variables:**
```
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=2365a77b538750a5741bacd4891ac5cf
```

**Plan:**
- [ ] Select **Free** tier for testing
- [ ] Or **Starter** ($7/mo) for production

### Step 4: Deploy
- [ ] Click "Create Web Service"
- [ ] Wait 5-10 minutes for build
- [ ] Monitor build logs for errors

### Step 5: Verify Deployment
- [ ] Visit your Render URL (e.g., `https://pumpbnb-frontend.onrender.com`)
- [ ] Check home page loads
- [ ] Test wallet connection
- [ ] Navigate to all pages
- [ ] Test responsive design on mobile

## Post-Deployment Testing

### Functional Tests
- [ ] Home page displays correctly
- [ ] Header navigation works
- [ ] Connect Wallet button functions
- [ ] Can switch to BSC Testnet
- [ ] Create token page loads
- [ ] Token form validation works
- [ ] Browse tokens page loads
- [ ] Token detail page loads
- [ ] Buy/Sell interface works

### Performance Tests
- [ ] Page load time < 3 seconds
- [ ] Images load properly
- [ ] No console errors
- [ ] Mobile responsive works

### Web3 Tests
- [ ] MetaMask connects successfully
- [ ] WalletConnect connects successfully
- [ ] Can read contract data
- [ ] Can write to contracts (create token)
- [ ] Transactions confirm properly

## Optional Enhancements

### Custom Domain
- [ ] Purchase domain (e.g., `app.pumpbnb.io`)
- [ ] Add to Render: Settings → Custom Domain
- [ ] Configure DNS records
- [ ] Wait for SSL certificate provisioning

### Monitoring
- [ ] Set up error tracking (Sentry)
- [ ] Configure analytics (Google Analytics)
- [ ] Enable performance monitoring
- [ ] Set up uptime monitoring

### Security
- [ ] Review CORS settings
- [ ] Configure rate limiting
- [ ] Review environment variables
- [ ] Enable security headers

## Deployment URLs

After deployment, save these:

```
Development: http://localhost:3000
Staging: https://pumpbnb-frontend.onrender.com
Production: [Your custom domain]

Repository: https://bitbucket.org/allouf/pumpbnb
BSCScan: https://testnet.bscscan.com
```

## Quick Commands

**Local Development:**
```bash
cd frontend
npm run dev
```

**Test Production Build:**
```bash
cd frontend
npm run build
npm start
```

**Update Deployment:**
```bash
git add .
git commit -m "Update frontend"
git push  # Auto-deploys to Render!
```

## Troubleshooting

### Build Fails
1. Check Render build logs
2. Test build locally: `npm run build`
3. Verify all dependencies in package.json
4. Check Node version compatibility

### Runtime Errors
1. Check Render logs tab
2. Verify environment variables
3. Check start command is correct
4. Test locally with `npm start`

### Wallet Won't Connect
1. Verify WalletConnect ID is set
2. Check BSC Testnet configuration
3. Verify contract addresses
4. Check browser console for errors

## Success Criteria

✅ Site loads without errors
✅ Wallet connection works
✅ Can create tokens
✅ Can trade tokens
✅ Mobile responsive
✅ Performance acceptable
✅ No console errors

## Next Steps After Deployment

1. **Share URL** with team for testing
2. **Monitor logs** for errors
3. **Gather feedback** from users
4. **Iterate** based on feedback
5. **Add features** from roadmap
6. **Upgrade plan** when ready for production

## Support

- **Render Docs**: https://render.com/docs
- **Render Status**: https://status.render.com
- **Community**: https://community.render.com

---

**Your WalletConnect Project ID**: `2365a77b538750a5741bacd4891ac5cf`
**Repository**: `pumpbnb` on Bitbucket
**Branch**: `main`
**Status**: Ready to deploy! 🚀

# PumpBNB Frontend - Quick Start Guide

## 🚀 Your Frontend is Ready!

The development server is **already running** at:
- **Local**: http://localhost:3000
- **Network**: http://10.211.1.6:3000

## What You Can Do Right Now

### 1. View the Application
Open your browser and navigate to **http://localhost:3000**

You should see:
- ✅ PumpBNB home page with hero section
- ✅ Navigation header with "Connect Wallet" button
- ✅ Feature cards
- ✅ Platform statistics

### 2. Connect Your Wallet

1. Click "Connect Wallet" in the top-right corner
2. Select MetaMask (or your preferred wallet)
3. **Important**: Make sure you're on BSC Testnet
   - Network Name: BSC Testnet
   - Chain ID: 97
   - RPC URL: https://data-seed-prebsc-1-s1.binance.org:8545

### 3. Get Testnet BNB

You'll need testnet BNB for gas fees:

1. Visit: https://testnet.bnbchain.org/faucet-smart
2. Enter your wallet address
3. Request testnet BNB (you'll get 0.5 tBNB)
4. Wait for confirmation (~3 seconds)

### 4. Get Testnet ASTER (for trading)

Since trading uses ASTER token, you'll need some:

**Option 1**: Use the Mock ASTER contract
- Contract: `0x311ECE533632bca662E100B8c4E0EB927EFE2588`
- This is a mock token for testing

**Option 2**: We'll add a faucet in the next update

### 5. Create Your First Token

1. Go to http://localhost:3000/create
2. Fill in the form:
   - **Name**: "My Awesome Token"
   - **Symbol**: "MAT"
   - **Metadata URI**: (optional, leave blank for now)
3. Click "Create Token (FREE)"
4. Confirm transaction in MetaMask
5. Wait for confirmation
6. Success! Your token is created

### 6. Browse Tokens

1. Go to http://localhost:3000/tokens
2. You'll see your newly created token
3. Click on it to view details

### 7. Trade Tokens

On the token detail page:
1. Click "Buy" or "Sell" tab
2. Enter amount
3. Click the button
4. Confirm transaction
5. Wait for confirmation

## File Structure

```
frontend/
├── app/                      # Pages
│   ├── page.tsx             # Home page
│   ├── create/page.tsx      # Create token
│   ├── tokens/page.tsx      # Browse tokens
│   └── token/[address]/     # Token detail
├── components/              # React components
│   ├── Header.tsx
│   ├── ConnectButton.tsx
│   └── Web3Provider.tsx
└── lib/                     # Config & utilities
    ├── contracts.ts         # Contract addresses
    ├── wagmi.ts            # Web3 config
    └── abis/               # Contract ABIs
```

## Common Commands

```bash
# Start dev server (already running!)
cd frontend && npm run dev

# Stop dev server
# Press Ctrl+C in the terminal

# Restart dev server
npm run dev

# Build for production
npm run build

# Run production build
npm run build && npm start

# Install dependencies (already done)
npm install
```

## Troubleshooting

### Wallet Won't Connect
- Make sure MetaMask is installed
- Try refreshing the page
- Check if you're on BSC Testnet

### Wrong Network
1. Open MetaMask
2. Click network dropdown
3. Add BSC Testnet manually:
   - Network Name: BSC Testnet
   - RPC URL: https://data-seed-prebsc-1-s1.binance.org:8545
   - Chain ID: 97
   - Currency Symbol: tBNB
   - Block Explorer: https://testnet.bscscan.com

### Transaction Fails
- Make sure you have enough testnet BNB
- Check gas price isn't too low
- Verify contract addresses are correct

### Page Not Loading
- Check if dev server is running
- Try clearing browser cache
- Delete `.next` folder and restart: `rm -rf .next && npm run dev`

## Next Steps

### Immediate Enhancements
1. Add real-time token discovery (event listeners)
2. Implement slippage protection
3. Add ASTER token faucet
4. Improve error handling
5. Add loading states

### Features to Add
1. **Charts**: Integrate TradingView for price charts
2. **Search**: Add token search and filtering
3. **Portfolio**: User portfolio view
4. **History**: Transaction history
5. **IPFS**: Metadata upload for token images

### Advanced Features
1. Analytics dashboard
2. Social features (comments, likes)
3. Advanced trading (limit orders, stop-loss)
4. Mobile app
5. Aster Protocol integration (100x leverage)

## Support

### Documentation
- Frontend README: `frontend/README.md`
- Main README: `README.md`
- Full setup guide: `FRONTEND_MVP_COMPLETE.md`

### Smart Contracts
- Deployment info: `deployments/bsc-testnet.json`
- Contract guide: `TESTNET_DEPLOYMENT_SUCCESS.md`

### BSC Testnet Links
- **Block Explorer**: https://testnet.bscscan.com
- **Faucet**: https://testnet.bnbchain.org/faucet-smart
- **TokenFactory**: https://testnet.bscscan.com/address/0x0d4D25e0239e689D7856c9760e74Ee12a2758866

## Development Tips

### Hot Reload
Any changes you make to files in `app/` or `components/` will automatically reload in the browser!

### TypeScript
The project uses TypeScript for type safety. Check `tsconfig.json` for configuration.

### Styling
Uses Tailwind CSS. Edit `tailwind.config.ts` to customize colors and themes.

### Web3 Calls
All Web3 interactions are in the page components using Wagmi hooks:
- `useAccount()` - Get wallet address
- `useReadContract()` - Read from contracts
- `useWriteContract()` - Write to contracts
- `useWaitForTransactionReceipt()` - Wait for confirmation

## Success! 🎉

You now have a fully functional meme coin launchpad frontend!

**What works:**
✅ Wallet connection
✅ Token creation
✅ Token browsing
✅ Trading (buy/sell)
✅ Real contract integration
✅ BSC Testnet deployment

**Have fun building! 🚀**

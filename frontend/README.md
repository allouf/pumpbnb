# PumpBNB Frontend

Next.js frontend for the PumpBNB meme coin launchpad on BNB Chain.

## Features

- 🎨 Modern UI with Tailwind CSS
- 🔗 Web3 integration with Wagmi & Viem
- 💰 Token creation interface (FREE - only gas costs)
- 📊 Trading interface with bonding curve
- 🔍 Token discovery and browsing
- 📱 Responsive mobile design

## Tech Stack

- **Framework**: Next.js 16 with App Router
- **Styling**: Tailwind CSS 3
- **Web3**: Wagmi v2, Viem v2
- **State Management**: TanStack Query
- **TypeScript**: Full type safety

## Getting Started

### Prerequisites

- Node.js 18+ installed
- MetaMask or compatible wallet
- BSC Testnet connection
- Testnet BNB for gas fees

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production

```bash
npm run build
npm start
```

## Smart Contract Integration

The frontend connects to deployed contracts on BSC Testnet:

- **TokenFactory**: `0x0d4D25e0239e689D7856c9760e74Ee12a2758866`
- **PlatformConfig**: `0x2FdB3697Bb6ef63F7c5dF5EAA9F78d4d2fa51479`
- **GraduationManager**: `0x459313EbBb829b0a39a71806C022F25891332E53`
- **Mock ASTER**: `0x311ECE533632bca662E100B8c4E0EB927EFE2588`

Contract addresses are configured in `lib/contracts.ts`.
ABIs are in `lib/abis/`.

## Project Structure

```
frontend/
├── app/                    # Next.js App Router
│   ├── page.tsx           # Home page
│   ├── create/            # Token creation page
│   ├── tokens/            # Token list page
│   └── token/[address]/   # Token detail & trading page
├── components/            # React components
│   ├── Header.tsx         # Navigation header
│   ├── ConnectButton.tsx  # Wallet connection
│   └── Web3Provider.tsx   # Web3 context provider
├── lib/                   # Utilities & config
│   ├── contracts.ts       # Contract addresses & constants
│   ├── wagmi.ts          # Wagmi configuration
│   └── abis/             # Contract ABIs
└── public/               # Static assets
```

## Key Pages

### Home (`/`)
- Hero section with platform features
- Statistics display
- Call-to-action buttons

### Create Token (`/create`)
- Token creation form
- Name, symbol, metadata URI inputs
- Distribution details
- Transaction status tracking

### Browse Tokens (`/tokens`)
- List of all created tokens
- Progress bars showing graduation status
- Filter and search (coming soon)

### Token Detail (`/token/[address]`)
- Token information
- Price chart (coming soon)
- Buy/sell trading interface
- Progress to PancakeSwap graduation

## Environment Setup

Create a `.env.local` file (optional):

```env
# WalletConnect Project ID (optional)
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id_here
```

Get a WalletConnect project ID from [cloud.walletconnect.com](https://cloud.walletconnect.com)

## Using the App

### Connect Wallet
1. Click "Connect Wallet" in the header
2. Select MetaMask or another wallet
3. Make sure you're on BSC Testnet (Chain ID: 97)

### Create a Token
1. Go to `/create`
2. Fill in token name and symbol
3. (Optional) Add metadata URI
4. Click "Create Token (FREE)"
5. Confirm transaction in wallet

### Trade Tokens
1. Browse tokens at `/tokens`
2. Click on a token to view details
3. Use the buy/sell interface
4. Enter amount and confirm transaction

## Next Steps

### Phase 1 (Current)
- ✅ Basic UI and navigation
- ✅ Token creation interface
- ✅ Trading interface
- ⏳ Real-time data fetching
- ⏳ Transaction event listening

### Phase 2
- ⏳ Price charts (TradingView integration)
- ⏳ Token search and filtering
- ⏳ User portfolio view
- ⏳ Transaction history

### Phase 3
- ⏳ IPFS metadata upload
- ⏳ Token image preview
- ⏳ Social features (comments, likes)
- ⏳ Advanced trading features

### Phase 4
- ⏳ Mobile app (React Native)
- ⏳ Analytics dashboard
- ⏳ Aster Protocol integration
- ⏳ 100x leverage trading

## Troubleshooting

### Wallet Not Connecting
- Make sure you're on BSC Testnet (Chain ID: 97)
- Try refreshing the page
- Clear browser cache

### Transactions Failing
- Check you have enough testnet BNB for gas
- Verify contract addresses are correct
- Check transaction on [BSCScan Testnet](https://testnet.bscscan.com)

### Page Not Loading
- Check if dev server is running (`npm run dev`)
- Clear Next.js cache: `rm -rf .next`
- Reinstall dependencies: `npm install`

## Contributing

This is part of the PumpBNB project. See main README for contribution guidelines.

## License

MIT

# Frontend Development Plan - PumpBNB

**Status**: Ready to Start
**Timeline**: 3-4 weeks for MVP
**Tech Stack**: Next.js 14 + TypeScript + Wagmi + Viem

---

## 🎯 Overview

Build a production-ready frontend that connects to our **live BSC Testnet deployment** for immediate testing and validation.

**Live Contracts (BSC Testnet)**:
- TokenFactory: `0x0d4D25e0239e689D7856c9760e74Ee12a2758866`
- Mock ASTER: `0x311ECE533632bca662E100B8c4E0EB927EFE2588`
- PlatformConfig: `0x2FdB3697Bb6ef63F7c5dF5EAA9F78d4d2fa51479`
- GraduationManager: `0x459313EbBb829b0a39a71806C022F25891332E53`

---

## 📦 Phase 1: Project Setup (Week 1, Days 1-2)

### 1.1 Initialize Next.js Project

```bash
# Create new Next.js app
npx create-next-app@latest pumpbnb-frontend --typescript --tailwind --app --src-dir

cd pumpbnb-frontend

# Install core dependencies
npm install wagmi viem@2.x @tanstack/react-query
npm install @rainbow-me/rainbowkit

# Install UI components
npm install @headlessui/react @heroicons/react
npm install clsx tailwind-merge

# Install state management
npm install zustand

# Install utilities
npm install date-fns
npm install react-hot-toast

# Install development tools
npm install -D @types/node
```

### 1.2 Project Structure

```
pumpbnb-frontend/
├── src/
│   ├── app/                    # Next.js 14 App Router
│   │   ├── layout.tsx          # Root layout with providers
│   │   ├── page.tsx            # Home page
│   │   ├── create/
│   │   │   └── page.tsx        # Token creation
│   │   ├── token/
│   │   │   └── [address]/
│   │   │       └── page.tsx    # Token detail/trading
│   │   └── portfolio/
│   │       └── page.tsx        # User portfolio
│   ├── components/             # React components
│   │   ├── layout/
│   │   │   ├── Header.tsx
│   │   │   ├── Footer.tsx
│   │   │   └── ConnectButton.tsx
│   │   ├── token/
│   │   │   ├── TokenCard.tsx
│   │   │   ├── TokenList.tsx
│   │   │   ├── CreateTokenForm.tsx
│   │   │   └── TradingInterface.tsx
│   │   └── common/
│   │       ├── Button.tsx
│   │       ├── Input.tsx
│   │       └── Card.tsx
│   ├── hooks/                  # Custom React hooks
│   │   ├── useTokenFactory.ts
│   │   ├── useBondingCurve.ts
│   │   ├── useAsterToken.ts
│   │   └── useTokenList.ts
│   ├── lib/                    # Utilities
│   │   ├── contracts.ts        # Contract addresses/ABIs
│   │   ├── wagmi.ts            # Wagmi config
│   │   └── utils.ts            # Helper functions
│   ├── stores/                 # Zustand stores
│   │   └── tokenStore.ts
│   └── types/                  # TypeScript types
│       └── token.ts
├── public/                     # Static assets
├── .env.local                  # Environment variables
└── package.json
```

### 1.3 Environment Configuration

Create `.env.local`:

```env
# BSC Testnet RPC
NEXT_PUBLIC_BSC_TESTNET_RPC=https://data-seed-prebsc-1-s1.binance.org:8545/

# Contract Addresses (BSC Testnet)
NEXT_PUBLIC_TOKEN_FACTORY=0x0d4D25e0239e689D7856c9760e74Ee12a2758866
NEXT_PUBLIC_MOCK_ASTER=0x311ECE533632bca662E100B8c4E0EB927EFE2588
NEXT_PUBLIC_PLATFORM_CONFIG=0x2FdB3697Bb6ef63F7c5dF5EAA9F78d4d2fa51479
NEXT_PUBLIC_GRADUATION_MANAGER=0x459313EbBb829b0a39a71806C022F25891332E53

# Network
NEXT_PUBLIC_CHAIN_ID=97
NEXT_PUBLIC_NETWORK_NAME=BSC Testnet

# Optional: Analytics, etc
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id_here
```

---

## 🔧 Phase 2: Core Infrastructure (Week 1, Days 3-5)

### 2.1 Wagmi Configuration

Create `src/lib/wagmi.ts`:

```typescript
import { http, createConfig } from 'wagmi'
import { bscTestnet } from 'wagmi/chains'
import { injected, walletConnect } from 'wagmi/connectors'

export const config = createConfig({
  chains: [bscTestnet],
  connectors: [
    injected(),
    walletConnect({
      projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID!,
    }),
  ],
  transports: {
    [bscTestnet.id]: http(process.env.NEXT_PUBLIC_BSC_TESTNET_RPC),
  },
})
```

### 2.2 Contract Configuration

Create `src/lib/contracts.ts`:

```typescript
// Contract addresses
export const CONTRACTS = {
  TokenFactory: '0x0d4D25e0239e689D7856c9760e74Ee12a2758866',
  MockASTER: '0x311ECE533632bca662E100B8c4E0EB927EFE2588',
  PlatformConfig: '0x2FdB3697Bb6ef63F7c5dF5EAA9F78d4d2fa51479',
  GraduationManager: '0x459313EbBb829b0a39a71806C022F25891332E53',
} as const

// ABIs (copy from typechain-types or artifacts)
export const TOKEN_FACTORY_ABI = [
  // Add ABI from artifacts/contracts/TokenFactory.sol/TokenFactory.json
] as const

export const BONDING_CURVE_ABI = [
  // Add ABI from artifacts/contracts/BondingCurve.sol/BondingCurve.json
] as const

export const ASTER_ABI = [
  // Standard ERC20 ABI
  'function balanceOf(address) view returns (uint256)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
] as const
```

### 2.3 Custom Hooks

Create `src/hooks/useTokenFactory.ts`:

```typescript
import { useWriteContract, useReadContract } from 'wagmi'
import { CONTRACTS, TOKEN_FACTORY_ABI } from '@/lib/contracts'

export function useTokenFactory() {
  const { writeContract } = useWriteContract()

  const createToken = async (
    name: string,
    symbol: string,
    metadataURI: string
  ) => {
    return writeContract({
      address: CONTRACTS.TokenFactory,
      abi: TOKEN_FACTORY_ABI,
      functionName: 'createToken',
      args: [name, symbol, metadataURI],
    })
  }

  const { data: allTokens } = useReadContract({
    address: CONTRACTS.TokenFactory,
    abi: TOKEN_FACTORY_ABI,
    functionName: 'getAllTokens',
    args: [0, 100], // offset, limit
  })

  return {
    createToken,
    allTokens,
  }
}
```

---

## 🎨 Phase 3: Core Pages (Week 2)

### 3.1 Home Page

**Features**:
- Hero section with platform intro
- Featured/trending tokens
- "Create Token" CTA button
- Recent tokens list
- Platform stats (total tokens, volume, etc.)

**File**: `src/app/page.tsx`

### 3.2 Create Token Page

**Features**:
- Form inputs (name, symbol, description)
- Image upload to IPFS
- Preview card
- Transaction status
- Success modal with token link

**File**: `src/app/create/page.tsx`

**Flow**:
1. User fills form
2. Upload metadata to IPFS
3. Call `TokenFactory.createToken()`
4. Show transaction status
5. Redirect to token page on success

### 3.3 Token Detail/Trading Page

**Features**:
- Token info (name, symbol, description, image)
- Current price and market cap
- Buy/Sell interface
- Transaction history
- Bonding curve progress bar
- Creator info

**File**: `src/app/token/[address]/page.tsx`

**Components**:
- TokenInfo card
- PriceChart (simple line chart)
- TradingInterface (buy/sell tabs)
- TransactionHistory table

### 3.4 Portfolio Page

**Features**:
- Connected wallet's tokens
- Holdings value
- Created tokens
- Transaction history

**File**: `src/app/portfolio/page.tsx`

---

## 🧩 Phase 4: Key Components (Week 3)

### 4.1 Connect Wallet Button

```typescript
// src/components/layout/ConnectButton.tsx
import { useAccount, useConnect, useDisconnect } from 'wagmi'

export function ConnectButton() {
  const { address, isConnected } = useAccount()
  const { connect, connectors } = useConnect()
  const { disconnect } = useDisconnect()

  if (isConnected) {
    return (
      <button onClick={() => disconnect()}>
        {address?.slice(0, 6)}...{address?.slice(-4)}
      </button>
    )
  }

  return (
    <button onClick={() => connect({ connector: connectors[0] })}>
      Connect Wallet
    </button>
  )
}
```

### 4.2 Create Token Form

```typescript
// src/components/token/CreateTokenForm.tsx
export function CreateTokenForm() {
  const [name, setName] = useState('')
  const [symbol, setSymbol] = useState('')
  const [description, setDescription] = useState('')
  const [image, setImage] = useState<File | null>(null)

  const { createToken } = useTokenFactory()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // 1. Upload to IPFS
    const metadataURI = await uploadToIPFS({
      name,
      symbol,
      description,
      image,
    })

    // 2. Create token
    await createToken(name, symbol, metadataURI)
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
    </form>
  )
}
```

### 4.3 Trading Interface

```typescript
// src/components/token/TradingInterface.tsx
export function TradingInterface({ tokenAddress }: { tokenAddress: string }) {
  const [amount, setAmount] = useState('')
  const [isBuying, setIsBuying] = useState(true)

  const { buyTokens, sellTokens } = useBondingCurve(tokenAddress)

  const handleTrade = async () => {
    if (isBuying) {
      await buyTokens(parseEther(amount))
    } else {
      await sellTokens(parseEther(amount))
    }
  }

  return (
    <div>
      <div className="tabs">
        <button onClick={() => setIsBuying(true)}>Buy</button>
        <button onClick={() => setIsBuying(false)}>Sell</button>
      </div>

      <input
        type="number"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder={isBuying ? "Amount in ASTER" : "Amount in tokens"}
      />

      <button onClick={handleTrade}>
        {isBuying ? 'Buy' : 'Sell'}
      </button>
    </div>
  )
}
```

---

## 🚀 Phase 5: Integration & Testing (Week 4)

### 5.1 Contract Integration Checklist

- [ ] Connect to BSC Testnet
- [ ] Read token list from TokenFactory
- [ ] Create new tokens
- [ ] Get ASTER balance
- [ ] Approve ASTER spending
- [ ] Buy tokens on bonding curve
- [ ] Sell tokens on bonding curve
- [ ] Display transaction history
- [ ] Handle transaction errors

### 5.2 Testing Scenarios

**Wallet Connection**:
- [ ] Connect MetaMask
- [ ] Connect WalletConnect
- [ ] Disconnect wallet
- [ ] Switch networks
- [ ] Handle wrong network

**Token Creation**:
- [ ] Create token with all fields
- [ ] Upload image to IPFS
- [ ] Handle creation errors
- [ ] Show transaction status
- [ ] Redirect to token page

**Trading**:
- [ ] Get Mock ASTER from contract
- [ ] Approve ASTER spending
- [ ] Buy tokens
- [ ] Sell tokens
- [ ] Handle insufficient balance
- [ ] Show slippage warnings

### 5.3 Error Handling

```typescript
// Common errors to handle
- User rejected transaction
- Insufficient balance
- Network error
- Contract revert
- IPFS upload failed
- RPC timeout
```

---

## 📱 Phase 6: Polish & Deploy (Week 4)

### 6.1 UI/UX Polish

- [ ] Loading states for all async operations
- [ ] Success/error toasts
- [ ] Skeleton loaders
- [ ] Responsive design (mobile, tablet, desktop)
- [ ] Dark mode (optional)
- [ ] Animations and transitions

### 6.2 Performance Optimization

- [ ] Image optimization (Next.js Image)
- [ ] Code splitting
- [ ] Lazy loading
- [ ] Caching with React Query
- [ ] Debounce user inputs

### 6.3 Deployment

**Option 1: Vercel** (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

**Option 2: Netlify**
```bash
# Build
npm run build

# Deploy on Netlify dashboard
```

**Environment Variables** (set in deployment):
- `NEXT_PUBLIC_BSC_TESTNET_RPC`
- `NEXT_PUBLIC_TOKEN_FACTORY`
- `NEXT_PUBLIC_MOCK_ASTER`
- etc.

---

## 🛠️ Development Commands

```bash
# Development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Type checking
npm run type-check

# Linting
npm run lint
```

---

## 📚 Key Resources

**Documentation**:
- Wagmi: https://wagmi.sh/
- Viem: https://viem.sh/
- RainbowKit: https://www.rainbowkit.com/
- Next.js 14: https://nextjs.org/docs

**Contract ABIs**:
- Location: `../typechain-types/` (from Hardhat project)
- Copy ABIs to frontend `src/lib/contracts.ts`

**Testnet Resources**:
- BSCScan Testnet: https://testnet.bscscan.com
- BSC Testnet Faucet: https://testnet.bnbchain.org/faucet-smart
- Contract Addresses: See `../TESTNET_DEPLOYMENT_SUCCESS.md`

---

## 🎯 MVP Feature Checklist

**Must Have** (Week 1-3):
- [ ] Wallet connection (MetaMask)
- [ ] Token list display
- [ ] Create token form
- [ ] Basic trading interface (buy/sell)
- [ ] Transaction status feedback

**Nice to Have** (Week 4):
- [ ] Portfolio page
- [ ] Price charts
- [ ] Token search
- [ ] Transaction history
- [ ] Dark mode

**Future** (Post-MVP):
- [ ] Advanced charts (TradingView)
- [ ] Social features (comments)
- [ ] Notifications
- [ ] Mobile app
- [ ] Analytics dashboard

---

## 💰 Budget Estimate

**If hiring developer**:
- Week 1 (Setup): $2,000 - $3,000
- Week 2 (Core Pages): $3,000 - $5,000
- Week 3 (Components): $3,000 - $5,000
- Week 4 (Polish): $2,000 - $3,000
- **Total**: $10,000 - $16,000

**If building yourself**:
- Time: 3-4 weeks full-time
- Cost: $0 (your time)

---

## 🚀 Quick Start (Right Now!)

```bash
# 1. Create Next.js app
npx create-next-app@latest pumpbnb-frontend --typescript --tailwind --app

# 2. Install Web3 dependencies
cd pumpbnb-frontend
npm install wagmi viem @tanstack/react-query @rainbow-me/rainbowkit

# 3. Copy contract ABIs from Hardhat project
# From: ../typechain-types/
# To: ./src/lib/contracts.ts

# 4. Configure environment
cp .env.example .env.local
# Edit .env.local with contract addresses

# 5. Start development
npm run dev
```

**Open**: http://localhost:3000

---

## ✅ Success Criteria

**Week 1**: Basic app running with wallet connection
**Week 2**: Can create tokens on testnet
**Week 3**: Can trade tokens on bonding curve
**Week 4**: Polished MVP ready for beta users

**Ready to ship when**:
- ✅ All core features work
- ✅ No critical bugs
- ✅ Responsive on mobile
- ✅ Tested on testnet
- ✅ Good UX/UI

---

## 🎯 Next Action

**Start NOW with**:
```bash
npx create-next-app@latest pumpbnb-frontend --typescript --tailwind --app
```

Then follow Phase 1 above!

**Questions while building?**
- Contract ABIs: Check `../artifacts/contracts/`
- Contract addresses: See `../TESTNET_DEPLOYMENT_SUCCESS.md`
- Examples: Reference Wagmi/Viem docs

🚀 **Let's build the UI and connect to our live testnet contracts!**

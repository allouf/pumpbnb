# 🔄 Frontend Migration Guide: From Hardcoded to Dynamic Config

## 📋 Overview

This guide explains how to migrate the frontend from hardcoded contract addresses to dynamic configuration fetched from the backend API.

---

## ✅ What's Already Done

### Backend Changes:
1. ✅ Created `/api/config` endpoint (`backend/src/routes/config.routes.ts`)
2. ✅ Added route to `backend/src/app.ts`
3. ✅ Backend provides all contract addresses, fees, and configuration

### Frontend Utilities:
1. ✅ Created `frontend/lib/config.ts` - Config fetching utility
2. ✅ Created `frontend/lib/hooks/useConfig.ts` - React hook for components

---

## 🎯 Migration Steps

### Step 1: Update Components to Use Dynamic Config

#### Before (Hardcoded):
```typescript
// ❌ OLD WAY - Hardcoded addresses
import { CONTRACTS } from '@/lib/contracts'

export default function CreateTokenPage() {
  const { writeContract } = useWriteContract()

  const handleCreate = async () => {
    await writeContract({
      address: CONTRACTS.TokenFactory as `0x${string}`,
      abi: TokenFactoryABI,
      functionName: 'createToken',
      args: [name, symbol, metadataURI],
    })
  }
}
```

#### After (Dynamic):
```typescript
// ✅ NEW WAY - Dynamic config from backend
import { useConfig } from '@/lib/hooks/useConfig'

export default function CreateTokenPage() {
  const { contracts, isLoading: configLoading } = useConfig()
  const { writeContract } = useWriteContract()

  // Show loading while config loads
  if (configLoading || !contracts) {
    return <div>Loading configuration...</div>
  }

  const handleCreate = async () => {
    await writeContract({
      address: contracts.tokenFactory as `0x${string}`,
      abi: TokenFactoryABI,
      functionName: 'createToken',
      args: [name, symbol, metadataURI],
    })
  }
}
```

---

### Step 2: Update Each Page/Component

#### Files to Update:

1. **`frontend/app/create/page.tsx`** - Token creation page
   - Replace `CONTRACTS.TokenFactory` with `contracts.tokenFactory`

2. **`frontend/app/tokens/[address]/page.tsx`** - Token detail/trading page
   - Replace `CONTRACTS.MockASTER` with `contracts.asterToken`
   - Replace bonding curve address with dynamic fetch

3. **`frontend/components/TokenCard.tsx`** - Token card component (if exists)
   - Use dynamic config for displaying token info

4. **`frontend/lib/hooks/useTokenList.ts`** - Already uses API ✅
   - No changes needed (already fetching from backend)

5. **`frontend/lib/hooks/useUserPortfolio.ts`** - Already uses API ✅
   - No changes needed (already fetching from backend)

---

### Step 3: Create Config Provider (Optional but Recommended)

Create `frontend/contexts/ConfigContext.tsx`:

```typescript
'use client'

import { createContext, useContext, ReactNode } from 'react'
import { useConfig } from '@/lib/hooks/useConfig'
import { PlatformConfig } from '@/lib/config'

interface ConfigContextValue {
  config: PlatformConfig | null
  isLoading: boolean
  error: Error | null
  contracts: PlatformConfig['contracts'] | null
  chainId: number | null
}

const ConfigContext = createContext<ConfigContextValue>({
  config: null,
  isLoading: true,
  error: null,
  contracts: null,
  chainId: null,
})

export function ConfigProvider({ children }: { children: ReactNode }) {
  const configData = useConfig()

  return (
    <ConfigContext.Provider value={configData}>
      {children}
    </ConfigContext.Provider>
  )
}

export function useConfigContext() {
  return useContext(ConfigContext)
}
```

Then wrap your app in `frontend/app/layout.tsx`:

```typescript
import { ConfigProvider } from '@/contexts/ConfigContext'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <ConfigProvider>
          {children}
        </ConfigProvider>
      </body>
    </html>
  )
}
```

Now all components can use:
```typescript
const { contracts, isLoading } = useConfigContext()
```

---

### Step 4: Remove Hardcoded Addresses from .env

#### Current `.env.local`:
```env
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=2365a77b538750a5741bacd4891ac5cf
NEXT_PUBLIC_API_URL=https://pumpbnb-backend.onrender.com
NEXT_PUBLIC_CHAIN_ID=97
NEXT_PUBLIC_NETWORK_NAME=BSC Testnet
NEXT_PUBLIC_TOKEN_FACTORY=0x1c3a8Afb7DCA2479c7bC9546e54d6B5d01005d10
NEXT_PUBLIC_PLATFORM_CONFIG=0xE98D020690F715EDb2dc1b48C4cfd678c9e2a3B5
NEXT_PUBLIC_GRADUATION_MANAGER=0x9aAF1512b9d74CdEb076F9b9756DA5588b7c0ED5
NEXT_PUBLIC_MOCK_ASTER=0xB1c4267412EAc792973261CC450ce7902b33a42D
NEXT_PUBLIC_SAMPLE_TOKEN=0x301F75A5B8DD75dA71a331CE36d752A1bFfc0723
```

#### After Migration:
```env
# WalletConnect (optional)
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=2365a77b538750a5741bacd4891ac5cf

# Backend API URL (ONLY env var needed!)
NEXT_PUBLIC_API_URL=https://pumpbnb-backend.onrender.com

# Everything else comes from /api/config endpoint!
```

---

## 🧪 Testing the Migration

### Test 1: Config Endpoint
```bash
curl https://pumpbnb-backend.onrender.com/api/config

# Should return:
{
  "success": true,
  "data": {
    "chainId": 97,
    "networkName": "BSC Testnet",
    "contracts": {
      "tokenFactory": "0x1c3a8Afb7DCA2479c7bC9546e54d6B5d01005d10",
      ...
    },
    ...
  }
}
```

### Test 2: Frontend Config Hook
Add this temporary test component:

```typescript
'use client'

import { useConfig } from '@/lib/hooks/useConfig'

export default function ConfigTest() {
  const { config, isLoading, error } = useConfig()

  if (isLoading) return <div>Loading config...</div>
  if (error) return <div>Error: {error.message}</div>

  return (
    <div>
      <h2>Configuration Loaded:</h2>
      <pre>{JSON.stringify(config, null, 2)}</pre>
    </div>
  )
}
```

### Test 3: Token Creation with Dynamic Config
1. Open `/create` page
2. Fill form
3. Create token
4. Verify transaction uses correct TokenFactory address from backend

---

## 📊 Benefits of Dynamic Config

### 1. Single Source of Truth
- Contract addresses only in backend `.env`
- Frontend automatically stays in sync
- No manual updates needed

### 2. Easy Network Switching
Backend controls network via `CHAIN_ID`:
```env
# Testnet
CHAIN_ID=97

# Mainnet (when ready)
CHAIN_ID=56
```
Frontend adapts automatically!

### 3. Hot Updates
- Update contract address on backend
- Redeploy backend
- Frontend picks up new address within 5 minutes (cache TTL)
- No frontend rebuild needed

### 4. Multiple Frontends
- Web app
- Mobile app
- Admin panel
- All use same config endpoint
- Guaranteed consistency

### 5. Environment-Specific Configs
Backend can return different configs based on:
- Network (testnet/mainnet)
- Environment (dev/staging/prod)
- User permissions
- Feature flags

---

## 🚨 Important Notes

### Cache Management
Config is cached for 5 minutes to reduce API calls. To force refresh:
```typescript
import { refreshConfig } from '@/lib/config'

// Force refresh (ignores cache)
const freshConfig = await refreshConfig()
```

### Error Handling
Always handle config loading errors:
```typescript
const { config, isLoading, error } = useConfig()

if (error) {
  return (
    <div className="error">
      Failed to load configuration. Please refresh the page.
      <button onClick={() => window.location.reload()}>Refresh</button>
    </div>
  )
}
```

### Loading States
Show loading UI while config loads:
```typescript
if (isLoading || !contracts) {
  return <LoadingSpinner />
}
```

---

## 📝 Migration Checklist

### Backend (URGENT - Do First):
- [x] Create `/api/config` endpoint
- [x] Add route to `app.ts`
- [ ] Update Render start command to `npm run start:migrate`
- [ ] Redeploy backend
- [ ] Test `/api/config` endpoint

### Frontend (After Backend is Fixed):
- [x] Create `lib/config.ts` utility
- [x] Create `lib/hooks/useConfig.ts` hook
- [ ] Update `app/create/page.tsx`
- [ ] Update token trading pages
- [ ] Create `ConfigProvider` context (optional)
- [ ] Test all pages work with dynamic config
- [ ] Remove contract addresses from `.env.local`
- [ ] Update `.env.example`

### Documentation:
- [x] Create migration guide (this file)
- [ ] Update README with new architecture
- [ ] Document config caching behavior

---

## 🎯 Next Steps

### 1. Fix Backend Database (URGENT)
```
Go to Render Dashboard
→ pumpbnb-backend
→ Settings
→ Start Command: npm run start:migrate
→ Save
→ Manual Deploy
```

### 2. Test Backend Config Endpoint
```bash
curl https://pumpbnb-backend.onrender.com/api/config
```

### 3. Update Frontend Components
Start with `create/page.tsx` as a test case.

### 4. Deploy Frontend to Render
Update environment variables to remove contract addresses.

---

## 🔗 Related Files

- Backend config endpoint: `backend/src/routes/config.routes.ts`
- Frontend config utility: `frontend/lib/config.ts`
- Frontend config hook: `frontend/lib/hooks/useConfig.ts`
- Migration guide: This file

---

**Created**: October 30, 2025
**Status**: Backend ready, frontend migration in progress
**Priority**: HIGH - Do database fix first, then migrate frontend

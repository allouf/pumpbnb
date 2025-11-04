# Frontend Restructure Plan: Pump.fun Layout Migration

**Project**: BNB PumpFun  
**Goal**: Transform current frontend from landing page + top nav to Pump.fun-style sidebar + token feed layout  
**Reference**: `pumpbnb-ui` mock design + Pump.fun live platform  
**Timeline**: Estimated 2-3 weeks  

---

## 📋 Overview

### Current State (Frontend)
- ❌ Top navigation bar with horizontal links
- ❌ Home page is static hero/landing page
- ❌ Tokens displayed only on `/tokens` route
- ✅ Web3 integration working (wagmi, RainbowKit)
- ✅ Token creation flow functional
- ✅ Individual token pages working

### Target State (Based on pumpbnb-ui Mock + Pump.fun)
- ✅ Left sidebar navigation (collapsible)
- ✅ Home page shows live token feed directly
- ✅ "Now Trending" horizontal scroll section
- ✅ "All Tokens" grid/list view with filters
- ✅ Search bar in header
- ✅ Mobile bottom navigation
- ✅ View mode toggle (grid/list)
- ✅ Advanced filters (Featured, NSFW, Animations)

---

## 🎯 Phase 1: Foundation Setup (Days 1-3)

### 1.1 Install Dependencies
```bash
cd frontend
npm install @heroicons/react
```

**Required packages to verify:**
- ✅ @heroicons/react (for sidebar icons)
- ✅ wagmi & viem (already installed)
- ✅ @rainbow-me/rainbowkit (already installed)
- ✅ zustand (already installed - for state management)

### 1.2 Create Layout Directory Structure
```
frontend/
  components/
    layout/
      Sidebar.tsx          (from pumpbnb-ui)
      MainLayout.tsx       (from pumpbnb-ui)
      MobileBottomNav.tsx  (from pumpbnb-ui)
      Header.tsx           (modified version for search)
```

### 1.3 Update Global Styles

**File**: `frontend/app/globals.css`

Add from pumpbnb-ui:
```css
:root {
  --primary-green: #00D4AA;
  --primary-red: #FF6B6B;
  --background-card: #1A1A1A;
  --background-sidebar: #111111;
  --text-secondary: #A0A0A0;
  --border-color: #2A2A2A;
}

/* Scrollbar hide utility */
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.scrollbar-hide::-webkit-scrollbar {
  display: none;
}

/* Shimmer animation for graduation bars */
@keyframes pulse-green {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

.animate-pulse-green {
  animation: pulse-green 2s ease-in-out infinite;
}
```

### 1.4 Update Tailwind Config

**File**: `frontend/tailwind.config.ts`

```typescript
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          green: '#00D4AA',
          red: '#FF6B6B',
          yellow: '#FFD93D',
        },
        background: {
          dark: '#0A0A0A',
          card: '#1A1A1A',
          sidebar: '#111111',
          light: '#2A2A2A',
        },
        text: {
          primary: '#FFFFFF',
          secondary: '#A0A0A0',
          muted: '#666666',
        },
        border: {
          DEFAULT: '#2A2A2A',
          light: '#3A3A3A',
        },
        accent: {
          blue: '#6366F1',
          purple: '#A855F7',
        },
      },
    },
  },
}
```

---

## 🏗️ Phase 2: Layout Migration (Days 4-6)

### 2.1 Copy and Adapt Sidebar Component

**Source**: `pumpbnb-ui/src/components/layout/Sidebar.tsx`  
**Target**: `frontend/components/layout/Sidebar.tsx`

**Modifications needed:**
1. ✅ Keep navigation structure
2. ✅ Update routes to match existing frontend routes:
   - Home: `/`
   - Create: `/create`
   - Tokens: `/tokens` (or remove if home is now the feed)
   - Portfolio: `/portfolio`
   - Dashboard: `/dashboard`
   - History: `/history`
3. ✅ Integrate RainbowKit ConnectButton in header area
4. ✅ Keep "Create coin" button at bottom
5. ✅ Keep collapsible functionality

**Navigation items to use:**
```typescript
const navigation = [
  { name: 'Home', href: '/', icon: HomeIcon },
  { name: 'Create', href: '/create', icon: PlusIcon },
  { name: 'Portfolio', href: '/portfolio', icon: ChartBarIcon },
  { name: 'Dashboard', href: '/dashboard', icon: ChartBarIcon },
  { name: 'History', href: '/history', icon: ClockIcon },
  { name: 'Profile', href: '/profile', icon: UserIcon },
]
```

### 2.2 Create MainLayout Component

**Source**: `pumpbnb-ui/src/components/layout/MainLayout.tsx`  
**Target**: `frontend/components/layout/MainLayout.tsx`

**Structure:**
```tsx
'use client'

import { Sidebar } from './Sidebar'
import { MobileBottomNav } from './MobileBottomNav'
import { useState } from 'react'

export function MainLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  
  return (
    <div className="min-h-screen bg-background-dark">
      <div className="flex">
        {/* Desktop Sidebar */}
        <div className="hidden md:block">
          <Sidebar 
            isCollapsed={isSidebarCollapsed}
            onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          />
        </div>
        
        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {/* Optional: Top search bar */}
          <div className="sticky top-0 z-50 bg-background-dark/95 backdrop-blur-sm border-b border-border">
            {/* Search component here */}
          </div>
          
          <main className="min-h-screen p-4 md:p-6">
            {children}
          </main>
        </div>
      </div>
      
      {/* Mobile Bottom Nav */}
      <MobileBottomNav />
    </div>
  )
}
```

### 2.3 Update Root Layout

**File**: `frontend/app/layout.tsx`

**Before:**
```tsx
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Web3Provider>
          <ToastProvider />
          <Header />
          {children}
        </Web3Provider>
      </body>
    </html>
  )
}
```

**After:**
```tsx
import { MainLayout } from '@/components/layout/MainLayout'

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Web3Provider>
          <ToastProvider />
          <MainLayout>
            {children}
          </MainLayout>
        </Web3Provider>
      </body>
    </html>
  )
}
```

### 2.4 Create Mobile Bottom Navigation

**Source**: `pumpbnb-ui/src/components/layout/MobileBottomNav.tsx`  
**Target**: `frontend/components/layout/MobileBottomNav.tsx`

Update routes to match frontend structure.

---

## 🎨 Phase 3: Token Display Components (Days 7-9)

### 3.1 Create Enhanced TokenCard Component

**Source**: `pumpbnb-ui/src/components/token/TokenCard.tsx`  
**Target**: `frontend/components/TokenCard.tsx`

**Key modifications:**
```tsx
'use client'

import { useReadContract } from 'wagmi'
import { formatUnits } from 'viem'
import BondingCurveABI from '@/lib/abis/BondingCurve.json'

interface TokenCardProps {
  token: {
    address: string
    bondingCurve: string
    name: string
    symbol: string
    creator: string
    imageUrl?: string
    description?: string
    timestamp: number
  }
  compact?: boolean
}

export function TokenCard({ token, compact }: TokenCardProps) {
  // Fetch real bonding curve data
  const { data: reserves } = useReadContract({
    address: token.bondingCurve as `0x${string}`,
    abi: BondingCurveABI.abi,
    functionName: 'getReserves',
  })
  
  const asterReserves = reserves ? reserves[0] : BigInt(0)
  const asterAmount = Number(formatUnits(asterReserves, 18))
  const progress = asterAmount // Out of 100 ASTER
  const marketCap = asterAmount.toFixed(2)
  
  return (
    <Link href={`/token/${token.address}`} className="...">
      {/* Token info, progress bar, etc. */}
    </Link>
  )
}
```

### 3.2 Create TrendingSection Component

**File**: `frontend/components/TrendingSection.tsx`

```tsx
'use client'

import { useRef } from 'react'
import { TokenCard } from './TokenCard'
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline'

export function TrendingSection({ tokens }: { tokens: any[] }) {
  const scrollRef = useRef<HTMLDivElement>(null)
  
  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return
    const scrollAmount = 320
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth'
    })
  }
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Now trending</h2>
        <div className="flex gap-2">
          <button onClick={() => scroll('left')}>
            <ChevronLeftIcon className="w-5 h-5" />
          </button>
          <button onClick={() => scroll('right')}>
            <ChevronRightIcon className="w-5 h-5" />
          </button>
        </div>
      </div>
      
      <div ref={scrollRef} className="flex gap-4 overflow-x-auto scrollbar-hide">
        {tokens.map(token => (
          <div key={token.address} className="min-w-[300px]">
            <TokenCard token={token} compact />
          </div>
        ))}
      </div>
    </div>
  )
}
```

### 3.3 Create FilterBar Component

**File**: `frontend/components/FilterBar.tsx`

```tsx
'use client'

import { useState } from 'react'
import { Squares2X2Icon, ListBulletIcon, FunnelIcon } from '@heroicons/react/24/outline'

export function FilterBar({ onFilterChange, onViewModeChange }) {
  const [activeTab, setActiveTab] = useState('featured')
  const [viewMode, setViewMode] = useState('grid')
  const [showNsfw, setShowNsfw] = useState(false)
  const [showAnimations, setShowAnimations] = useState(false)
  
  return (
    <div className="flex items-center justify-between gap-4">
      {/* Filter tabs */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setActiveTab('featured')}
          className={activeTab === 'featured' ? 'bg-primary-green' : ''}
        >
          Featured 🔥
        </button>
        
        {/* NSFW Toggle */}
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setShowNsfw(!showNsfw)}
            className={`w-10 h-6 rounded-full ${showNsfw ? 'bg-primary-green' : 'bg-gray-600'}`}
          >
            <div className={`w-4 h-4 bg-white rounded-full transition-transform ${showNsfw ? 'translate-x-5' : 'translate-x-1'}`} />
          </button>
          <span>Nsfw</span>
        </div>
        
        {/* Animations Toggle */}
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setShowAnimations(!showAnimations)}
            className={`w-10 h-6 rounded-full ${showAnimations ? 'bg-primary-green' : 'bg-gray-600'}`}
          >
            <div className={`w-4 h-4 bg-white rounded-full transition-transform ${showAnimations ? 'translate-x-5' : 'translate-x-1'}`} />
          </button>
          <span>Animations</span>
        </div>
      </div>
      
      {/* View mode toggle */}
      <div className="flex items-center gap-2">
        <button><FunnelIcon className="w-4 h-4" /> Filter</button>
        <div className="flex border border-border rounded-lg">
          <button 
            onClick={() => setViewMode('grid')}
            className={viewMode === 'grid' ? 'bg-primary-green' : ''}
          >
            <Squares2X2Icon className="w-4 h-4" />
          </button>
          <button 
            onClick={() => setViewMode('list')}
            className={viewMode === 'list' ? 'bg-primary-green' : ''}
          >
            <ListBulletIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
```

---

## 🏠 Phase 4: Home Page Transformation (Days 10-12)

### 4.1 Backup Current Home Page

```bash
cd frontend/app
cp page.tsx page.backup.tsx
```

### 4.2 Create New Home Page

**File**: `frontend/app/page.tsx`

**Structure:**
```tsx
'use client'

import { useState, useRef } from 'react'
import { useTokenList } from '@/lib/hooks/useTokenList'
import { useWatchTokenCreated } from '@/lib/hooks/useTokenEvents'
import { TrendingSection } from '@/components/TrendingSection'
import { FilterBar } from '@/components/FilterBar'
import { TokenCard } from '@/components/TokenCard'

export default function Home() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [filters, setFilters] = useState({
    featured: true,
    nsfw: false,
    animations: false
  })
  
  // Fetch all tokens from blockchain
  const { tokens, isLoading } = useTokenList()
  
  // Watch for new token events
  useWatchTokenCreated((event) => {
    // Add new token to list
  })
  
  // Get trending tokens (sort by volume or recent activity)
  const trendingTokens = tokens
    .sort((a, b) => b.volume - a.volume)
    .slice(0, 10)
  
  // Filter tokens based on active filters
  const filteredTokens = tokens.filter(token => {
    if (filters.featured && !token.featured) return false
    // Add more filter logic
    return true
  })
  
  return (
    <div className="space-y-6">
      {/* Trending Section */}
      <TrendingSection tokens={trendingTokens} />
      
      {/* Filter Bar */}
      <FilterBar 
        onFilterChange={setFilters}
        onViewModeChange={setViewMode}
      />
      
      {/* Token Grid */}
      <div className={`grid gap-4 ${
        viewMode === 'grid' 
          ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
          : 'grid-cols-1'
      }`}>
        {filteredTokens.map(token => (
          <TokenCard key={token.address} token={token} compact={viewMode === 'list'} />
        ))}
      </div>
    </div>
  )
}
```

### 4.3 Update Search Component in Header

**File**: `frontend/components/layout/SearchBar.tsx`

```tsx
'use client'

import { useState } from 'react'
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import { useRouter } from 'next/navigation'

export function SearchBar() {
  const [query, setQuery] = useState('')
  const router = useRouter()
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (query) {
      router.push(`/search?q=${encodeURIComponent(query)}`)
    }
  }
  
  return (
    <form onSubmit={handleSearch} className="flex-1 max-w-lg">
      <div className="relative">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
        <input
          type="text"
          placeholder="Search tokens..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-background-card border border-border rounded-lg focus:ring-2 focus:ring-primary-green"
        />
      </div>
    </form>
  )
}
```

---

## 🔗 Phase 5: Integration & Testing (Days 13-15)

### 5.1 Integration Checklist

- [ ] All routes accessible from sidebar
- [ ] Wallet connection persists across navigation
- [ ] Token creation flow works with new layout
- [ ] Individual token pages render correctly
- [ ] Real-time token updates working
- [ ] Mobile navigation functional
- [ ] Search functionality working
- [ ] Filters apply correctly

### 5.2 Testing Scenarios

**Desktop (1920x1080):**
- [ ] Sidebar fully expanded by default
- [ ] Sidebar collapse/expand works
- [ ] Token grid shows 4 columns
- [ ] Trending section scrolls smoothly
- [ ] Search bar visible and functional

**Tablet (768x1024):**
- [ ] Sidebar hidden, mobile nav shows
- [ ] Token grid shows 2 columns
- [ ] Touch scrolling works on trending section

**Mobile (375x667):**
- [ ] Mobile bottom nav visible
- [ ] Token grid shows 1 column
- [ ] All interactions touch-friendly
- [ ] Horizontal scroll works on trending

### 5.3 Performance Optimization

```typescript
// Lazy load token images
<img 
  src={token.imageUrl} 
  loading="lazy"
  alt={token.name}
/>

// Virtualize long token lists
import { useVirtualizer } from '@tanstack/react-virtual'

// Debounce search input
import { useDebouncedValue } from '@/hooks/useDebounce'
```

---

## 📝 Phase 6: Final Polish (Days 16-18)

### 6.1 Add Loading States

```tsx
// Skeleton loader for token cards
export function TokenCardSkeleton() {
  return (
    <div className="bg-background-card rounded-lg p-4 animate-pulse">
      <div className="flex gap-3">
        <div className="w-12 h-12 bg-background-sidebar rounded-full" />
        <div className="flex-1">
          <div className="h-4 bg-background-sidebar rounded mb-2" />
          <div className="h-3 bg-background-sidebar rounded w-2/3" />
        </div>
      </div>
    </div>
  )
}
```

### 6.2 Add Empty States

```tsx
// Empty state when no tokens found
<div className="text-center py-12">
  <div className="text-6xl mb-4">🚀</div>
  <h3 className="text-xl font-semibold mb-2">No tokens found</h3>
  <p className="text-text-secondary mb-6">Be the first to create a token!</p>
  <Link href="/create" className="...">Create Token</Link>
</div>
```

### 6.3 Add Error Boundaries

```tsx
// Error boundary for token loading failures
export function TokenListErrorBoundary({ error, reset }) {
  return (
    <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4">
      <p className="text-red-500">Error loading tokens: {error.message}</p>
      <button onClick={reset}>Retry</button>
    </div>
  )
}
```

---

## 🚀 Deployment Checklist

### Pre-deployment
- [ ] All console errors resolved
- [ ] No TypeScript errors
- [ ] All existing functionality still works
- [ ] Mobile responsive design tested
- [ ] Cross-browser testing (Chrome, Firefox, Safari)
- [ ] Performance metrics acceptable (Lighthouse score >90)

### Deployment Steps
1. Test build locally: `npm run build`
2. Test production build: `npm run start`
3. Deploy to staging environment
4. Run smoke tests on staging
5. Deploy to production
6. Monitor for errors

---

## 📚 Key Files to Create/Modify

### New Files to Create:
```
frontend/
  components/
    layout/
      Sidebar.tsx
      MainLayout.tsx
      MobileBottomNav.tsx
      SearchBar.tsx
    TokenCard.tsx
    TrendingSection.tsx
    FilterBar.tsx
    TokenCardSkeleton.tsx
```

### Files to Modify:
```
frontend/
  app/
    layout.tsx          (integrate MainLayout)
    page.tsx            (transform to token feed)
    globals.css         (add new styles)
  tailwind.config.ts    (add new colors)
  package.json          (add @heroicons/react)
```

### Files to Keep:
```
frontend/
  app/
    create/page.tsx
    tokens/page.tsx (can be deprecated or keep for legacy)
    token/[address]/page.tsx
    portfolio/page.tsx
    dashboard/page.tsx
    history/page.tsx
  components/
    ConnectButton.tsx
    Web3Provider.tsx
    ToastProvider.tsx
    TradingPanel.tsx
    PriceChart.tsx
  lib/
    hooks/          (all existing hooks)
    contracts/      (all contract ABIs)
    wagmi.ts
```

---

## 🎯 Success Criteria

✅ Home page shows live token feed (not landing page)  
✅ Sidebar navigation implemented and functional  
✅ Mobile bottom navigation working  
✅ "Now Trending" section with horizontal scroll  
✅ Filters and search working  
✅ Grid/List view toggle functional  
✅ Token cards show real blockchain data  
✅ Graduation progress bars accurate  
✅ Wallet connection integrated in layout  
✅ All existing routes still functional  
✅ Responsive design on all devices  
✅ Performance metrics acceptable  

---

## 🔄 Rollback Plan

If issues arise:
1. Revert `frontend/app/layout.tsx` to use Header component
2. Restore `frontend/app/page.tsx` from `page.backup.tsx`
3. Keep new components for future use
4. Investigate issues in development branch
5. Re-deploy when fixed

---

## 📞 Support & Resources

- **Mock Design Reference**: `F:\BNB_PumpFun\pumpbnb-ui`
- **Pump.fun Live**: https://pump.fun
- **Project Docs**: `F:\BNB_PumpFun\docs`
- **Insights Doc**: `F:\BNB_PumpFun\docs\PUMP_FUN_INSIGHTS_FOR_PUMPBNB.md`

---

**Last Updated**: 2025-11-04  
**Status**: Ready to implement  
**Estimated Completion**: 3 weeks

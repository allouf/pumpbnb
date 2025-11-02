# Token Page UI Components Guide

## Overview

Complete set of production-ready React components for the ASTER FUN token page, built with TypeScript, Tailwind CSS, and real-time WebSocket integration.

**Status**: ✅ **All 6 core components + TokenPage wrapper complete**

---

## 📦 Components

### 1. TokenHeader

Displays token information, statistics, and action buttons with real-time price updates.

**Features**:
- Token name, symbol, and image
- Live price, market cap, 24h volume, and holders
- Price change percentage with color indicators
- Watchlist toggle (persisted in Zustand)
- Copy address to clipboard
- Links to BscScan, website, and social media
- Graduation status badge
- Real-time WebSocket connection indicator

**Props**:
```typescript
interface TokenHeaderProps {
  token: Token;      // Token data
  stats: TokenStats; // Token statistics
}
```

**Usage**:
```typescript
import { TokenHeader } from '@/components';
import { useTokenPage, useTokenStats } from '@/lib/hooks';

function MyPage({ tokenAddress }: { tokenAddress: string }) {
  const { data } = useTokenPage(tokenAddress);
  const { data: statsData } = useTokenStats(tokenAddress);

  if (!data?.data || !statsData?.data) return null;

  return (
    <TokenHeader
      token={data.data.token}
      stats={statsData.data}
    />
  );
}
```

**Real-time Updates**:
- Listens to `token:price` WebSocket event
- Updates price, market cap, and price change automatically

---

### 2. PriceChart

Interactive TradingView-style candlestick chart with real-time updates.

**Features**:
- Candlestick chart using lightweight-charts library
- 6 timeframe options: 1m, 5m, 15m, 1h, 4h, 1D
- Real-time candle updates via WebSocket
- Price change statistics (percentage and direction)
- Dark mode support with auto-detection
- Responsive chart resizing
- Empty state for tokens with no trades yet
- Green/red color scheme for bullish/bearish candles

**Props**:
```typescript
interface PriceChartProps {
  tokenAddress: string;
  height?: number; // Chart height in pixels (default: 400)
}
```

**Usage**:
```typescript
import { PriceChart } from '@/components';

function MyPage({ tokenAddress }: { tokenAddress: string }) {
  return (
    <PriceChart tokenAddress={tokenAddress} height={400} />
  );
}
```

**Real-time Updates**:
- Listens to `token:candle` WebSocket event for new/updated candles
- Listens to `token:trade` to invalidate and refetch chart data
- Updates chart in real-time without full page refresh

**Timeframe Behavior**:
- Switches between 1m, 5m, 15m, 1h, 4h, 1d timeframes
- Automatically refetches data when timeframe changes
- Only updates chart when WebSocket event matches selected timeframe

**Dark Mode**:
- Automatically detects document dark mode class
- Updates chart colors dynamically
- Uses MutationObserver to watch for theme changes

---

### 3. TradesPanel

Displays recent trades with filters and real-time updates.

**Features**:
- Recent trades list (last 50 trades)
- Filter by: All, Buys, Sells, My Trades, Large Orders
- Real-time trade updates via WebSocket
- Color-coded buy/sell indicators
- Trader address links to BscScan
- Time display (relative, e.g., "2 minutes ago")
- Total volume calculation
- Sticky table header for scrolling

**Props**:
```typescript
interface TradesPanelProps {
  tokenAddress: string;
  userAddress?: string; // Required for "My Trades" filter
}
```

**Usage**:
```typescript
import { TradesPanel } from '@/components';

function MyPage({ tokenAddress, userAddress }: Props) {
  return (
    <TradesPanel
      tokenAddress={tokenAddress}
      userAddress={userAddress}
    />
  );
}
```

**Real-time Updates**:
- Listens to `token:trade` WebSocket event
- Invalidates React Query cache to refetch trades

---

### 4. HoldersPanel

Displays token holders with distribution analysis.

**Features**:
- Top holders ranked by balance
- Holder statistics (total holders, top 10%, concentration, Gini coefficient)
- Visual percentage bars
- Large holder indicators (>5% ownership)
- Show all/collapse functionality
- Real-time holder updates via WebSocket
- Distribution analysis explanation
- Links to BscScan

**Props**:
```typescript
interface HoldersPanelProps {
  tokenAddress: string;
  totalSupply: string; // For percentage calculations
}
```

**Usage**:
```typescript
import { HoldersPanel } from '@/components';
import { useTokenPage } from '@/lib/hooks';

function MyPage({ tokenAddress }: { tokenAddress: string }) {
  const { data } = useTokenPage(tokenAddress);
  const token = data?.data?.token;

  if (!token) return null;

  return (
    <HoldersPanel
      tokenAddress={tokenAddress}
      totalSupply={token.totalSupply}
    />
  );
}
```

**Real-time Updates**:
- Listens to `token:holder-update` for individual holder changes
- Listens to `token:holder-stats` for distribution statistics updates

---

### 5. CommentsPanel

Displays threaded comments with likes, replies, and real-time updates.

**Features**:
- Nested comment threads (1 level deep)
- Like/unlike comments with count
- Reply to comments
- Edit own comments
- Delete own comments
- Sort by: Newest, Oldest, Most Liked
- Real-time comment updates via WebSocket
- Character limit (1000 chars)
- User address avatar with gradient
- Time display with "(edited)" indicator
- Wallet connection required for actions

**Props**:
```typescript
interface CommentsPanelProps {
  tokenAddress: string;
  userAddress?: string; // Required for commenting/liking
}
```

**Usage**:
```typescript
import { CommentsPanel } from '@/components';

function MyPage({ tokenAddress, userAddress }: Props) {
  return (
    <CommentsPanel
      tokenAddress={tokenAddress}
      userAddress={userAddress}
    />
  );
}
```

**Real-time Updates**:
- Listens to `token:comment` for new comments
- Listens to `comment:updated` for edits
- Listens to `comment:deleted` for deletions
- Listens to `comment:liked` for like count changes
- Uses optimistic updates for instant UI feedback

---

### 6. TradeButton

Buy/sell interface with slippage protection and real-time quotes.

**Features**:
- Buy/Sell toggle tabs
- Amount input with MAX button
- Estimated output calculation
- Price impact warning (>5% = high risk)
- Slippage tolerance settings (0.5%, 1%, 2%, 5%, custom)
- Balance display for input currency
- Trading fee display (1% bonding curve, 0.3% graduated)
- Phase information (bonding curve vs. graduated)
- Real-time price updates
- Input validation and error handling

**Props**:
```typescript
interface TradeButtonProps {
  token: Token;
  userAddress?: string;    // Required for trading
  asterBalance?: string;   // User's ASTER balance
  tokenBalance?: string;   // User's token balance
}
```

**Usage**:
```typescript
import { TradeButton } from '@/components';
import { useTokenPage } from '@/lib/hooks';

function MyPage({ tokenAddress, userAddress }: Props) {
  const { data } = useTokenPage(tokenAddress);
  const token = data?.data?.token;

  // In a real app, fetch these from wallet/contract
  const asterBalance = '1000'; // User's ASTER balance
  const tokenBalance = '5000'; // User's token balance

  if (!token) return null;

  return (
    <TradeButton
      token={token}
      userAddress={userAddress}
      asterBalance={asterBalance}
      tokenBalance={tokenBalance}
    />
  );
}
```

**Note**: The trade execution is a placeholder. You'll need to integrate with smart contracts using wagmi/viem for actual trading.

---

### 7. TokenPage (Complete Layout)

Full token page layout that combines all components.

**Features**:
- Responsive grid layout (3-column on desktop, 1-column on mobile)
- Token header at top
- Left column: Chart placeholder, Trades, Comments
- Right column: Trade button, Holders
- Loading state with skeleton UI
- Error state handling
- Tracks token in "Recently Viewed"
- Dark mode support

**Props**:
```typescript
interface TokenPageProps {
  tokenAddress: string;
  userAddress?: string;
  asterBalance?: string;
  tokenBalance?: string;
}
```

**Usage**:
```typescript
import { TokenPage } from '@/components';

// In your Next.js page or route
export default function Page({ params }: { params: { address: string } }) {
  // Get user address from wallet connection (wagmi)
  const userAddress = '0x...';
  const asterBalance = '1000';
  const tokenBalance = '5000';

  return (
    <TokenPage
      tokenAddress={params.address}
      userAddress={userAddress}
      asterBalance={asterBalance}
      tokenBalance={tokenBalance}
    />
  );
}
```

---

## 🎨 Styling

All components use:
- **Tailwind CSS** for styling
- **Dark mode support** via `dark:` classes
- **Lucide React** for icons
- **Responsive design** (mobile-first)
- **Smooth transitions** for hover/focus states
- **Consistent color palette**:
  - Blue: Primary actions
  - Green: Buy/positive
  - Red: Sell/negative
  - Yellow: Warnings
  - Gray: Neutral

---

## 🔌 Dependencies

### Required Packages

```json
{
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "next": "^16.0.0",
    "@tanstack/react-query": "^5.90.5",
    "zustand": "^5.0.8",
    "socket.io-client": "^4.8.1",
    "lucide-react": "^0.552.0",
    "date-fns": "^4.1.0"
  }
}
```

### Optional Enhancements

- `wagmi` + `viem` - For wallet connection and smart contract interaction
- `react-hot-toast` - For toast notifications
- `recharts` - For additional charts

---

## 📱 Responsive Breakpoints

Components adapt to screen sizes using Tailwind breakpoints:

- **Mobile** (default): Single column, compact stats
- **md** (768px+): 2-column grids, expanded stats
- **lg** (1024px+): 3-column layout, full features

---

## ⚡ Performance Optimizations

### 1. React Query Caching
- Each component uses appropriate `staleTime` and `refetchInterval`
- Automatic cache invalidation on WebSocket events
- No unnecessary refetches

### 2. WebSocket Efficiency
- Single WebSocket connection per token (via `useTokenSocket`)
- Room-based subscriptions (only receive relevant events)
- Automatic cleanup on unmount

### 3. Conditional Rendering
- Loading states with skeleton UI
- Error boundaries (implement in your app)
- Lazy loading for heavy components (if needed)

### 4. Zustand State Management
- Selective re-renders with granular selectors
- Persistence only for necessary state (watchlist, UI preferences)
- DevTools integration for debugging

---

## 🧪 Testing Recommendations

### Unit Tests (Jest + React Testing Library)

```typescript
// Example: TokenHeader.test.tsx
import { render, screen } from '@testing-library/react';
import { TokenHeader } from '@/components';

describe('TokenHeader', () => {
  it('renders token name and symbol', () => {
    const token = { name: 'Test Token', symbol: 'TEST', ... };
    const stats = { price: '1.234', ... };

    render(<TokenHeader token={token} stats={stats} />);

    expect(screen.getByText('Test Token')).toBeInTheDocument();
    expect(screen.getByText('$TEST')).toBeInTheDocument();
  });
});
```

### Integration Tests (Playwright/Cypress)

```typescript
// Example: token-page.spec.ts
test('displays real-time trade updates', async ({ page }) => {
  await page.goto('/token/0x123...');

  // Wait for WebSocket connection
  await page.waitForSelector('text=Live');

  // Verify trades panel loads
  await expect(page.locator('text=Recent Trades')).toBeVisible();

  // Trigger mock trade event and verify update
  // ...
});
```

---

## 🔧 Customization

### Theming

Components inherit theme from parent via Tailwind's `dark:` classes. To customize:

```typescript
// In your root layout or provider
import { useUIStore } from '@/lib/stores';
import { useEffect } from 'react';

function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { theme } = useUIStore();

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  return <>{children}</>;
}
```

### Colors

To change color scheme, update Tailwind config:

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          500: '#3B82F6', // Blue
          600: '#2563EB',
        },
        success: {
          500: '#10B981', // Green
          600: '#059669',
        },
        danger: {
          500: '#EF4444', // Red
          600: '#DC2626',
        },
      },
    },
  },
};
```

Then replace class names in components:
- `bg-blue-500` → `bg-primary-500`
- `text-green-500` → `text-success-500`
- etc.

---

## 🚨 Known Limitations

1. **Trade Execution**: TradeButton is UI-only. You must integrate with smart contracts using wagmi/viem.

2. **Like Tracking**: CommentsPanel doesn't track which users liked which comments. Implement `CommentLike` table in backend.

3. **Pagination**: TradesPanel and CommentsPanel show recent items only. Implement infinite scroll for full history.

4. **Notifications**: No toast notifications for errors/success. Consider adding react-hot-toast.

5. **Wallet Connection**: Components expect userAddress prop but don't handle wallet connection. Integrate wagmi for wallet management.

---

## 📚 Next Steps

1. **Integrate Wallet Connection**
   - Use wagmi for wallet connection
   - Add authentication with EIP-4361 (Sign-In with Ethereum)
   - Fetch real balances from contracts

2. **Smart Contract Integration**
   - Implement actual trade execution in TradeButton
   - Add transaction status tracking
   - Handle errors and reverts gracefully

3. **Enhanced Features**
   - Toast notifications (react-hot-toast)
   - Infinite scroll for trades/comments
   - User like tracking for comments
   - Image uploads for comments
   - Markdown support for comments

---

## 🎯 Component Checklist

- ✅ TokenHeader - Token info and stats
- ✅ PriceChart - TradingView candlestick chart
- ✅ TradesPanel - Recent trades with filters
- ✅ HoldersPanel - Top holders and distribution
- ✅ CommentsPanel - Threaded comments with likes
- ✅ TradeButton - Buy/sell interface
- ✅ TokenPage - Complete layout wrapper

---

## 📞 Support

For questions or issues:
1. Check documentation: `DEVELOPER_QUICK_START.md`
2. Review API reference: `FRONTEND_INTEGRATION_SUMMARY.md`
3. Examine example code in component files

---

**Status**: ✅ **All UI Components Complete - Ready for Wallet Integration & Smart Contract Execution**

Last Updated: 2025-11-02

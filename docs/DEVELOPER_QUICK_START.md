# Developer Quick Start Guide

## 🚀 Getting Started with PumpBNB Token Page Integration

This guide will help you quickly integrate the token page features into your frontend components.

---

## Environment Setup

### 1. Configure Environment Variables

Create `.env.local` in the frontend directory:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_WS_URL=http://localhost:3001
```

### 2. Start Backend Services

```bash
cd backend
npm run dev
```

### 3. Start Frontend

```bash
cd frontend
npm run dev
```

---

## Quick Examples

### Example 1: Display Token Price (with real-time updates)

```typescript
'use client';

import { useTokenStats, useTokenSocket } from '@/lib/hooks';
import { useEffect, useState } from 'react';

export function TokenPrice({ tokenAddress }: { tokenAddress: string }) {
  // Fetch initial price
  const { data: stats } = useTokenStats(tokenAddress);

  // Set up WebSocket for real-time updates
  const [livePrice, setLivePrice] = useState<string | null>(null);
  const ws = useTokenSocket(tokenAddress);

  useEffect(() => {
    ws.on('token:price', (data) => {
      setLivePrice(data.price);
    });

    return () => {
      ws.off('token:price');
    };
  }, [ws]);

  const displayPrice = livePrice || stats?.data?.price || '0';

  return (
    <div>
      <h2>Current Price</h2>
      <p className="text-2xl font-bold">${displayPrice}</p>
      {ws.isConnected && (
        <span className="text-green-500">● Live</span>
      )}
    </div>
  );
}
```

### Example 2: Recent Trades List (auto-updating)

```typescript
'use client';

import { useRecentTrades, useTokenSocket } from '@/lib/hooks';
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

export function RecentTradesList({ tokenAddress }: { tokenAddress: string }) {
  const { data } = useRecentTrades(tokenAddress, 10);
  const ws = useTokenSocket(tokenAddress);
  const queryClient = useQueryClient();

  useEffect(() => {
    // Invalidate query when new trade comes in
    ws.on('token:trade', () => {
      queryClient.invalidateQueries({
        queryKey: ['tokens', tokenAddress, 'trades', 'recent'],
      });
    });

    return () => {
      ws.off('token:trade');
    };
  }, [ws, queryClient, tokenAddress]);

  return (
    <div>
      <h3>Recent Trades</h3>
      {data?.data?.map((trade) => (
        <div key={trade.id} className="flex justify-between">
          <span className={trade.isBuy ? 'text-green-500' : 'text-red-500'}>
            {trade.isBuy ? 'BUY' : 'SELL'}
          </span>
          <span>{trade.tokenAmount}</span>
          <span>${trade.price}</span>
        </div>
      ))}
    </div>
  );
}
```

### Example 3: Comment Section (with mutations)

```typescript
'use client';

import { useTokenComments, useCreateComment } from '@/lib/hooks';
import { useState } from 'react';
import { useAccount } from 'wagmi';

export function CommentsSection({ tokenAddress }: { tokenAddress: string }) {
  const [content, setContent] = useState('');
  const { address } = useAccount(); // From wagmi
  const { data } = useTokenComments(tokenAddress);
  const createComment = useCreateComment(tokenAddress);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address || !content.trim()) return;

    await createComment.mutateAsync({
      userAddress: address,
      content,
    });

    setContent('');
  };

  return (
    <div>
      <h3>Comments</h3>

      <form onSubmit={handleSubmit}>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Add a comment..."
          maxLength={1000}
        />
        <button
          type="submit"
          disabled={createComment.isPending || !address}
        >
          {createComment.isPending ? 'Posting...' : 'Post Comment'}
        </button>
      </form>

      {data?.data?.map((comment) => (
        <div key={comment.id}>
          <p>{comment.content}</p>
          <small>{comment.userAddress}</small>
          <span>❤️ {comment.likeCount}</span>
        </div>
      ))}
    </div>
  );
}
```

### Example 4: Watchlist Feature

```typescript
'use client';

import { useTokenStore } from '@/lib/stores';
import { StarIcon } from 'lucide-react';

export function WatchlistButton({ tokenAddress }: { tokenAddress: string }) {
  const { isInWatchlist, toggleWatchlist } = useTokenStore();
  const inWatchlist = isInWatchlist(tokenAddress);

  return (
    <button
      onClick={() => toggleWatchlist(tokenAddress)}
      className={inWatchlist ? 'text-yellow-500' : 'text-gray-400'}
    >
      <StarIcon className={inWatchlist ? 'fill-current' : ''} />
      {inWatchlist ? 'Remove from Watchlist' : 'Add to Watchlist'}
    </button>
  );
}
```

### Example 5: Theme Toggle

```typescript
'use client';

import { useUIStore } from '@/lib/stores';
import { useEffect } from 'react';

export function ThemeToggle() {
  const { theme, toggleTheme } = useUIStore();

  useEffect(() => {
    // Apply theme to document
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  return (
    <button onClick={toggleTheme}>
      {theme === 'light' ? '🌙 Dark Mode' : '☀️ Light Mode'}
    </button>
  );
}
```

### Example 6: Notifications Dropdown

```typescript
'use client';

import { useNotificationStore } from '@/lib/stores';

export function NotificationsDropdown() {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
  } = useNotificationStore();

  return (
    <div>
      <button>
        🔔 Notifications
        {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
      </button>

      <div className="dropdown">
        <button onClick={markAllAsRead}>Mark All as Read</button>

        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={notification.read ? 'read' : 'unread'}
            onClick={() => markAsRead(notification.id)}
          >
            <strong>{notification.title}</strong>
            <p>{notification.message}</p>
            <small>{new Date(notification.timestamp).toLocaleString()}</small>
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## Common Patterns

### Pattern 1: Fetch + Real-time Updates

```typescript
// 1. Fetch initial data with React Query
const { data } = useTokenStats(address);

// 2. Subscribe to WebSocket updates
const ws = useTokenSocket(address);

// 3. Update React Query cache when WebSocket event occurs
useEffect(() => {
  ws.on('token:price', (newData) => {
    queryClient.setQueryData(['tokens', address, 'stats'], (old) => ({
      ...old,
      data: { ...old.data, price: newData.price },
    }));
  });
}, [ws]);
```

### Pattern 2: Infinite Scroll

```typescript
const {
  data,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
} = useInfiniteTokenTrades(tokenAddress);

// In component:
<InfiniteScroll
  loadMore={fetchNextPage}
  hasMore={hasNextPage}
  isLoading={isFetchingNextPage}
>
  {data?.pages.map((page) =>
    page.data.map((item) => <Item key={item.id} {...item} />)
  )}
</InfiniteScroll>
```

### Pattern 3: Optimistic Updates

```typescript
const createComment = useCreateComment(tokenAddress);

const handleComment = async (content: string) => {
  // Optimistic update
  queryClient.setQueryData(['tokens', tokenAddress, 'comments'], (old) => ({
    ...old,
    data: [{ id: 'temp', content, /* ... */ }, ...old.data],
  }));

  try {
    await createComment.mutateAsync({ userAddress, content });
  } catch (error) {
    // Revert on error
    queryClient.invalidateQueries(['tokens', tokenAddress, 'comments']);
  }
};
```

---

## TypeScript Tips

### Use provided types

```typescript
import type { Token, Trade, Comment } from '@/lib/api/types';

function TokenCard({ token }: { token: Token }) {
  // token is fully typed
}
```

### Extract hook data types

```typescript
import { useTokenPage } from '@/lib/hooks';

type TokenPageData = NonNullable<
  ReturnType<typeof useTokenPage>['data']
>['data'];
```

---

## Performance Tips

1. **Use selective store selectors**
   ```typescript
   // ❌ Bad - re-renders on any watchlist change
   const store = useTokenStore();

   // ✅ Good - only re-renders when specific value changes
   const isInWatchlist = useTokenStore((s) =>
     s.isInWatchlist(tokenAddress)
   );
   ```

2. **Memoize expensive computations**
   ```typescript
   const sortedTrades = useMemo(
     () => data?.data?.sort((a, b) => b.timestamp - a.timestamp),
     [data]
   );
   ```

3. **Use proper stale times**
   - Immutable data: `Infinity`
   - Volatile data (prices): `10_000` (10s)
   - Semi-stable data: `60_000` (1min)

---

## Debugging

### React Query DevTools

```typescript
// In your layout/app component
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

export default function RootLayout({ children }) {
  return (
    <>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </>
  );
}
```

### Zustand DevTools

Already enabled in all stores. Use Redux DevTools extension in browser.

### WebSocket Connection Status

```typescript
const ws = useWebSocket();
console.log('Connected:', ws.isConnected);
console.log('Error:', ws.error);
```

---

## Common Issues & Solutions

### Issue: WebSocket not connecting

**Solution**: Check that backend is running and `NEXT_PUBLIC_WS_URL` is correct.

### Issue: React Query not refetching

**Solution**: Check `staleTime` and `refetchInterval` settings. Use `queryClient.invalidateQueries()` to force refetch.

### Issue: Zustand state not persisting

**Solution**: Check browser localStorage. Clear storage if migration needed.

### Issue: TypeScript errors with API responses

**Solution**: Ensure types in `lib/api/types.ts` match backend Prisma schema.

---

## Need Help?

- Check the full documentation: `/docs/FRONTEND_INTEGRATION_SUMMARY.md`
- Backend API reference: `/docs/API_SUMMARY.md`
- Example components: `/frontend/src/components/examples/` (to be created)

---

Happy coding! 🚀

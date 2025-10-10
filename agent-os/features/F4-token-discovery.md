# F4: Token Discovery & Feed

**Feature ID**: F4
**Priority**: Critical (Must-Have)
**Phase**: 1 - Core Platform (MVP)
**Dependencies**: F2 (Token Creation), F3 (Bonding Curve Trading)
**Status**: Specification

---

## Overview

Real-time feed showcasing newly created tokens, trending tokens, and community favorites. Users discover investment opportunities through curated lists, filters, and search functionality.

### User Value
- **Discover New Opportunities**: Find tokens before they trend
- **Trending Insights**: See what's gaining traction
- **Community Signal**: Popular tokens highlighted
- **Real-Time Updates**: New tokens appear within seconds

---

## User Stories

### As a trader
- I want to see new tokens as soon as they're created
- I want to filter tokens by market cap, age, and volume
- I want to see which tokens are trending
- I want to bookmark tokens I'm interested in

### As a token creator
- I want my token to appear in the feed immediately after creation
- I want my token to get visibility based on trading activity

---

## Feed Categories

### 1. Recently Created (Default)
- **Sort**: Newest first
- **Display**: Last 100 tokens created
- **Update Frequency**: Real-time (WebSocket)
- **Data**: Token name, symbol, image, creator, time created, current price

### 2. Trending
- **Sort**: By 24h volume
- **Algorithm**: Volume * (1 - time_decay_factor)
- **Update Frequency**: Every 5 minutes
- **Minimum Threshold**: $1,000 24h volume

### 3. Biggest Gainers
- **Sort**: By 24h price % change (descending)
- **Display**: Top 50 gainers
- **Update Frequency**: Every 5 minutes
- **Minimum Threshold**: $500 24h volume (prevent manipulation)

### 4. Close to Graduation
- **Sort**: By % toward $100K market cap (descending)
- **Display**: Tokens 70%+ toward graduation
- **Update Frequency**: Every 1 minute
- **Highlight**: Tokens 90%+ in special color

### 5. Recently Graduated
- **Sort**: Most recent graduation first
- **Display**: Last 20 graduated tokens
- **Update Frequency**: Real-time
- **Link**: Direct link to PancakeSwap pair

---

## UI Components

### Feed Card

```
┌───────────────────────────────────┐
│ [IMG]  DOGE KILLER ($DOGK)        │
│         Created 5m ago            │
│                                   │
│  Price: $0.000001234  (+5.2%)     │
│  Market Cap: $50,234              │
│  24h Volume: $12,456              │
│  Progress: ▓▓▓▓▓▓░░░░ 50%         │
│                                   │
│  [Quick Buy] [View Details] [⭐]  │
└───────────────────────────────────┘
```

### Filter Panel

```
┌─────────────────────────────────┐
│  Filters                        │
├─────────────────────────────────┤
│  Sort By:                       │
│  [Newest ▼]                     │
│                                  │
│  Market Cap:                     │
│  [$0 ────●─────── $100K]        │
│                                  │
│  Age:                            │
│  ☑ Last Hour                     │
│  ☑ Last 24 Hours                 │
│  ☐ Last 7 Days                   │
│  ☐ All Time                      │
│                                  │
│  Min 24h Volume:                 │
│  [$0 ──●────────── $100K]       │
│                                  │
│  [Apply Filters] [Reset]         │
└─────────────────────────────────┘
```

---

## Technical Implementation

### API Endpoints

```typescript
// Get token feed
GET /api/feed/recently-created
Query: { limit=50, offset=0 }
Response: [{ tokenAddress, name, symbol, image, creator, price, marketCap, volume24h, createdAt }]

GET /api/feed/trending
Query: { limit=50, offset=0, timeframe=24h }
Response: [{ tokenAddress, trendingScore, volume24h, priceChange24h, ... }]

GET /api/feed/gainers
Query: { limit=50, offset=0 }
Response: [{ tokenAddress, priceChange24h, priceChange1h, ... }]

GET /api/feed/graduation
Query: { minProgress=70 }
Response: [{ tokenAddress, graduationProgress, marketCap, ... }]

// Filter and search
POST /api/feed/filter
Request: {
  sortBy: 'volume' | 'marketCap' | 'age',
  marketCapMin: 0,
  marketCapMax: 100000,
  ageMax: 86400,
  volumeMin: 1000
}
Response: [tokens matching filters]
```

### Database Schema

```sql
CREATE TABLE token_metrics (
  token_address VARCHAR(42) PRIMARY KEY,
  current_price NUMERIC(78,18),
  market_cap NUMERIC(78,2),
  volume_1h NUMERIC(78,2),
  volume_24h NUMERIC(78,2),
  price_change_1h NUMERIC(10,2),
  price_change_24h NUMERIC(10,2),
  holder_count INTEGER,
  trade_count_24h INTEGER,
  graduation_progress NUMERIC(5,2),
  trending_score NUMERIC(10,2),
  last_updated TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_trending ON token_metrics(trending_score DESC);
CREATE INDEX idx_gainers ON token_metrics(price_change_24h DESC);
CREATE INDEX idx_graduation ON token_metrics(graduation_progress DESC);
```

### Real-Time Updates (WebSocket)

```typescript
// Subscribe to new tokens
socket.on('subscribe:new-tokens');

// Receive new token event
socket.on('new-token', {
  tokenAddress: '0x...',
  name: 'Doge Killer',
  symbol: 'DOGK',
  image: 'ipfs://...',
  creator: '0x...',
  createdAt: 1696944000
});

// Subscribe to trending updates
socket.on('subscribe:trending');

// Receive trending updates every 5 min
socket.on('trending-update', [
  { tokenAddress, trendingScore, volume24h }
]);
```

---

## Feed Algorithms

### Trending Score Calculation

```typescript
function calculateTrendingScore(token: Token): number {
  const volume24h = token.volume24h;
  const ageInHours = (Date.now() - token.createdAt) / 3600000;

  // Time decay: newer tokens get boost
  const decayFactor = Math.exp(-0.1 * ageInHours);

  // Engagement boost: more trades = higher score
  const engagementMultiplier = 1 + (token.tradeCount24h / 1000);

  return volume24h * decayFactor * engagementMultiplier;
}
```

### Anti-Manipulation Rules

```typescript
// Minimum thresholds to prevent fake tokens
const TRENDING_MIN_VOLUME = 1000; // $1,000 USD
const TRENDING_MIN_HOLDERS = 10;
const TRENDING_MIN_TRADES = 20;

// Filter out suspicious activity
function isValidForTrending(token: Token): boolean {
  if (token.volume24h < TRENDING_MIN_VOLUME) return false;
  if (token.holderCount < TRENDING_MIN_HOLDERS) return false;
  if (token.tradeCount24h < TRENDING_MIN_TRADES) return false;

  // Check for wash trading (same address buying/selling)
  const uniqueTraders = getUniqueTraders(token);
  if (uniqueTraders < 5) return false;

  return true;
}
```

---

## Acceptance Criteria

### Must Have
- [ ] New tokens appear in feed within 10 seconds of creation
- [ ] Feed loads in < 2 seconds
- [ ] Real-time updates via WebSocket
- [ ] Infinite scroll pagination
- [ ] Trending algorithm prevents manipulation
- [ ] Filters work correctly
- [ ] Mobile-responsive grid layout

### Should Have
- [ ] Bookmark/favorite tokens
- [ ] Share token cards on social media
- [ ] "Hot" badge for tokens with high activity
- [ ] Creator verification badges
- [ ] Volume spike notifications

### Nice to Have
- [ ] AI-generated token summaries
- [ ] Community sentiment indicators
- [ ] Related tokens suggestions
- [ ] Token comparison view

---

## Performance Requirements

| Metric | Target | Notes |
|--------|--------|-------|
| **Feed Load Time** | < 2 seconds | Initial 50 tokens |
| **Scroll Performance** | 60 FPS | Smooth infinite scroll |
| **WebSocket Latency** | < 500ms | New token appears |
| **Filter Response** | < 1 second | Apply filters |
| **Image Load Time** | < 1 second | IPFS images cached |

---

## Implementation Checklist

### Week 1: Backend
- [ ] Database schema for metrics
- [ ] Feed API endpoints
- [ ] Trending score calculation
- [ ] WebSocket server for real-time updates
- [ ] Cron job for metrics updates

### Week 2: Frontend
- [ ] Feed grid layout
- [ ] Token card component
- [ ] Infinite scroll
- [ ] WebSocket integration
- [ ] Loading states

### Week 3: Features
- [ ] Filter panel
- [ ] Search functionality
- [ ] Tab navigation (Recently Created, Trending, etc.)
- [ ] Bookmarks/favorites
- [ ] Share buttons

### Week 4: Polish
- [ ] Mobile optimization
- [ ] Performance optimization
- [ ] Error states
- [ ] User testing
- [ ] Analytics integration

---

## Success Metrics

- **Feed Engagement**: > 80% of users browse feed
- **Click-Through Rate**: > 5% click to token page
- **Load Time**: < 2 seconds for initial feed
- **Real-Time Updates**: < 10 seconds delay
- **User Retention**: 40%+ return to feed daily

---

**Next Steps**: Review specification, begin backend development for feed APIs and metrics calculation.

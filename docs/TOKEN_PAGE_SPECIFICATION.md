# Token Page Specification - ASTER FUN

## Overview
This document outlines the comprehensive feature set for the ASTER FUN token page, inspired by Pump.fun and DexTools, adapted for BNB Chain.

## Page Layout

```
┌─────────────────────────────────────────────────────────────────┐
│ Header: Logo | Token Name | Creator | Share | Favorite          │
├─────────────────────────────────┬───────────────────────────────┤
│                                 │                               │
│  Token Info Card                │   Trading Panel               │
│  - Market Cap                   │   - Buy/Sell Tabs             │
│  - Progress %                   │   - Amount Input              │
│  - Status                       │   - You Receive               │
│  - Progress Bar                 │   - Price Impact              │
│                                 │   - Trading Fee               │
│                                 │   - Buy/Sell Button           │
├─────────────────────────────────┴───────────────────────────────┤
│                                                                 │
│  Advanced Trading Chart (TradingView Lightweight Charts)       │
│  - Trade Display Filter (All/My Trades/Dev/Tracked)            │
│  - Timeframe Selector (1s, 1m, 5m, 15m, 30m, 1h, 4h, 1D)      │
│  - Chart Tools (Drawing, Indicators, Settings)                 │
│  - Price/Volume Overlay                                        │
│  - Trade Bubbles on Chart                                      │
│                                                                 │
├─────────────────────────────────┬───────────────────────────────┤
│                                 │                               │
│  Tabs: Comments|Trades|Holders  │   Token Chat                  │
│                                 │   - Member Count              │
│  COMMENTS TAB:                  │   - Join Chat                 │
│  - Comment List                 │   - Live Chat Messages        │
│  - Like/Reply                   │   - Send Message              │
│  - Sort (Newest/Top)            │                               │
│                                 │                               │
│  TRADES TAB:                    │                               │
│  - Trade History                │                               │
│  - Date | Type | Price | Total  │                               │
│  - Filter by User               │                               │
│                                 │                               │
│  HOLDERS TAB:                   │                               │
│  - Top Holders List             │                               │
│  - Address | Balance | %        │                               │
│  - Generate Bubble Map          │                               │
│                                 │                               │
└─────────────────────────────────┴───────────────────────────────┘
```

---

## Feature Breakdown

### 1. Token Header Section

**Components:**
- **Token Avatar/Logo**: Displayed from IPFS metadata
- **Token Name & Ticker**: e.g., "mhnd1" - $MHND1
- **Creator Address**: Shortened with copy button (e.g., 0x5F9c...9f34)
- **Created Timestamp**: "14 ago" relative time
- **Share Button**: Share token link on social media
- **Favorite/Star Button**: Bookmark token (with count)

**Data Sources:**
- Token contract address
- IPFS metadata (name, symbol, image)
- TokenFactory creation event
- User favorites (stored in DB)

---

### 2. Token Info Card

**Metrics Displayed:**
- **Market Cap**: Current market cap in ASTER (e.g., "0.99 ASTER")
- **Progress**: Percentage to graduation (e.g., "1.0%")
- **Status**: "Active" | "Graduated" | "Locked"
- **Progress Bar**: Visual representation
  - Label: "Progress to PancakeSwap"
  - Current: "0 ASTER"
  - Target: "100 ASTER (Graduation)"
  - Percentage bar with color gradient

**Data Sources:**
- BondingCurve contract: `getReserves()`, `virtualReserves()`
- Calculate market cap: `(realAster + virtualAster) * price`
- Progress: `(realAster / 100) * 100`

---

### 3. Advanced Trading Chart

**Chart Library**: TradingView Lightweight Charts

**Features:**

#### A. Trade Display Filter (Top Bar)
- **Tabs**:
  - "All Trades" (default)
  - "My Trades" (connected wallet only)
  - "Dev Trades" (creator trades only)
  - "Tracked Trades" (followed wallets)
- **Toggle**: "Hide All Bubbles" - show/hide trade markers on chart

#### B. Timeframe Selector
**Intervals**:
- Seconds: 1s (live tick)
- Minutes: 1m, 5m, 15m, 30m
- Hours: 1h, 4h
- Days: 1D
- Weeks: 1W (post-graduation)

**Default**: 1h for new tokens, 1D for graduated tokens

#### C. Price/Pair Toggle
- "Price/MCap" - Show price or market cap
- "ASTER/BNB" - Toggle between ASTER and BNB denomination

#### D. Chart Display Options
- **Candlestick Chart**: OHLC data
- **Volume Bars**: Buy volume (green) | Sell volume (red)
- **Volume SMA**: Moving average overlay
- **Trade Bubbles**: Size based on trade volume
  - Green bubbles: Buys
  - Red bubbles: Sells
  - Bubble size: Proportional to trade amount
  - Hover: Show details (wallet, amount, timestamp)

#### E. Chart Tools Panel (Left Sidebar)
- **Drawing Tools**:
  - Trend line
  - Horizontal line
  - Rectangle
  - Text annotation
- **Indicators**:
  - Volume
  - SMA (Simple Moving Average)
  - EMA (Exponential Moving Average)
  - RSI (Relative Strength Index)
  - MACD (future)
- **Settings**:
  - % (percentage scale)
  - log (logarithmic scale)
  - auto (auto-scale)

#### F. Chart Footer
- **Volume 24h**: e.g., "Vol 24h: $7.7M"
- **Price Stats**:
  - 5m change: "+3.16%"
  - 1h change: "+10.96%"
  - 6h change: "-20.28%"

**Data Sources:**
- Trade events from BondingCurve
- Aggregate OHLCV data (1min buckets in DB)
- WebSocket for real-time updates

---

### 4. Trading Panel

**Components:**

#### A. Buy/Sell Tabs
- Active tab highlighted (yellow for buy, default for sell)

#### B. Amount Input
- **Label**: "Amount (ASTER)"
- **Input Field**: Numeric with max decimals 18
- **Quick Select Buttons**:
  - "Reset" - Clear input
  - "0.1 SOL" → "0.1 ASTER"
  - "0.5 SOL" → "0.5 ASTER"
  - "1 SOL" → "1 ASTER"
  - "Max" - Use wallet balance

#### C. Trade Preview (Real-time)
- **You receive (min)**: Expected token amount after slippage
- **Price Impact**: Percentage (color-coded):
  - Green: 0-1%
  - Yellow: 1-3%
  - Orange: 3-5%
  - Red: >5% (with warning)
- **Trading fee (1%)**: Fee in ASTER
- **Position**: If user holds tokens (e.g., "Tokens")

#### D. Profit/Loss Indicator
- **Display**: "Profit/Loss" with slider
- **Color**: Green (profit) | Red (loss)
- **Calculation**: Current value vs cost basis

#### E. Slippage Settings
- **Display**: "⚙️ Slippage: 0.50%"
- **Options**: 0.1%, 0.5%, 1%, 5%, Custom

#### F. Buy/Sell Button
- **States**:
  - "Log in to buy" (not connected)
  - "Buy" (ready)
  - "Insufficient balance" (disabled)
  - "High price impact! Consider reducing trade size." (warning)
  - "Buying..." (pending)

#### G. Warnings
- High price impact warning (>3%)
- Slippage too low warning
- Insufficient liquidity warning

**Data Sources:**
- BondingCurve: `getAmountOut()` for price calculation
- User wallet balance
- Recent trade history for P&L calculation

---

### 5. Tabs Section: Comments | Trades | Holders

### TAB 1: Comments

**Features:**
- **Comment Input**: "Add a comment..." textarea
- **Sort Dropdown**: "Newest" | "Top" | "Oldest"
- **Comment List**:
  - User avatar (generated from address)
  - Username (shortened address or ENS)
  - Timestamp (relative: "1m", "3m")
  - Comment text (supports emojis, mentions)
  - Like button with count
  - Reply button
  - Nested replies (indented)
  - "view X more replies" expansion

**Comment Features:**
- Markdown support
- @mention wallets
- Emoji reactions
- Report/Flag (for moderation)
- Edit/Delete (own comments)

**Data Sources:**
- Comments table in PostgreSQL
- User authentication via wallet signature
- Real-time updates via WebSocket

---

### TAB 2: Trades

**Sub-tabs:**
- **Trade History** (all trades)
- **My Positions** (connected wallet trades)
- **Top Traders** (leaderboard)

**Trade History Table:**
- **Columns**:
  - Date (timestamp)
  - Type (Buy/Sell badge)
  - Price (in ASTER)
  - Total (in ASTER)
  - Wallet (shortened, clickable)
  - Tokens (amount)
- **Sorting**: Click column headers
- **Filtering**:
  - By wallet address
  - By trade type (buy/sell)
  - By time range
- **Pagination**: Load more (infinite scroll)
- **Color Coding**:
  - Green text: Buy
  - Red text: Sell

**My Positions:**
- Only show trades from connected wallet
- Show P&L for each trade
- Show cumulative position

**Top Traders:**
- Leaderboard by profit
- Leaderboard by volume
- Leaderboard by number of trades
- "Track" button to follow traders

**Data Sources:**
- Trade events from BondingCurve contract
- Indexed in PostgreSQL
- Real-time updates via WebSocket

---

### TAB 3: Holders

**Features:**

#### A. Top Holders List
- **Columns**:
  - Rank (1, 2, 3...)
  - Wallet Address (shortened, with emoji identifier)
  - Balance (token amount)
  - Percentage (of total supply)
  - Badge: "🔥 Liquidity pool" for LP, "👑 Creator" for creator
- **Sorting**: By balance (descending)
- **Highlighting**:
  - Creator address (gold highlight)
  - Connected wallet (blue highlight)
  - Top 3 holders (podium icons)

#### B. Generate Bubble Map
- **Button**: "Generate bubble map"
- **Visualization**:
  - Bubble size = holder percentage
  - Color-coded by holder type
  - Interactive: Click to view wallet
  - Shows top 50 holders

#### C. Holder Stats
- **Total Holders**: Count
- **Concentration**: Top 10 holders %
- **Distribution Chart**: Simple bar chart

**Data Sources:**
- Token contract: `balanceOf()` for all holders
- Cached in Redis for performance
- Updated every 5 minutes or on trade event

---

### 6. Token Chat

**Features:**
- **Chat Room**: One per token
- **Member Count**: e.g., "154 members"
- **Join Chat Button**: Connect wallet to join
- **Message List**:
  - User avatar
  - Username (address or ENS)
  - Timestamp
  - Message text
  - Emoji reactions
- **Send Message**: Input field with emoji picker
- **Auto-scroll**: Scroll to latest message
- **Notifications**: New message indicator

**Chat Rules:**
- Must hold tokens to send messages (anti-spam)
- Rate limiting: 1 message per 3 seconds
- Ban/mute functionality for moderators
- Creator gets moderator role

**Data Sources:**
- Chat messages in MongoDB
- WebSocket for real-time messaging
- User authentication via wallet signature

---

## Technical Implementation

### Frontend Stack
- **Framework**: Next.js 14 with App Router
- **UI Components**:
  - Headless UI for tabs, dropdowns
  - Radix UI for advanced components
  - TailwindCSS for styling
- **Chart Library**: TradingView Lightweight Charts
- **Web3**: Wagmi + Viem for blockchain interaction
- **State Management**: Zustand
- **Real-time**: Socket.io client

### Backend Stack
- **API**: Next.js API Routes (Edge functions)
- **Database**:
  - PostgreSQL (trades, comments, users)
  - MongoDB (chat messages)
  - Redis (cache, real-time data)
- **Real-time**: Socket.io server
- **Background Jobs**: Bull queue for indexing

### Database Schema

#### PostgreSQL Tables

**tokens**
```sql
CREATE TABLE tokens (
  id SERIAL PRIMARY KEY,
  address VARCHAR(42) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  symbol VARCHAR(20) NOT NULL,
  image_url TEXT,
  creator_address VARCHAR(42) NOT NULL,
  bonding_curve_address VARCHAR(42) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  graduated BOOLEAN DEFAULT FALSE,
  graduated_at TIMESTAMP,
  metadata JSONB
);
```

**trades**
```sql
CREATE TABLE trades (
  id SERIAL PRIMARY KEY,
  token_address VARCHAR(42) NOT NULL,
  tx_hash VARCHAR(66) UNIQUE NOT NULL,
  block_number INTEGER NOT NULL,
  timestamp TIMESTAMP NOT NULL,
  trader_address VARCHAR(42) NOT NULL,
  trade_type VARCHAR(4) NOT NULL, -- 'buy' or 'sell'
  aster_amount NUMERIC(78, 18) NOT NULL,
  token_amount NUMERIC(78, 18) NOT NULL,
  price NUMERIC(78, 18) NOT NULL,
  market_cap NUMERIC(78, 18),
  FOREIGN KEY (token_address) REFERENCES tokens(address)
);
CREATE INDEX idx_trades_token ON trades(token_address, timestamp DESC);
CREATE INDEX idx_trades_trader ON trades(trader_address, timestamp DESC);
```

**holders**
```sql
CREATE TABLE holders (
  id SERIAL PRIMARY KEY,
  token_address VARCHAR(42) NOT NULL,
  holder_address VARCHAR(42) NOT NULL,
  balance NUMERIC(78, 18) NOT NULL,
  percentage NUMERIC(5, 2),
  last_updated TIMESTAMP DEFAULT NOW(),
  UNIQUE(token_address, holder_address),
  FOREIGN KEY (token_address) REFERENCES tokens(address)
);
CREATE INDEX idx_holders_token ON holders(token_address, balance DESC);
```

**comments**
```sql
CREATE TABLE comments (
  id SERIAL PRIMARY KEY,
  token_address VARCHAR(42) NOT NULL,
  user_address VARCHAR(42) NOT NULL,
  parent_id INTEGER, -- for replies
  content TEXT NOT NULL,
  likes INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP,
  deleted BOOLEAN DEFAULT FALSE,
  FOREIGN KEY (token_address) REFERENCES tokens(address),
  FOREIGN KEY (parent_id) REFERENCES comments(id)
);
CREATE INDEX idx_comments_token ON comments(token_address, created_at DESC);
```

**user_favorites**
```sql
CREATE TABLE user_favorites (
  user_address VARCHAR(42) NOT NULL,
  token_address VARCHAR(42) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (user_address, token_address),
  FOREIGN KEY (token_address) REFERENCES tokens(address)
);
```

**ohlcv_data** (Candlestick data)
```sql
CREATE TABLE ohlcv_data (
  id SERIAL PRIMARY KEY,
  token_address VARCHAR(42) NOT NULL,
  interval VARCHAR(10) NOT NULL, -- '1m', '5m', '1h', etc.
  timestamp TIMESTAMP NOT NULL,
  open NUMERIC(78, 18) NOT NULL,
  high NUMERIC(78, 18) NOT NULL,
  low NUMERIC(78, 18) NOT NULL,
  close NUMERIC(78, 18) NOT NULL,
  volume NUMERIC(78, 18) NOT NULL,
  buy_volume NUMERIC(78, 18),
  sell_volume NUMERIC(78, 18),
  UNIQUE(token_address, interval, timestamp),
  FOREIGN KEY (token_address) REFERENCES tokens(address)
);
CREATE INDEX idx_ohlcv_token ON ohlcv_data(token_address, interval, timestamp DESC);
```

#### MongoDB Collections

**chat_messages**
```javascript
{
  _id: ObjectId,
  tokenAddress: String,
  userAddress: String,
  username: String, // ENS or shortened address
  message: String,
  reactions: [{
    emoji: String,
    userAddress: String
  }],
  createdAt: Date,
  deleted: Boolean
}
```

**chat_rooms**
```javascript
{
  _id: ObjectId,
  tokenAddress: String,
  memberCount: Number,
  lastActivity: Date,
  moderators: [String], // addresses
  bannedUsers: [String]
}
```

---

## API Endpoints

### Token Data
- `GET /api/tokens/:address` - Get token details
- `GET /api/tokens/:address/stats` - Get token statistics
- `GET /api/tokens/:address/progress` - Get graduation progress

### Trading
- `GET /api/tokens/:address/trades` - Get trade history (paginated)
- `GET /api/tokens/:address/trades?wallet=0x...` - Filter by wallet
- `GET /api/tokens/:address/quote?amount=1&type=buy` - Get trade quote
- `GET /api/tokens/:address/chart/:interval` - Get OHLCV data

### Holders
- `GET /api/tokens/:address/holders` - Get top holders
- `GET /api/tokens/:address/holders/stats` - Get holder statistics

### Comments
- `GET /api/tokens/:address/comments` - Get comments (paginated)
- `POST /api/tokens/:address/comments` - Post comment (requires auth)
- `PUT /api/comments/:id` - Edit comment
- `DELETE /api/comments/:id` - Delete comment
- `POST /api/comments/:id/like` - Like comment

### Chat
- `GET /api/tokens/:address/chat/messages` - Get recent messages
- `POST /api/tokens/:address/chat/join` - Join chat room
- WebSocket: `/ws/chat/:address` - Real-time messages

### User
- `GET /api/user/:address/positions` - Get user positions
- `GET /api/user/:address/favorites` - Get favorited tokens
- `POST /api/user/favorites` - Add favorite
- `DELETE /api/user/favorites/:address` - Remove favorite

---

## Real-time Features (WebSocket)

**Events:**
- `trade` - New trade executed
- `price_update` - Price change
- `comment_added` - New comment
- `chat_message` - New chat message
- `holder_update` - Holder balance change
- `graduation` - Token graduated to PancakeSwap

**Rooms:**
- `/token/:address` - All token updates
- `/chat/:address` - Chat messages for token
- `/user/:address` - User-specific updates

---

## Performance Optimization

1. **Caching Strategy**:
   - Redis cache for hot data (current price, holders)
   - 5-minute cache for holder list
   - 1-minute cache for token stats
   - Cache invalidation on trade events

2. **Data Aggregation**:
   - Pre-compute OHLCV data every minute
   - Background job to update holder balances
   - Materialized views for top traders

3. **Lazy Loading**:
   - Infinite scroll for trade history
   - Load chat messages on demand
   - Paginate holders list

4. **WebSocket Optimization**:
   - Throttle price updates (max 1/sec)
   - Batch trade events
   - Compress large messages

---

## Mobile Responsiveness

- **Breakpoints**:
  - Mobile: < 640px
  - Tablet: 640px - 1024px
  - Desktop: > 1024px

- **Mobile Layout**:
  - Stack trading panel below chart
  - Tabs in horizontal scroll
  - Simplified chart tools (drawer)
  - Bottom sheet for trade form

---

## Security Considerations

1. **Authentication**: Wallet signature verification (EIP-4361)
2. **Rate Limiting**: API endpoints, chat messages, comments
3. **Input Validation**: Sanitize all user inputs (XSS prevention)
4. **CSRF Protection**: Token-based CSRF for state-changing operations
5. **Content Moderation**: Report/flag system, auto-ban on spam

---

## Future Enhancements

1. **Advanced Chart Indicators**: Bollinger Bands, Fibonacci retracements
2. **Price Alerts**: Notify users on price targets
3. **Portfolio Tracking**: Multi-token portfolio view
4. **Social Features**: Follow traders, copy trading
5. **Analytics Dashboard**: Deep dive into token metrics
6. **Mobile App**: React Native app with push notifications
7. **Token Comparison**: Compare multiple tokens side-by-side
8. **Whale Alerts**: Notifications for large trades
9. **Governance**: Token holder voting (future)
10. **Limit Orders**: Off-chain limit order matching (Phase 3)

---

## Development Phases

### Phase 1: Core Token Page (Week 1-2)
- [ ] Token header and info card
- [ ] Basic trading panel (buy/sell)
- [ ] Simple price chart (TradingView)
- [ ] Trade history table
- [ ] Top holders list

### Phase 2: Advanced Chart (Week 3)
- [ ] Trade bubbles on chart
- [ ] Trade display filters
- [ ] Timeframe selector
- [ ] Chart tools and indicators
- [ ] Drawing tools

### Phase 3: Social Features (Week 4)
- [ ] Comments system
- [ ] Token chat
- [ ] User authentication
- [ ] Real-time WebSocket integration

### Phase 4: Analytics & Optimization (Week 5-6)
- [ ] OHLCV data aggregation
- [ ] Holder tracking system
- [ ] Performance optimization
- [ ] Mobile responsive design
- [ ] Testing and bug fixes

---

## Success Metrics

1. **User Engagement**:
   - Average session duration > 5 minutes
   - Chart interaction rate > 60%
   - Comment/chat participation > 20%

2. **Performance**:
   - Page load time < 2 seconds
   - Chart render time < 500ms
   - Real-time update latency < 100ms

3. **Trading**:
   - Trade completion rate > 90%
   - Average trades per user > 3
   - Return user rate > 50%

---

## Conclusion

This specification provides a comprehensive blueprint for building a world-class token page that rivals Pump.fun and DexTools. The focus is on:
- **Rich charting** with TradingView integration
- **Real-time data** via WebSocket
- **Social engagement** through comments and chat
- **Detailed analytics** for informed trading decisions
- **Mobile-first** responsive design

By implementing these features in phases, we can rapidly iterate and launch a compelling user experience for ASTER FUN traders.

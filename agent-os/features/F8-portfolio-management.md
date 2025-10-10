# F8: Portfolio Management

**Feature ID**: F8
**Priority**: High (Should-Have)
**Phase**: 2 - Advanced Features
**Dependencies**: F1 (Wallet Connection), F3 (Bonding Curve Trading)
**Status**: Specification

---

## Overview

User portfolio tracking showing token holdings, P&L calculation, transaction history, and performance analytics.

### User Value
- **Track Holdings**: See all tokens in one place
- **P&L Tracking**: Understand profit and loss
- **Transaction History**: Complete trade history
- **Performance Metrics**: ROI, win rate, avg hold time

---

## Features

### 1. Portfolio Overview
- Total portfolio value (in BNB and USD)
- Total P&L (realized + unrealized)
- Number of tokens held
- Best/worst performers
- Portfolio diversification chart

### 2. Holdings Table
| Token | Balance | Avg Buy Price | Current Price | P&L | Actions |
|-------|---------|---------------|---------------|-----|---------|
| DOGK | 450K | $0.000001 | $0.000001234 | +23.4% | Trade |
| PEPE2 | 1.2M | $0.000002 | $0.000001500 | -25% | Trade |

### 3. Transaction History
- All buys and sells
- Date, token, amount, price, total
- Filter by token, date range, type
- Export to CSV

---

## UI Components

```
┌──────────────────────────────────────────┐
│  My Portfolio                            │
├──────────────────────────────────────────┤
│  Total Value: 12.5 BNB ($15,643.625)     │
│  Total P&L: +2.3 BNB (+22.5%) ▲         │
│  Tokens Held: 8                          │
├──────────────────────────────────────────┤
│  [All] [Profitable] [At Loss]            │
│                                           │
│  DOGK          450K    +23.4% ▲  [Trade] │
│  PEPE2         1.2M    -25.0% ▼  [Trade] │
│  SHIB3         800K    +15.2% ▲  [Trade] │
│  ...                                      │
└──────────────────────────────────────────┘
```

---

## Backend Implementation

```typescript
GET /api/portfolio/:walletAddress
GET /api/portfolio/:walletAddress/history
GET /api/portfolio/:walletAddress/stats
```

### Database Schema
```sql
CREATE TABLE user_trades (
  id SERIAL PRIMARY KEY,
  wallet_address VARCHAR(42),
  token_address VARCHAR(42),
  type VARCHAR(4), -- 'buy' or 'sell'
  amount NUMERIC(78,18),
  price NUMERIC(78,18),
  total_bnb NUMERIC(78,18),
  fee NUMERIC(78,18),
  timestamp TIMESTAMP DEFAULT NOW()
);
```

---

## Implementation Checklist

- [ ] Trade tracking service
- [ ] P&L calculation algorithm
- [ ] Portfolio value aggregation
- [ ] Holdings display component
- [ ] Transaction history table
- [ ] Export functionality
- [ ] Real-time balance updates
- [ ] Mobile optimization

---

## Success Metrics

- **Adoption Rate**: > 60% of users use portfolio
- **Load Time**: < 2 seconds
- **P&L Accuracy**: 99.9%
- **Daily Active Users**: > 30%

---

**Status**: Detailed specification to be expanded in Phase 2 planning.

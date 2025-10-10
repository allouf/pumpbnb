# F12: Advanced Order Types

**Feature ID**: F12
**Priority**: Medium (Nice-to-Have)
**Phase**: 3 - Aster Integration & Mobile
**Dependencies**: F11 (Aster Protocol Integration)
**Status**: Specification

---

## Overview

Professional trading features including limit orders, stop-loss, take-profit, and conditional orders for both spot (bonding curve) and leverage (Aster) trading.

### User Value
- **Automated Trading**: Set orders and forget
- **Risk Management**: Stop-loss protection
- **Profit Taking**: Automatic take-profit
- **Advanced Strategies**: Conditional orders

---

## Order Types

### 1. Limit Order
Buy/sell at specific price or better

```
Type: Limit Buy
Token: DOGK
Price: $0.000001000
Amount: 500,000 DOGK
Status: [Pending] [Filled] [Cancelled]
```

### 2. Stop-Loss Order
Sell when price falls to limit losses

```
Type: Stop-Loss
Trigger Price: $0.000000900
Sell Amount: All holdings
Current Price: $0.000001234
Status: Monitoring
```

### 3. Take-Profit Order
Sell when price reaches target to lock profits

```
Type: Take-Profit
Trigger Price: $0.000002000
Sell Amount: 50% of holdings
Current Price: $0.000001234
Status: Monitoring
```

### 4. OCO (One-Cancels-Other)
Combine stop-loss and take-profit

```
Position: Long 1M DOGK
Take-Profit: $0.000002000 (sell 50%)
Stop-Loss: $0.000000900 (sell all)
```

---

## Implementation

### Order Manager Service

```typescript
class OrderManager {
  // Monitor price and execute orders
  async processOrders() {
    const activeOrders = await getActiveOrders();

    for (const order of activeOrders) {
      const currentPrice = await getPrice(order.tokenAddress);

      if (this.shouldExecute(order, currentPrice)) {
        await this.executeOrder(order);
      }
    }
  }

  shouldExecute(order, price) {
    switch (order.type) {
      case 'limit-buy':
        return price <= order.triggerPrice;
      case 'limit-sell':
        return price >= order.triggerPrice;
      case 'stop-loss':
        return price <= order.triggerPrice;
      case 'take-profit':
        return price >= order.triggerPrice;
    }
  }
}
```

### Database Schema

```sql
CREATE TABLE advanced_orders (
  id SERIAL PRIMARY KEY,
  user_address VARCHAR(42),
  token_address VARCHAR(42),
  order_type VARCHAR(20), -- 'limit-buy', 'limit-sell', 'stop-loss', 'take-profit'
  trigger_price NUMERIC(78,18),
  amount NUMERIC(78,18),
  status VARCHAR(20), -- 'pending', 'filled', 'cancelled', 'expired'
  created_at TIMESTAMP DEFAULT NOW(),
  filled_at TIMESTAMP,
  filled_price NUMERIC(78,18),
  tx_hash VARCHAR(66)
);
```

---

## UI Components

```
┌────────────────────────────────────────┐
│  Order Type: [Limit ▼]                 │
│                                         │
│  Price: [__________] BNB               │
│  Amount: [__________] DOGK              │
│                                         │
│  [When price reaches $0.000001000,     │
│   buy 500,000 DOGK]                    │
│                                         │
│  Expiry: [Good til cancelled ▼]        │
│                                         │
│  [Place Limit Order]                    │
└────────────────────────────────────────┘

Open Orders:
┌────────────────────────────────────────┐
│  Limit Buy | 500K DOGK @ $0.000001    │
│  [Cancel]                              │
├────────────────────────────────────────┤
│  Stop-Loss | Sell all @ $0.000000900  │
│  [Cancel]                              │
└────────────────────────────────────────┘
```

---

## Implementation Checklist

- [ ] Order matching engine
- [ ] Price monitoring service (cron every 10 seconds)
- [ ] Order execution logic
- [ ] Database schema and APIs
- [ ] Order management UI
- [ ] Mobile order interface
- [ ] Email/push notifications on fill
- [ ] Historical orders view

---

## Success Metrics

- **Order Adoption**: > 20% of traders use orders
- **Fill Rate**: > 90% of orders filled
- **Execution Latency**: < 30 seconds from trigger
- **Order Accuracy**: 99.9%

---

**Status**: Detailed specification to be expanded in Phase 3 planning.

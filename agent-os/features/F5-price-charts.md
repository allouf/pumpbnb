# F5: Real-time Price Charts

**Feature ID**: F5
**Priority**: Critical (Must-Have)
**Phase**: 1 - Core Platform (MVP)
**Dependencies**: F3 (Bonding Curve Trading)
**Status**: Specification

---

## Overview

Interactive price charts using TradingView Lightweight Charts showing real-time price movements, volume, and technical indicators for each token. Essential for traders to make informed decisions.

### User Value
- **Visual Price Discovery**: See price trends at a glance
- **Trading Insights**: Technical indicators for analysis
- **Volume Analysis**: Understand trading activity
- **Real-Time Updates**: Live price and volume updates

---

## User Stories

### As a trader
- I want to see price history before buying
- I want to analyze volume patterns
- I want to zoom in/out on different timeframes
- I want to see my entry/exit points on the chart

### As a day trader
- I want 1-minute candles for short-term trading
- I want technical indicators (MA, RSI, MACD)
- I want to draw trend lines and annotations

---

## Technical Requirements

### Chart Library
**TradingView Lightweight Charts**
- Lightweight and performant
- Supports candlestick, area, and line charts
- Real-time updates
- Mobile-friendly
- MIT licensed

### Timeframes

| Timeframe | Candlestick Interval | Data Retention |
|-----------|---------------------|----------------|
| **1m** | 1 minute | 24 hours |
| **5m** | 5 minutes | 7 days |
| **15m** | 15 minutes | 30 days |
| **1h** | 1 hour | 90 days |
| **4h** | 4 hours | 1 year |
| **1d** | 1 day | All time |

### Chart Types

1. **Candlestick** (Default for timeframes ≤ 1h)
   - Open, High, Low, Close (OHLC) data
   - Green/red coloring
   - Volume histogram below

2. **Line Chart** (Default for timeframes ≥ 4h)
   - Close price only
   - Smooth curve
   - Gradient fill

3. **Area Chart**
   - Fill below line
   - Good for long-term trends

---

## UI Components

### Chart Interface

```
┌────────────────────────────────────────────────┐
│  DOGK/BNB                    $0.000001234 ▲5.2%│
├────────────────────────────────────────────────┤
│  [1m] [5m] [15m] [1h] [4h] [1d]  [📊] [⚙]     │
├────────────────────────────────────────────────┤
│                                                 │
│              📈 PRICE CHART                     │
│                                                 │
│    $0.0000014 ┤          ╱╲                    │
│              ┤        ╱    ╲                   │
│    $0.0000012┤      ╱        ╲╱╲              │
│              ┤    ╱              ╲            │
│    $0.0000010┤  ╱                  ╲          │
│              └──────────────────────────       │
│               10:00  11:00  12:00  13:00       │
│                                                 │
├────────────────────────────────────────────────┤
│              📊 VOLUME                          │
│              ┃┃ ┃┃ ┃┃┃┃ ┃┃ ┃                   │
│              ┃┃ ┃┃ ┃┃┃┃ ┃┃ ┃                   │
└────────────────────────────────────────────────┘
```

### Chart Controls

```
⚙ Settings:
  ☑ Show Volume
  ☑ Show Grid
  ☑ Logarithmic Scale
  ☐ Show Indicators
  ☐ Show Trades (my trades highlighted)
```

---

## Data Structure

### OHLCV Data Format

```typescript
interface Candle {
  time: number;        // Unix timestamp
  open: number;        // Opening price
  high: number;        // Highest price
  low: number;         // Lowest price
  close: number;       // Closing price
  volume: number;      // Volume in BNB
}
```

### API Endpoints

```typescript
// Get historical candles
GET /api/charts/:tokenAddress/candles
Query: {
  timeframe: '1m' | '5m' | '15m' | '1h' | '4h' | '1d',
  from: 1696944000,  // Unix timestamp
  to: 1696947600,    // Unix timestamp
  limit: 500
}
Response: [Candle]

// Get latest price
GET /api/charts/:tokenAddress/price
Response: {
  price: 0.000001234,
  volume24h: 12456,
  change24h: 5.2,
  high24h: 0.000001456,
  low24h: 0.000001012
}
```

### WebSocket Real-Time Updates

```typescript
// Subscribe to price updates
socket.on('subscribe:chart', { tokenAddress, timeframe: '1m' });

// Receive candle updates
socket.on('candle-update', {
  time: 1696944060,
  open: 0.000001234,
  high: 0.000001245,
  low: 0.000001230,
  close: 0.000001240,
  volume: 1.5
});

// Receive trade updates (for tick chart)
socket.on('trade', {
  price: 0.000001240,
  amount: 100000,
  time: 1696944065,
  type: 'buy'
});
```

---

## Candle Aggregation Logic

### Database Schema

```sql
CREATE TABLE price_candles (
  token_address VARCHAR(42),
  timeframe VARCHAR(3),
  timestamp BIGINT,
  open NUMERIC(78,18),
  high NUMERIC(78,18),
  low NUMERIC(78,18),
  close NUMERIC(78,18),
  volume NUMERIC(78,18),
  PRIMARY KEY (token_address, timeframe, timestamp)
);

CREATE INDEX idx_candles ON price_candles(token_address, timeframe, timestamp DESC);
```

### Aggregation Service

```typescript
// Process every trade to update candles
async function onTrade(trade: Trade) {
  const timeframes = ['1m', '5m', '15m', '1h', '4h', '1d'];

  for (const timeframe of timeframes) {
    const candleTime = getCandleTime(trade.timestamp, timeframe);

    // Update or create candle
    await updateCandle({
      tokenAddress: trade.tokenAddress,
      timeframe,
      timestamp: candleTime,
      price: trade.price,
      volume: trade.volume
    });
  }
}

function updateCandle(data) {
  // If candle exists, update high/low/close/volume
  // If candle doesn't exist, create with price as OHLC
  return db.query(`
    INSERT INTO price_candles (token_address, timeframe, timestamp, open, high, low, close, volume)
    VALUES ($1, $2, $3, $4, $4, $4, $4, $5)
    ON CONFLICT (token_address, timeframe, timestamp)
    DO UPDATE SET
      high = GREATEST(price_candles.high, $4),
      low = LEAST(price_candles.low, $4),
      close = $4,
      volume = price_candles.volume + $5
  `, [data.tokenAddress, data.timeframe, data.timestamp, data.price, data.volume]);
}
```

---

## Technical Indicators (Phase 2 - Nice to Have)

### Moving Averages
```typescript
interface Indicator {
  type: 'SMA' | 'EMA' | 'RSI' | 'MACD';
  period: number;
  color: string;
}

// Simple Moving Average
function calculateSMA(candles: Candle[], period: number): number[] {
  return candles.map((_, i, arr) => {
    if (i < period - 1) return null;
    const slice = arr.slice(i - period + 1, i + 1);
    return slice.reduce((sum, c) => sum + c.close, 0) / period;
  });
}
```

### Available Indicators
- **SMA (Simple Moving Average)**: 7, 25, 99 periods
- **EMA (Exponential Moving Average)**: 7, 25, 99 periods
- **RSI (Relative Strength Index)**: 14 periods
- **MACD**: 12, 26, 9 periods
- **Bollinger Bands**: 20 periods, 2 std dev

---

## Acceptance Criteria

### Must Have
- [ ] Charts load in < 2 seconds
- [ ] Real-time price updates (< 1 second delay)
- [ ] 6 timeframes (1m, 5m, 15m, 1h, 4h, 1d)
- [ ] Candlestick and line chart types
- [ ] Volume histogram
- [ ] Zoom and pan functionality
- [ ] Mobile-responsive
- [ ] Tooltips show OHLCV on hover

### Should Have
- [ ] Crosshair with price labels
- [ ] Price scale on right
- [ ] Time scale on bottom
- [ ] Toggle volume visibility
- [ ] Logarithmic scale option
- [ ] Full-screen mode

### Nice to Have
- [ ] Technical indicators (MA, RSI, MACD)
- [ ] Drawing tools (trend lines, support/resistance)
- [ ] Save chart preferences
- [ ] Compare multiple tokens
- [ ] Export chart as image

---

## Performance Requirements

| Metric | Target | Notes |
|--------|--------|-------|
| **Initial Load** | < 2 seconds | Load 500 candles |
| **Real-Time Update** | < 1 second | WebSocket latency |
| **Render Performance** | 60 FPS | Smooth animations |
| **Memory Usage** | < 50MB | Per chart instance |
| **Zoom/Pan** | Instant | No lag |

---

## Implementation Checklist

### Week 1: Data Pipeline
- [ ] Database schema for candles
- [ ] Trade aggregation service
- [ ] Candle generation for all timeframes
- [ ] Historical data backfill
- [ ] API endpoints for candle data

### Week 2: Chart Integration
- [ ] Install TradingView Lightweight Charts
- [ ] Basic candlestick chart
- [ ] Timeframe selector
- [ ] Real-time WebSocket updates
- [ ] Volume histogram

### Week 3: Features
- [ ] Chart type toggle (candlestick/line/area)
- [ ] Zoom and pan
- [ ] Tooltips and crosshair
- [ ] Price/time scales
- [ ] Mobile responsiveness

### Week 4: Polish
- [ ] Performance optimization
- [ ] Error states (no data)
- [ ] Loading skeletons
- [ ] Chart settings
- [ ] User testing

---

## Success Metrics

- **Chart Load Time**: < 2 seconds
- **Update Latency**: < 1 second for real-time
- **User Engagement**: > 70% of users view charts
- **Chart Interactions**: > 30% zoom/pan/change timeframe
- **Mobile Usage**: > 40% of chart views on mobile

---

**Next Steps**: Review specification, begin data aggregation service and chart component development.

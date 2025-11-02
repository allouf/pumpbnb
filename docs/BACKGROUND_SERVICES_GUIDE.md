# Background Services Guide

## Overview

Complete set of background automation services for the ASTER FUN platform. These services handle data aggregation, cache warming, and real-time updates to provide a smooth user experience.

**Status**: ✅ **All 3 core background services complete and integrated**

---

## 📦 Services

### 1. OHLCV Aggregation Service

Aggregates trade data into candlestick (OHLCV) data for charting.

**Purpose**: Powers the PriceChart component with real-time candlestick data across multiple timeframes.

**Features**:
- Runs as cron job with configurable intervals per timeframe
- Supports 6 timeframes: 1m, 5m, 15m, 1h, 4h, 1d
- Aggregates trades into OHLCV candles automatically
- Emits WebSocket events for real-time chart updates
- Manual aggregation API for immediate updates
- Backfill functionality for historical data

**Timeframe Schedule**:
```typescript
{
  '1m': 60 * 1000,          // Runs every 1 minute
  '5m': 5 * 60 * 1000,      // Runs every 5 minutes
  '15m': 15 * 60 * 1000,    // Runs every 15 minutes
  '1h': 60 * 60 * 1000,     // Runs every 1 hour
  '4h': 4 * 60 * 60 * 1000, // Runs every 4 hours
  '1d': 24 * 60 * 60 * 1000, // Runs every 24 hours
}
```

**Usage**:

```typescript
import { ohlcvAggregatorService } from './services/ohlcv-aggregator.service';

// Start the service (automatically started in server.ts)
ohlcvAggregatorService.start();

// Manually aggregate a specific token and timeframe
await ohlcvAggregatorService.aggregateToken('0x123...', '15m');

// Aggregate all timeframes for a token (useful after a trade)
await ohlcvAggregatorService.aggregateAllTimeframesForToken('0x123...');

// Backfill historical data
await ohlcvAggregatorService.backfillToken(
  '0x123...',
  new Date('2025-01-01'),
  new Date('2025-11-02')
);

// Get service status
const status = ohlcvAggregatorService.getStatus();
// { isRunning: true, activeTimeframes: ['1m', '5m', '15m', '1h', '4h', '1d'] }

// Stop the service (graceful shutdown)
ohlcvAggregatorService.stop();
```

**Integration Points**:
- **Database**: Reads from `Trade` table, writes to `OHLCVData` table
- **WebSocket**: Emits `token:candle` events with updated candle data
- **Trade Indexer**: Automatically triggered after each trade is indexed
- **Frontend**: PriceChart component listens to `token:candle` events

**Data Flow**:
```
Trade Indexed → aggregateAllTimeframesForToken() → Aggregate trades into candles
  → Save to OHLCVData table → Emit WebSocket event → Frontend chart updates
```

---

### 2. Holder Balance Updater Service

Updates token holder balances in real-time as trades occur.

**Purpose**: Powers the HoldersPanel component with accurate, real-time holder data and distribution statistics.

**Features**:
- Event-driven architecture (listens to trade events)
- Updates holder balances instantly after trades
- Recalculates holder statistics (concentration, Gini coefficient)
- Emits WebSocket events for real-time UI updates
- Handles holder creation and removal (when balance reaches 0)
- Backfill functionality to rebuild all holders from trades

**Statistics Calculated**:
- Total holders count
- Top 10% concentration (percentage of supply held by top 10% of holders)
- Gini coefficient (measure of wealth inequality, 0 = perfect equality, 1 = perfect inequality)

**Usage**:

```typescript
import { holderUpdaterService } from './services/holder-updater.service';

// Start the service (automatically started in server.ts)
holderUpdaterService.start();

// Emit trade event (called by trade indexer)
holderUpdaterService.emitTradeEvent({
  tokenAddress: '0x123...',
  trader: '0xabc...',
  isBuy: true,
  tokenAmount: '1000000000000000000', // 1 token (18 decimals)
  timestamp: new Date(),
});

// Manually refresh all holders for a token (backfill)
await holderUpdaterService.refreshAllHolders('0x123...');

// Get service status
const status = holderUpdaterService.getStatus();
// { isRunning: true, eventListeners: 1 }

// Stop the service
holderUpdaterService.stop();
```

**Integration Points**:
- **Database**: Updates `TokenHolder` table
- **WebSocket**: Emits `token:holder-update` and `token:holder-stats` events
- **Trade Indexer**: Trade indexer emits events after each trade
- **Frontend**: HoldersPanel component listens to holder events

**Data Flow**:
```
Trade Indexed → emitTradeEvent() → updateHolderBalance() → Update TokenHolder table
  → updateHolderStats() → Emit WebSocket events → Frontend holders panel updates
```

**Holder Statistics Calculation**:

**Gini Coefficient Formula**:
```
G = (2 * Σ(i * x_i)) / (n * Σ(x_i)) - (n + 1) / n

Where:
- n = number of holders
- x_i = balance of holder i (sorted in ascending order)
- i = rank of holder (1 to n)
```

**Example Holder Distribution**:
```
Holders: [100, 200, 300, 400, 500] tokens
Gini: 0.2 (relatively equal distribution)

Holders: [1, 1, 1, 1, 9996] tokens
Gini: 0.998 (highly concentrated, one whale)
```

---

### 3. Cache Warming Service

Pre-populates Redis cache with frequently accessed data to improve API response times.

**Purpose**: Reduce database load and improve API performance by proactively caching hot data.

**Features**:
- Runs as periodic cron job (configurable interval, default: 5 minutes)
- Warms cache for trending tokens, recent tokens, and popular endpoints
- Monitors cache hit rates
- Prevents cache stampede during high traffic
- Configurable number of tokens and data to cache
- Manual cache warming API for specific tokens

**Configuration**:
```typescript
interface CacheWarmingConfig {
  topTokensByVolume: number;    // Default: 20
  recentTokens: number;          // Default: 10
  warmInterval: number;          // Default: 5 minutes
  tradesPerToken: number;        // Default: 50
  holdersPerToken: number;       // Default: 50
}
```

**Data Cached**:
- Trending tokens (top 20 by 24h volume)
- Recent tokens (last 10 created)
- Token statistics (price, market cap, volume, etc.)
- Recent trades per token
- Top holders per token
- Platform-wide statistics

**Usage**:

```typescript
import { cacheWarmerService } from './services/cache-warmer.service';

// Start with custom config
cacheWarmerService.start({
  topTokensByVolume: 30,
  recentTokens: 15,
  warmInterval: 3 * 60 * 1000, // 3 minutes
  tradesPerToken: 100,
  holdersPerToken: 100,
});

// Manually warm cache for a specific token
await cacheWarmerService.warmToken('0x123...');

// Get cache statistics
const stats = await cacheWarmerService.getCacheStats();
// {
//   keys: 1234,
//   memory: '12.5MB',
//   hits: 50000,
//   misses: 1000,
//   hitRate: 98.04
// }

// Clear all cache (use with caution!)
await cacheWarmerService.clearAll();

// Get service status
const status = cacheWarmerService.getStatus();
// { isRunning: true, config: {...}, nextRunIn: 300000 }

// Stop the service
cacheWarmerService.stop();
```

**Integration Points**:
- **Redis**: Reads/writes cache data
- **Database**: Fetches data from Prisma to populate cache
- **API Endpoints**: All API endpoints benefit from cached data
- **Frontend**: Faster API responses improve user experience

**Cache Keys Pattern**:
```typescript
// Token trades
`token:trades:${tokenAddress}:${limit}`

// Token holders
`token:holders:${tokenAddress}:${limit}`

// Token stats
`token:stats:${tokenAddress}`

// Trending tokens
`tokens:trending`

// Recent tokens
`tokens:recent`

// Platform stats
`platform:stats`

// OHLCV data
`ohlcv:${tokenAddress}:${timeframe}:${from}:${to}`
```

**Cache TTL (Time To Live)**:
```typescript
// Configured via environment variables
{
  CACHE_TRADES_TTL: 10,        // 10 seconds (real-time data)
  CACHE_HOLDERS_TTL: 30,       // 30 seconds
  CACHE_STATS_TTL: 60,         // 1 minute
  CACHE_TRENDING_TTL: 60,      // 1 minute
  CACHE_RECENT_TTL: 30,        // 30 seconds
  CACHE_PLATFORM_STATS_TTL: 300, // 5 minutes
}
```

---

## 🚀 Getting Started

### Automatic Startup

All background services are automatically started when the backend server starts:

```typescript
// backend/src/server.ts
import { ohlcvAggregatorService } from './services/ohlcv-aggregator.service';
import { holderUpdaterService } from './services/holder-updater.service';
import { cacheWarmerService } from './services/cache-warmer.service';

async function startServer() {
  // ... database and websocket initialization

  // Start background services
  ohlcvAggregatorService.start();
  holderUpdaterService.start();
  cacheWarmerService.start();

  // ... start HTTP server
}
```

### Graceful Shutdown

All services support graceful shutdown on SIGTERM/SIGINT:

```typescript
const gracefulShutdown = async (signal: string) => {
  logger.info(`${signal} signal received: shutting down gracefully`);

  // Stop background services
  ohlcvAggregatorService.stop();
  holderUpdaterService.stop();
  cacheWarmerService.stop();

  // Close HTTP server
  server.close(() => process.exit(0));

  // Force close after 10 seconds
  setTimeout(() => process.exit(1), 10000);
};
```

---

## ⚙️ Configuration

### Environment Variables

```bash
# Redis Cache TTLs (in seconds)
CACHE_TRADES_TTL=10
CACHE_HOLDERS_TTL=30
CACHE_STATS_TTL=60
CACHE_TRENDING_TTL=60
CACHE_RECENT_TTL=30
CACHE_PLATFORM_STATS_TTL=300

# OHLCV Aggregation (optional, hardcoded defaults)
# No env vars needed - intervals are defined in code

# Cache Warming (optional, can be overridden in code)
# No env vars needed - config passed to start() method
```

---

## 📊 Monitoring

### Service Status Endpoints

You can add API endpoints to monitor service health:

```typescript
// GET /api/admin/services/status
{
  ohlcvAggregator: {
    isRunning: true,
    activeTimeframes: ['1m', '5m', '15m', '1h', '4h', '1d']
  },
  holderUpdater: {
    isRunning: true,
    eventListeners: 1
  },
  cacheWarmer: {
    isRunning: true,
    config: {...},
    nextRunIn: 300000
  },
  cache: {
    keys: 1234,
    memory: '12.5MB',
    hits: 50000,
    misses: 1000,
    hitRate: 98.04
  }
}
```

### Logging

All services use the Winston logger with structured logging:

```typescript
logger.info('Starting OHLCV Aggregation Service');
logger.debug(`Aggregating ${timeframe} candles for ${tokens.length} tokens`);
logger.error('Failed to aggregate candles:', error);
```

**Log Levels**:
- `info`: Service lifecycle events (start, stop, major operations)
- `debug`: Detailed operation logs (useful for debugging)
- `warn`: Non-critical issues (already cached data, etc.)
- `error`: Critical failures (database errors, etc.)

---

## 🔧 Troubleshooting

### OHLCV Aggregation Issues

**Problem**: Charts show no data
- **Check**: Are trades being indexed? Verify trades exist in database
- **Check**: Is OHLCV aggregator running? Call `getStatus()`
- **Check**: Database has OHLCV candles? Query `OHLCVData` table
- **Fix**: Run manual aggregation: `aggregateToken(address, timeframe)`

**Problem**: Old candles not updating
- **Check**: Aggregator intervals running? Look for periodic logs
- **Check**: Trade indexer emitting events? Check immediate-trade-indexer logs
- **Fix**: Restart OHLCV aggregator service

### Holder Balance Issues

**Problem**: Holder balances incorrect
- **Check**: Is holder updater running? Call `getStatus()`
- **Check**: Trade events being emitted? Check immediate-trade-indexer integration
- **Fix**: Run `refreshAllHolders(tokenAddress)` to rebuild from trades

**Problem**: Holder stats not updating
- **Check**: Are holder update events emitted? Check WebSocket logs
- **Check**: Frontend listening to `token:holder-update` events?
- **Fix**: Manually trigger stats recalculation

### Cache Warming Issues

**Problem**: Low cache hit rate
- **Check**: Is cache warmer running? Call `getStatus()`
- **Check**: Cache TTLs too short? Adjust env variables
- **Check**: Too few tokens being cached? Increase `topTokensByVolume`
- **Fix**: Increase warm interval to reduce cache eviction

**Problem**: High memory usage
- **Check**: Too many tokens being cached? Reduce `topTokensByVolume`
- **Check**: Too much data per token? Reduce `tradesPerToken`, `holdersPerToken`
- **Fix**: Clear cache and restart: `clearAll()` then `start()`

---

## 🧪 Testing

### Manual Testing

```typescript
// Test OHLCV Aggregation
import { ohlcvAggregatorService } from './services/ohlcv-aggregator.service';

const tokenAddress = '0x...'; // Replace with real token

// Aggregate all timeframes
await ohlcvAggregatorService.aggregateAllTimeframesForToken(tokenAddress);

// Check database
const candles = await prisma.oHLCVData.findMany({
  where: { tokenAddress, timeframe: '15m' },
  orderBy: { timestamp: 'desc' },
  take: 10,
});

console.log('Latest 15m candles:', candles);
```

```typescript
// Test Holder Updater
import { holderUpdaterService } from './services/holder-updater.service';

const tokenAddress = '0x...'; // Replace with real token

// Rebuild all holders
await holderUpdaterService.refreshAllHolders(tokenAddress);

// Check database
const holders = await prisma.tokenHolder.findMany({
  where: { tokenAddress },
  orderBy: { percentage: 'desc' },
  take: 10,
});

console.log('Top 10 holders:', holders);
```

```typescript
// Test Cache Warmer
import { cacheWarmerService } from './services/cache-warmer.service';

// Warm cache
await cacheWarmerService.warmToken('0x...');

// Check cache stats
const stats = await cacheWarmerService.getCacheStats();
console.log('Cache stats:', stats);
```

---

## 🚨 Known Limitations

1. **OHLCV Aggregation**:
   - Lookback window is fixed per timeframe (can't customize)
   - No support for custom timeframes beyond the 6 predefined ones
   - Backfill can be slow for tokens with many trades

2. **Holder Updater**:
   - Gini coefficient calculation can be slow for tokens with many holders (>10,000)
   - No support for tracking historical holder changes over time
   - Event-driven model assumes trades are indexed (won't catch external transfers)

3. **Cache Warmer**:
   - No intelligent cache eviction strategy (uses Redis default LRU)
   - Memory usage can grow unbounded if too many tokens cached
   - No per-endpoint cache warming (caches entire datasets)

---

## 📚 Next Steps

### Recommended Enhancements

1. **Admin Dashboard**:
   - Real-time service monitoring UI
   - Manual trigger buttons for each service
   - Cache hit rate graphs
   - Service health alerts

2. **Performance Optimizations**:
   - Batch OHLCV aggregation (multiple tokens at once)
   - Parallel holder balance updates
   - Intelligent cache warming (based on access patterns)

3. **Advanced Features**:
   - Custom timeframe support (3m, 30m, 2h, etc.)
   - Historical holder snapshots (track changes over time)
   - Predictive cache warming (ML-based)
   - Multi-region cache replication

---

## 🎯 Service Checklist

- ✅ OHLCV Aggregation Service - Real-time chart data
- ✅ Holder Balance Updater Service - Real-time holder tracking
- ✅ Cache Warming Service - Performance optimization
- ✅ WebSocket Integration - Real-time events
- ✅ Trade Indexer Integration - Automatic triggers
- ✅ Graceful Shutdown - Clean service termination
- ✅ Comprehensive Logging - Debugging support

---

**Status**: ✅ **All Background Services Complete - Ready for Production**

Last Updated: 2025-11-02

import { OHLCVData } from '@prisma/client';
import { prisma } from './db.service';
import { cache, cacheKeys } from '../config/redis';
import { Timeframe, ChartData } from '../types/tokenPage';

class OHLCVService {
  /**
   * Get OHLCV data for a token within a time range
   */
  async getOHLCVData(
    tokenAddress: string,
    timeframe: Timeframe,
    from: Date,
    to: Date
  ): Promise<OHLCVData[]> {
    const address = tokenAddress.toLowerCase();

    // Try cache first
    const fromTs = from.getTime();
    const toTs = to.getTime();
    const cacheKey = cacheKeys.ohlcv(address, timeframe, fromTs, toTs);

    const cached = await cache.get<OHLCVData[]>(cacheKey);
    if (cached) {
      return cached;
    }

    // Fetch from database
    const data = await prisma.oHLCVData.findMany({
      where: {
        tokenAddress: address,
        timeframe,
        timestamp: {
          gte: from,
          lte: to,
        },
      },
      orderBy: { timestamp: 'asc' },
    });

    // Cache for 1 minute (chart data is relatively static)
    await cache.set(cacheKey, data, 60);

    return data;
  }

  /**
   * Get chart data formatted for TradingView Lightweight Charts
   */
  async getChartData(
    tokenAddress: string,
    timeframe: Timeframe,
    from: Date,
    to: Date
  ): Promise<ChartData[]> {
    const ohlcvData = await this.getOHLCVData(tokenAddress, timeframe, from, to);

    return ohlcvData.map((candle) => ({
      timestamp: Math.floor(candle.timestamp.getTime() / 1000), // Convert to Unix timestamp in seconds
      open: parseFloat(candle.open),
      high: parseFloat(candle.high),
      low: parseFloat(candle.low),
      close: parseFloat(candle.close),
      volume: parseFloat(candle.volume),
    }));
  }

  /**
   * Get latest candle for a token
   */
  async getLatestCandle(
    tokenAddress: string,
    timeframe: Timeframe
  ): Promise<OHLCVData | null> {
    return prisma.oHLCVData.findFirst({
      where: {
        tokenAddress: tokenAddress.toLowerCase(),
        timeframe,
      },
      orderBy: { timestamp: 'desc' },
    });
  }

  /**
   * Create or update OHLCV candle
   * (This will be called by a background aggregation service)
   */
  async upsertCandle(data: {
    tokenAddress: string;
    timeframe: string;
    timestamp: Date;
    open: string;
    high: string;
    low: string;
    close: string;
    volume: string;
    trades: number;
  }): Promise<OHLCVData> {
    const candle = await prisma.oHLCVData.upsert({
      where: {
        tokenAddress_timeframe_timestamp: {
          tokenAddress: data.tokenAddress.toLowerCase(),
          timeframe: data.timeframe,
          timestamp: data.timestamp,
        },
      },
      update: {
        high: data.high,
        low: data.low,
        close: data.close,
        volume: data.volume,
        trades: data.trades,
      },
      create: {
        tokenAddress: data.tokenAddress.toLowerCase(),
        timeframe: data.timeframe,
        timestamp: data.timestamp,
        open: data.open,
        high: data.high,
        low: data.low,
        close: data.close,
        volume: data.volume,
        trades: data.trades,
      },
    });

    // Invalidate cache for this timeframe
    await this.invalidateCache(data.tokenAddress, data.timeframe as Timeframe);

    return candle;
  }

  /**
   * Aggregate OHLCV data from trades
   * This creates candles from raw trade data
   */
  async aggregateFromTrades(
    tokenAddress: string,
    timeframe: Timeframe,
    from: Date,
    to: Date
  ): Promise<OHLCVData[]> {
    const address = tokenAddress.toLowerCase();

    // Get all trades in the time range
    const trades = await prisma.trade.findMany({
      where: {
        tokenAddress: address,
        timestamp: {
          gte: from,
          lte: to,
        },
      },
      orderBy: { timestamp: 'asc' },
      select: {
        timestamp: true,
        price: true,
        asterAmount: true,
      },
    });

    if (trades.length === 0) {
      return [];
    }

    // Calculate timeframe interval in milliseconds
    const intervals: Record<Timeframe, number> = {
      '1m': 60 * 1000,
      '5m': 5 * 60 * 1000,
      '15m': 15 * 60 * 1000,
      '1h': 60 * 60 * 1000,
      '4h': 4 * 60 * 60 * 1000,
      '1d': 24 * 60 * 60 * 1000,
    };

    const intervalMs = intervals[timeframe];

    // Group trades into candles
    const candlesMap = new Map<number, {
      open: string;
      high: string;
      low: string;
      close: string;
      volume: bigint;
      trades: number;
    }>();

    trades.forEach((trade) => {
      // Skip trades with null price (old records before price tracking was added)
      if (!trade.price) {
        return;
      }

      const candleTime = Math.floor(trade.timestamp.getTime() / intervalMs) * intervalMs;

      const existing = candlesMap.get(candleTime);
      const price = trade.price;
      const volume = BigInt(trade.asterAmount);

      if (!existing) {
        candlesMap.set(candleTime, {
          open: price,
          high: price,
          low: price,
          close: price,
          volume,
          trades: 1,
        });
      } else {
        existing.high = this.maxPrice(existing.high, price);
        existing.low = this.minPrice(existing.low, price);
        existing.close = price;
        existing.volume += volume;
        existing.trades += 1;
      }
    });

    // Create candles in database
    const candles: OHLCVData[] = [];
    for (const [candleTime, data] of candlesMap) {
      const candle = await this.upsertCandle({
        tokenAddress: address,
        timeframe,
        timestamp: new Date(candleTime),
        open: data.open,
        high: data.high,
        low: data.low,
        close: data.close,
        volume: data.volume.toString(),
        trades: data.trades,
      });
      candles.push(candle);
    }

    return candles;
  }

  /**
   * Helper: Compare prices and return max
   */
  private maxPrice(a: string, b: string): string {
    return parseFloat(a) > parseFloat(b) ? a : b;
  }

  /**
   * Helper: Compare prices and return min
   */
  private minPrice(a: string, b: string): string {
    return parseFloat(a) < parseFloat(b) ? a : b;
  }

  /**
   * Invalidate OHLCV cache for a token/timeframe
   */
  async invalidateCache(tokenAddress: string, timeframe: Timeframe): Promise<void> {
    const address = tokenAddress.toLowerCase();
    await cache.delPattern(`ohlcv:${address}:${timeframe}:*`);
  }
}

export const ohlcvService = new OHLCVService();
export default ohlcvService;

/**
 * OHLCV Aggregation Service
 *
 * Background cron job that aggregates trade data into OHLCV candlestick data
 * for multiple timeframes (1m, 5m, 15m, 1h, 4h, 1d)
 *
 * This service:
 * 1. Runs periodically (every minute for 1m candles, etc.)
 * 2. Fetches recent trades from database
 * 3. Aggregates them into OHLCV candles
 * 4. Emits WebSocket events for real-time chart updates
 */

import { prisma } from './db.service';
import { ohlcvService } from './ohlcv.service';
import { websocketService } from './websocket.service';
import logger from '../utils/logger';
import { Timeframe } from '../types/tokenPage';

export class OHLCVAggregatorService {
  private isRunning: boolean = false;
  private intervals: Map<Timeframe, NodeJS.Timeout> = new Map();

  /**
   * Start all aggregation cron jobs
   */
  start(): void {
    if (this.isRunning) {
      logger.warn('OHLCV Aggregator is already running');
      return;
    }

    logger.info('Starting OHLCV Aggregation Service');

    // Configure intervals for each timeframe (in milliseconds)
    const timeframeIntervals: Record<Timeframe, number> = {
      '1m': 60 * 1000,        // Run every 1 minute
      '5m': 5 * 60 * 1000,    // Run every 5 minutes
      '15m': 15 * 60 * 1000,  // Run every 15 minutes
      '1h': 60 * 60 * 1000,   // Run every 1 hour
      '4h': 4 * 60 * 60 * 1000, // Run every 4 hours
      '1d': 24 * 60 * 60 * 1000, // Run every 24 hours
    };

    // Start aggregation for each timeframe
    for (const [timeframe, intervalMs] of Object.entries(timeframeIntervals)) {
      // Run immediately on startup
      this.aggregateTimeframe(timeframe as Timeframe).catch((err) => {
        logger.error(`Initial aggregation failed for ${timeframe}:`, err);
      });

      // Schedule periodic aggregation
      const interval = setInterval(() => {
        this.aggregateTimeframe(timeframe as Timeframe).catch((err) => {
          logger.error(`Periodic aggregation failed for ${timeframe}:`, err);
        });
      }, intervalMs);

      this.intervals.set(timeframe as Timeframe, interval);
      logger.info(`Started ${timeframe} aggregation (interval: ${intervalMs}ms)`);
    }

    this.isRunning = true;
    logger.info('OHLCV Aggregation Service started successfully');
  }

  /**
   * Stop all aggregation cron jobs
   */
  stop(): void {
    if (!this.isRunning) {
      logger.warn('OHLCV Aggregator is not running');
      return;
    }

    logger.info('Stopping OHLCV Aggregation Service');

    // Clear all intervals
    for (const [timeframe, interval] of this.intervals) {
      clearInterval(interval);
      logger.info(`Stopped ${timeframe} aggregation`);
    }

    this.intervals.clear();
    this.isRunning = false;
    logger.info('OHLCV Aggregation Service stopped');
  }

  /**
   * Aggregate OHLCV data for a specific timeframe
   */
  private async aggregateTimeframe(timeframe: Timeframe): Promise<void> {
    const startTime = Date.now();
    logger.info(`Starting ${timeframe} aggregation`);

    try {
      // Get all tokens that have trades
      const tokens = await prisma.token.findMany({
        where: {
          trades: {
            some: {}, // Has at least one trade
          },
        },
        select: {
          address: true,
        },
      });

      if (tokens.length === 0) {
        logger.info(`No tokens with trades found for ${timeframe} aggregation`);
        return;
      }

      logger.info(`Aggregating ${timeframe} candles for ${tokens.length} tokens`);

      // Calculate time range based on timeframe
      const { from, to } = this.getTimeRange(timeframe);

      // Aggregate each token's trades
      let totalCandles = 0;
      let updatedTokens = 0;

      for (const token of tokens) {
        try {
          const candles = await ohlcvService.aggregateFromTrades(
            token.address,
            timeframe,
            from,
            to
          );

          if (candles.length > 0) {
            totalCandles += candles.length;
            updatedTokens++;

            // Broadcast the latest candle via WebSocket
            const latestCandle = candles[candles.length - 1];
            await this.broadcastCandleUpdate(token.address, timeframe, latestCandle);
          }
        } catch (error) {
          logger.error(`Failed to aggregate ${timeframe} for token ${token.address}:`, error);
        }
      }

      const duration = Date.now() - startTime;
      logger.info(
        `Completed ${timeframe} aggregation: ${totalCandles} candles for ${updatedTokens}/${tokens.length} tokens in ${duration}ms`
      );
    } catch (error) {
      logger.error(`Failed to aggregate ${timeframe} candles:`, error);
      throw error;
    }
  }

  /**
   * Calculate time range for aggregation based on timeframe
   */
  private getTimeRange(timeframe: Timeframe): { from: Date; to: Date } {
    const now = new Date();
    const to = now;

    // Calculate how far back to look based on timeframe
    const lookbackMs: Record<Timeframe, number> = {
      '1m': 2 * 60 * 1000,        // Last 2 minutes (current + previous)
      '5m': 10 * 60 * 1000,       // Last 10 minutes
      '15m': 30 * 60 * 1000,      // Last 30 minutes
      '1h': 2 * 60 * 60 * 1000,   // Last 2 hours
      '4h': 8 * 60 * 60 * 1000,   // Last 8 hours
      '1d': 2 * 24 * 60 * 60 * 1000, // Last 2 days
    };

    const from = new Date(now.getTime() - lookbackMs[timeframe]);

    return { from, to };
  }

  /**
   * Broadcast candle update via WebSocket
   */
  private async broadcastCandleUpdate(
    tokenAddress: string,
    timeframe: Timeframe,
    candle: any
  ): Promise<void> {
    try {
      const candleData = {
        tokenAddress,
        timeframe,
        timestamp: candle.timestamp.toISOString(),
        open: candle.open,
        high: candle.high,
        low: candle.low,
        close: candle.close,
        volume: candle.volume,
        trades: candle.trades,
      };

      // Broadcast via WebSocket service
      websocketService.publishEvent('CandleUpdate', candleData);

      logger.debug(`Broadcasted ${timeframe} candle for ${tokenAddress}`);
    } catch (error) {
      logger.error(`Failed to broadcast candle update:`, error);
    }
  }

  /**
   * Manually trigger aggregation for a specific token and timeframe
   * Useful for testing or immediate updates after a trade
   */
  async aggregateToken(
    tokenAddress: string,
    timeframe: Timeframe
  ): Promise<number> {
    logger.info(`Manual aggregation for token ${tokenAddress} (${timeframe})`);

    const { from, to } = this.getTimeRange(timeframe);

    const candles = await ohlcvService.aggregateFromTrades(
      tokenAddress,
      timeframe,
      from,
      to
    );

    if (candles.length > 0) {
      const latestCandle = candles[candles.length - 1];
      await this.broadcastCandleUpdate(tokenAddress, timeframe, latestCandle);
    }

    logger.info(
      `Manual aggregation complete: ${candles.length} candles for ${tokenAddress} (${timeframe})`
    );

    return candles.length;
  }

  /**
   * Aggregate all timeframes for a specific token
   * Useful when a new token is created or after trades
   */
  async aggregateAllTimeframesForToken(tokenAddress: string): Promise<void> {
    logger.info(`Aggregating all timeframes for token ${tokenAddress}`);

    const timeframes: Timeframe[] = ['1m', '5m', '15m', '1h', '4h', '1d'];

    for (const timeframe of timeframes) {
      try {
        await this.aggregateToken(tokenAddress, timeframe);
      } catch (error) {
        logger.error(
          `Failed to aggregate ${timeframe} for ${tokenAddress}:`,
          error
        );
      }
    }

    logger.info(`All timeframes aggregated for token ${tokenAddress}`);
  }

  /**
   * Get aggregation status
   */
  getStatus(): {
    isRunning: boolean;
    activeTimeframes: Timeframe[];
  } {
    return {
      isRunning: this.isRunning,
      activeTimeframes: Array.from(this.intervals.keys()),
    };
  }

  /**
   * Backfill historical OHLCV data for a token
   * Useful for newly indexed tokens
   */
  async backfillToken(
    tokenAddress: string,
    startDate: Date,
    endDate: Date = new Date()
  ): Promise<void> {
    logger.info(
      `Backfilling OHLCV data for ${tokenAddress} from ${startDate.toISOString()} to ${endDate.toISOString()}`
    );

    const timeframes: Timeframe[] = ['1m', '5m', '15m', '1h', '4h', '1d'];

    for (const timeframe of timeframes) {
      try {
        logger.info(`Backfilling ${timeframe} for ${tokenAddress}`);

        const candles = await ohlcvService.aggregateFromTrades(
          tokenAddress,
          timeframe,
          startDate,
          endDate
        );

        logger.info(
          `Backfilled ${candles.length} ${timeframe} candles for ${tokenAddress}`
        );
      } catch (error) {
        logger.error(
          `Failed to backfill ${timeframe} for ${tokenAddress}:`,
          error
        );
      }
    }

    logger.info(`Backfill complete for ${tokenAddress}`);
  }
}

export const ohlcvAggregatorService = new OHLCVAggregatorService();
export default ohlcvAggregatorService;

import { prisma } from './database.service';
import { Trade, PaginationParams, PaginatedResponse } from '../types';
import { NotFoundError } from '../utils/errors';
import { ethers } from 'ethers';
import { provider } from './indexer.service';
import BondingCurveABI from '../../../artifacts/contracts/BondingCurve.sol/BondingCurve.json';

export class TradeService {
  /**
   * Get trade history for a token
   */
  async getTokenTrades(
    tokenAddress: string,
    params: PaginationParams
  ): Promise<PaginatedResponse<Trade>> {
    const { page = 1, limit = 20, sortOrder = 'desc' } = params;
    const skip = (page - 1) * limit;

    const [trades, total] = await Promise.all([
      prisma.trade.findMany({
        where: { tokenAddress: tokenAddress.toLowerCase() },
        skip,
        take: limit,
        orderBy: { timestamp: sortOrder },
      }),
      prisma.trade.count({ where: { tokenAddress: tokenAddress.toLowerCase() } }),
    ]);

    return {
      data: trades as any,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get chart data for a token (price over time)
   */
  async getChartData(
    tokenAddress: string,
    interval: '1m' | '5m' | '15m' | '1h' | '4h' | '1d' = '1h',
    limit: number = 100
  ): Promise<any[]> {
    // Get trades and aggregate by time interval
    const trades = await prisma.trade.findMany({
      where: { tokenAddress: tokenAddress.toLowerCase() },
      orderBy: { timestamp: 'asc' },
      take: limit * 10, // Get more trades to aggregate
    });

    // Group trades by interval and calculate OHLC
    const intervalMs = this.getIntervalMs(interval);
    const chartData: any[] = [];

    if (trades.length === 0) {
      return chartData;
    }

    let currentBucket = Math.floor(trades[0].timestamp.getTime() / intervalMs) * intervalMs;
    let bucketTrades: typeof trades = [];

    for (const trade of trades) {
      const tradeTime = trade.timestamp.getTime();
      const tradeBucket = Math.floor(tradeTime / intervalMs) * intervalMs;

      if (tradeBucket > currentBucket) {
        if (bucketTrades.length > 0) {
          chartData.push(this.calculateOHLC(bucketTrades, currentBucket));
        }
        currentBucket = tradeBucket;
        bucketTrades = [trade];
      } else {
        bucketTrades.push(trade);
      }
    }

    // Add last bucket
    if (bucketTrades.length > 0) {
      chartData.push(this.calculateOHLC(bucketTrades, currentBucket));
    }

    return chartData.slice(-limit);
  }

  /**
   * Get trading statistics for a token
   */
  async getTokenStats(tokenAddress: string): Promise<any> {
    const stats = await prisma.tokenStats.findUnique({
      where: { tokenAddress: tokenAddress.toLowerCase() },
    });

    if (!stats) {
      throw new NotFoundError(`Stats for token ${tokenAddress} not found`);
    }

    // Get additional computed stats
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [trades7d, allTimeTrades, uniqueTraders] = await Promise.all([
      prisma.trade.findMany({
        where: {
          tokenAddress: tokenAddress.toLowerCase(),
          timestamp: { gte: oneWeekAgo },
        },
        select: { amountIn: true },
      }),
      prisma.trade.count({
        where: { tokenAddress: tokenAddress.toLowerCase() },
      }),
      prisma.trade.findMany({
        where: { tokenAddress: tokenAddress.toLowerCase() },
        select: { trader: true },
        distinct: ['trader'],
      }),
    ]);

    // Manually calculate 7-day volume
    const volume7d = trades7d
      .reduce((sum, trade) => sum + BigInt(trade.amountIn), BigInt(0))
      .toString();

    return {
      ...stats,
      volume7d,
      allTimeTrades,
      uniqueTraders: uniqueTraders.length,
    };
  }

  /**
   * Estimate trade output (read from smart contract)
   */
  async estimateTrade(
    tokenAddress: string,
    amountIn: string,
    isBuy: boolean
  ): Promise<{ amountOut: string; fee: string; priceImpact: string }> {
    try {
      // Get bonding curve address from token
      const token = await prisma.token.findUnique({
        where: { address: tokenAddress.toLowerCase() },
      });

      if (!token) {
        throw new NotFoundError(`Token ${tokenAddress} not found`);
      }

      const bondingCurve = new ethers.Contract(token.bondingCurve, BondingCurveABI.abi, provider);

      // Call the appropriate calculation function
      const result = isBuy
        ? await bondingCurve.calculateBuy(amountIn)
        : await bondingCurve.calculateSell(amountIn);

      // Calculate fee (1% = 100 basis points)
      const fee = (BigInt(amountIn) * BigInt(100)) / BigInt(10000);

      // Calculate price impact (simplified)
      const priceImpact = '0'; // TODO: Implement price impact calculation

      return {
        amountOut: result.toString(),
        fee: fee.toString(),
        priceImpact,
      };
    } catch (error) {
      throw new Error(`Failed to estimate trade: ${error}`);
    }
  }

  /**
   * Get user trade history
   */
  async getUserTrades(
    userAddress: string,
    params: PaginationParams
  ): Promise<PaginatedResponse<Trade>> {
    const { page = 1, limit = 20, sortOrder = 'desc' } = params;
    const skip = (page - 1) * limit;

    const [trades, total] = await Promise.all([
      prisma.trade.findMany({
        where: { trader: userAddress.toLowerCase() },
        skip,
        take: limit,
        orderBy: { timestamp: sortOrder },
        include: {
          token: {
            select: {
              name: true,
              symbol: true,
              imageUrl: true,
            },
          },
        },
      }),
      prisma.trade.count({ where: { trader: userAddress.toLowerCase() } }),
    ]);

    return {
      data: trades as any,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Helper methods
  private getIntervalMs(interval: string): number {
    const intervals: Record<string, number> = {
      '1m': 60 * 1000,
      '5m': 5 * 60 * 1000,
      '15m': 15 * 60 * 1000,
      '1h': 60 * 60 * 1000,
      '4h': 4 * 60 * 60 * 1000,
      '1d': 24 * 60 * 60 * 1000,
    };
    return intervals[interval] || intervals['1h'];
  }

  private calculateOHLC(trades: any[], timestamp: number): any {
    const prices = trades.map((t) => {
      const amountIn = BigInt(t.amountIn);
      const amountOut = BigInt(t.amountOut);
      return Number(amountIn) / Number(amountOut);
    });

    return {
      timestamp: new Date(timestamp),
      open: prices[0],
      high: Math.max(...prices),
      low: Math.min(...prices),
      close: prices[prices.length - 1],
      volume: trades.reduce((sum, t) => sum + Number(t.amountIn), 0),
      trades: trades.length,
    };
  }
}

export const tradeService = new TradeService();
export default tradeService;

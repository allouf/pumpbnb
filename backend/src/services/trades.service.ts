import { Trade, Prisma } from '@prisma/client';
import { prisma } from './db.service';
import { cache, cacheKeys } from '../config/redis';
import { TradeFilter, PaginatedResponse } from '../types/tokenPage';

class TradesService {
  /**
   * Get trades for a specific token with filtering and pagination
   */
  async getTokenTrades(
    tokenAddress: string,
    options: {
      filter?: TradeFilter;
      page?: number;
      limit?: number;
      sortBy?: 'timestamp' | 'price' | 'volume';
      sortOrder?: 'asc' | 'desc';
    } = {}
  ): Promise<PaginatedResponse<Trade>> {
    console.log('[TradesService] getTokenTrades called');
    console.log('[TradesService] Token address:', tokenAddress);
    console.log('[TradesService] Options:', JSON.stringify(options, null, 2));

    const {
      filter = {},
      page = 1,
      limit = 50,
      sortBy = 'timestamp',
      sortOrder = 'desc',
    } = options;

    // Build where clause
    const where: Prisma.TradeWhereInput = {
      tokenAddress: tokenAddress.toLowerCase(),
    };

    console.log('[TradesService] Initial where clause:', JSON.stringify(where, null, 2));

    // Apply filters
    if (filter.type === 'my' && filter.traderAddress) {
      where.trader = filter.traderAddress.toLowerCase();
    }

    if (filter.type === 'dev') {
      // Get token creator
      const token = await prisma.token.findUnique({
        where: { address: tokenAddress.toLowerCase() },
        select: { creator: true },
      });
      if (token) {
        where.trader = token.creator.toLowerCase();
      }
    }

    if (filter.minAmount) {
      where.asterAmount = { gte: filter.minAmount };
    }

    if (filter.maxAmount) {
      where.asterAmount = { lte: filter.maxAmount };
    }

    if (filter.startTime || filter.endTime) {
      where.timestamp = {};
      if (filter.startTime) {
        where.timestamp.gte = filter.startTime;
      }
      if (filter.endTime) {
        where.timestamp.lte = filter.endTime;
      }
    }

    // Build order by
    const orderBy: Prisma.TradeOrderByWithRelationInput = {};
    if (sortBy === 'timestamp') {
      orderBy.timestamp = sortOrder;
    } else if (sortBy === 'price') {
      orderBy.price = sortOrder;
    } else if (sortBy === 'volume') {
      orderBy.asterAmount = sortOrder;
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    console.log('[TradesService] Final where clause:', JSON.stringify(where, null, 2));
    console.log('[TradesService] Order by:', JSON.stringify(orderBy, null, 2));
    console.log('[TradesService] Pagination:', { skip, take: limit });

    try {
      // Execute query with pagination
      const [trades, total] = await Promise.all([
        prisma.trade.findMany({
          where,
          orderBy,
          skip,
          take: limit,
        }),
        prisma.trade.count({ where }),
      ]);

      console.log('[TradesService] Query successful');
      console.log('[TradesService] Found', trades.length, 'trades out of', total, 'total');

      const totalPages = Math.ceil(total / limit);

      return {
        data: trades,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasMore: page < totalPages,
        },
      };
    } catch (error) {
      console.error('[TradesService] Database query failed:', error);
      throw error;
    }
  }

  /**
   * Get recent trades for a token (cached)
   */
  async getRecentTrades(
    tokenAddress: string,
    limit: number = 20
  ): Promise<Trade[]> {
    const cacheKey = cacheKeys.tokenTrades(tokenAddress, limit);

    // Try cache first
    const cached = await cache.get<Trade[]>(cacheKey);
    if (cached) {
      return cached;
    }

    // Fetch from database
    const trades = await prisma.trade.findMany({
      where: { tokenAddress: tokenAddress.toLowerCase() },
      orderBy: { timestamp: 'desc' },
      take: limit,
    });

    // Cache for 10 seconds (trades are time-sensitive)
    const ttl = parseInt(process.env.CACHE_TRADES_TTL || '10');
    await cache.set(cacheKey, trades, ttl);

    return trades;
  }

  /**
   * Get a single trade by transaction hash
   */
  async getTradeByTxHash(txHash: string): Promise<Trade | null> {
    return prisma.trade.findUnique({
      where: { txHash: txHash.toLowerCase() },
      include: {
        token: {
          select: {
            name: true,
            symbol: true,
            imageUrl: true,
          },
        },
      },
    });
  }

  /**
   * Get trades for a specific trader
   */
  async getTraderTrades(
    traderAddress: string,
    options: {
      page?: number;
      limit?: number;
      tokenAddress?: string;
    } = {}
  ): Promise<PaginatedResponse<Trade>> {
    const { page = 1, limit = 50, tokenAddress } = options;

    const where: Prisma.TradeWhereInput = {
      trader: traderAddress.toLowerCase(),
    };

    if (tokenAddress) {
      where.tokenAddress = tokenAddress.toLowerCase();
    }

    const skip = (page - 1) * limit;

    const [trades, total] = await Promise.all([
      prisma.trade.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        skip,
        take: limit,
        include: {
          token: {
            select: {
              name: true,
              symbol: true,
              imageUrl: true,
              address: true,
            },
          },
        },
      }),
      prisma.trade.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: trades,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasMore: page < totalPages,
      },
    };
  }

  /**
   * Get trade statistics for a token
   */
  async getTradeStats(tokenAddress: string, timeWindow: number = 24 * 60 * 60 * 1000) {
    const since = new Date(Date.now() - timeWindow);

    const trades = await prisma.trade.findMany({
      where: {
        tokenAddress: tokenAddress.toLowerCase(),
        timestamp: { gte: since },
      },
      select: {
        isBuy: true,
        asterAmount: true,
        tokenAmount: true,
        price: true,
      },
    });

    let totalVolume = BigInt(0);
    let buyVolume = BigInt(0);
    let sellVolume = BigInt(0);
    let buyCount = 0;
    let sellCount = 0;

    trades.forEach((trade) => {
      const volume = BigInt(trade.asterAmount || '0');
      totalVolume += volume;

      if (trade.isBuy) {
        buyVolume += volume;
        buyCount++;
      } else {
        sellVolume += volume;
        sellCount++;
      }
    });

    return {
      totalTrades: trades.length,
      buyCount,
      sellCount,
      totalVolume: totalVolume.toString(),
      buyVolume: buyVolume.toString(),
      sellVolume: sellVolume.toString(),
      buyRatio: trades.length > 0 ? buyCount / trades.length : 0,
    };
  }

  /**
   * Invalidate trades cache for a token
   */
  async invalidateCache(tokenAddress: string): Promise<void> {
    await cache.delPattern(`token:trades:${tokenAddress.toLowerCase()}:*`);
  }
}

export const tradesService = new TradesService();
export default tradesService;

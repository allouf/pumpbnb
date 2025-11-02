import { TokenHolder, Prisma } from '@prisma/client';
import { prisma } from './db.service';
import { cache, cacheKeys } from '../config/redis';
import { PaginatedResponse, HolderFilter } from '../types/tokenPage';

class HoldersService {
  /**
   * Get holders for a specific token with filtering and pagination
   */
  async getTokenHolders(
    tokenAddress: string,
    options: {
      filter?: HolderFilter;
      page?: number;
      limit?: number;
      sortBy?: 'balance' | 'percentage' | 'firstTxAt' | 'lastTxAt';
      sortOrder?: 'asc' | 'desc';
    } = {}
  ): Promise<PaginatedResponse<TokenHolder>> {
    const {
      filter = {},
      page = 1,
      limit = 50,
      sortBy = 'percentage',
      sortOrder = 'desc',
    } = options;

    const where: Prisma.TokenHolderWhereInput = {
      tokenAddress: tokenAddress.toLowerCase(),
    };

    // Apply filters
    if (filter.minBalance) {
      where.balance = { gte: filter.minBalance };
    }

    if (filter.minPercentage !== undefined) {
      where.percentage = { gte: filter.minPercentage };
    }

    if (filter.includeCreator === false) {
      where.isCreator = false;
    }

    // Build order by
    const orderBy: Prisma.TokenHolderOrderByWithRelationInput = {};
    orderBy[sortBy] = sortOrder;

    const skip = (page - 1) * limit;

    const [holders, total] = await Promise.all([
      prisma.tokenHolder.findMany({
        where,
        orderBy,
        skip,
        take: limit,
      }),
      prisma.tokenHolder.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: holders,
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
   * Get top holders for a token (cached)
   */
  async getTopHolders(
    tokenAddress: string,
    limit: number = 10
  ): Promise<TokenHolder[]> {
    const cacheKey = cacheKeys.tokenHolders(tokenAddress);

    // Try cache first
    const cached = await cache.get<TokenHolder[]>(cacheKey);
    if (cached) {
      return cached;
    }

    // Fetch from database
    const holders = await prisma.tokenHolder.findMany({
      where: { tokenAddress: tokenAddress.toLowerCase() },
      orderBy: { percentage: 'desc' },
      take: limit,
    });

    // Cache for 1 minute (holder data changes less frequently)
    const ttl = parseInt(process.env.CACHE_HOLDERS_TTL || '60');
    await cache.set(cacheKey, holders, ttl);

    return holders;
  }

  /**
   * Get holder count for a token
   */
  async getHolderCount(tokenAddress: string): Promise<number> {
    return prisma.tokenHolder.count({
      where: { tokenAddress: tokenAddress.toLowerCase() },
    });
  }

  /**
   * Get holder information for a specific address
   */
  async getHolder(
    tokenAddress: string,
    holderAddress: string
  ): Promise<TokenHolder | null> {
    return prisma.tokenHolder.findUnique({
      where: {
        tokenAddress_holderAddress: {
          tokenAddress: tokenAddress.toLowerCase(),
          holderAddress: holderAddress.toLowerCase(),
        },
      },
    });
  }

  /**
   * Get all tokens held by a specific address
   */
  async getHolderPortfolio(
    holderAddress: string,
    options: { page?: number; limit?: number } = {}
  ): Promise<PaginatedResponse<TokenHolder>> {
    const { page = 1, limit = 50 } = options;
    const skip = (page - 1) * limit;

    const where = { holderAddress: holderAddress.toLowerCase() };

    const [holdings, total] = await Promise.all([
      prisma.tokenHolder.findMany({
        where,
        orderBy: { percentage: 'desc' },
        skip,
        take: limit,
      }),
      prisma.tokenHolder.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: holdings,
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
   * Get holder statistics for a token
   */
  async getHolderStats(tokenAddress: string) {
    const holders = await prisma.tokenHolder.findMany({
      where: { tokenAddress: tokenAddress.toLowerCase() },
      select: {
        percentage: true,
        isCreator: true,
      },
    });

    const totalHolders = holders.length;
    const creatorHolder = holders.find((h) => h.isCreator);
    const creatorPercentage = creatorHolder?.percentage || 0;

    // Calculate concentration metrics
    const top10 = holders
      .sort((a, b) => b.percentage - a.percentage)
      .slice(0, 10);
    const top10Percentage = top10.reduce((sum, h) => sum + h.percentage, 0);

    return {
      totalHolders,
      creatorPercentage,
      top10Percentage,
      top10Count: top10.length,
    };
  }

  /**
   * Invalidate holders cache for a token
   */
  async invalidateCache(tokenAddress: string): Promise<void> {
    await cache.del(cacheKeys.tokenHolders(tokenAddress.toLowerCase()));
  }
}

export const holdersService = new HoldersService();
export default holdersService;

import { Token, TokenStats, Prisma } from '@prisma/client';
import { prisma } from './db.service';
import { cache, cacheKeys } from '../config/redis';
import { TokenPageData, PaginatedResponse } from '../types/tokenPage';

class TokensService {
  /**
   * Get complete token page data (token + stats + recent data)
   */
  async getTokenPageData(tokenAddress: string): Promise<TokenPageData | null> {
    const address = tokenAddress.toLowerCase();

    // Try cache first
    const cacheKey = cacheKeys.token(address);
    const cached = await cache.get<TokenPageData>(cacheKey);
    if (cached) {
      return cached;
    }

    // Fetch token with related data
    const token = await prisma.token.findUnique({
      where: { address },
      include: {
        stats: true,
        trades: {
          orderBy: { timestamp: 'desc' },
          take: 20,
        },
      },
    });

    if (!token) {
      return null;
    }

    // Fetch top holders
    const topHolders = await prisma.tokenHolder.findMany({
      where: { tokenAddress: address },
      orderBy: { percentage: 'desc' },
      take: 10,
    });

    // Fetch recent comments
    const recentComments = await prisma.comment.findMany({
      where: { tokenAddress: address },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    // If token.stats is null, we need to handle it - but type expects it to exist
    // This should never happen if database is properly set up, but handle gracefully
    if (!token.stats) {
      return null;
    }

    const pageData: TokenPageData = {
      token: {
        ...token,
        graduatedAt: token.graduatedAt ?? undefined,
        ipfsHash: token.ipfsHash ?? undefined,
        website: token.website ?? undefined,
        twitter: token.twitter ?? undefined,
        telegram: token.telegram ?? undefined,
        discord: token.discord ?? undefined,
      },
      stats: token.stats,
      recentTrades: token.trades.map(trade => ({
        ...trade,
        price: trade.price ?? undefined,
        marketCap: trade.marketCap ?? undefined,
      })),
      topHolders,
      recentComments: recentComments.map(comment => ({
        ...comment,
        replyTo: comment.replyTo ?? undefined,
      })),
    };

    // Cache for 5 minutes
    const ttl = parseInt(process.env.CACHE_TOKEN_TTL || '300');
    await cache.set(cacheKey, pageData, ttl);

    return pageData;
  }

  /**
   * Get token basic info
   */
  async getToken(tokenAddress: string): Promise<Token | null> {
    const address = tokenAddress.toLowerCase();

    return prisma.token.findUnique({
      where: { address },
    });
  }

  /**
   * Get token stats
   */
  async getTokenStats(tokenAddress: string): Promise<TokenStats | null> {
    const address = tokenAddress.toLowerCase();

    const cacheKey = cacheKeys.tokenStats(address);
    const cached = await cache.get<TokenStats>(cacheKey);
    if (cached) {
      return cached;
    }

    const stats = await prisma.tokenStats.findUnique({
      where: { tokenAddress: address },
    });

    if (stats) {
      const ttl = parseInt(process.env.CACHE_STATS_TTL || '30');
      await cache.set(cacheKey, stats, ttl);
    }

    return stats;
  }

  /**
   * Get all tokens with pagination and filtering
   */
  async getTokens(options: {
    page?: number;
    limit?: number;
    sortBy?: 'createdAt' | 'marketCap' | 'volume24h' | 'trades24h' | 'lastTraded' | 'lastReply' | 'oldestCoins' | 'highestMcap' | 'topGainers';
    sortOrder?: 'asc' | 'desc';
    isGraduated?: boolean;
    isNsfw?: boolean;
    search?: string;
    minMarketCap?: number;
    maxMarketCap?: number;
    minVolume24h?: number;
    maxVolume24h?: number;
  } = {}): Promise<PaginatedResponse<Token & { stats?: TokenStats }>> {
    const {
      page = 1,
      limit = 50,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      isGraduated,
      isNsfw,
      search,
      minMarketCap,
      maxMarketCap,
      minVolume24h,
      maxVolume24h,
    } = options;

    const where: Prisma.TokenWhereInput = {};

    if (isGraduated !== undefined) {
      where.isGraduated = isGraduated;
    }

    if (isNsfw !== undefined) {
      where.isNsfw = isNsfw;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { symbol: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Add market cap and volume filters
    if (minMarketCap !== undefined || maxMarketCap !== undefined || minVolume24h !== undefined || maxVolume24h !== undefined) {
      where.stats = {};
      
      if (minMarketCap !== undefined || maxMarketCap !== undefined) {
        where.stats.marketCap = {};
        if (minMarketCap !== undefined) {
          where.stats.marketCap.gte = minMarketCap.toString();
        }
        if (maxMarketCap !== undefined) {
          where.stats.marketCap.lte = maxMarketCap.toString();
        }
      }

      if (minVolume24h !== undefined || maxVolume24h !== undefined) {
        where.stats.volume24h = {};
        if (minVolume24h !== undefined) {
          where.stats.volume24h.gte = minVolume24h.toString();
        }
        if (maxVolume24h !== undefined) {
          where.stats.volume24h.lte = maxVolume24h.toString();
        }
      }
    }

    const skip = (page - 1) * limit;

    // Build order by
    let orderBy: any = {};
    if (sortBy === 'createdAt' || sortBy === 'oldestCoins') {
      orderBy = { createdAt: sortBy === 'oldestCoins' ? 'asc' : sortOrder };
    } else if (sortBy === 'marketCap' || sortBy === 'volume24h' || sortBy === 'trades24h' || sortBy === 'highestMcap' || sortBy === 'topGainers') {
      const field = sortBy === 'highestMcap' ? 'marketCap' : sortBy === 'topGainers' ? 'priceChange24h' : sortBy;
      orderBy = {
        stats: {
          [field]: sortBy === 'highestMcap' || sortBy === 'topGainers' ? 'desc' : sortOrder,
        },
      };
    } else if (sortBy === 'lastTraded') {
      // Order by most recent trade
      orderBy = [
        { trades: { _count: 'desc' } },
        { createdAt: 'desc' },
      ];
    } else if (sortBy === 'lastReply') {
      // This will need a subquery - for now use createdAt
      orderBy = { createdAt: sortOrder };
    }

    const [tokens, total] = await Promise.all([
      prisma.token.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          stats: true,
        },
      }),
      prisma.token.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: tokens.map(token => ({
        ...token,
        graduatedAt: token.graduatedAt ?? undefined,
        ipfsHash: token.ipfsHash ?? undefined,
        website: token.website ?? undefined,
        twitter: token.twitter ?? undefined,
        telegram: token.telegram ?? undefined,
        discord: token.discord ?? undefined,
        stats: token.stats ?? undefined,
      })) as (Token & { stats?: TokenStats })[],
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
   * Search tokens by name, symbol, or address
   */
  async searchTokens(query: string, limit: number = 10): Promise<Token[]> {
    return prisma.token.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { symbol: { contains: query, mode: 'insensitive' } },
          { address: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: limit,
      include: {
        stats: true,
      },
    });
  }

  /**
   * Get tokens created by a specific address
   */
  async getTokensByCreator(
    creatorAddress: string,
    options: { page?: number; limit?: number } = {}
  ): Promise<PaginatedResponse<Token>> {
    const { page = 1, limit = 50 } = options;
    const skip = (page - 1) * limit;

    const where = { creator: creatorAddress.toLowerCase() };

    const [tokens, total] = await Promise.all([
      prisma.token.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          stats: true,
        },
      }),
      prisma.token.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: tokens.map(token => ({
        ...token,
        graduatedAt: token.graduatedAt ?? undefined,
        ipfsHash: token.ipfsHash ?? undefined,
        website: token.website ?? undefined,
        twitter: token.twitter ?? undefined,
        telegram: token.telegram ?? undefined,
        discord: token.discord ?? undefined,
      })) as Token[],
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
   * Get trending tokens (by volume, trades, or other metrics)
   * Filters: marketCap > 5 ASTER (5% progress) AND has trades in last 24 hours
   */
  async getTrendingTokens(limit: number = 10): Promise<(Token & { stats: TokenStats })[]> {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    return prisma.token.findMany({
      where: {
        isGraduated: false, // Only bonding curve tokens
        stats: {
          marketCap: {
            gte: '5', // Minimum 5 ASTER (5% progress)
          },
        },
        trades: {
          some: {
            timestamp: {
              gte: twentyFourHoursAgo,
            },
          },
        },
      },
      include: {
        stats: true,
      },
      orderBy: {
        stats: {
          volume24h: 'desc',
        },
      },
      take: limit,
    }) as any;
  }

  /**
   * Get recently created tokens
   */
  async getRecentTokens(limit: number = 10): Promise<Token[]> {
    return prisma.token.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        stats: true,
      },
    });
  }

  /**
   * Get graduated tokens
   */
  async getGraduatedTokens(options: {
    page?: number;
    limit?: number;
  } = {}): Promise<PaginatedResponse<Token>> {
    const { page = 1, limit = 50 } = options;
    const skip = (page - 1) * limit;

    const where = { isGraduated: true };

    const [tokens, total] = await Promise.all([
      prisma.token.findMany({
        where,
        orderBy: { graduatedAt: 'desc' },
        skip,
        take: limit,
        include: {
          stats: true,
        },
      }),
      prisma.token.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: tokens.map(token => ({
        ...token,
        graduatedAt: token.graduatedAt ?? undefined,
        ipfsHash: token.ipfsHash ?? undefined,
        website: token.website ?? undefined,
        twitter: token.twitter ?? undefined,
        telegram: token.telegram ?? undefined,
        discord: token.discord ?? undefined,
      })) as Token[],
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
   * Invalidate token cache
   */
  async invalidateCache(tokenAddress: string): Promise<void> {
    const address = tokenAddress.toLowerCase();
    await Promise.all([
      cache.del(cacheKeys.token(address)),
      cache.del(cacheKeys.tokenStats(address)),
    ]);
  }
}

export const tokensService = new TokensService();
export default tokensService;

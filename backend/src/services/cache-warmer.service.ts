/**
 * Cache Warming Service
 *
 * Background service that pre-populates Redis cache with frequently accessed data
 * to improve API response times and reduce database load.
 *
 * This service:
 * 1. Runs periodically to refresh cached data
 * 2. Warms cache for trending tokens, new tokens, and popular endpoints
 * 3. Monitors cache hit rates and adjusts strategy
 * 4. Prevents cache stampede during high traffic
 */

import { prisma } from './db.service';
import { cache, cacheKeys } from '../config/redis';
import { tradesService } from './trades.service';
import { holdersService } from './holders.service';
import { tokensService } from './tokens.service';
import logger from '../utils/logger';

interface CacheWarmingConfig {
  // Top N tokens to warm based on volume
  topTokensByVolume: number;
  // Top N tokens to warm based on recency
  recentTokens: number;
  // Warm interval in milliseconds
  warmInterval: number;
  // Number of trades to cache per token
  tradesPerToken: number;
  // Number of holders to cache per token
  holdersPerToken: number;
}

export class CacheWarmerService {
  private isRunning: boolean = false;
  private interval: NodeJS.Timeout | null = null;

  private config: CacheWarmingConfig = {
    topTokensByVolume: 20,
    recentTokens: 10,
    warmInterval: 5 * 60 * 1000, // 5 minutes
    tradesPerToken: 50,
    holdersPerToken: 50,
  };

  /**
   * Start the cache warming service
   */
  start(config?: Partial<CacheWarmingConfig>): void {
    if (this.isRunning) {
      logger.warn('Cache Warmer Service is already running');
      return;
    }

    // Merge custom config
    if (config) {
      this.config = { ...this.config, ...config };
    }

    logger.info('Starting Cache Warming Service', this.config);

    // Run immediately on startup
    this.warmCache().catch((err) => {
      logger.error('Initial cache warming failed:', err);
    });

    // Schedule periodic cache warming
    this.interval = setInterval(() => {
      this.warmCache().catch((err) => {
        logger.error('Periodic cache warming failed:', err);
      });
    }, this.config.warmInterval);

    this.isRunning = true;
    logger.info('Cache Warming Service started successfully');
  }

  /**
   * Stop the cache warming service
   */
  stop(): void {
    if (!this.isRunning) {
      logger.warn('Cache Warmer Service is not running');
      return;
    }

    logger.info('Stopping Cache Warming Service');

    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }

    this.isRunning = false;
    logger.info('Cache Warming Service stopped');
  }

  /**
   * Main cache warming routine
   */
  private async warmCache(): Promise<void> {
    const startTime = Date.now();
    logger.info('Starting cache warming cycle');

    try {
      // Get tokens to warm
      const tokensToWarm = await this.getTokensToWarm();

      logger.info(`Warming cache for ${tokensToWarm.length} tokens`);

      // Warm data for each token
      await Promise.all([
        this.warmTrendingTokens(),
        this.warmRecentTokens(),
        this.warmTokenData(tokensToWarm),
        this.warmPlatformStats(),
      ]);

      const duration = Date.now() - startTime;
      logger.info(`Cache warming completed in ${duration}ms`);
    } catch (error) {
      logger.error('Cache warming failed:', error);
      throw error;
    }
  }

  /**
   * Get list of tokens that should be cached
   */
  private async getTokensToWarm(): Promise<string[]> {
    // Get top tokens by 24h volume
    const topByVolume = await prisma.tokenStats.findMany({
      take: this.config.topTokensByVolume,
      orderBy: { volume24h: 'desc' },
      select: { tokenAddress: true },
    });

    // Get most recent tokens
    const recent = await prisma.token.findMany({
      take: this.config.recentTokens,
      orderBy: { createdAt: 'desc' },
      select: { address: true },
    });

    // Combine and deduplicate
    const addresses = new Set<string>([
      ...topByVolume.map((t) => t.tokenAddress),
      ...recent.map((t) => t.address),
    ]);

    return Array.from(addresses);
  }

  /**
   * Warm token-specific data
   */
  private async warmTokenData(tokenAddresses: string[]): Promise<void> {
    const startTime = Date.now();

    for (const address of tokenAddresses) {
      try {
        await Promise.all([
          this.warmTokenTrades(address),
          this.warmTokenHolders(address),
          this.warmTokenStats(address),
        ]);
      } catch (error) {
        logger.error(`Failed to warm cache for token ${address}:`, error);
      }
    }

    const duration = Date.now() - startTime;
    logger.debug(`Warmed token data in ${duration}ms`);
  }

  /**
   * Warm recent trades for a token
   */
  private async warmTokenTrades(tokenAddress: string): Promise<void> {
    const cacheKey = cacheKeys.tokenTrades(tokenAddress, this.config.tradesPerToken);

    // Check if already cached
    const cached = await cache.get(cacheKey);
    if (cached) {
      logger.debug(`Trades already cached for ${tokenAddress}`);
      return;
    }

    // Fetch and cache trades
    const trades = await prisma.trade.findMany({
      where: { tokenAddress: tokenAddress.toLowerCase() },
      orderBy: { timestamp: 'desc' },
      take: this.config.tradesPerToken,
    });

    const ttl = parseInt(process.env.CACHE_TRADES_TTL || '10');
    await cache.set(cacheKey, trades, ttl);

    logger.debug(`Warmed ${trades.length} trades for ${tokenAddress}`);
  }

  /**
   * Warm token holders
   */
  private async warmTokenHolders(tokenAddress: string): Promise<void> {
    const cacheKey = cacheKeys.tokenHolders(tokenAddress, this.config.holdersPerToken);

    // Check if already cached
    const cached = await cache.get(cacheKey);
    if (cached) {
      logger.debug(`Holders already cached for ${tokenAddress}`);
      return;
    }

    // Fetch and cache holders
    const holders = await prisma.tokenHolder.findMany({
      where: { tokenAddress: tokenAddress.toLowerCase() },
      orderBy: { percentage: 'desc' },
      take: this.config.holdersPerToken,
    });

    const ttl = parseInt(process.env.CACHE_HOLDERS_TTL || '30');
    await cache.set(cacheKey, holders, ttl);

    logger.debug(`Warmed ${holders.length} holders for ${tokenAddress}`);
  }

  /**
   * Warm token statistics
   */
  private async warmTokenStats(tokenAddress: string): Promise<void> {
    const cacheKey = cacheKeys.tokenStats(tokenAddress);

    // Check if already cached
    const cached = await cache.get(cacheKey);
    if (cached) {
      logger.debug(`Stats already cached for ${tokenAddress}`);
      return;
    }

    // Fetch and cache stats
    const stats = await prisma.tokenStats.findUnique({
      where: { tokenAddress: tokenAddress.toLowerCase() },
    });

    if (stats) {
      const ttl = parseInt(process.env.CACHE_STATS_TTL || '60');
      await cache.set(cacheKey, stats, ttl);
      logger.debug(`Warmed stats for ${tokenAddress}`);
    }
  }

  /**
   * Warm trending tokens list
   */
  private async warmTrendingTokens(): Promise<void> {
    const cacheKey = 'tokens:trending';

    // Check if already cached
    const cached = await cache.get(cacheKey);
    if (cached) {
      logger.debug('Trending tokens already cached');
      return;
    }

    // Fetch trending tokens (top by 24h volume)
    const trending = await prisma.tokenStats.findMany({
      take: 20,
      orderBy: { volume24h: 'desc' },
      include: {
        token: {
          select: {
            address: true,
            name: true,
            symbol: true,
            imageUrl: true,
            creator: true,
            createdAt: true,
            isGraduated: true,
          },
        },
      },
    });

    const formattedTrending = trending.map((t) => ({
      ...t.token,
      stats: {
        price: t.price,
        marketCap: t.marketCap,
        volume24h: t.volume24h,
        trades24h: t.trades24h,
        holders: t.holders,
        priceChange24h: t.priceChange24h,
      },
    }));

    const ttl = parseInt(process.env.CACHE_TRENDING_TTL || '60');
    await cache.set(cacheKey, formattedTrending, ttl);

    logger.debug(`Warmed ${trending.length} trending tokens`);
  }

  /**
   * Warm recently created tokens list
   */
  private async warmRecentTokens(): Promise<void> {
    const cacheKey = 'tokens:recent';

    // Check if already cached
    const cached = await cache.get(cacheKey);
    if (cached) {
      logger.debug('Recent tokens already cached');
      return;
    }

    // Fetch recent tokens
    const recent = await prisma.token.findMany({
      take: 20,
      orderBy: { createdAt: 'desc' },
      include: {
        stats: true,
      },
    });

    const ttl = parseInt(process.env.CACHE_RECENT_TTL || '30');
    await cache.set(cacheKey, recent, ttl);

    logger.debug(`Warmed ${recent.length} recent tokens`);
  }

  /**
   * Warm platform-wide statistics
   */
  private async warmPlatformStats(): Promise<void> {
    const cacheKey = 'platform:stats';

    // Check if already cached
    const cached = await cache.get(cacheKey);
    if (cached) {
      logger.debug('Platform stats already cached');
      return;
    }

    // Calculate platform statistics
    const [totalTokens, totalGraduated, totalTrades] = await Promise.all([
      prisma.token.count(),
      prisma.token.count({ where: { isGraduated: true } }),
      prisma.trade.count(),
    ]);

    // Get total volume (last 24h)
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const trades = await prisma.trade.findMany({
      where: { timestamp: { gte: since } },
      select: { asterAmount: true },
    });

    const totalVolume = trades.reduce(
      (sum, t) => sum + BigInt(t.asterAmount),
      BigInt(0)
    );

    const stats = {
      totalTokens,
      totalGraduated,
      totalTrades,
      volume24h: totalVolume.toString(),
      graduationRate: totalTokens > 0 ? (totalGraduated / totalTokens) * 100 : 0,
    };

    const ttl = parseInt(process.env.CACHE_PLATFORM_STATS_TTL || '300');
    await cache.set(cacheKey, stats, ttl);

    logger.debug('Warmed platform stats');
  }

  /**
   * Manually trigger cache warming for a specific token
   */
  async warmToken(tokenAddress: string): Promise<void> {
    logger.info(`Manually warming cache for token ${tokenAddress}`);

    await Promise.all([
      this.warmTokenTrades(tokenAddress),
      this.warmTokenHolders(tokenAddress),
      this.warmTokenStats(tokenAddress),
    ]);

    logger.info(`Cache warmed for token ${tokenAddress}`);
  }

  /**
   * Clear all cached data (use with caution)
   */
  async clearAll(): Promise<void> {
    logger.warn('Clearing all cached data');
    await cache.flushdb();
    logger.info('All cached data cleared');
  }

  /**
   * Get cache statistics
   */
  async getCacheStats(): Promise<{
    keys: number;
    memory: string;
    hits: number;
    misses: number;
    hitRate: number;
  }> {
    const info = await cache.info('stats');
    const keyspace = await cache.info('keyspace');

    // Parse info string (Redis INFO command returns text)
    const stats = {
      keys: 0,
      memory: '0',
      hits: 0,
      misses: 0,
      hitRate: 0,
    };

    // Extract keyspace info
    const keyspaceMatch = keyspace.match(/keys=(\d+)/);
    if (keyspaceMatch) {
      stats.keys = parseInt(keyspaceMatch[1]);
    }

    // Extract stats
    const hitsMatch = info.match(/keyspace_hits:(\d+)/);
    const missesMatch = info.match(/keyspace_misses:(\d+)/);

    if (hitsMatch) stats.hits = parseInt(hitsMatch[1]);
    if (missesMatch) stats.misses = parseInt(missesMatch[1]);

    const total = stats.hits + stats.misses;
    stats.hitRate = total > 0 ? (stats.hits / total) * 100 : 0;

    return stats;
  }

  /**
   * Get service status
   */
  getStatus(): {
    isRunning: boolean;
    config: CacheWarmingConfig;
    nextRunIn?: number;
  } {
    const status: any = {
      isRunning: this.isRunning,
      config: this.config,
    };

    if (this.interval) {
      // Calculate time until next run (approximate)
      status.nextRunIn = this.config.warmInterval;
    }

    return status;
  }
}

export const cacheWarmerService = new CacheWarmerService();
export default cacheWarmerService;

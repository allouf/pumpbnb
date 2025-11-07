import { prisma } from './database.service';
import logger from '../utils/logger';

// Mock data for when database is empty or external services are down
const MOCK_TOKENS = [
  {
    address: '0x1234567890123456789012345678901234567890',
    name: 'Sample Token 1',
    symbol: 'SAMPLE1',
    description: 'A sample token for testing purposes',
    imageUrl: 'https://via.placeholder.com/64x64/FF6B6B/ffffff?text=S1',
    creator: '0x1111111111111111111111111111111111111111',
    bondingCurve: '0x2222222222222222222222222222222222222222',
    totalSupply: '1000000000000000000000000000',
    isGraduated: false,
    timestamp: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago
    stats: {
      price: '0.00000150',
      priceUsd: '0.0000009',
      marketCap: '15.50',
      marketCapUsd: '9.30',
      volume24h: '2.30',
      volume24hUsd: '1.38',
      trades24h: 12,
      holders: 8,
      liquidity: '15.50',
      liquidityUsd: '9.30',
      priceChange24h: '5.20',
    }
  },
  {
    address: '0x2345678901234567890123456789012345678901',
    name: 'Demo Coin',
    symbol: 'DEMO',
    description: 'Demo coin showing platform functionality',
    imageUrl: 'https://via.placeholder.com/64x64/4ECDC4/ffffff?text=DC',
    creator: '0x3333333333333333333333333333333333333333',
    bondingCurve: '0x4444444444444444444444444444444444444444',
    totalSupply: '1000000000000000000000000000',
    isGraduated: false,
    timestamp: Math.floor(Date.now() / 1000) - 7200, // 2 hours ago
    stats: {
      price: '0.00000089',
      priceUsd: '0.00000053',
      marketCap: '8.90',
      marketCapUsd: '5.34',
      volume24h: '1.45',
      volume24hUsd: '0.87',
      trades24h: 7,
      holders: 5,
      liquidity: '8.90',
      liquidityUsd: '5.34',
      priceChange24h: '-2.10',
    }
  },
  {
    address: '0x3456789012345678901234567890123456789012',
    name: 'Test Token',
    symbol: 'TEST',
    description: 'Test token for development',
    imageUrl: 'https://via.placeholder.com/64x64/45B7D1/ffffff?text=TT',
    creator: '0x5555555555555555555555555555555555555555',
    bondingCurve: '0x6666666666666666666666666666666666666666',
    totalSupply: '1000000000000000000000000000',
    isGraduated: false,
    timestamp: Math.floor(Date.now() / 1000) - 10800, // 3 hours ago
    stats: {
      price: '0.00000045',
      priceUsd: '0.00000027',
      marketCap: '4.50',
      marketCapUsd: '2.70',
      volume24h: '0.80',
      volume24hUsd: '0.48',
      trades24h: 3,
      holders: 3,
      liquidity: '4.50',
      liquidityUsd: '2.70',
      priceChange24h: '0.00',
    }
  },
  {
    address: '0x4567890123456789012345678901234567890123',
    name: 'Local Dev Token',
    symbol: 'LOCAL',
    description: 'Development token for offline testing',
    imageUrl: 'https://via.placeholder.com/64x64/96CEB4/ffffff?text=LT',
    creator: '0x7777777777777777777777777777777777777777',
    bondingCurve: '0x8888888888888888888888888888888888888888',
    totalSupply: '1000000000000000000000000000',
    isGraduated: false,
    timestamp: Math.floor(Date.now() / 1000) - 14400, // 4 hours ago
    stats: {
      price: '0.00000112',
      priceUsd: '0.00000067',
      marketCap: '11.20',
      marketCapUsd: '6.72',
      volume24h: '3.10',
      volume24hUsd: '1.86',
      trades24h: 15,
      holders: 12,
      liquidity: '11.20',
      liquidityUsd: '6.72',
      priceChange24h: '8.75',
    }
  }
];

export class OfflineFallbackService {
  private isOfflineMode = false;

  /**
   * Check if we should use offline mode
   */
  async shouldUseOfflineMode(): Promise<boolean> {
    try {
      // Try to access database
      await prisma.$queryRaw`SELECT 1`;
      
      // Check if we have any tokens in database
      const tokenCount = await prisma.token.count();
      
      // If no tokens, we're probably in offline/empty state
      if (tokenCount === 0) {
        logger.warn('No tokens found in database, enabling offline fallback mode');
        this.isOfflineMode = true;
        return true;
      }

      this.isOfflineMode = false;
      return false;
    } catch (error) {
      logger.error('Database connection failed, enabling offline fallback mode:', error);
      this.isOfflineMode = true;
      return true;
    }
  }

  /**
   * Get tokens with offline fallback
   */
  async getTokensWithFallback(options: {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  } = {}): Promise<any> {
    const { limit = 50, sortBy = 'createdAt', sortOrder = 'desc' } = options;

    try {
      // First try database
      if (!this.isOfflineMode) {
        const tokenCount = await prisma.token.count();
        if (tokenCount > 0) {
          // Database has data, try to fetch normally
          const tokens = await prisma.token.findMany({
            take: limit,
            orderBy: sortBy === 'volume24h' ? { createdAt: sortOrder } : { [sortBy]: sortOrder },
            include: {
              stats: true,
            },
          });

          return {
            success: true,
            data: tokens.map(token => ({
              ...token,
              timestamp: Math.floor(token.createdAt.getTime() / 1000),
              stats: token.stats,
            })),
            pagination: {
              page: 1,
              limit,
              total: tokenCount,
              totalPages: Math.ceil(tokenCount / limit),
              hasMore: tokenCount > limit,
            },
            offline: false,
          };
        }
      }
    } catch (error) {
      logger.warn('Failed to fetch from database, using offline fallback:', error);
    }

    // Fallback to mock data
    logger.info('Using offline fallback data');
    
    // Sort mock data
    let sortedTokens = [...MOCK_TOKENS];
    if (sortBy === 'volume24h') {
      sortedTokens.sort((a, b) => {
        const aVol = parseFloat(a.stats.volume24h);
        const bVol = parseFloat(b.stats.volume24h);
        return sortOrder === 'desc' ? bVol - aVol : aVol - bVol;
      });
    } else if (sortBy === 'createdAt') {
      sortedTokens.sort((a, b) => {
        return sortOrder === 'desc' ? b.timestamp - a.timestamp : a.timestamp - b.timestamp;
      });
    }

    const paginatedTokens = sortedTokens.slice(0, limit);

    return {
      success: true,
      data: paginatedTokens,
      pagination: {
        page: 1,
        limit,
        total: MOCK_TOKENS.length,
        totalPages: Math.ceil(MOCK_TOKENS.length / limit),
        hasMore: MOCK_TOKENS.length > limit,
      },
      offline: true,
      message: 'Using offline data - some features may be limited',
    };
  }

  /**
   * Get trending tokens with offline fallback
   */
  async getTrendingTokensWithFallback(limit: number = 4): Promise<any> {
    try {
      // Try database first
      if (!this.isOfflineMode) {
        const tokens = await prisma.token.findMany({
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            stats: true,
          },
        });

        if (tokens.length > 0) {
          return {
            success: true,
            data: tokens.map(token => ({
              ...token,
              timestamp: Math.floor(token.createdAt.getTime() / 1000),
              stats: token.stats,
            })),
            offline: false,
          };
        }
      }
    } catch (error) {
      logger.warn('Failed to fetch trending from database, using offline fallback:', error);
    }

    // Fallback to mock trending data (top by volume)
    const trendingTokens = MOCK_TOKENS
      .sort((a, b) => parseFloat(b.stats.volume24h) - parseFloat(a.stats.volume24h))
      .slice(0, limit);

    return {
      success: true,
      data: trendingTokens,
      offline: true,
      message: 'Using offline trending data',
    };
  }

  /**
   * Get single token with offline fallback
   */
  async getTokenWithFallback(address: string): Promise<any> {
    try {
      // Try database first
      if (!this.isOfflineMode) {
        const token = await prisma.token.findUnique({
          where: { address: address.toLowerCase() },
          include: { stats: true },
        });

        if (token) {
          return {
            success: true,
            data: {
              ...token,
              timestamp: Math.floor(token.createdAt.getTime() / 1000),
            },
            offline: false,
          };
        }
      }
    } catch (error) {
      logger.warn(`Failed to fetch token ${address} from database:`, error);
    }

    // Fallback to mock data
    const mockToken = MOCK_TOKENS.find(t => t.address.toLowerCase() === address.toLowerCase());
    if (mockToken) {
      return {
        success: true,
        data: mockToken,
        offline: true,
        message: 'Using offline token data',
      };
    }

    return {
      success: false,
      message: 'Token not found',
      offline: true,
    };
  }

  /**
   * Initialize offline mode if needed
   */
  async initialize(): Promise<void> {
    await this.shouldUseOfflineMode();
    if (this.isOfflineMode) {
      logger.info('🔌 Offline Fallback Service initialized - serving mock data');
    } else {
      logger.info('🌐 Online mode - using database data');
    }
  }

  /**
   * Get service status
   */
  getStatus(): { isOffline: boolean; dataSource: string } {
    return {
      isOffline: this.isOfflineMode,
      dataSource: this.isOfflineMode ? 'mock' : 'database',
    };
  }
}

export const offlineFallbackService = new OfflineFallbackService();
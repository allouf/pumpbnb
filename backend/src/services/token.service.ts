import { prisma } from './database.service';
import { ipfsService } from './ipfs.service';
import { Token, TokenMetadata, PaginationParams, PaginatedResponse } from '../types';
import { NotFoundError } from '../utils/errors';
import logger from '../utils/logger';

export class TokenService {
  /**
   * Get all tokens with pagination
   */
  async getAllTokens(params: PaginationParams): Promise<PaginatedResponse<Token>> {
    const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = params;
    const skip = (page - 1) * limit;

    // Stats fields that need to be accessed via the stats relation
    const statsFields = ['volume24h', 'volumeTotal', 'priceChange24h', 'holders', 'transactions'];

    // Build orderBy clause based on field type
    const orderBy = statsFields.includes(sortBy)
      ? { stats: { [sortBy]: sortOrder } }
      : { [sortBy]: sortOrder };

    const [tokens, total] = await Promise.all([
      prisma.token.findMany({
        skip,
        take: limit,
        orderBy,
        include: {
          stats: true,
        },
      }),
      prisma.token.count(),
    ]);

    return {
      data: tokens as any,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get token by address
   */
  async getTokenByAddress(address: string): Promise<Token> {
    const token = await prisma.token.findUnique({
      where: { address: address.toLowerCase() },
      include: {
        stats: true,
      },
    });

    if (!token) {
      throw new NotFoundError(`Token ${address} not found`);
    }

    return token as any;
  }

  /**
   * Get trending tokens (by 24h volume)
   */
  async getTrendingTokens(limit: number = 10): Promise<Token[]> {
    const tokens = await prisma.token.findMany({
      take: limit,
      orderBy: {
        stats: {
          volume24h: 'desc',
        },
      },
      include: {
        stats: true,
      },
    });

    return tokens as any;
  }

  /**
   * Get recently created tokens
   */
  async getRecentTokens(limit: number = 10): Promise<Token[]> {
    const tokens = await prisma.token.findMany({
      take: limit,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        stats: true,
      },
    });

    return tokens as any;
  }

  /**
   * Get graduated tokens
   */
  async getGraduatedTokens(params: PaginationParams): Promise<PaginatedResponse<Token>> {
    const { page = 1, limit = 20 } = params;
    const skip = (page - 1) * limit;

    const [tokens, total] = await Promise.all([
      prisma.token.findMany({
        where: { isGraduated: true },
        skip,
        take: limit,
        orderBy: { graduatedAt: 'desc' },
        include: {
          stats: true,
        },
      }),
      prisma.token.count({ where: { isGraduated: true } }),
    ]);

    return {
      data: tokens as any,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get token holders
   */
  async getTokenHolders(tokenAddress: string, limit: number = 100): Promise<any[]> {
    const holders = await prisma.userPortfolio.findMany({
      where: {
        tokenAddress: tokenAddress.toLowerCase(),
      },
      take: limit,
      orderBy: {
        balance: 'desc',
      },
    });

    return holders;
  }

  /**
   * Search tokens by name or symbol
   */
  async searchTokens(query: string, limit: number = 20): Promise<Token[]> {
    const tokens = await prisma.token.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { symbol: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: limit,
      include: {
        stats: true,
      },
    });

    return tokens as any;
  }

  /**
   * Create token metadata and upload to IPFS
   */
  async createTokenMetadata(metadata: TokenMetadata): Promise<string> {
    try {
      const ipfsHash = await ipfsService.uploadJSON(metadata);
      logger.info(`Token metadata uploaded to IPFS: ${ipfsHash}`);
      return ipfsHash;
    } catch (error) {
      logger.error('Error creating token metadata:', error);
      throw error;
    }
  }

  /**
   * Get token metadata from IPFS
   */
  async getTokenMetadata(ipfsHash: string): Promise<TokenMetadata> {
    try {
      return await ipfsService.getJSON(ipfsHash);
    } catch (error) {
      logger.error(`Error fetching metadata from IPFS (${ipfsHash}):`, error);
      throw error;
    }
  }

  /**
   * Update token with IPFS metadata
   */
  async updateTokenMetadata(tokenAddress: string, ipfsHash: string): Promise<void> {
    try {
      const metadata = await this.getTokenMetadata(ipfsHash);

      await prisma.token.update({
        where: { address: tokenAddress.toLowerCase() },
        data: {
          description: metadata.description,
          imageUrl: metadata.image,
          website: metadata.properties?.social?.website || '',
          twitter: metadata.properties?.social?.twitter || '',
          telegram: metadata.properties?.social?.telegram || '',
          discord: metadata.properties?.social?.discord || '',
          ipfsHash,
        },
      });

      logger.info(`Token ${tokenAddress} metadata updated from IPFS`);
    } catch (error) {
      logger.error(`Error updating token metadata for ${tokenAddress}:`, error);
      throw error;
    }
  }

  /**
   * Get tokens by creator
   */
  async getTokensByCreator(
    creatorAddress: string,
    params: PaginationParams
  ): Promise<PaginatedResponse<Token>> {
    const { page = 1, limit = 20 } = params;
    const skip = (page - 1) * limit;

    const [tokens, total] = await Promise.all([
      prisma.token.findMany({
        where: { creator: creatorAddress.toLowerCase() },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          stats: true,
        },
      }),
      prisma.token.count({ where: { creator: creatorAddress.toLowerCase() } }),
    ]);

    return {
      data: tokens as any,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}

export const tokenService = new TokenService();
export default tokenService;

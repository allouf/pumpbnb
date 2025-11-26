import { ethers } from 'ethers';
import logger from '../utils/logger';
import { prisma } from './database.service';
import { provider, tokenFactoryContract } from './indexer.service';

class AdminService {
  /**
   * Manually index a specific token by searching for its TokenCreated event
   */
  async indexToken(tokenAddress: string) {
    try {
      logger.info(`Manual indexing requested for token: ${tokenAddress}`);

      // Check if already indexed
      const existing = await prisma.token.findUnique({
        where: { address: tokenAddress.toLowerCase() },
      });

      if (existing) {
        logger.info(`Token ${tokenAddress} already exists in database`);
        return {
          alreadyIndexed: true,
          token: existing,
        };
      }

      // Get current block
      const currentBlock = await provider.getBlockNumber();
      logger.info(`Current block: ${currentBlock}`);

      // Search last 50,000 blocks (~41 hours on BSC testnet)
      const fromBlock = Math.max(0, currentBlock - 50000);
      logger.info(`Searching from block ${fromBlock} to ${currentBlock}...`);

      // Query TokenCreated events in chunks to avoid RPC limits
      const chunkSize = 5000;
      let tokenEvent = null;

      for (let start = fromBlock; start <= currentBlock; start += chunkSize) {
        const end = Math.min(start + chunkSize - 1, currentBlock);

        try {
          const filter = tokenFactoryContract.filters.TokenCreated();
          const events = await tokenFactoryContract.queryFilter(filter, start, end);

          // Find event for our token
          tokenEvent = events.find((event: any) =>
            event.args && event.args[0].toLowerCase() === tokenAddress.toLowerCase()
          );

          if (tokenEvent) {
            logger.info(`Found TokenCreated event in blocks ${start}-${end}`);
            break;
          }
        } catch (error) {
          logger.error(`Error querying blocks ${start}-${end}:`, error);
          // Continue with next chunk
        }

        // Small delay to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      if (!tokenEvent) {
        throw new Error(`No TokenCreated event found for ${tokenAddress} in last 50,000 blocks`);
      }

      const eventLog = tokenEvent as ethers.EventLog;
      const [token, bondingCurve, creator, name, symbol] = eventLog.args;

      logger.info(`Found token: ${name} (${symbol}) created by ${creator} at block ${eventLog.blockNumber}`);

      // Get block timestamp
      const block = await provider.getBlock(eventLog.blockNumber);
      const timestamp = block ? new Date(block.timestamp * 1000) : new Date();

      // Fetch metadata URI from token contract
      let description = '';
      let imageUrl = '';

      try {
        const PumpTokenABI = ['function metadataURI() view returns (string)'];
        const tokenContract = new ethers.Contract(token, PumpTokenABI, provider);
        const metadataURI = await tokenContract.metadataURI();
        logger.info(`Metadata URI for ${token}: ${metadataURI}`);

        // Fetch metadata from IPFS if available
        if (metadataURI && metadataURI.startsWith('ipfs://')) {
          try {
            const ipfsService = (await import('./ipfs.service')).ipfsService;
            const metadata = await ipfsService.fetchMetadata(metadataURI);
            description = metadata.description || '';
            imageUrl = metadata.image || '';
            logger.info(`Fetched IPFS metadata for ${token}`);
          } catch (ipfsError) {
            logger.warn(`Failed to fetch IPFS metadata for ${token}:`, ipfsError);
          }
        }
      } catch (contractError) {
        logger.warn(`Failed to read metadataURI from token ${token}:`, contractError);
      }

      // Store token in database
      const newToken = await prisma.token.create({
        data: {
          address: token.toLowerCase(),
          name,
          symbol,
          description,
          imageUrl,
          creator: creator.toLowerCase(),
          totalSupply: '1000000000000000000000000000',
          bondingCurve: bondingCurve.toLowerCase(),
          createdAt: timestamp,
          blockNumber: eventLog.blockNumber,
          isGraduated: false,
        },
      });

      // Initialize token stats
      await prisma.tokenStats.create({
        data: {
          tokenAddress: token.toLowerCase(),
          price: '0',
          marketCap: '0',
          volume24h: '0',
          liquidity: '0',
          trades24h: 0,
          holders: 1,
          priceChange24h: '0',
        },
      });

      logger.info(`Token ${token} indexed successfully!`);

      return {
        alreadyIndexed: false,
        token: newToken,
        blockNumber: eventLog.blockNumber,
      };
    } catch (error) {
      logger.error('Error indexing token:', error);
      throw error;
    }
  }

  /**
   * Re-index a range of blocks
   */
  async reindexBlocks(fromBlock: number, toBlock?: number) {
    try {
      const currentBlock = await provider.getBlockNumber();
      const endBlock = toBlock || currentBlock;

      logger.info(`Re-indexing blocks ${fromBlock} to ${endBlock}`);

      // Limit to 10,000 blocks max
      const maxRange = 10000;
      const actualEndBlock = Math.min(endBlock, fromBlock + maxRange);

      // Query TokenCreated events in chunks
      const chunkSize = 1000;
      let totalTokensFound = 0;

      for (let start = fromBlock; start <= actualEndBlock; start += chunkSize) {
        const end = Math.min(start + chunkSize - 1, actualEndBlock);

        try {
          const filter = tokenFactoryContract.filters.TokenCreated();
          const events = await tokenFactoryContract.queryFilter(filter, start, end);

          logger.info(`Found ${events.length} TokenCreated events in blocks ${start}-${end}`);

          for (const event of events) {
            try {
              const eventLog = event as ethers.EventLog;
              const [tokenAddress] = eventLog.args;

              // Check if already indexed
              const existing = await prisma.token.findUnique({
                where: { address: tokenAddress.toLowerCase() },
              });

              if (existing) {
                logger.info(`Token ${tokenAddress} already indexed, skipping`);
                continue;
              }

              // Index this token
              await this.indexToken(tokenAddress);
              totalTokensFound++;
            } catch (error) {
              logger.error('Error processing event:', error);
            }
          }
        } catch (error) {
          logger.error(`Error querying blocks ${start}-${end}:`, error);
        }

        // Small delay to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      return {
        fromBlock,
        toBlock: actualEndBlock,
        tokensIndexed: totalTokensFound,
      };
    } catch (error) {
      logger.error('Error re-indexing blocks:', error);
      throw error;
    }
  }

  /**
   * Get current indexer status
   */
  async getIndexerStatus() {
    try {
      const currentBlock = await provider.getBlockNumber();

      // Get indexer state
      const indexerState = await prisma.indexerState.findFirst({
        orderBy: { updatedAt: 'desc' },
      });

      // Get latest indexed token
      const latestToken = await prisma.token.findFirst({
        orderBy: { blockNumber: 'desc' },
      });

      // Get total tokens
      const totalTokens = await prisma.token.count();

      return {
        currentBlockNumber: currentBlock,
        lastIndexedBlock: indexerState?.lastIndexedBlock || null,
        lastIndexedAt: indexerState?.updatedAt || null,
        latestTokenBlock: latestToken?.blockNumber || null,
        latestTokenAddress: latestToken?.address || null,
        totalTokensIndexed: totalTokens,
        blocksBehind: indexerState
          ? currentBlock - indexerState.lastIndexedBlock
          : null,
      };
    } catch (error) {
      logger.error('Error getting indexer status:', error);
      throw error;
    }
  }

  /**
   * Get comprehensive platform statistics for admin dashboard
   */
  async getPlatformStats() {
    try {
      const now = new Date();
      const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      // Get token counts
      const [totalTokens, graduatedTokens, totalTrades, totalUsers] = await Promise.all([
        prisma.token.count(),
        prisma.token.count({ where: { isGraduated: true } }),
        prisma.trade.count(),
        prisma.user.count(),
      ]);

      // Get 24h stats
      const [trades24h, tokensCreated24h, newUsers24h] = await Promise.all([
        prisma.trade.count({ where: { timestamp: { gte: twentyFourHoursAgo } } }),
        prisma.token.count({ where: { createdAt: { gte: twentyFourHoursAgo } } }),
        prisma.user.count({ where: { createdAt: { gte: twentyFourHoursAgo } } }),
      ]);

      // Get 7d stats
      const [trades7d, tokensCreated7d, newUsers7d] = await Promise.all([
        prisma.trade.count({ where: { timestamp: { gte: oneWeekAgo } } }),
        prisma.token.count({ where: { createdAt: { gte: oneWeekAgo } } }),
        prisma.user.count({ where: { createdAt: { gte: oneWeekAgo } } }),
      ]);

      // Calculate total trading volume and fees
      const allTrades = await prisma.trade.findMany({
        select: { asterAmount: true, fee: true },
      });

      let totalVolume = BigInt(0);
      let totalPlatformFees = BigInt(0);

      for (const trade of allTrades) {
        if (trade.asterAmount) {
          totalVolume += BigInt(trade.asterAmount);
        }
        if (trade.fee) {
          // Platform gets 70% of fees (0.7% of 1% total fee)
          const platformFee = (BigInt(trade.fee) * BigInt(70)) / BigInt(100);
          totalPlatformFees += platformFee;
        }
      }

      // 24h volume
      const trades24hData = await prisma.trade.findMany({
        where: { timestamp: { gte: twentyFourHoursAgo } },
        select: { asterAmount: true, fee: true },
      });

      let volume24h = BigInt(0);
      let fees24h = BigInt(0);

      for (const trade of trades24hData) {
        if (trade.asterAmount) {
          volume24h += BigInt(trade.asterAmount);
        }
        if (trade.fee) {
          const platformFee = (BigInt(trade.fee) * BigInt(70)) / BigInt(100);
          fees24h += platformFee;
        }
      }

      // Get unique traders count
      const uniqueTraders = await prisma.trade.groupBy({
        by: ['trader'],
        _count: true,
      });

      // Get top tokens by volume
      const topTokensByVolume = await prisma.tokenStats.findMany({
        take: 5,
        orderBy: { volume24h: 'desc' },
        include: {
          token: {
            select: { name: true, symbol: true, address: true },
          },
        },
      });

      return {
        overview: {
          totalTokens,
          graduatedTokens,
          graduationRate: totalTokens > 0 ? ((graduatedTokens / totalTokens) * 100).toFixed(2) : '0',
          totalTrades,
          totalUsers,
          uniqueTraders: uniqueTraders.length,
          totalVolume: totalVolume.toString(),
          totalPlatformFees: totalPlatformFees.toString(),
        },
        last24h: {
          trades: trades24h,
          tokensCreated: tokensCreated24h,
          newUsers: newUsers24h,
          volume: volume24h.toString(),
          platformFees: fees24h.toString(),
        },
        last7d: {
          trades: trades7d,
          tokensCreated: tokensCreated7d,
          newUsers: newUsers7d,
        },
        topTokensByVolume: topTokensByVolume.map((t) => ({
          address: t.token.address,
          name: t.token.name,
          symbol: t.token.symbol,
          volume24h: t.volume24h,
          trades24h: t.trades24h,
        })),
        timestamp: now.toISOString(),
      };
    } catch (error) {
      logger.error('Error getting platform stats:', error);
      throw error;
    }
  }
}

export const adminService = new AdminService();

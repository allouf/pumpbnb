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

      // Store token in database
      const newToken = await prisma.token.create({
        data: {
          address: token.toLowerCase(),
          name,
          symbol,
          description: '',
          imageUrl: '',
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
}

export const adminService = new AdminService();

import { ethers } from 'ethers';
import config from '../config';
import logger from '../utils/logger';
import { prisma } from './database.service';
import TokenFactoryABI from '../../../artifacts/contracts/TokenFactory.sol/TokenFactory.json';
import BondingCurveABI from '../../../artifacts/contracts/BondingCurve.sol/BondingCurve.json';
// import GraduationManagerABI from '../../../artifacts/contracts/GraduationManager.sol/GraduationManager.json'; // TODO: Add graduation event listening

let provider: ethers.JsonRpcProvider;
let tokenFactoryContract: ethers.Contract;
let isIndexing = false;

export async function startBlockchainIndexer(): Promise<void> {
  try {
    // Initialize provider
    provider = new ethers.JsonRpcProvider(config.bscTestnetRpc);
    logger.info('Connected to BSC Testnet RPC');

    // Initialize TokenFactory contract
    tokenFactoryContract = new ethers.Contract(
      config.tokenFactoryAddress,
      TokenFactoryABI.abi,
      provider
    );

    // Get the latest indexed block
    const latestBlock = await getLatestIndexedBlock();
    logger.info(`Starting indexer from block ${latestBlock}`);

    // Start listening to events
    await listenToTokenCreation();
    await indexPastEvents(latestBlock);

    isIndexing = true;
    logger.info('Blockchain indexer started successfully');
  } catch (error) {
    logger.error('Failed to start blockchain indexer:', error);
    throw error;
  }
}

async function getLatestIndexedBlock(): Promise<number> {
  try {
    // Get the latest trade or graduation event block
    const latestTrade = await prisma.trade.findFirst({
      orderBy: { blockNumber: 'desc' },
      select: { blockNumber: true },
    });

    const latestGraduation = await prisma.graduationEvent.findFirst({
      orderBy: { blockNumber: 'desc' },
      select: { blockNumber: true },
    });

    const latestBlock = Math.max(
      latestTrade?.blockNumber || 0,
      latestGraduation?.blockNumber || 0
    );

    // If no events indexed, start from deployment block or recent block
    if (latestBlock === 0) {
      const currentBlock = await provider.getBlockNumber();
      // Start from 1000 blocks ago to catch recent events
      return Math.max(0, currentBlock - 1000);
    }

    return latestBlock + 1;
  } catch (error) {
    logger.error('Error getting latest indexed block:', error);
    return 0;
  }
}

async function listenToTokenCreation(): Promise<void> {
  // Listen for TokenCreated events
  tokenFactoryContract.on(
    'TokenCreated',
    async (
      tokenAddress: string,
      bondingCurve: string,
      creator: string,
      name: string,
      symbol: string,
      event: any
    ) => {
      try {
        logger.info(`New token created: ${tokenAddress} by ${creator}`);

        // Store token in database
        await prisma.token.create({
          data: {
            address: tokenAddress.toLowerCase(),
            name,
            symbol,
            description: '', // Will be updated from IPFS metadata
            imageUrl: '', // Will be updated from IPFS metadata
            creator: creator.toLowerCase(),
            totalSupply: '1000000000000000000000000000', // 1 billion with 18 decimals
            bondingCurve: bondingCurve.toLowerCase(),
            createdAt: new Date(event.log.timestamp * 1000 || Date.now()),
            isGraduated: false,
          },
        });

        // Initialize token stats
        await prisma.tokenStats.create({
          data: {
            tokenAddress: tokenAddress.toLowerCase(),
            price: '0',
            marketCap: '0',
            volume24h: '0',
            liquidity: '0',
            trades24h: 0,
            holders: 1, // Creator is first holder
            priceChange24h: '0',
          },
        });

        // Start listening to bonding curve events for this token
        await listenToBondingCurve(bondingCurve);

        logger.info(`Token ${tokenAddress} indexed successfully`);
      } catch (error) {
        logger.error(`Error processing TokenCreated event:`, error);
      }
    }
  );

  logger.info('Listening for TokenCreated events');
}

async function listenToBondingCurve(bondingCurveAddress: string): Promise<void> {
  const bondingCurve = new ethers.Contract(bondingCurveAddress, BondingCurveABI.abi, provider);

  // Get token address from bonding curve
  const tokenAddress = await bondingCurve.token();

  // Listen for Buy events
  bondingCurve.on('Buy', async (buyer: string, amountIn: bigint, amountOut: bigint, event: any) => {
    try {
      logger.info(`Buy event on ${tokenAddress}: ${buyer}`);

      const receipt = await event.log.getTransactionReceipt();
      const block = await provider.getBlock(event.log.blockNumber);

      await prisma.trade.create({
        data: {
          tokenAddress: tokenAddress.toLowerCase(),
          trader: buyer.toLowerCase(),
          isBuy: true,
          amountIn: amountIn.toString(),
          amountOut: amountOut.toString(),
          fee: '0', // Calculate from event if needed
          timestamp: new Date((block?.timestamp || Date.now() / 1000) * 1000),
          txHash: receipt.hash,
          blockNumber: event.log.blockNumber,
        },
      });

      // Update token stats
      await updateTokenStats(tokenAddress.toLowerCase());

      logger.info(`Buy event indexed for ${tokenAddress}`);
    } catch (error) {
      logger.error(`Error processing Buy event:`, error);
    }
  });

  // Listen for Sell events
  bondingCurve.on(
    'Sell',
    async (seller: string, amountIn: bigint, amountOut: bigint, event: any) => {
      try {
        logger.info(`Sell event on ${tokenAddress}: ${seller}`);

        const receipt = await event.log.getTransactionReceipt();
        const block = await provider.getBlock(event.log.blockNumber);

        await prisma.trade.create({
          data: {
            tokenAddress: tokenAddress.toLowerCase(),
            trader: seller.toLowerCase(),
            isBuy: false,
            amountIn: amountIn.toString(),
            amountOut: amountOut.toString(),
            fee: '0',
            timestamp: new Date((block?.timestamp || Date.now() / 1000) * 1000),
            txHash: receipt.hash,
            blockNumber: event.log.blockNumber,
          },
        });

        await updateTokenStats(tokenAddress.toLowerCase());

        logger.info(`Sell event indexed for ${tokenAddress}`);
      } catch (error) {
        logger.error(`Error processing Sell event:`, error);
      }
    }
  );

  logger.info(`Listening for trades on bonding curve ${bondingCurveAddress}`);
}

async function updateTokenStats(tokenAddress: string): Promise<void> {
  try {
    // Calculate 24h volume
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const trades24h = await prisma.trade.count({
      where: {
        tokenAddress,
        timestamp: { gte: oneDayAgo },
      },
    });

    // Get trades from last 24 hours to calculate volume
    const tradesFor24h = await prisma.trade.findMany({
      where: {
        tokenAddress,
        timestamp: { gte: oneDayAgo },
      },
      select: {
        amountIn: true,
      },
    });

    // Manually sum the volume (since amountIn is String, can't use Prisma aggregate)
    const volume24h = tradesFor24h
      .reduce((sum, trade) => sum + BigInt(trade.amountIn), BigInt(0))
      .toString();

    // Get unique holders
    const holders = await prisma.userPortfolio.count({
      where: { tokenAddress },
    });

    // Update stats
    await prisma.tokenStats.update({
      where: { tokenAddress },
      data: {
        volume24h,
        trades24h,
        holders: holders || 1,
        updatedAt: new Date(),
      },
    });
  } catch (error) {
    logger.error(`Error updating token stats for ${tokenAddress}:`, error);
  }
}

async function indexPastEvents(fromBlock: number): Promise<void> {
  try {
    const currentBlock = await provider.getBlockNumber();
    logger.info(`Indexing past events from block ${fromBlock} to ${currentBlock}`);

    // Query TokenCreated events in chunks to avoid rate limits
    const chunkSize = 5000;
    for (let startBlock = fromBlock; startBlock < currentBlock; startBlock += chunkSize) {
      const endBlock = Math.min(startBlock + chunkSize - 1, currentBlock);

      const filter = tokenFactoryContract.filters.TokenCreated();
      const events = await tokenFactoryContract.queryFilter(filter, startBlock, endBlock);

      logger.info(`Found ${events.length} TokenCreated events in blocks ${startBlock}-${endBlock}`);

      for (const event of events) {
        // Process each event (similar to real-time listener)
        // This is a simplified version - you may want to batch insert for performance
        const args = (event as any).args;
        if (args) {
          const [tokenAddress, bondingCurve, creator, name, symbol] = args;

          // Check if already indexed
          const existing = await prisma.token.findUnique({
            where: { address: tokenAddress.toLowerCase() },
          });

          if (!existing) {
            await prisma.token.create({
              data: {
                address: tokenAddress.toLowerCase(),
                name,
                symbol,
                description: '',
                imageUrl: '',
                creator: creator.toLowerCase(),
                totalSupply: '1000000000000000000000000000',
                bondingCurve: bondingCurve.toLowerCase(),
                createdAt: new Date(),
                isGraduated: false,
              },
            });

            await prisma.tokenStats.create({
              data: {
                tokenAddress: tokenAddress.toLowerCase(),
                price: '0',
                marketCap: '0',
                volume24h: '0',
                liquidity: '0',
                trades24h: 0,
                holders: 1,
                priceChange24h: '0',
              },
            });

            logger.info(`Indexed past token: ${tokenAddress}`);
          }
        }
      }
    }

    logger.info('Past events indexing completed');
  } catch (error) {
    logger.error('Error indexing past events:', error);
  }
}

export function stopBlockchainIndexer(): void {
  if (provider && isIndexing) {
    provider.removeAllListeners();
    isIndexing = false;
    logger.info('Blockchain indexer stopped');
  }
}

export { provider, tokenFactoryContract };

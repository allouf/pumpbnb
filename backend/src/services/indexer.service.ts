import { ethers } from 'ethers';
import config from '../config';
import logger from '../utils/logger';
import { prisma } from './database.service';
import TokenFactoryABI from '../../artifacts/contracts/TokenFactory.sol/TokenFactory.json';
// import BondingCurveABI from '../../artifacts/contracts/BondingCurve.sol/BondingCurve.json';
// import GraduationManagerABI from '../../artifacts/contracts/GraduationManager.sol/GraduationManager.json'; // TODO: Add graduation event listening

let provider: ethers.JsonRpcProvider;
let tokenFactoryContract: ethers.Contract;
let isIndexing = false;
let pollingInterval: NodeJS.Timeout | null = null;
let lastIndexedBlock = 0;

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
    lastIndexedBlock = await getLatestIndexedBlock();
    logger.info(`Starting indexer from block ${lastIndexedBlock}`);

    // Index past events first
    await indexPastEvents(lastIndexedBlock);

    // Start polling for new events every 10 seconds
    isIndexing = true;
    startPolling();

    logger.info('Blockchain indexer started successfully');
  } catch (error) {
    logger.error('Failed to start blockchain indexer:', error);
    throw error;
  }
}

async function getLatestIndexedBlock(): Promise<number> {
  try {
    // Check IndexerState first (most reliable source)
    const indexerState = await prisma.indexerState.findFirst({
      orderBy: { updatedAt: 'desc' },
    });

    if (indexerState) {
      logger.info(`Resuming from saved indexer state: block ${indexerState.lastIndexedBlock}`);
      return indexerState.lastIndexedBlock + 1;
    }

    // Fallback: check actual indexed data
    const latestToken = await prisma.token.findFirst({
      orderBy: { blockNumber: 'desc' },
      select: { blockNumber: true },
    });

    const latestTrade = await prisma.trade.findFirst({
      orderBy: { blockNumber: 'desc' },
      select: { blockNumber: true },
    });

    let latestGraduation = null;
    try {
      latestGraduation = await prisma.graduationEvent.findFirst({
        orderBy: { blockNumber: 'desc' },
        select: { blockNumber: true },
      });
    } catch (graduationError) {
      logger.warn('graduation_events table not found, will be created on migration');
    }

    const latestBlock = Math.max(
      latestToken?.blockNumber || 0,
      latestTrade?.blockNumber || 0,
      latestGraduation?.blockNumber || 0
    );

    // If no events indexed, start from deployment block (Oct 30, 2025)
    if (latestBlock === 0) {
      const currentBlock = await provider.getBlockNumber();
      // Start from 10000 blocks ago to catch recent events (last ~8 hours on BSC)
      const startBlock = Math.max(0, currentBlock - 10000);
      logger.info(`No indexed data found, starting from ${startBlock} (last 10000 blocks)`);
      return startBlock;
    }

    logger.info(`Resuming from block ${latestBlock + 1} based on indexed data`);
    return latestBlock + 1;
  } catch (error) {
    logger.error('Error getting latest indexed block:', error);
    const currentBlock = await provider.getBlockNumber();
    return currentBlock;
  }
}

function startPolling(): void {
  // Poll for new events every 10 seconds
  pollingInterval = setInterval(async () => {
    try {
      await pollForNewEvents();
    } catch (error) {
      logger.error('Error during polling:', error);
    }
  }, 10000); // 10 seconds

  logger.info('Started polling for new events every 10 seconds');
}

async function pollForNewEvents(): Promise<void> {
  try {
    const currentBlock = await provider.getBlockNumber();

    // Initialize lastIndexedBlock if it's 0 (first run)
    if (lastIndexedBlock === 0) {
      lastIndexedBlock = currentBlock;
      logger.info(`Initialized lastIndexedBlock to current block: ${currentBlock}`);
      return;
    }

    // If we're already at the latest block, skip
    if (lastIndexedBlock >= currentBlock) {
      return;
    }

    // Limit the block range to 1000 blocks max per query to avoid RPC limits
    const maxBlockRange = 1000;
    const fromBlock = lastIndexedBlock + 1;
    const toBlock = Math.min(fromBlock + maxBlockRange - 1, currentBlock);

    logger.info(`Polling blocks ${fromBlock} to ${toBlock}`);

    // Query TokenCreated events
    const filter = tokenFactoryContract.filters.TokenCreated();
    const events = await tokenFactoryContract.queryFilter(filter, fromBlock, toBlock);

    if (events.length > 0) {
      logger.info(`Found ${events.length} new TokenCreated events`);

      for (const event of events) {
        await processTokenCreatedEvent(event);
      }
    }

    // Update last indexed block in memory
    lastIndexedBlock = toBlock;

    // Save indexer state to database every 100 blocks
    if (toBlock % 100 === 0) {
      await saveIndexerState(toBlock);
    }
  } catch (error) {
    logger.error('Error polling for new events:', error);
  }
}

async function saveIndexerState(blockNumber: number): Promise<void> {
  try {
    // Upsert indexer state (create or update)
    const existing = await prisma.indexerState.findFirst();

    if (existing) {
      await prisma.indexerState.update({
        where: { id: existing.id },
        data: { lastIndexedBlock: blockNumber },
      });
    } else {
      await prisma.indexerState.create({
        data: { lastIndexedBlock: blockNumber },
      });
    }

    logger.info(`Saved indexer state: block ${blockNumber}`);
  } catch (error) {
    logger.error('Error saving indexer state:', error);
  }
}

async function processTokenCreatedEvent(event: any): Promise<void> {
  try {
    const args = event.args;
    if (!args) return;

    const [tokenAddress, bondingCurve, creator, name, symbol] = args;

    logger.info(`New token created: ${tokenAddress} by ${creator}`);

    // Check if already indexed
    const existing = await prisma.token.findUnique({
      where: { address: tokenAddress.toLowerCase() },
    });

    if (existing) {
      logger.info(`Token ${tokenAddress} already indexed, skipping`);
      return;
    }

    // Get block timestamp
    const block = await provider.getBlock(event.blockNumber);
    const timestamp = block ? new Date(block.timestamp * 1000) : new Date();

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
        createdAt: timestamp,
        blockNumber: event.blockNumber,
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

    logger.info(`Token ${tokenAddress} indexed successfully`);
  } catch (error) {
    logger.error(`Error processing TokenCreated event:`, error);
  }
}

// Bonding curve events are now polled in pollForNewEvents
// This function is kept for reference but not used with polling approach

// TODO: Re-enable when implementing bonding curve event polling
/*
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
*/

async function indexPastEvents(fromBlock: number): Promise<void> {
  try {
    const currentBlock = await provider.getBlockNumber();

    // Limit to last 1000 blocks to avoid RPC rate limits on initial start
    const maxBlockRange = 1000;
    const startBlock = Math.max(fromBlock, currentBlock - maxBlockRange);

    logger.info(`Indexing past events from block ${startBlock} to ${currentBlock}`);

    // Query TokenCreated events in smaller chunks (500 blocks) to avoid rate limits
    const chunkSize = 500;
    for (let start = startBlock; start < currentBlock; start += chunkSize) {
      const end = Math.min(start + chunkSize - 1, currentBlock);

      try {
        const filter = tokenFactoryContract.filters.TokenCreated();
        const events = await tokenFactoryContract.queryFilter(filter, start, end);

        logger.info(`Found ${events.length} TokenCreated events in blocks ${start}-${end}`);

        for (const event of events) {
          await processTokenCreatedEvent(event);
        }

        // Add a small delay between chunks to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (error) {
        logger.error(`Error querying blocks ${start}-${end}:`, error);
        // Continue with next chunk even if this one fails
      }
    }

    logger.info('Past events indexing completed');
  } catch (error) {
    logger.error('Error indexing past events:', error);
  }
}

export function stopBlockchainIndexer(): void {
  if (isIndexing) {
    if (pollingInterval) {
      clearInterval(pollingInterval);
      pollingInterval = null;
    }
    isIndexing = false;
    logger.info('Blockchain indexer stopped');
  }
}

export { provider, tokenFactoryContract };

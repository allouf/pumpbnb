/**
 * Immediate Token Indexer Service
 * Indexes a newly created token immediately from transaction hash
 * without waiting for the background indexer
 */

import { ethers } from 'ethers';
import config from '../config';
import logger from '../utils/logger';
import { prisma } from './database.service';
import { ipfsService } from './ipfs.service';
import TokenFactoryABI from '../../artifacts/contracts/TokenFactory.sol/TokenFactory.json';

let provider: ethers.JsonRpcProvider;

function getProvider(): ethers.JsonRpcProvider {
  if (!provider) {
    provider = new ethers.JsonRpcProvider(config.bscTestnetRpc);
  }
  return provider;
}

export interface IndexTokenRequest {
  txHash: string;
  tokenAddress?: string;
  bondingCurve?: string;
  creator?: string;
  name?: string;
  symbol?: string;
}

/**
 * Index a token immediately from transaction hash
 */
export async function indexTokenFromTransaction(request: IndexTokenRequest): Promise<any> {
  try {
    const provider = getProvider();

    logger.info(`[Immediate Indexer] Processing transaction: ${request.txHash}`);

    // Get transaction receipt
    const receipt = await provider.getTransactionReceipt(request.txHash);

    if (!receipt) {
      throw new Error('Transaction not found or not confirmed yet');
    }

    if (receipt.status !== 1) {
      throw new Error('Transaction failed');
    }

    // Parse TokenCreated event from logs
    const tokenFactoryInterface = new ethers.Interface(TokenFactoryABI.abi);
    let tokenCreatedEvent: any = null;

    for (const log of receipt.logs) {
      try {
        const parsed = tokenFactoryInterface.parseLog({
          topics: log.topics as string[],
          data: log.data,
        });

        if (parsed && parsed.name === 'TokenCreated') {
          tokenCreatedEvent = parsed;
          break;
        }
      } catch (e) {
        // Skip logs that don't match TokenCreated event
        continue;
      }
    }

    if (!tokenCreatedEvent) {
      throw new Error('TokenCreated event not found in transaction');
    }

    // Extract event data
    const [tokenAddress, bondingCurve, creator, name, symbol, metadataURI] = tokenCreatedEvent.args;

    logger.info(`[Immediate Indexer] Found token: ${tokenAddress}`);

    // Check if already indexed
    const existing = await prisma.token.findUnique({
      where: { address: tokenAddress.toLowerCase() },
    });

    if (existing) {
      logger.info(`[Immediate Indexer] Token ${tokenAddress} already indexed`);
      return existing;
    }

    // Get block timestamp
    const block = await provider.getBlock(receipt.blockNumber);
    const timestamp = block ? new Date(block.timestamp * 1000) : new Date();

    // Fetch metadata from IPFS
    let description = '';
    let imageUrl = '';
    let website = '';
    let twitter = '';
    let telegram = '';
    let discord = '';
    let ipfsHash = '';

    if (metadataURI && metadataURI.startsWith('ipfs://')) {
      try {
        ipfsHash = metadataURI.replace('ipfs://', '');
        logger.info(`[Immediate Indexer] Fetching metadata from IPFS: ${ipfsHash}`);

        const metadata = await ipfsService.fetchMetadata(metadataURI);

        description = metadata.description || '';
        imageUrl = metadata.image || '';

        // Extract social links
        if (metadata.properties?.social) {
          website = metadata.properties.social.website || '';
          twitter = metadata.properties.social.twitter || '';
          telegram = metadata.properties.social.telegram || '';
          discord = metadata.properties.social.discord || '';
        }

        logger.info(`[Immediate Indexer] Fetched metadata for ${tokenAddress}:`, {
          description: description ? 'present' : 'empty',
          imageUrl: imageUrl ? 'present' : 'empty',
          ipfsHash,
        });
      } catch (ipfsError: any) {
        logger.error(`[Immediate Indexer] Failed to fetch IPFS metadata for ${ipfsHash}:`, {
          message: ipfsError.message,
          code: ipfsError.code,
          response: ipfsError.response?.status,
        });
      }
    } else {
      logger.warn(`[Immediate Indexer] No metadata URI or invalid format: ${metadataURI}`);
    }

    // Store token in database
    const token = await prisma.token.create({
      data: {
        address: tokenAddress.toLowerCase(),
        name,
        symbol,
        description,
        imageUrl,
        creator: creator.toLowerCase(),
        totalSupply: '1000000000000000000000000000', // 1 billion with 18 decimals
        bondingCurve: bondingCurve.toLowerCase(),
        createdAt: timestamp,
        blockNumber: receipt.blockNumber,
        isGraduated: false,
        ipfsHash,
        website,
        twitter,
        telegram,
        discord,
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

    logger.info(`[Immediate Indexer] Token ${tokenAddress} indexed successfully`);

    return token;
  } catch (error) {
    logger.error('[Immediate Indexer] Error indexing token:', error);
    throw error;
  }
}

/**
 * Index token with retry logic (for cases where transaction isn't confirmed yet)
 */
export async function indexTokenWithRetry(
  request: IndexTokenRequest,
  maxRetries = 5,
  delayMs = 2000
): Promise<any> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await indexTokenFromTransaction(request);
    } catch (error: any) {
      lastError = error;

      if (error.message.includes('not found') || error.message.includes('not confirmed')) {
        // Transaction not confirmed yet, retry
        logger.info(`[Immediate Indexer] Attempt ${attempt}/${maxRetries} - waiting for confirmation...`);

        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, delayMs));
          continue;
        }
      }

      // Other errors, don't retry
      throw error;
    }
  }

  throw lastError || new Error('Failed to index token after multiple attempts');
}

export const immediateIndexerService = {
  indexTokenFromTransaction,
  indexTokenWithRetry,
};

export default immediateIndexerService;

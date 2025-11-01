/**
 * Immediate Trade Indexer Service
 * Indexes buy/sell transactions immediately from transaction hash
 * without waiting for the background indexer
 */

import { ethers } from 'ethers';
import config from '../config';
import logger from '../utils/logger';
import { prisma } from './database.service';
import BondingCurveABI from '../../artifacts/contracts/BondingCurve.sol/BondingCurve.json';

let provider: ethers.JsonRpcProvider;

function getProvider(): ethers.JsonRpcProvider {
  if (!provider) {
    provider = new ethers.JsonRpcProvider(config.bscTestnetRpc);
  }
  return provider;
}

export interface IndexTradeRequest {
  txHash: string;
  tokenAddress: string;
}

/**
 * Index a trade immediately from transaction hash
 */
export async function indexTradeFromTransaction(request: IndexTradeRequest): Promise<any> {
  try {
    const provider = getProvider();

    logger.info(`[Immediate Trade Indexer] Processing transaction: ${request.txHash}`);

    // Get transaction receipt
    const receipt = await provider.getTransactionReceipt(request.txHash);

    if (!receipt) {
      throw new Error('Transaction not found or not confirmed yet');
    }

    if (receipt.status !== 1) {
      throw new Error('Transaction failed');
    }

    // Check if trade already indexed
    const existing = await prisma.trade.findUnique({
      where: { txHash: request.txHash },
    });

    if (existing) {
      logger.info(`[Immediate Trade Indexer] Trade ${request.txHash} already indexed`);
      return existing;
    }

    // Get token to find bonding curve address
    const token = await prisma.token.findUnique({
      where: { address: request.tokenAddress.toLowerCase() },
    });

    if (!token) {
      throw new Error(`Token ${request.tokenAddress} not found`);
    }

    // Parse Buy or Sell event from logs
    const bondingCurveInterface = new ethers.Interface(BondingCurveABI.abi);
    let buyEvent: any = null;
    let sellEvent: any = null;

    for (const log of receipt.logs) {
      // Skip if log is not from the bonding curve contract
      if (log.address.toLowerCase() !== token.bondingCurve.toLowerCase()) {
        continue;
      }

      try {
        const parsed = bondingCurveInterface.parseLog({
          topics: log.topics as string[],
          data: log.data,
        });

        if (parsed) {
          if (parsed.name === 'Buy') {
            buyEvent = parsed;
            break;
          } else if (parsed.name === 'Sell') {
            sellEvent = parsed;
            break;
          }
        }
      } catch (e) {
        // Skip logs that don't match Buy/Sell events
        continue;
      }
    }

    if (!buyEvent && !sellEvent) {
      throw new Error('Buy or Sell event not found in transaction');
    }

    // Get block timestamp
    const block = await provider.getBlock(receipt.blockNumber);
    const timestamp = block ? new Date(block.timestamp * 1000) : new Date();

    // Process Buy event
    if (buyEvent) {
      const buyer = buyEvent.args.buyer as string;
      const asterIn = buyEvent.args.asterIn.toString();
      const tokensOut = buyEvent.args.tokensOut.toString();
      const totalFee = (buyEvent.args.creatorFee + buyEvent.args.protocolFee).toString();

      const trade = await prisma.trade.create({
        data: {
          tokenAddress: request.tokenAddress.toLowerCase(),
          trader: buyer.toLowerCase(),
          isBuy: true,
          amountIn: asterIn,
          amountOut: tokensOut,
          fee: totalFee,
          timestamp,
          txHash: request.txHash,
          blockNumber: receipt.blockNumber,
        },
      });

      logger.info(`[Immediate Trade Indexer] Buy indexed: ${buyer} bought ${Number(tokensOut) / 1e18} tokens for ${Number(asterIn) / 1e18} ASTER`);

      return trade;
    }

    // Process Sell event
    if (sellEvent) {
      const seller = sellEvent.args.seller as string;
      const tokensIn = sellEvent.args.tokensIn.toString();
      const asterOut = sellEvent.args.asterOut.toString();
      const totalFee = (sellEvent.args.creatorFee + sellEvent.args.protocolFee).toString();

      const trade = await prisma.trade.create({
        data: {
          tokenAddress: request.tokenAddress.toLowerCase(),
          trader: seller.toLowerCase(),
          isBuy: false,
          amountIn: tokensIn,
          amountOut: asterOut,
          fee: totalFee,
          timestamp,
          txHash: request.txHash,
          blockNumber: receipt.blockNumber,
        },
      });

      logger.info(`[Immediate Trade Indexer] Sell indexed: ${seller} sold ${Number(tokensIn) / 1e18} tokens for ${Number(asterOut) / 1e18} ASTER`);

      return trade;
    }

    throw new Error('Failed to process trade event');
  } catch (error) {
    logger.error('[Immediate Trade Indexer] Error indexing trade:', error);
    throw error;
  }
}

/**
 * Index trade with retry logic (for cases where transaction isn't confirmed yet)
 */
export async function indexTradeWithRetry(
  request: IndexTradeRequest,
  maxRetries = 5,
  delayMs = 2000
): Promise<any> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await indexTradeFromTransaction(request);
    } catch (error: any) {
      lastError = error;

      if (error.message.includes('not found') || error.message.includes('not confirmed')) {
        // Transaction not confirmed yet, retry
        logger.info(`[Immediate Trade Indexer] Attempt ${attempt}/${maxRetries} - waiting for confirmation...`);

        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, delayMs));
          continue;
        }
      }

      // Other errors, don't retry
      throw error;
    }
  }

  throw lastError || new Error('Failed to index trade after multiple attempts');
}

export const immediateTradeIndexerService = {
  indexTradeFromTransaction,
  indexTradeWithRetry,
};

export default immediateTradeIndexerService;

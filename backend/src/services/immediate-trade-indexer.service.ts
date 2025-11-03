/**
 * Immediate Trade Indexer Service
 * Indexes buy/sell transactions immediately from transaction hash
 * without waiting for the background indexer
 */

import { ethers } from 'ethers';
import config from '../config';
import logger from '../utils/logger';
import { prisma } from './database.service';
import { holderUpdaterService } from './holder-updater.service';
import { ohlcvAggregatorService } from './ohlcv-aggregator.service';
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

    logger.info(`[Immediate Trade Indexer] 🔍 Processing transaction:`, {
      txHash: request.txHash,
      tokenAddress: request.tokenAddress,
    });

    // Get transaction receipt
    const receipt = await provider.getTransactionReceipt(request.txHash);

    if (!receipt) {
      logger.error(`[Immediate Trade Indexer] ❌ Transaction not found: ${request.txHash}`);
      throw new Error('Transaction not found or not confirmed yet');
    }

    logger.info(`[Immediate Trade Indexer] 📄 Receipt received:`, {
      status: receipt.status,
      blockNumber: receipt.blockNumber,
      logCount: receipt.logs.length,
    });

    if (receipt.status !== 1) {
      logger.error(`[Immediate Trade Indexer] ❌ Transaction failed (status ${receipt.status})`);
      throw new Error('Transaction failed');
    }

    // Check if trade already indexed
    const existing = await prisma.trade.findUnique({
      where: { txHash: request.txHash },
    });

    if (existing) {
      logger.info(`[Immediate Trade Indexer] ℹ️ Trade already indexed:`, {
        txHash: request.txHash,
        isBuy: existing.isBuy,
      });
      return existing;
    }

    // Get token to find bonding curve address
    const token = await prisma.token.findUnique({
      where: { address: request.tokenAddress.toLowerCase() },
    });

    if (!token) {
      logger.error(`[Immediate Trade Indexer] ❌ Token not found: ${request.tokenAddress}`);
      throw new Error(`Token ${request.tokenAddress} not found`);
    }

    logger.info(`[Immediate Trade Indexer] ✅ Token found:`, {
      address: token.address,
      bondingCurve: token.bondingCurve,
      symbol: token.symbol,
    });

    // Parse Buy or Sell event from logs
    const bondingCurveInterface = new ethers.Interface(BondingCurveABI.abi);
    let buyEvent: any = null;
    let sellEvent: any = null;

    logger.info(`[Immediate Trade Indexer] 🔎 Parsing ${receipt.logs.length} logs...`);

    for (const log of receipt.logs) {
      logger.info(`[Immediate Trade Indexer] 📋 Checking log:`, {
        address: log.address,
        bondingCurve: token.bondingCurve,
        matches: log.address.toLowerCase() === token.bondingCurve.toLowerCase(),
        topicCount: log.topics.length,
      });

      // Skip if log is not from the bonding curve contract
      if (log.address.toLowerCase() !== token.bondingCurve.toLowerCase()) {
        continue;
      }

      try {
        const parsed = bondingCurveInterface.parseLog({
          topics: log.topics as string[],
          data: log.data,
        });

        logger.info(`[Immediate Trade Indexer] 📊 Parsed event:`, {
          name: parsed?.name,
          args: parsed?.args,
        });

        if (parsed) {
          if (parsed.name === 'Buy') {
            buyEvent = parsed;
            logger.info(`[Immediate Trade Indexer] ✅ Buy event found!`);
            break;
          } else if (parsed.name === 'Sell') {
            sellEvent = parsed;
            logger.info(`[Immediate Trade Indexer] ✅ Sell event found!`);
            break;
          }
        }
      } catch (e: any) {
        logger.warn(`[Immediate Trade Indexer] ⚠️ Failed to parse log:`, e.message);
        // Skip logs that don't match Buy/Sell events
        continue;
      }
    }

    if (!buyEvent && !sellEvent) {
      logger.error(`[Immediate Trade Indexer] ❌ No Buy or Sell event found in transaction!`, {
        txHash: request.txHash,
        logCount: receipt.logs.length,
        bondingCurve: token.bondingCurve,
      });
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

      // Calculate price (ASTER per token)
      const price = (BigInt(asterIn) * BigInt(1e18)) / BigInt(tokensOut);

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
          price: price.toString(),
          asterAmount: asterIn,
          tokenAmount: tokensOut,
        },
      });

      logger.info(`[Immediate Trade Indexer] Buy indexed: ${buyer} bought ${Number(tokensOut) / 1e18} tokens for ${Number(asterIn) / 1e18} ASTER`);

      // Emit trade event for holder updater service
      logger.info(`[Immediate Trade Indexer] 📤 Emitting trade event to holder updater service`);
      logger.info(`[Immediate Trade Indexer] Event data: { token: ${request.tokenAddress.toLowerCase()}, trader: ${buyer.toLowerCase()}, type: BUY, amount: ${tokensOut} }`);

      holderUpdaterService.emitTradeEvent({
        tokenAddress: request.tokenAddress.toLowerCase(),
        trader: buyer.toLowerCase(),
        isBuy: true,
        tokenAmount: tokensOut,
        timestamp,
      });

      logger.info(`[Immediate Trade Indexer] ✅ Trade event emitted`);

      // Trigger OHLCV aggregation for this token (all timeframes)
      ohlcvAggregatorService.aggregateAllTimeframesForToken(request.tokenAddress.toLowerCase())
        .catch(err => logger.error('Failed to aggregate OHLCV after buy:', err));

      return trade;
    }

    // Process Sell event
    if (sellEvent) {
      logger.info(`[Immediate Trade Indexer] 💰 Processing Sell event...`);

      const seller = sellEvent.args.seller as string;
      const tokensIn = sellEvent.args.tokensIn.toString();
      const asterOut = sellEvent.args.asterOut.toString();
      const totalFee = (sellEvent.args.creatorFee + sellEvent.args.protocolFee).toString();

      logger.info(`[Immediate Trade Indexer] 📊 Sell details:`, {
        seller,
        tokensIn: Number(tokensIn) / 1e18,
        asterOut: Number(asterOut) / 1e18,
        totalFee: Number(totalFee) / 1e18,
      });

      // Calculate price (ASTER per token)
      const price = (BigInt(asterOut) * BigInt(1e18)) / BigInt(tokensIn);

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
          price: price.toString(),
          asterAmount: asterOut,
          tokenAmount: tokensIn,
        },
      });

      logger.info(`[Immediate Trade Indexer] ✅ Sell indexed successfully:`, {
        id: trade.id,
        seller,
        tokensIn: Number(tokensIn) / 1e18,
        asterOut: Number(asterOut) / 1e18,
        txHash: request.txHash,
      });

      // Emit trade event for holder updater service
      logger.info(`[Immediate Trade Indexer] 📤 Emitting trade event to holder updater service`);
      logger.info(`[Immediate Trade Indexer] Event data: { token: ${request.tokenAddress.toLowerCase()}, trader: ${seller.toLowerCase()}, type: SELL, amount: ${tokensIn} }`);

      holderUpdaterService.emitTradeEvent({
        tokenAddress: request.tokenAddress.toLowerCase(),
        trader: seller.toLowerCase(),
        isBuy: false,
        tokenAmount: tokensIn,
        timestamp,
      });

      logger.info(`[Immediate Trade Indexer] ✅ Trade event emitted`);

      // Trigger OHLCV aggregation for this token (all timeframes)
      ohlcvAggregatorService.aggregateAllTimeframesForToken(request.tokenAddress.toLowerCase())
        .catch(err => logger.error('Failed to aggregate OHLCV after sell:', err));

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

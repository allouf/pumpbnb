/**
 * Holder Balance Updater Service
 *
 * Background service that updates token holder balances and statistics
 * in real-time as trades occur.
 *
 * This service:
 * 1. Listens for trade events (via event emitter or database triggers)
 * 2. Updates holder balances in the database
 * 3. Recalculates holder statistics (concentration, distribution)
 * 4. Emits WebSocket events for real-time UI updates
 */

import { prisma } from './db.service';
import { websocketService } from './websocket.service';
import { cache } from '../config/redis';
import logger from '../utils/logger';
import { EventEmitter } from 'events';

interface TradeEvent {
  tokenAddress: string;
  trader: string;
  isBuy: boolean;
  tokenAmount: string;
  timestamp: Date;
}

export class HolderUpdaterService extends EventEmitter {
  private isRunning: boolean = false;

  /**
   * Start the holder updater service
   */
  start(): void {
    if (this.isRunning) {
      logger.warn('[HolderUpdater] ⚠️ Service is already running');
      return;
    }

    logger.info('[HolderUpdater] 🚀 Starting Holder Balance Updater Service');

    // Listen for trade events
    this.on('trade', this.handleTradeEvent.bind(this));

    this.isRunning = true;
    logger.info('[HolderUpdater] ✅ Service started successfully');
    logger.info(`[HolderUpdater] 👂 Listening for trade events (${this.listenerCount('trade')} listeners)`);
  }

  /**
   * Stop the service
   */
  stop(): void {
    if (!this.isRunning) {
      logger.warn('Holder Updater Service is not running');
      return;
    }

    logger.info('Stopping Holder Balance Updater Service');
    this.removeAllListeners('trade');
    this.isRunning = false;
    logger.info('Holder Balance Updater Service stopped');
  }

  /**
   * Handle trade event and update holder balance
   */
  private async handleTradeEvent(trade: TradeEvent): Promise<void> {
    try {
      logger.info(`[HolderUpdater] 📊 Processing trade event`);
      logger.info(`[HolderUpdater] Token: ${trade.tokenAddress}`);
      logger.info(`[HolderUpdater] Trader: ${trade.trader}`);
      logger.info(`[HolderUpdater] Type: ${trade.isBuy ? 'BUY' : 'SELL'}`);
      logger.info(`[HolderUpdater] Amount: ${trade.tokenAmount}`);

      // Update holder balance
      await this.updateHolderBalance(
        trade.tokenAddress,
        trade.trader,
        trade.isBuy,
        trade.tokenAmount,
        trade.timestamp
      );

      // Recalculate holder statistics
      await this.updateHolderStats(trade.tokenAddress);

      // Invalidate cache
      await this.invalidateCache(trade.tokenAddress);

      logger.info(`[HolderUpdater] ✅ Holder balance updated for ${trade.trader} on token ${trade.tokenAddress}`);
    } catch (error) {
      logger.error('[HolderUpdater] ❌ Failed to handle trade event:', error);
      logger.error('[HolderUpdater] Error details:', error);
    }
  }

  /**
   * Update holder balance for a specific trader
   */
  async updateHolderBalance(
    tokenAddress: string,
    holderAddress: string,
    isBuy: boolean,
    tokenAmount: string,
    timestamp: Date
  ): Promise<void> {
    const address = tokenAddress.toLowerCase();
    const holder = holderAddress.toLowerCase();

    logger.info(`[HolderUpdater] updateHolderBalance called`);
    logger.info(`[HolderUpdater] Token: ${address}`);
    logger.info(`[HolderUpdater] Holder: ${holder}`);

    // Get current holder record
    const existingHolder = await prisma.tokenHolder.findUnique({
      where: {
        tokenAddress_holderAddress: {
          tokenAddress: address,
          holderAddress: holder,
        },
      },
    });

    logger.info(`[HolderUpdater] Existing holder found: ${existingHolder ? 'YES' : 'NO'}`);
    if (existingHolder) {
      logger.info(`[HolderUpdater] Current balance: ${existingHolder.balance}`);
    }

    // Calculate new balance
    const amountBigInt = BigInt(tokenAmount);
    let newBalance: bigint;

    if (existingHolder) {
      const currentBalance = BigInt(existingHolder.balance);
      newBalance = isBuy ? currentBalance + amountBigInt : currentBalance - amountBigInt;
      logger.info(`[HolderUpdater] New balance: ${newBalance.toString()} (${isBuy ? 'added' : 'subtracted'} ${tokenAmount})`);
    } else {
      newBalance = isBuy ? amountBigInt : BigInt(0);
      logger.info(`[HolderUpdater] New holder - Initial balance: ${newBalance.toString()}`);
    }

    // Check if holder is the token creator
    const token = await prisma.token.findUnique({
      where: { address },
      select: { creator: true, totalSupply: true },
    });

    const isCreator = token ? token.creator.toLowerCase() === holder : false;

    // Calculate percentage of total supply
    const totalSupply = token ? BigInt(token.totalSupply) : BigInt(1);
    const percentage = (Number(newBalance) / Number(totalSupply)) * 100;

    // Update or create holder record
    if (newBalance > 0) {
      logger.info(`[HolderUpdater] Upserting holder record - Balance: ${newBalance.toString()}, Percentage: ${percentage.toFixed(4)}%`);

      await prisma.tokenHolder.upsert({
        where: {
          tokenAddress_holderAddress: {
            tokenAddress: address,
            holderAddress: holder,
          },
        },
        update: {
          balance: newBalance.toString(),
          percentage,
          lastTxAt: timestamp,
        },
        create: {
          tokenAddress: address,
          holderAddress: holder,
          balance: newBalance.toString(),
          percentage,
          isCreator,
          firstTxAt: timestamp,
          lastTxAt: timestamp,
        },
      });

      logger.info(`[HolderUpdater] ✅ Holder record ${existingHolder ? 'updated' : 'created'} successfully`);

      // Broadcast holder update via WebSocket
      await websocketService.publishEvent('HolderUpdate', {
        tokenAddress: address,
        holderAddress: holder,
        balance: newBalance.toString(),
        percentage,
        isCreator,
      });
    } else {
      logger.info(`[HolderUpdater] Balance is 0, removing holder record`);

      // Remove holder if balance is 0
      await prisma.tokenHolder.delete({
        where: {
          tokenAddress_holderAddress: {
            tokenAddress: address,
            holderAddress: holder,
          },
        },
      });

      logger.info(`[HolderUpdater] ✅ Holder record deleted`);

      // Broadcast holder removal
      await websocketService.publishEvent('HolderUpdate', {
        tokenAddress: address,
        holderAddress: holder,
        balance: '0',
        percentage: 0,
        removed: true,
      });
    }
  }

  /**
   * Recalculate holder statistics for a token
   */
  async updateHolderStats(tokenAddress: string): Promise<void> {
    const address = tokenAddress.toLowerCase();

    // Get all holders
    const holders = await prisma.tokenHolder.findMany({
      where: { tokenAddress: address },
      select: { balance: true, percentage: true },
    });

    if (holders.length === 0) {
      return;
    }

    // Calculate statistics
    const totalHolders = holders.length;

    // Top 10% concentration
    const top10Count = Math.max(1, Math.ceil(totalHolders * 0.1));
    const sortedHolders = holders
      .sort((a, b) => parseFloat(b.balance) - parseFloat(a.balance))
      .slice(0, top10Count);

    const top10Concentration = sortedHolders.reduce(
      (sum, holder) => sum + holder.percentage,
      0
    );

    // Calculate Gini coefficient (measure of inequality)
    const giniCoefficient = this.calculateGiniCoefficient(
      holders.map((h) => parseFloat(h.balance))
    );

    // Broadcast stats update
    await websocketService.publishEvent('HolderStats', {
      tokenAddress: address,
      totalHolders,
      top10Concentration,
      giniCoefficient,
    });

    logger.debug(
      `Updated holder stats for ${address}: ${totalHolders} holders, ${top10Concentration.toFixed(2)}% top10 concentration`
    );
  }

  /**
   * Calculate Gini coefficient for holder distribution
   * Range: 0 (perfect equality) to 1 (perfect inequality)
   */
  private calculateGiniCoefficient(balances: number[]): number {
    if (balances.length === 0) return 0;

    // Sort balances in ascending order
    const sorted = balances.sort((a, b) => a - b);
    const n = sorted.length;

    // Calculate sum of all balances
    const totalBalance = sorted.reduce((sum, b) => sum + b, 0);

    if (totalBalance === 0) return 0;

    // Calculate Gini coefficient using the formula:
    // G = (2 * sum(i * x_i)) / (n * sum(x_i)) - (n + 1) / n
    let weightedSum = 0;
    for (let i = 0; i < n; i++) {
      weightedSum += (i + 1) * sorted[i];
    }

    const gini = (2 * weightedSum) / (n * totalBalance) - (n + 1) / n;

    return Math.max(0, Math.min(1, gini)); // Clamp to [0, 1]
  }

  /**
   * Invalidate cache for token holder data
   */
  private async invalidateCache(tokenAddress: string): Promise<void> {
    const address = tokenAddress.toLowerCase();
    await cache.delPattern(`token:holders:${address}:*`);
    await cache.delPattern(`token:stats:${address}`);
  }

  /**
   * Manually update all holders for a token
   * Useful for backfilling or fixing data inconsistencies
   */
  async refreshAllHolders(tokenAddress: string): Promise<void> {
    logger.info(`Refreshing all holders for token ${tokenAddress}`);

    const address = tokenAddress.toLowerCase();

    // Get all trades for this token
    const trades = await prisma.trade.findMany({
      where: { tokenAddress: address },
      orderBy: { timestamp: 'asc' },
      select: {
        trader: true,
        isBuy: true,
        tokenAmount: true,
        timestamp: true,
      },
    });

    // Clear existing holder records
    await prisma.tokenHolder.deleteMany({
      where: { tokenAddress: address },
    });

    // Rebuild holder balances from trades
    const balances = new Map<string, {
      balance: bigint;
      firstTx: Date;
      lastTx: Date;
    }>();

    for (const trade of trades) {
      const trader = trade.trader.toLowerCase();
      const amount = BigInt(trade.tokenAmount);

      const existing = balances.get(trader) || {
        balance: BigInt(0),
        firstTx: trade.timestamp,
        lastTx: trade.timestamp,
      };

      existing.balance = trade.isBuy
        ? existing.balance + amount
        : existing.balance - amount;
      existing.lastTx = trade.timestamp;

      balances.set(trader, existing);
    }

    // Get token info for creator check
    const token = await prisma.token.findUnique({
      where: { address },
      select: { creator: true, totalSupply: true },
    });

    const totalSupply = token ? BigInt(token.totalSupply) : BigInt(1);

    // Insert holder records
    for (const [holderAddress, data] of balances) {
      if (data.balance > 0) {
        const percentage = (Number(data.balance) / Number(totalSupply)) * 100;
        const isCreator = token ? token.creator.toLowerCase() === holderAddress : false;

        await prisma.tokenHolder.create({
          data: {
            tokenAddress: address,
            holderAddress,
            balance: data.balance.toString(),
            percentage,
            isCreator,
            firstTxAt: data.firstTx,
            lastTxAt: data.lastTx,
          },
        });
      }
    }

    // Update holder stats
    await this.updateHolderStats(address);

    // Invalidate cache
    await this.invalidateCache(address);

    logger.info(`Refreshed ${balances.size} holders for token ${tokenAddress}`);
  }

  /**
   * Get service status
   */
  getStatus(): {
    isRunning: boolean;
    eventListeners: number;
  } {
    return {
      isRunning: this.isRunning,
      eventListeners: this.listenerCount('trade'),
    };
  }

  /**
   * Emit a trade event (called by trade indexer or API)
   */
  emitTradeEvent(trade: TradeEvent): void {
    this.emit('trade', trade);
  }
}

export const holderUpdaterService = new HolderUpdaterService();
export default holderUpdaterService;

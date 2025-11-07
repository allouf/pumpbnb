import { EventEmitter } from 'events';
import { ethers } from 'ethers';
import { formatUnits } from 'viem';
import prisma from '../lib/db';
import logger from '../utils/logger';
import config from '../config';

// ABIs for reading bonding curve data
const BondingCurveABI = [
  'function getReserves() view returns (uint256, uint256)'
];

interface TokenStatsUpdaterConfig {
  updateInterval: number; // in milliseconds
  batchSize: number; // number of tokens to update per batch
}

class TokenStatsUpdaterService extends EventEmitter {
  private isRunning = false;
  private intervalId: NodeJS.Timeout | null = null;
  private config: TokenStatsUpdaterConfig;
  private provider: ethers.JsonRpcProvider;

  constructor() {
    super();
    this.config = {
      updateInterval: 2 * 60 * 1000, // 2 minutes
      batchSize: 10, // Process 10 tokens at a time
    };
    this.provider = new ethers.JsonRpcProvider(config.bscTestnetRpc);
  }

  start(customConfig?: Partial<TokenStatsUpdaterConfig>): void {
    if (this.isRunning) {
      logger.warn('Token Stats Updater Service is already running');
      return;
    }

    this.config = { ...this.config, ...customConfig };
    this.isRunning = true;

    logger.info('Starting Token Stats Updater Service', {
      updateInterval: this.config.updateInterval,
      batchSize: this.config.batchSize,
    });

    // Run immediately, then on interval
    this.updateAllTokenStats();
    this.intervalId = setInterval(() => {
      this.updateAllTokenStats();
    }, this.config.updateInterval);

    this.emit('started');
  }

  stop(): void {
    if (!this.isRunning) {
      return;
    }

    logger.info('Stopping Token Stats Updater Service...');
    this.isRunning = false;

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    this.emit('stopped');
    logger.info('Token Stats Updater Service stopped');
  }

  private async updateAllTokenStats(): Promise<void> {
    try {
      logger.info('Starting token stats update cycle');

      // Get all tokens that need stats updates
      const tokens = await prisma.token.findMany({
        where: {
          isGraduated: false, // Only update tokens still on bonding curve
        },
        select: {
          address: true,
          bondingCurve: true,
          symbol: true,
        },
        take: this.config.batchSize,
      });

      if (tokens.length === 0) {
        logger.debug('No tokens found for stats update');
        return;
      }

      logger.info(`Updating stats for ${tokens.length} tokens`);

      // Process tokens in parallel but with limited concurrency
      const updatePromises = tokens.map(token => this.updateTokenStats(token.address, token.bondingCurve, token.symbol));
      await Promise.allSettled(updatePromises);

      logger.info(`Token stats update cycle completed for ${tokens.length} tokens`);
    } catch (error) {
      logger.error('Error in updateAllTokenStats:', error);
    }
  }

  private async updateTokenStats(tokenAddress: string, bondingCurve: string, symbol: string): Promise<void> {
    try {
      // Get bonding curve reserves to calculate current price and market cap
      const bondingCurveContract = new ethers.Contract(bondingCurve, BondingCurveABI, this.provider);
      const reserves = await bondingCurveContract.getReserves();
      const asterReserves = Number(formatUnits(reserves[0], 18));
      
      // Market cap is the ASTER reserves (simplified calculation)
      const marketCap = asterReserves.toFixed(2);
      
      // Calculate 24h volume and trades
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      
      const [trades24hResult, tradesFor24h] = await Promise.all([
        prisma.trade.count({
          where: {
            tokenAddress: tokenAddress.toLowerCase(),
            timestamp: { gte: oneDayAgo },
          },
        }),
        prisma.trade.findMany({
          where: {
            tokenAddress: tokenAddress.toLowerCase(),
            timestamp: { gte: oneDayAgo },
          },
          select: {
            asterAmountFormatted: true,
            tokenAmountFormatted: true,
            timestamp: true,
            isBuy: true,
          },
          orderBy: {
            timestamp: 'asc',
          },
        }),
      ]);

      // Calculate 24h volume in ASTER
      const volume24h = tradesFor24h
        .reduce((sum, trade) => {
          const asterAmount = parseFloat(trade.asterAmountFormatted || '0');
          return sum + asterAmount;
        }, 0)
        .toFixed(6);

      // Calculate price change 24h
      let priceChange24h = '0';
      if (tradesFor24h.length > 1) {
        const oldestTrade = tradesFor24h[0];
        const newestTrade = tradesFor24h[tradesFor24h.length - 1];
        
        const calculatePrice = (trade: typeof oldestTrade) => {
          const asterAmount = parseFloat(trade.asterAmountFormatted || '0');
          const tokenAmount = parseFloat(trade.tokenAmountFormatted || '0');
          return tokenAmount > 0 ? asterAmount / tokenAmount : 0;
        };
        
        const oldPrice = calculatePrice(oldestTrade);
        const currentPrice = calculatePrice(newestTrade);
        
        if (oldPrice > 0) {
          priceChange24h = (((currentPrice - oldPrice) / oldPrice) * 100).toFixed(2);
        }
      }

      // Calculate current price (from most recent trade)
      let currentPrice = '0';
      if (tradesFor24h.length > 0) {
        const recentTrade = tradesFor24h[tradesFor24h.length - 1];
        const asterAmount = parseFloat(recentTrade.asterAmountFormatted || '0');
        const tokenAmount = parseFloat(recentTrade.tokenAmountFormatted || '0');
        if (tokenAmount > 0) {
          currentPrice = (asterAmount / tokenAmount).toFixed(8);
        }
      }

      // Get unique holders count
      const holders = await prisma.tokenHolder.count({
        where: { 
          tokenAddress: tokenAddress.toLowerCase(),
          balance: { gt: '0' }
        },
      });

      // Update token stats
      await prisma.tokenStats.upsert({
        where: { tokenAddress: tokenAddress.toLowerCase() },
        update: {
          price: currentPrice,
          marketCap: marketCap,
          volume24h: volume24h,
          trades24h: trades24hResult,
          holders: holders || 1,
          priceChange24h: priceChange24h,
          liquidity: asterReserves.toFixed(2), // Use ASTER reserves as liquidity
          updatedAt: new Date(),
        },
        create: {
          tokenAddress: tokenAddress.toLowerCase(),
          price: currentPrice,
          marketCap: marketCap,
          volume24h: volume24h,
          trades24h: trades24hResult,
          holders: holders || 1,
          priceChange24h: priceChange24h,
          liquidity: asterReserves.toFixed(2),
        },
      });

      logger.debug(`Updated stats for ${symbol}: MC=${marketCap}, Vol=${volume24h}, Price=${currentPrice}, Change=${priceChange24h}%`);
    } catch (error) {
      logger.error(`Error updating token stats for ${symbol} (${tokenAddress}):`, error);
    }
  }

  getStatus(): { isRunning: boolean; config: TokenStatsUpdaterConfig; nextRunIn?: number } {
    const status = {
      isRunning: this.isRunning,
      config: this.config,
    };

    if (this.isRunning && this.intervalId) {
      // Estimate next run time (this is approximate)
      return {
        ...status,
        nextRunIn: this.config.updateInterval,
      };
    }

    return status;
  }

  // Manual trigger for immediate stats update
  async updateToken(tokenAddress: string): Promise<void> {
    try {
      const token = await prisma.token.findUnique({
        where: { address: tokenAddress.toLowerCase() },
        select: {
          address: true,
          bondingCurve: true,
          symbol: true,
        },
      });

      if (!token) {
        throw new Error(`Token ${tokenAddress} not found`);
      }

      await this.updateTokenStats(token.address, token.bondingCurve, token.symbol);
      logger.info(`Manually updated stats for ${token.symbol}`);
    } catch (error) {
      logger.error(`Error manually updating token ${tokenAddress}:`, error);
      throw error;
    }
  }
}

export const tokenStatsUpdaterService = new TokenStatsUpdaterService();
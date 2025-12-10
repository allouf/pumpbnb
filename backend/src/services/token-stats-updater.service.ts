import { EventEmitter } from 'events';
import { ethers } from 'ethers';
import { prisma } from './database.service';
import { usdPriceService } from './usd-price.service';
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
      updateInterval: 30 * 1000, // 30 seconds for faster testing
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
      const updatePromises = tokens.map((token: { address: string; bondingCurve: string; symbol: string }) => 
        this.updateTokenStats(token.address, token.bondingCurve, token.symbol)
      );
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
      const asterReserves = Number(ethers.formatUnits(reserves[0], 18));
      
      // Market cap is the ASTER reserves (simplified calculation)
      const marketCap = asterReserves.toFixed(2);
      
      // Calculate 24h volume and trades
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      
      const [trades24hResult, tradesFor24h, allRecentTrades] = await Promise.all([
        // Count trades in last 24h
        prisma.trade.count({
          where: {
            tokenAddress: tokenAddress.toLowerCase(),
            timestamp: { gte: oneDayAgo },
          },
        }),
        // Get trades from last 24h for volume and price change calculation
        prisma.trade.findMany({
          where: {
            tokenAddress: tokenAddress.toLowerCase(),
            timestamp: { gte: oneDayAgo },
          },
          select: {
            asterAmount: true,
            tokenAmount: true,
            timestamp: true,
            isBuy: true,
          },
          orderBy: {
            timestamp: 'asc',
          },
        }),
        // Get recent trades for current price calculation
        prisma.trade.findMany({
          where: {
            tokenAddress: tokenAddress.toLowerCase(),
          },
          select: {
            asterAmount: true,
            tokenAmount: true,
            timestamp: true,
            isBuy: true,
          },
          orderBy: {
            timestamp: 'desc',
          },
          take: 10, // Get last 10 trades for better price calculation
        }),
      ]);

      // Calculate 24h volume in ASTER (sum absolute values to avoid negative volumes)
      // Note: asterAmount might be stored in Wei (18 decimals), so we need to handle both formats
      const volume24h = tradesFor24h
        .reduce((sum: number, trade: { asterAmount: string | null }) => {
          const asterAmountStr = trade.asterAmount || '0';
          let asterAmount = Math.abs(parseFloat(asterAmountStr));
          
          // If the number is very large (> 1e15), it's likely in Wei and needs conversion
          if (asterAmount > 1e15) {
            asterAmount = asterAmount / 1e18; // Convert from Wei to ASTER
          }
          
          return sum + asterAmount;
        }, 0)
        .toFixed(6);

      // Calculate current price from most recent trades with better precision
      let currentPriceInAster = 0;
      if (allRecentTrades.length > 0) {
        // Use average price from recent trades for more stability
        const recentPrices = allRecentTrades
          .map(trade => {
            let asterAmount = parseFloat(trade.asterAmount || '0');
            let tokenAmount = parseFloat(trade.tokenAmount || '0');
            
            // Handle Wei conversion for asterAmount if needed
            if (asterAmount > 1e15) {
              asterAmount = asterAmount / 1e18;
            }
            
            // Handle Wei conversion for tokenAmount if needed (tokens usually have 18 decimals too)
            if (tokenAmount > 1e15) {
              tokenAmount = tokenAmount / 1e18;
            }
            
            return tokenAmount > 0 ? asterAmount / tokenAmount : 0;
          })
          .filter(price => price > 0);
        
        if (recentPrices.length > 0) {
          currentPriceInAster = recentPrices.reduce((sum, price) => sum + price, 0) / recentPrices.length;
        }
      }
      
      // If no recent trades, try to calculate price from bonding curve math
      if (currentPriceInAster === 0 && asterReserves > 0) {
        // Simple bonding curve price estimation: price increases with more reserves
        // This is a simplified calculation - you might want to use the exact bonding curve formula
        const totalSupply = 1000000000; // 1 billion tokens (adjust based on your tokenomics)
        const tokensInCirculation = asterReserves * 10000; // Rough estimation
        currentPriceInAster = asterReserves / (totalSupply - tokensInCirculation);
      }
      
      // Format price with high precision for small values
      const currentPrice = currentPriceInAster > 0 ? currentPriceInAster.toFixed(12) : '0';
      
      // Calculate USD values
      const priceUsd = usdPriceService.tokenPriceToUsd(currentPriceInAster);
      const marketCapUsd = usdPriceService.asterToUsd(asterReserves);

      // Helper function to calculate price change for a given period
      const calculatePriceChange = async (periodSeconds: number, currentPrice: number): Promise<string> => {
        if (currentPrice <= 0) return '0';

        const cutoffTime = new Date(Date.now() - periodSeconds * 1000);

        // First check if there were ANY trades within the period
        // If no trades in the period, price change should be 0%
        const tradesInPeriod = await prisma.trade.count({
          where: {
            tokenAddress: tokenAddress.toLowerCase(),
            timestamp: { gte: cutoffTime },
          },
        });

        // No trades in period = no price change
        if (tradesInPeriod === 0) {
          return '0';
        }

        // Find the oldest trade in the period to compare with current price
        const oldestTradeInPeriod = await prisma.trade.findFirst({
          where: {
            tokenAddress: tokenAddress.toLowerCase(),
            timestamp: { gte: cutoffTime },
          },
          select: {
            asterAmount: true,
            tokenAmount: true,
          },
          orderBy: {
            timestamp: 'asc',
          },
        });

        if (oldestTradeInPeriod) {
          let asterAmount = parseFloat(oldestTradeInPeriod.asterAmount || '0');
          let tokenAmount = parseFloat(oldestTradeInPeriod.tokenAmount || '0');

          // Handle Wei conversion
          if (asterAmount > 1e15) asterAmount = asterAmount / 1e18;
          if (tokenAmount > 1e15) tokenAmount = tokenAmount / 1e18;

          if (tokenAmount > 0) {
            const oldPrice = asterAmount / tokenAmount;
            if (oldPrice > 0) {
              return (((currentPrice - oldPrice) / oldPrice) * 100).toFixed(2);
            }
          }
        }
        return '0';
      };

      // Calculate price changes for different periods
      const [priceChange1h, priceChange6h, priceChange24h] = await Promise.all([
        calculatePriceChange(3600, currentPriceInAster),      // 1 hour
        calculatePriceChange(21600, currentPriceInAster),     // 6 hours
        calculatePriceChange(86400, currentPriceInAster),     // 24 hours
      ]);

      // Get unique holders count
      const holders = await prisma.tokenHolder.count({
        where: { 
          tokenAddress: tokenAddress.toLowerCase(),
          balance: { gt: '0' }
        },
      });

      // Get existing ATH to ensure it never decreases
      const existingStats = await prisma.tokenStats.findUnique({
        where: { tokenAddress: tokenAddress.toLowerCase() },
        select: { athMarketCapUsd: true },
      });
      const existingAth = parseFloat(existingStats?.athMarketCapUsd || '0');
      const newAth = Math.max(existingAth, marketCapUsd).toFixed(2);

      // Update token stats with both ASTER and USD values
      await prisma.tokenStats.upsert({
        where: { tokenAddress: tokenAddress.toLowerCase() },
        update: {
          price: currentPrice,
          priceUsd: priceUsd.toFixed(12),
          marketCap: marketCap,
          marketCapUsd: marketCapUsd.toFixed(2),
          volume24h: volume24h,
          volume24hUsd: usdPriceService.asterToUsd(parseFloat(volume24h)).toFixed(2),
          trades24h: trades24hResult,
          holders: holders || 1,
          priceChange1h: priceChange1h,
          priceChange6h: priceChange6h,
          priceChange24h: priceChange24h,
          athMarketCapUsd: newAth, // ATH never decreases
          liquidity: asterReserves.toFixed(2),
          liquidityUsd: marketCapUsd.toFixed(2), // Same as market cap for now
          updatedAt: new Date(),
        },
        create: {
          tokenAddress: tokenAddress.toLowerCase(),
          price: currentPrice,
          priceUsd: priceUsd.toFixed(12),
          marketCap: marketCap,
          marketCapUsd: marketCapUsd.toFixed(2),
          volume24h: volume24h,
          volume24hUsd: usdPriceService.asterToUsd(parseFloat(volume24h)).toFixed(2),
          trades24h: trades24hResult,
          holders: holders || 1,
          priceChange1h: priceChange1h,
          priceChange6h: priceChange6h,
          priceChange24h: priceChange24h,
          athMarketCapUsd: marketCapUsd.toFixed(2), // Initial ATH is current market cap
          liquidity: asterReserves.toFixed(2),
          liquidityUsd: marketCapUsd.toFixed(2),
        },
      });

      logger.info(`Updated stats for ${symbol}: MC=$${marketCapUsd.toFixed(2)}, ATH=$${newAth}, Vol=${volume24h}, 1h=${priceChange1h}%, 6h=${priceChange6h}%, 24h=${priceChange24h}%`);
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
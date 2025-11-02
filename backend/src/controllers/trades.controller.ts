import { Request, Response, NextFunction } from 'express';
import tradesService from '../services/trades.service';
import { TradeFilter } from '../types/tokenPage';
import logger from '../utils/logger';

class TradesController {
  /**
   * GET /api/tokens/:address/trades
   * Get trades for a specific token
   */
  async getTokenTrades(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { address } = req.params;
      const {
        type,
        traderAddress,
        minAmount,
        maxAmount,
        startTime,
        endTime,
        page = '1',
        limit = '50',
        sortBy = 'timestamp',
        sortOrder = 'desc',
      } = req.query;

      // Build filter
      const filter: TradeFilter = {};
      if (type) filter.type = type as any;
      if (traderAddress) filter.traderAddress = traderAddress as string;
      if (minAmount) filter.minAmount = minAmount as string;
      if (maxAmount) filter.maxAmount = maxAmount as string;
      if (startTime) filter.startTime = new Date(startTime as string);
      if (endTime) filter.endTime = new Date(endTime as string);

      const result = await tradesService.getTokenTrades(address, {
        filter,
        page: parseInt(page as string),
        limit: Math.min(parseInt(limit as string), 100), // Max 100 per page
        sortBy: sortBy as any,
        sortOrder: sortOrder as any,
      });

      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      logger.error('Error fetching token trades:', error);
      next(error);
    }
  }

  /**
   * GET /api/tokens/:address/trades/recent
   * Get recent trades for a token (cached, faster)
   */
  async getRecentTrades(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { address } = req.params;
      const { limit = '20' } = req.query;

      const trades = await tradesService.getRecentTrades(
        address,
        Math.min(parseInt(limit as string), 100)
      );

      res.json({
        success: true,
        data: trades,
        count: trades.length,
      });
    } catch (error) {
      logger.error('Error fetching recent trades:', error);
      next(error);
    }
  }

  /**
   * GET /api/trades/:txHash
   * Get a single trade by transaction hash
   */
  async getTradeByTxHash(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { txHash } = req.params;

      const trade = await tradesService.getTradeByTxHash(txHash);

      if (!trade) {
        res.status(404).json({
          success: false,
          error: 'Trade not found',
        });
        return;
      }

      res.json({
        success: true,
        data: trade,
      });
    } catch (error) {
      logger.error('Error fetching trade:', error);
      next(error);
    }
  }

  /**
   * GET /api/traders/:address/trades
   * Get all trades for a specific trader
   */
  async getTraderTrades(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { address } = req.params;
      const {
        page = '1',
        limit = '50',
        tokenAddress,
      } = req.query;

      const result = await tradesService.getTraderTrades(address, {
        page: parseInt(page as string),
        limit: Math.min(parseInt(limit as string), 100),
        tokenAddress: tokenAddress as string | undefined,
      });

      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      logger.error('Error fetching trader trades:', error);
      next(error);
    }
  }

  /**
   * GET /api/tokens/:address/trades/stats
   * Get trade statistics for a token
   */
  async getTradeStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { address } = req.params;
      const { timeWindow = '86400000' } = req.query; // Default 24h in ms

      const stats = await tradesService.getTradeStats(
        address,
        parseInt(timeWindow as string)
      );

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      logger.error('Error fetching trade stats:', error);
      next(error);
    }
  }
}

export const tradesController = new TradesController();
export default tradesController;

import { Request, Response, NextFunction } from 'express';
import holdersService from '../services/holders.service';
import { HolderFilter } from '../types/tokenPage';
import logger from '../utils/logger';

class HoldersController {
  /**
   * GET /api/v2/tokens/:address/holders
   * Get holders for a specific token
   */
  async getTokenHolders(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { address } = req.params;
      const {
        minBalance,
        minPercentage,
        includeCreator,
        page = '1',
        limit = '50',
        sortBy = 'percentage',
        sortOrder = 'desc',
      } = req.query;

      // Build filter
      const filter: HolderFilter = {};
      if (minBalance) filter.minBalance = minBalance as string;
      if (minPercentage) filter.minPercentage = parseFloat(minPercentage as string);
      if (includeCreator !== undefined) filter.includeCreator = includeCreator === 'true';

      const result = await holdersService.getTokenHolders(address, {
        filter,
        page: parseInt(page as string),
        limit: Math.min(parseInt(limit as string), 100),
        sortBy: sortBy as any,
        sortOrder: sortOrder as any,
      });

      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      logger.error('Error fetching token holders:', error);
      next(error);
    }
  }

  /**
   * GET /api/v2/tokens/:address/holders/top
   * Get top holders for a token (cached)
   */
  async getTopHolders(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { address } = req.params;
      const { limit = '10' } = req.query;

      const holders = await holdersService.getTopHolders(
        address,
        Math.min(parseInt(limit as string), 100)
      );

      res.json({
        success: true,
        data: holders,
        count: holders.length,
      });
    } catch (error) {
      logger.error('Error fetching top holders:', error);
      next(error);
    }
  }

  /**
   * GET /api/v2/tokens/:address/holders/count
   * Get holder count for a token
   */
  async getHolderCount(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { address } = req.params;

      const count = await holdersService.getHolderCount(address);

      res.json({
        success: true,
        data: { count },
      });
    } catch (error) {
      logger.error('Error fetching holder count:', error);
      next(error);
    }
  }

  /**
   * GET /api/v2/tokens/:address/holders/stats
   * Get holder statistics
   */
  async getHolderStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { address } = req.params;

      const stats = await holdersService.getHolderStats(address);

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      logger.error('Error fetching holder stats:', error);
      next(error);
    }
  }

  /**
   * GET /api/v2/tokens/:address/holders/:holderAddress
   * Get specific holder information
   */
  async getHolder(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { address, holderAddress } = req.params;

      const holder = await holdersService.getHolder(address, holderAddress);

      if (!holder) {
        res.status(404).json({
          success: false,
          error: 'Holder not found',
        });
        return;
      }

      res.json({
        success: true,
        data: holder,
      });
    } catch (error) {
      logger.error('Error fetching holder:', error);
      next(error);
    }
  }

  /**
   * GET /api/v2/holders/:address/portfolio
   * Get all tokens held by a specific address
   */
  async getHolderPortfolio(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { address } = req.params;
      const { page = '1', limit = '50' } = req.query;

      const result = await holdersService.getHolderPortfolio(address, {
        page: parseInt(page as string),
        limit: Math.min(parseInt(limit as string), 100),
      });

      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      logger.error('Error fetching holder portfolio:', error);
      next(error);
    }
  }
}

export const holdersController = new HoldersController();
export default holdersController;

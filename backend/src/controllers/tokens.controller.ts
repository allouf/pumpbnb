import { Request, Response, NextFunction } from 'express';
import tokensService from '../services/tokens.service';
import logger from '../utils/logger';

class TokensController {
  /**
   * GET /api/v2/tokens/:address
   * Get complete token page data
   */
  async getTokenPageData(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { address } = req.params;

      const pageData = await tokensService.getTokenPageData(address);

      if (!pageData) {
        res.status(404).json({
          success: false,
          error: 'Token not found',
        });
        return;
      }

      res.json({
        success: true,
        data: pageData,
      });
    } catch (error) {
      logger.error('Error fetching token page data:', error);
      next(error);
    }
  }

  /**
   * GET /api/v2/tokens/:address/info
   * Get token basic info
   */
  async getTokenInfo(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { address } = req.params;

      const token = await tokensService.getToken(address);

      if (!token) {
        res.status(404).json({
          success: false,
          error: 'Token not found',
        });
        return;
      }

      res.json({
        success: true,
        data: token,
      });
    } catch (error) {
      logger.error('Error fetching token info:', error);
      next(error);
    }
  }

  /**
   * GET /api/v2/tokens/:address/stats
   * Get token statistics
   */
  async getTokenStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { address } = req.params;

      const stats = await tokensService.getTokenStats(address);

      if (!stats) {
        res.status(404).json({
          success: false,
          error: 'Token stats not found',
        });
        return;
      }

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      logger.error('Error fetching token stats:', error);
      next(error);
    }
  }

  /**
   * GET /api/v2/tokens
   * Get all tokens with filtering and pagination
   */
  async getTokens(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const {
        page = '1',
        limit = '50',
        sortBy = 'createdAt',
        sortOrder = 'desc',
        isGraduated,
        isNsfw,
        search,
        minMarketCap,
        maxMarketCap,
        minVolume24h,
        maxVolume24h,
      } = req.query;

      const result = await tokensService.getTokens({
        page: parseInt(page as string),
        limit: Math.min(parseInt(limit as string), 100),
        sortBy: sortBy as any,
        sortOrder: sortOrder as any,
        isGraduated: isGraduated ? isGraduated === 'true' : undefined,
        isNsfw: isNsfw ? isNsfw === 'true' : undefined,
        search: search as string,
        minMarketCap: minMarketCap ? parseFloat(minMarketCap as string) : undefined,
        maxMarketCap: maxMarketCap ? parseFloat(maxMarketCap as string) : undefined,
        minVolume24h: minVolume24h ? parseFloat(minVolume24h as string) : undefined,
        maxVolume24h: maxVolume24h ? parseFloat(maxVolume24h as string) : undefined,
      });

      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      logger.error('Error fetching tokens:', error);
      next(error);
    }
  }

  /**
   * GET /api/v2/tokens/search
   * Search tokens by name, symbol, or address
   */
  async searchTokens(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { q, limit = '10' } = req.query;

      if (!q || typeof q !== 'string') {
        res.status(400).json({
          success: false,
          error: 'Query parameter "q" is required',
        });
        return;
      }

      const tokens = await tokensService.searchTokens(
        q,
        Math.min(parseInt(limit as string), 50)
      );

      res.json({
        success: true,
        data: tokens,
        count: tokens.length,
      });
    } catch (error) {
      logger.error('Error searching tokens:', error);
      next(error);
    }
  }

  /**
   * GET /api/v2/tokens/trending
   * Get trending tokens
   */
  async getTrendingTokens(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { limit = '10' } = req.query;

      const tokens = await tokensService.getTrendingTokens(
        Math.min(parseInt(limit as string), 50)
      );

      res.json({
        success: true,
        data: tokens,
        count: tokens.length,
      });
    } catch (error) {
      logger.error('Error fetching trending tokens:', error);
      next(error);
    }
  }

  /**
   * GET /api/v2/tokens/recent
   * Get recently created tokens
   */
  async getRecentTokens(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { limit = '10' } = req.query;

      const tokens = await tokensService.getRecentTokens(
        Math.min(parseInt(limit as string), 50)
      );

      res.json({
        success: true,
        data: tokens,
        count: tokens.length,
      });
    } catch (error) {
      logger.error('Error fetching recent tokens:', error);
      next(error);
    }
  }

  /**
   * GET /api/v2/tokens/graduated
   * Get graduated tokens
   */
  async getGraduatedTokens(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page = '1', limit = '50' } = req.query;

      const result = await tokensService.getGraduatedTokens({
        page: parseInt(page as string),
        limit: Math.min(parseInt(limit as string), 100),
      });

      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      logger.error('Error fetching graduated tokens:', error);
      next(error);
    }
  }

  /**
   * GET /api/v2/creators/:address/tokens
   * Get tokens created by a specific address
   */
  async getTokensByCreator(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { address } = req.params;
      const { page = '1', limit = '50' } = req.query;

      const result = await tokensService.getTokensByCreator(address, {
        page: parseInt(page as string),
        limit: Math.min(parseInt(limit as string), 100),
      });

      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      logger.error('Error fetching tokens by creator:', error);
      next(error);
    }
  }
}

export const tokensController = new TokensController();
export default tokensController;

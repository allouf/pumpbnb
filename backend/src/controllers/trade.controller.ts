import { Request, Response } from 'express';
import { tradeService } from '../services/trade.service';
import { asyncHandler } from '../middleware/errorHandler';

export class TradeController {
  /**
   * GET /api/trades/:tokenAddress
   * Get trade history for a token
   */
  getTokenTrades = asyncHandler(async (req: Request, res: Response) => {
    const { tokenAddress } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const sortOrder = (req.query.sortOrder as 'asc' | 'desc') || 'desc';

    const result = await tradeService.getTokenTrades(tokenAddress, { page, limit, sortOrder });

    res.json({
      success: true,
      ...result,
    });
  });

  /**
   * GET /api/trades/:tokenAddress/chart
   * Get chart data for a token
   */
  getChartData = asyncHandler(async (req: Request, res: Response) => {
    const { tokenAddress } = req.params;
    const interval = (req.query.interval as any) || '1h';
    const limit = parseInt(req.query.limit as string) || 100;

    const chartData = await tradeService.getChartData(tokenAddress, interval, limit);

    res.json({
      success: true,
      data: chartData,
    });
  });

  /**
   * GET /api/trades/:tokenAddress/stats
   * Get trading statistics for a token
   */
  getTokenStats = asyncHandler(async (req: Request, res: Response) => {
    const { tokenAddress } = req.params;
    const stats = await tradeService.getTokenStats(tokenAddress);

    res.json({
      success: true,
      data: stats,
    });
  });

  /**
   * POST /api/trades/estimate
   * Estimate trade output
   */
  estimateTrade = asyncHandler(async (req: Request, res: Response) => {
    const { tokenAddress, amountIn, isBuy } = req.body;

    const estimate = await tradeService.estimateTrade(tokenAddress, amountIn, isBuy);

    res.json({
      success: true,
      data: estimate,
    });
  });

  /**
   * GET /api/trades/user/:address
   * Get user trade history
   */
  getUserTrades = asyncHandler(async (req: Request, res: Response) => {
    const { address } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const sortOrder = (req.query.sortOrder as 'asc' | 'desc') || 'desc';

    const result = await tradeService.getUserTrades(address, { page, limit, sortOrder });

    res.json({
      success: true,
      ...result,
    });
  });
}

export const tradeController = new TradeController();
export default tradeController;

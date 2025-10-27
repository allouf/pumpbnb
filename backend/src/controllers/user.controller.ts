import { Request, Response } from 'express';
import { userService } from '../services/user.service';
import { asyncHandler } from '../middleware/errorHandler';

export class UserController {
  /**
   * GET /api/users/:address/portfolio
   * Get user portfolio
   */
  getUserPortfolio = asyncHandler(async (req: Request, res: Response) => {
    const { address } = req.params;
    const portfolio = await userService.getUserPortfolio(address);

    res.json({
      success: true,
      data: portfolio,
    });
  });

  /**
   * GET /api/users/:address/history
   * Get user transaction history
   */
  getUserHistory = asyncHandler(async (req: Request, res: Response) => {
    const { address } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const sortOrder = (req.query.sortOrder as 'asc' | 'desc') || 'desc';

    const result = await userService.getUserHistory(address, { page, limit, sortOrder });

    res.json({
      success: true,
      ...result,
    });
  });

  /**
   * GET /api/users/:address/pnl
   * Get user profit/loss data
   */
  getUserPnL = asyncHandler(async (req: Request, res: Response) => {
    const { address } = req.params;
    const pnl = await userService.getUserPnL(address);

    res.json({
      success: true,
      data: pnl,
    });
  });

  /**
   * POST /api/users/:address/watchlist
   * Add token to watchlist
   */
  addToWatchlist = asyncHandler(async (req: Request, res: Response) => {
    const { address } = req.params;
    const { tokenAddress } = req.body;

    await userService.addToWatchlist(address, tokenAddress);

    res.json({
      success: true,
      message: 'Token added to watchlist',
    });
  });

  /**
   * DELETE /api/users/:address/watchlist/:tokenAddress
   * Remove token from watchlist
   */
  removeFromWatchlist = asyncHandler(async (req: Request, res: Response) => {
    const { address, tokenAddress } = req.params;

    await userService.removeFromWatchlist(address, tokenAddress);

    res.json({
      success: true,
      message: 'Token removed from watchlist',
    });
  });

  /**
   * GET /api/users/:address/watchlist
   * Get user watchlist
   */
  getWatchlist = asyncHandler(async (req: Request, res: Response) => {
    const { address } = req.params;
    const watchlist = await userService.getWatchlist(address);

    res.json({
      success: true,
      data: watchlist,
    });
  });

  /**
   * POST /api/users/:address/sync
   * Sync user balances from blockchain
   */
  syncBalances = asyncHandler(async (req: Request, res: Response) => {
    const { address } = req.params;
    await userService.syncBalances(address);

    res.json({
      success: true,
      message: 'Balances synced successfully',
    });
  });
}

export const userController = new UserController();
export default userController;

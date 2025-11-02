import { Router } from 'express';
import tradesController from '../controllers/trades.controller';

const router = Router();

/**
 * @route   GET /api/traders/:address/trades
 * @desc    Get all trades for a specific trader across all tokens
 * @access  Public
 * @query   page - Page number (default: 1)
 * @query   limit - Items per page (default: 50, max: 100)
 * @query   tokenAddress - Filter by specific token
 */
router.get(
  '/:address/trades',
  tradesController.getTraderTrades.bind(tradesController)
);

export default router;

import { Router } from 'express';
import tradesController from '../controllers/trades.controller';

const router = Router();

/**
 * @route   GET /api/trades/:txHash
 * @desc    Get a single trade by transaction hash
 * @access  Public
 */
router.get('/:txHash', tradesController.getTradeByTxHash.bind(tradesController));

export default router;

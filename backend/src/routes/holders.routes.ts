import { Router } from 'express';
import holdersController from '../controllers/holders.controller';

const router = Router();

/**
 * @route   GET /api/v2/holders/:address/portfolio
 * @desc    Get all tokens held by a specific address
 * @access  Public
 */
router.get(
  '/:address/portfolio',
  holdersController.getHolderPortfolio.bind(holdersController)
);

export default router;

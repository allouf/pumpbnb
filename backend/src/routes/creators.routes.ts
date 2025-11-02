import { Router } from 'express';
import tokensController from '../controllers/tokens.controller';

const router = Router();

/**
 * @route   GET /api/v2/creators/:address/tokens
 * @desc    Get all tokens created by a specific address
 * @access  Public
 */
router.get(
  '/:address/tokens',
  tokensController.getTokensByCreator.bind(tokensController)
);

export default router;

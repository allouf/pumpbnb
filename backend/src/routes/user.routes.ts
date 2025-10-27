import { Router } from 'express';
import { userController } from '../controllers/user.controller';
import { validate, schemas } from '../middleware/validation';
import { optionalAuth } from '../middleware/auth';
import Joi from 'joi';

const router = Router();

// Validation schemas
const addressSchema = Joi.object({
  params: Joi.object({
    address: schemas.address,
  }),
});

const historySchema = Joi.object({
  params: Joi.object({
    address: schemas.address,
  }),
  query: Joi.object({
    page: Joi.number().integer().min(1).optional(),
    limit: Joi.number().integer().min(1).max(100).optional(),
    sortOrder: Joi.string().valid('asc', 'desc').optional(),
  }),
});

const watchlistSchema = Joi.object({
  params: Joi.object({
    address: schemas.address,
  }),
  body: Joi.object({
    tokenAddress: schemas.address,
  }),
});

const removeWatchlistSchema = Joi.object({
  params: Joi.object({
    address: schemas.address,
    tokenAddress: schemas.address,
  }),
});

// Routes
router.get('/:address/portfolio', validate(addressSchema), optionalAuth, userController.getUserPortfolio);

router.get('/:address/history', validate(historySchema), optionalAuth, userController.getUserHistory);

router.get('/:address/pnl', validate(addressSchema), optionalAuth, userController.getUserPnL);

router.get('/:address/watchlist', validate(addressSchema), optionalAuth, userController.getWatchlist);

router.post('/:address/watchlist', validate(watchlistSchema), userController.addToWatchlist);

router.delete('/:address/watchlist/:tokenAddress', validate(removeWatchlistSchema), userController.removeFromWatchlist);

router.post('/:address/sync', validate(addressSchema), userController.syncBalances);

export default router;

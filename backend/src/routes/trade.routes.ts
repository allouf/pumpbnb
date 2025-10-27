import { Router } from 'express';
import { tradeController } from '../controllers/trade.controller';
import { validate, schemas } from '../middleware/validation';
import { optionalAuth } from '../middleware/auth';
import Joi from 'joi';

const router = Router();

// Validation schemas
const getTradesSchema = Joi.object({
  params: Joi.object({
    tokenAddress: schemas.address,
  }),
  query: Joi.object({
    page: Joi.number().integer().min(1).optional(),
    limit: Joi.number().integer().min(1).max(100).optional(),
    sortOrder: Joi.string().valid('asc', 'desc').optional(),
  }),
});

const getChartSchema = Joi.object({
  params: Joi.object({
    tokenAddress: schemas.address,
  }),
  query: Joi.object({
    interval: Joi.string().valid('1m', '5m', '15m', '1h', '4h', '1d').optional(),
    limit: Joi.number().integer().min(1).max(1000).optional(),
  }),
});

const estimateTradeSchema = Joi.object({
  body: Joi.object({
    tokenAddress: schemas.address,
    amountIn: Joi.string().required(),
    isBuy: Joi.boolean().required(),
  }),
});

const getUserTradesSchema = Joi.object({
  params: Joi.object({
    address: schemas.address,
  }),
  query: Joi.object({
    page: Joi.number().integer().min(1).optional(),
    limit: Joi.number().integer().min(1).max(100).optional(),
    sortOrder: Joi.string().valid('asc', 'desc').optional(),
  }),
});

// Routes
router.get('/:tokenAddress', validate(getTradesSchema), optionalAuth, tradeController.getTokenTrades);

router.get('/:tokenAddress/chart', validate(getChartSchema), optionalAuth, tradeController.getChartData);

router.get('/:tokenAddress/stats', validate(getTradesSchema), optionalAuth, tradeController.getTokenStats);

router.post('/estimate', validate(estimateTradeSchema), tradeController.estimateTrade);

router.get('/user/:address', validate(getUserTradesSchema), optionalAuth, tradeController.getUserTrades);

export default router;

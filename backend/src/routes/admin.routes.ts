import { Router } from 'express';
import { adminController } from '../controllers/admin.controller';
import { tokenStatsUpdaterService } from '../services/token-stats-updater.service';
import Joi from 'joi';
import { validate } from '../middleware/validation';
import logger from '../utils/logger';

const router = Router();

// Validation schemas
const indexTokenSchema = Joi.object({
  body: Joi.object({
    tokenAddress: Joi.string()
      .pattern(/^0x[a-fA-F0-9]{40}$/)
      .required()
      .messages({
        'string.pattern.base': 'Invalid Ethereum address format',
      }),
  }).unknown(true),
  query: Joi.any(),
  params: Joi.any(),
}).unknown(true);

const reindexBlocksSchema = Joi.object({
  body: Joi.object({
    fromBlock: Joi.number().integer().min(0).required(),
    toBlock: Joi.number().integer().min(0).optional(),
  }).unknown(true),
  query: Joi.any(),
  params: Joi.any(),
}).unknown(true);

// Routes
// POST /api/admin/index-token - Manually index a specific token
router.post('/index-token', validate(indexTokenSchema), adminController.indexToken);

// POST /api/admin/reindex-blocks - Re-index a range of blocks
router.post('/reindex-blocks', validate(reindexBlocksSchema), adminController.reindexBlocks);

// GET /api/admin/indexer-status - Get current indexer status
router.get('/indexer-status', adminController.getIndexerStatus);

export default router;

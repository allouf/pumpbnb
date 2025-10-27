import { Router } from 'express';
import { tokenController } from '../controllers/token.controller';
import { validate, schemas } from '../middleware/validation';
import { optionalAuth } from '../middleware/auth';
import Joi from 'joi';

const router = Router();

// Validation schemas
const getTokensSchema = Joi.object({
  query: Joi.object({
    page: Joi.number().integer().min(1).optional(),
    limit: Joi.number().integer().min(1).max(100).optional(),
    sortBy: Joi.string().optional(),
    sortOrder: Joi.string().valid('asc', 'desc').optional(),
  }),
});

const getTokenByAddressSchema = Joi.object({
  params: Joi.object({
    address: schemas.address,
  }),
});

const searchTokensSchema = Joi.object({
  query: Joi.object({
    q: Joi.string().min(1).required(),
    limit: Joi.number().integer().min(1).max(100).optional(),
  }),
});

const createMetadataSchema = Joi.object({
  body: schemas.tokenMetadata,
});

// Routes
router.get('/', validate(getTokensSchema), optionalAuth, tokenController.getAllTokens);

router.get('/trending', optionalAuth, tokenController.getTrendingTokens);

router.get('/recent', optionalAuth, tokenController.getRecentTokens);

router.get('/graduated', optionalAuth, tokenController.getGraduatedTokens);

router.get('/search', validate(searchTokensSchema), optionalAuth, tokenController.searchTokens);

router.post('/metadata', validate(createMetadataSchema), tokenController.createTokenMetadata);

router.get(
  '/creator/:address',
  validate(getTokenByAddressSchema),
  optionalAuth,
  tokenController.getTokensByCreator
);

router.get(
  '/:address',
  validate(getTokenByAddressSchema),
  optionalAuth,
  tokenController.getTokenByAddress
);

router.get(
  '/:address/holders',
  validate(getTokenByAddressSchema),
  optionalAuth,
  tokenController.getTokenHolders
);

export default router;

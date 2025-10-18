import { Router } from 'express';
import {
  getTokens,
  getToken,
  createToken,
  updateToken,
  getTrendingTokens,
  createTokenValidation,
  updateTokenValidation,
  getTokensValidation
} from '../controllers/tokenController';
import { authenticate, optionalAuthenticate } from '../middleware/auth';

const router = Router();

// Public routes
router.get('/', getTokensValidation, optionalAuthenticate, getTokens);
router.get('/trending', getTrendingTokens);
router.get('/:id', optionalAuthenticate, getToken);

// Protected routes
router.post('/', authenticate, createTokenValidation, createToken);
router.put('/:id', authenticate, updateTokenValidation, updateToken);

export default router;
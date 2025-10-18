import { Router } from 'express';
import {
  register,
  login,
  walletAuth,
  getProfile,
  updateProfile,
  registerValidation,
  loginValidation,
  walletAuthValidation,
  updateProfileValidation
} from '../controllers/authController';
import { authenticate } from '../middleware/auth';

const router = Router();

// Public routes
router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);
router.post('/wallet', walletAuthValidation, walletAuth);

// Protected routes
router.get('/profile', authenticate, getProfile);
router.put('/profile', authenticate, updateProfileValidation, updateProfile);

// Health check for auth service
router.get('/health', (req, res) => {
  res.json({
    service: 'auth',
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

export default router;
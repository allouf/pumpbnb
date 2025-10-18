import { Router } from 'express';
import { authenticate, optionalAuthenticate } from '../middleware/auth';

const router = Router();

// Get comments for a token
router.get('/token/:tokenId', optionalAuthenticate, async (req, res) => {
  // TODO: Implement get comments for token
  res.json({
    success: true,
    message: 'Token comments - Coming soon',
    endpoint: 'GET /api/comments/token/:tokenId'
  });
});

// Create comment
router.post('/', authenticate, async (req, res) => {
  // TODO: Implement create comment
  res.json({
    success: true,
    message: 'Create comment - Coming soon',
    endpoint: 'POST /api/comments'
  });
});

// Like/unlike comment
router.post('/:id/like', authenticate, async (req, res) => {
  // TODO: Implement like comment
  res.json({
    success: true,
    message: 'Like comment - Coming soon',
    endpoint: 'POST /api/comments/:id/like'
  });
});

export default router;
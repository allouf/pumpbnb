import { Router } from 'express';
import commentsController from '../controllers/comments.controller';

const router = Router();

/**
 * @route   GET /api/v2/comments/:commentId
 * @desc    Get a single comment
 * @access  Public
 */
router.get(
  '/:commentId',
  commentsController.getComment.bind(commentsController)
);

/**
 * @route   GET /api/v2/comments/:commentId/replies
 * @desc    Get replies for a comment
 * @access  Public
 */
router.get(
  '/:commentId/replies',
  commentsController.getReplies.bind(commentsController)
);

/**
 * @route   PUT /api/v2/comments/:commentId
 * @desc    Update/edit a comment
 * @access  Public (requires ownership)
 */
router.put(
  '/:commentId',
  commentsController.updateComment.bind(commentsController)
);

/**
 * @route   DELETE /api/v2/comments/:commentId
 * @desc    Delete a comment
 * @access  Public (requires ownership)
 */
router.delete(
  '/:commentId',
  commentsController.deleteComment.bind(commentsController)
);

/**
 * @route   POST /api/v2/comments/:commentId/like
 * @desc    Like a comment
 * @access  Public
 */
router.post(
  '/:commentId/like',
  commentsController.likeComment.bind(commentsController)
);

/**
 * @route   POST /api/v2/comments/:commentId/unlike
 * @desc    Unlike a comment
 * @access  Public
 */
router.post(
  '/:commentId/unlike',
  commentsController.unlikeComment.bind(commentsController)
);

export default router;

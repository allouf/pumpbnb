import { Request, Response, NextFunction } from 'express';
import commentsService from '../services/comments.service';
import { CommentFilter } from '../types/tokenPage';
import logger from '../utils/logger';
import websocketService from '../services/websocket.service';

class CommentsController {
  /**
   * GET /api/v2/tokens/:address/comments
   * Get comments for a specific token
   */
  async getTokenComments(req: Request, res: Response, next: NextFunction) {
    try {
      const { address } = req.params;
      const {
        userAddress,
        sortBy = 'newest',
        includeReplies,
        page = '1',
        limit = '50',
      } = req.query;

      // Build filter
      const filter: CommentFilter = {};
      if (userAddress) filter.userAddress = userAddress as string;
      if (sortBy) filter.sortBy = sortBy as any;
      if (includeReplies !== undefined) filter.includeReplies = includeReplies === 'true';

      const result = await commentsService.getTokenComments(address, {
        filter,
        page: parseInt(page as string),
        limit: Math.min(parseInt(limit as string), 100),
      });

      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      logger.error('Error fetching token comments:', error);
      next(error);
    }
  }

  /**
   * GET /api/v2/tokens/:address/comments/recent
   * Get recent comments for a token (cached)
   */
  async getRecentComments(req: Request, res: Response, next: NextFunction) {
    try {
      const { address } = req.params;
      const { limit = '10' } = req.query;

      const comments = await commentsService.getRecentComments(
        address,
        Math.min(parseInt(limit as string), 100)
      );

      res.json({
        success: true,
        data: comments,
        count: comments.length,
      });
    } catch (error) {
      logger.error('Error fetching recent comments:', error);
      next(error);
    }
  }

  /**
   * GET /api/v2/tokens/:address/comments/stats
   * Get comment statistics for a token
   */
  async getCommentStats(req: Request, res: Response, next: NextFunction) {
    try {
      const { address } = req.params;

      const stats = await commentsService.getCommentStats(address);

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      logger.error('Error fetching comment stats:', error);
      next(error);
    }
  }

  /**
   * GET /api/v2/comments/:commentId
   * Get a single comment
   */
  async getComment(req: Request, res: Response, next: NextFunction) {
    try {
      const { commentId } = req.params;

      const comment = await commentsService.getComment(commentId);

      if (!comment) {
        return res.status(404).json({
          success: false,
          error: 'Comment not found',
        });
      }

      res.json({
        success: true,
        data: comment,
      });
    } catch (error) {
      logger.error('Error fetching comment:', error);
      next(error);
    }
  }

  /**
   * GET /api/v2/comments/:commentId/replies
   * Get replies for a comment
   */
  async getReplies(req: Request, res: Response, next: NextFunction) {
    try {
      const { commentId } = req.params;

      const replies = await commentsService.getReplies(commentId);

      res.json({
        success: true,
        data: replies,
        count: replies.length,
      });
    } catch (error) {
      logger.error('Error fetching comment replies:', error);
      next(error);
    }
  }

  /**
   * POST /api/v2/tokens/:address/comments
   * Create a new comment
   */
  async createComment(req: Request, res: Response, next: NextFunction) {
    try {
      const { address } = req.params;
      const { userAddress, content, replyTo } = req.body;

      if (!userAddress || !content) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: userAddress, content',
        });
      }

      if (content.length > 1000) {
        return res.status(400).json({
          success: false,
          error: 'Comment content too long (max 1000 characters)',
        });
      }

      const comment = await commentsService.createComment({
        tokenAddress: address,
        userAddress,
        content,
        replyTo,
      });

      // Broadcast new comment via WebSocket
      websocketService.publishEvent('Comment', {
        tokenAddress: address,
        ...comment,
      });

      res.status(201).json({
        success: true,
        data: comment,
      });
    } catch (error) {
      logger.error('Error creating comment:', error);
      next(error);
    }
  }

  /**
   * PUT /api/v2/comments/:commentId
   * Update a comment
   */
  async updateComment(req: Request, res: Response, next: NextFunction) {
    try {
      const { commentId } = req.params;
      const { userAddress, content } = req.body;

      if (!userAddress || !content) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: userAddress, content',
        });
      }

      const comment = await commentsService.updateComment(
        commentId,
        userAddress,
        content
      );

      // Broadcast comment update via WebSocket
      websocketService.publishEvent('CommentUpdate', {
        tokenAddress: comment.tokenAddress,
        commentId,
        content,
      });

      res.json({
        success: true,
        data: comment,
      });
    } catch (error) {
      logger.error('Error updating comment:', error);
      if (error instanceof Error && error.message.includes('Unauthorized')) {
        return res.status(403).json({
          success: false,
          error: error.message,
        });
      }
      next(error);
    }
  }

  /**
   * DELETE /api/v2/comments/:commentId
   * Delete a comment
   */
  async deleteComment(req: Request, res: Response, next: NextFunction) {
    try {
      const { commentId } = req.params;
      const { userAddress } = req.body;

      if (!userAddress) {
        return res.status(400).json({
          success: false,
          error: 'Missing required field: userAddress',
        });
      }

      // Get comment first to access tokenAddress
      const comment = await commentsService.getComment(commentId);
      if (!comment) {
        return res.status(404).json({
          success: false,
          error: 'Comment not found',
        });
      }

      await commentsService.deleteComment(commentId, userAddress);

      // Broadcast comment deletion via WebSocket
      websocketService.publishEvent('CommentDelete', {
        tokenAddress: comment.tokenAddress,
        commentId,
      });

      res.json({
        success: true,
        message: 'Comment deleted successfully',
      });
    } catch (error) {
      logger.error('Error deleting comment:', error);
      if (error instanceof Error && error.message.includes('Unauthorized')) {
        return res.status(403).json({
          success: false,
          error: error.message,
        });
      }
      next(error);
    }
  }

  /**
   * POST /api/v2/comments/:commentId/like
   * Like a comment
   */
  async likeComment(req: Request, res: Response, next: NextFunction) {
    try {
      const { commentId } = req.params;
      const { userAddress } = req.body;

      if (!userAddress) {
        return res.status(400).json({
          success: false,
          error: 'Missing required field: userAddress',
        });
      }

      await commentsService.likeComment(commentId, userAddress);

      // Get updated comment to get like count and tokenAddress
      const comment = await commentsService.getComment(commentId);
      if (comment) {
        websocketService.publishEvent('CommentLike', {
          tokenAddress: comment.tokenAddress,
          commentId,
          likeCount: comment.likeCount,
        });
      }

      res.json({
        success: true,
        message: 'Comment liked successfully',
      });
    } catch (error) {
      logger.error('Error liking comment:', error);
      if (error instanceof Error && error.message.includes('Already liked')) {
        return res.status(400).json({
          success: false,
          error: error.message,
        });
      }
      next(error);
    }
  }

  /**
   * POST /api/v2/comments/:commentId/unlike
   * Unlike a comment
   */
  async unlikeComment(req: Request, res: Response, next: NextFunction) {
    try {
      const { commentId } = req.params;
      const { userAddress } = req.body;

      if (!userAddress) {
        return res.status(400).json({
          success: false,
          error: 'Missing required field: userAddress',
        });
      }

      await commentsService.unlikeComment(commentId, userAddress);

      // Get updated comment to get like count and tokenAddress
      const comment = await commentsService.getComment(commentId);
      if (comment) {
        websocketService.publishEvent('CommentLike', {
          tokenAddress: comment.tokenAddress,
          commentId,
          likeCount: comment.likeCount,
        });
      }

      res.json({
        success: true,
        message: 'Comment unliked successfully',
      });
    } catch (error) {
      logger.error('Error unliking comment:', error);
      if (error instanceof Error && error.message.includes('not liked')) {
        return res.status(400).json({
          success: false,
          error: error.message,
        });
      }
      next(error);
    }
  }
}

export const commentsController = new CommentsController();
export default commentsController;

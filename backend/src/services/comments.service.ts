import { Comment, Prisma } from '@prisma/client';
import { prisma } from './db.service';
import { cache, cacheKeys } from '../config/redis';
import { PaginatedResponse, CommentFilter } from '../types/tokenPage';

class CommentsService {
  /**
   * Get comments for a specific token with filtering and pagination
   */
  async getTokenComments(
    tokenAddress: string,
    options: {
      filter?: CommentFilter;
      page?: number;
      limit?: number;
    } = {}
  ): Promise<PaginatedResponse<Comment>> {
    const {
      filter = {},
      page = 1,
      limit = 50,
    } = options;

    const where: Prisma.CommentWhereInput = {
      tokenAddress: tokenAddress.toLowerCase(),
    };

    // Apply filters
    if (filter.userAddress) {
      where.userAddress = filter.userAddress.toLowerCase();
    }

    if (filter.includeReplies === false) {
      where.replyTo = null; // Only top-level comments
    }

    // Build order by
    let orderBy: Prisma.CommentOrderByWithRelationInput = {};
    if (filter.sortBy === 'newest') {
      orderBy = { createdAt: 'desc' };
    } else if (filter.sortBy === 'oldest') {
      orderBy = { createdAt: 'asc' };
    } else if (filter.sortBy === 'mostLiked') {
      orderBy = { likes: 'desc' };
    } else {
      orderBy = { createdAt: 'desc' }; // Default
    }

    const skip = (page - 1) * limit;

    const [comments, total] = await Promise.all([
      prisma.comment.findMany({
        where,
        orderBy,
        skip,
        take: limit,
      }),
      prisma.comment.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: comments,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasMore: page < totalPages,
      },
    };
  }

  /**
   * Get recent comments for a token (cached)
   */
  async getRecentComments(
    tokenAddress: string,
    limit: number = 10
  ): Promise<Comment[]> {
    const cacheKey = cacheKeys.tokenComments(tokenAddress, limit);

    // Try cache first
    const cached = await cache.get<Comment[]>(cacheKey);
    if (cached) {
      return cached;
    }

    // Fetch from database
    const comments = await prisma.comment.findMany({
      where: {
        tokenAddress: tokenAddress.toLowerCase(),
        replyTo: null, // Only top-level comments
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    // Cache for 30 seconds
    const ttl = parseInt(process.env.CACHE_COMMENTS_TTL || '30');
    await cache.set(cacheKey, comments, ttl);

    return comments;
  }

  /**
   * Get a single comment by ID
   */
  async getComment(commentId: string): Promise<Comment | null> {
    return prisma.comment.findUnique({
      where: { id: commentId },
    });
  }

  /**
   * Get replies for a comment
   */
  async getReplies(commentId: string): Promise<Comment[]> {
    return prisma.comment.findMany({
      where: { replyTo: commentId },
      orderBy: { createdAt: 'asc' },
    });
  }

  /**
   * Create a new comment
   */
  async createComment(data: {
    tokenAddress: string;
    userAddress: string;
    content: string;
    replyTo?: string;
  }): Promise<Comment> {
    // Validate replyTo if provided
    if (data.replyTo) {
      const parentComment = await this.getComment(data.replyTo);
      if (!parentComment) {
        throw new Error('Parent comment not found');
      }
    }

    const comment = await prisma.comment.create({
      data: {
        tokenAddress: data.tokenAddress.toLowerCase(),
        userAddress: data.userAddress.toLowerCase(),
        content: data.content,
        replyTo: data.replyTo,
      },
    });

    // Invalidate cache
    await this.invalidateCache(data.tokenAddress);

    return comment;
  }

  /**
   * Update a comment (edit)
   */
  async updateComment(
    commentId: string,
    userAddress: string,
    content: string
  ): Promise<Comment> {
    const comment = await this.getComment(commentId);

    if (!comment) {
      throw new Error('Comment not found');
    }

    if (comment.userAddress.toLowerCase() !== userAddress.toLowerCase()) {
      throw new Error('Unauthorized to edit this comment');
    }

    const updated = await prisma.comment.update({
      where: { id: commentId },
      data: { content },
    });

    // Invalidate cache
    await this.invalidateCache(comment.tokenAddress);

    return updated;
  }

  /**
   * Delete a comment
   */
  async deleteComment(commentId: string, userAddress: string): Promise<void> {
    const comment = await this.getComment(commentId);

    if (!comment) {
      throw new Error('Comment not found');
    }

    if (comment.userAddress.toLowerCase() !== userAddress.toLowerCase()) {
      throw new Error('Unauthorized to delete this comment');
    }

    await prisma.comment.delete({
      where: { id: commentId },
    });

    // Invalidate cache
    await this.invalidateCache(comment.tokenAddress);
  }

  /**
   * Like a comment
   */
  async likeComment(commentId: string, userAddress: string): Promise<void> {
    const comment = await this.getComment(commentId);

    if (!comment) {
      throw new Error('Comment not found');
    }

    // Check if already liked
    const existingLike = await prisma.commentLike.findUnique({
      where: {
        commentId_userAddress: {
          commentId,
          userAddress: userAddress.toLowerCase(),
        },
      },
    });

    if (existingLike) {
      throw new Error('Already liked this comment');
    }

    // Create like and increment counter
    await Promise.all([
      prisma.commentLike.create({
        data: {
          commentId,
          userAddress: userAddress.toLowerCase(),
        },
      }),
      prisma.comment.update({
        where: { id: commentId },
        data: { likes: { increment: 1 } },
      }),
    ]);

    // Invalidate cache
    await this.invalidateCache(comment.tokenAddress);
  }

  /**
   * Unlike a comment
   */
  async unlikeComment(commentId: string, userAddress: string): Promise<void> {
    const comment = await this.getComment(commentId);

    if (!comment) {
      throw new Error('Comment not found');
    }

    // Check if liked
    const existingLike = await prisma.commentLike.findUnique({
      where: {
        commentId_userAddress: {
          commentId,
          userAddress: userAddress.toLowerCase(),
        },
      },
    });

    if (!existingLike) {
      throw new Error('Comment not liked');
    }

    // Delete like and decrement counter
    await Promise.all([
      prisma.commentLike.delete({
        where: {
          commentId_userAddress: {
            commentId,
            userAddress: userAddress.toLowerCase(),
          },
        },
      }),
      prisma.comment.update({
        where: { id: commentId },
        data: { likes: { decrement: 1 } },
      }),
    ]);

    // Invalidate cache
    await this.invalidateCache(comment.tokenAddress);
  }

  /**
   * Check if user has liked a comment
   */
  async hasUserLiked(commentId: string, userAddress: string): Promise<boolean> {
    const like = await prisma.commentLike.findUnique({
      where: {
        commentId_userAddress: {
          commentId,
          userAddress: userAddress.toLowerCase(),
        },
      },
    });

    return !!like;
  }

  /**
   * Get comment statistics for a token
   */
  async getCommentStats(tokenAddress: string) {
    const [totalComments, topLevelComments, totalLikes] = await Promise.all([
      prisma.comment.count({
        where: { tokenAddress: tokenAddress.toLowerCase() },
      }),
      prisma.comment.count({
        where: {
          tokenAddress: tokenAddress.toLowerCase(),
          replyTo: null,
        },
      }),
      prisma.comment.aggregate({
        where: { tokenAddress: tokenAddress.toLowerCase() },
        _sum: { likes: true },
      }),
    ]);

    return {
      totalComments,
      topLevelComments,
      replies: totalComments - topLevelComments,
      totalLikes: totalLikes._sum.likes || 0,
    };
  }

  /**
   * Invalidate comments cache for a token
   */
  async invalidateCache(tokenAddress: string): Promise<void> {
    await cache.delPattern(`token:comments:${tokenAddress.toLowerCase()}:*`);
  }
}

export const commentsService = new CommentsService();
export default commentsService;

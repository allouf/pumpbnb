import { Router, Request, Response } from 'express';
import { prisma } from '../services/database.service';
import logger from '../utils/logger';
import { ensureUserExists } from '../utils/autoCreateUser';

const router = Router();

/**
 * GET /api/profile/:address
 * Get user profile by wallet address
 */
router.get('/:address', async (req: Request, res: Response): Promise<void> => {
  try {
    const { address } = req.params;

    // Auto-create user profile if it doesn't exist (like Pump.fun)
    const user = await ensureUserExists(address);

    if (!user) {
      res.status(500).json({
        success: false,
        error: 'Failed to load user profile',
      });
      return;
    }

    // Get tokens created by this user
    const tokens = await prisma.token.findMany({
      where: { creator: address.toLowerCase() },
      include: { stats: true },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    // Update created tokens count if it doesn't match
    const actualTokensCount = await prisma.token.count({
      where: { creator: address.toLowerCase() },
    });

    if (user.createdTokensCount !== actualTokensCount) {
      await prisma.user.update({
        where: { walletAddress: address.toLowerCase() },
        data: { createdTokensCount: actualTokensCount },
      });
      user.createdTokensCount = actualTokensCount;
    }

    // Get user's portfolio/balances
    const portfolio = await prisma.userPortfolio.findMany({
      where: { userAddress: address.toLowerCase() },
      orderBy: { updatedAt: 'desc' },
    });

    res.json({
      success: true,
      data: {
        user,
        tokens,
        portfolio,
      },
    });
  } catch (error: any) {
    logger.error('[Profile] Error fetching profile:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch profile',
    });
  }
});

/**
 * PUT /api/profile/:address
 * Update user profile
 */
router.put('/:address', async (req: Request, res: Response): Promise<void> => {
  try {
    const { address } = req.params;
    const { username, bio, profileImage } = req.body;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { walletAddress: address.toLowerCase() },
    });

    if (!existingUser) {
      res.status(404).json({
        success: false,
        error: 'User not found',
      });
      return;
    }

    // Check username change limit (once per day)
    if (username && username !== existingUser.username) {
      if (existingUser.lastUsernameChange) {
        const daysSinceChange = (Date.now() - existingUser.lastUsernameChange.getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceChange < 1) {
          res.status(400).json({
            success: false,
            error: 'You can only change your username once per day',
          });
          return;
        }
      }

      // Check if username is already taken
      const existingUsername = await prisma.user.findUnique({
        where: { username },
      });

      if (existingUsername && existingUsername.walletAddress !== address.toLowerCase()) {
        res.status(400).json({
          success: false,
          error: 'Username already taken',
        });
        return;
      }
    }

    // Update user profile
    const updateData: any = {};
    if (username !== undefined) {
      updateData.username = username;
      updateData.lastUsernameChange = new Date();
    }
    if (bio !== undefined) updateData.bio = bio;
    if (profileImage !== undefined) updateData.profileImage = profileImage;

    const updatedUser = await prisma.user.update({
      where: { walletAddress: address.toLowerCase() },
      data: updateData,
    });

    logger.info(`[Profile] User profile updated: ${address}`);

    res.json({
      success: true,
      data: { user: updatedUser },
    });
  } catch (error: any) {
    logger.error('[Profile] Error updating profile:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update profile',
    });
  }
});

/**
 * POST /api/profile/:address/follow
 * Follow/unfollow a user
 */
router.post('/:address/follow', async (req: Request, res: Response): Promise<void> => {
  try {
    const { address } = req.params; // Address to follow
    const { followerAddress } = req.body; // Current user's address

    if (!followerAddress) {
      res.status(400).json({
        success: false,
        error: 'Follower address is required',
      });
      return;
    }

    // Check if already following
    const existingFollow = await prisma.userFollow.findUnique({
      where: {
        followerAddress_followingAddress: {
          followerAddress: followerAddress.toLowerCase(),
          followingAddress: address.toLowerCase(),
        },
      },
    });

    if (existingFollow) {
      // Unfollow
      await prisma.userFollow.delete({
        where: { id: existingFollow.id },
      });

      // Update counts
      await prisma.user.update({
        where: { walletAddress: followerAddress.toLowerCase() },
        data: { followingCount: { decrement: 1 } },
      });
      await prisma.user.update({
        where: { walletAddress: address.toLowerCase() },
        data: { followersCount: { decrement: 1 } },
      });

      res.json({
        success: true,
        data: { following: false },
      });
    } else {
      // Follow
      await prisma.userFollow.create({
        data: {
          followerAddress: followerAddress.toLowerCase(),
          followingAddress: address.toLowerCase(),
        },
      });

      // Update counts
      await prisma.user.update({
        where: { walletAddress: followerAddress.toLowerCase() },
        data: { followingCount: { increment: 1 } },
      });
      await prisma.user.update({
        where: { walletAddress: address.toLowerCase() },
        data: { followersCount: { increment: 1 } },
      });

      res.json({
        success: true,
        data: { following: true },
      });
    }
  } catch (error: any) {
    logger.error('[Profile] Error following/unfollowing user:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to follow/unfollow user',
    });
  }
});

export default router;

import { Router, Request, Response } from 'express';
import { ethers } from 'ethers';
import { prisma } from '../services/database.service';
import logger from '../utils/logger';

const router = Router();

/**
 * POST /api/auth/nonce
 * Get a nonce for wallet signature
 */
router.post('/nonce', async (req: Request, res: Response): Promise<void> => {
  try {
    const { walletAddress } = req.body;

    if (!walletAddress) {
      res.status(400).json({
        success: false,
        error: 'Wallet address is required',
      });
      return;
    }

    // Generate a random nonce
    const nonce = ethers.hexlify(ethers.randomBytes(32));
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Create or update session with new nonce
    await prisma.userSession.upsert({
      where: { nonce: nonce }, // This will always create new since nonce is unique
      update: {},
      create: {
        userAddress: walletAddress.toLowerCase(),
        nonce,
        expiresAt,
      },
    });

    logger.info(`[Auth] Nonce generated for ${walletAddress}`);

    res.json({
      success: true,
      data: { nonce },
    });
  } catch (error: any) {
    logger.error('[Auth] Error generating nonce:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate nonce',
    });
  }
});

/**
 * POST /api/auth/verify
 * Verify wallet signature and create/update user profile
 */
router.post('/verify', async (req: Request, res: Response): Promise<void> => {
  try {
    const { walletAddress, signature, nonce } = req.body;

    if (!walletAddress || !signature || !nonce) {
      res.status(400).json({
        success: false,
        error: 'Wallet address, signature, and nonce are required',
      });
      return;
    }

    // Find the session with this nonce
    const session = await prisma.userSession.findUnique({
      where: { nonce },
    });

    if (!session) {
      res.status(401).json({
        success: false,
        error: 'Invalid nonce',
      });
      return;
    }

    if (session.expiresAt < new Date()) {
      res.status(401).json({
        success: false,
        error: 'Nonce expired',
      });
      return;
    }

    if (session.userAddress.toLowerCase() !== walletAddress.toLowerCase()) {
      res.status(401).json({
        success: false,
        error: 'Wallet address mismatch',
      });
      return;
    }

    // Verify the signature
    const message = `Sign this message to authenticate with PumpBNB.\n\nNonce: ${nonce}`;
    let recoveredAddress: string;

    try {
      recoveredAddress = ethers.verifyMessage(message, signature);
    } catch (error) {
      res.status(401).json({
        success: false,
        error: 'Invalid signature',
      });
      return;
    }

    if (recoveredAddress.toLowerCase() !== walletAddress.toLowerCase()) {
      res.status(401).json({
        success: false,
        error: 'Signature verification failed',
      });
      return;
    }

    // Update session with signature
    await prisma.userSession.update({
      where: { nonce },
      data: {
        signature,
        lastActivityAt: new Date(),
      },
    });

    // Create or get user profile
    let user = await prisma.user.findUnique({
      where: { walletAddress: walletAddress.toLowerCase() },
    });

    if (!user) {
      // Create new user with default username (like Pump.fun: first 6 chars after 0x)
      const defaultUsername = walletAddress.slice(2, 8).toLowerCase();
      user = await prisma.user.create({
        data: {
          walletAddress: walletAddress.toLowerCase(),
          username: defaultUsername,
        },
      });
      logger.info(`[Auth] New user created: ${walletAddress} with username: ${defaultUsername}`);
    }

    // Count tokens created by this user
    const tokensCreated = await prisma.token.count({
      where: { creator: walletAddress.toLowerCase() },
    });

    // Update created tokens count
    if (tokensCreated > 0) {
      await prisma.user.update({
        where: { walletAddress: walletAddress.toLowerCase() },
        data: { createdTokensCount: tokensCreated },
      });
    }

    logger.info(`[Auth] User authenticated: ${walletAddress}`);

    res.json({
      success: true,
      data: {
        user: {
          ...user,
          createdTokensCount: tokensCreated,
        },
      },
    });
  } catch (error: any) {
    logger.error('[Auth] Error verifying signature:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to verify signature',
    });
  }
});

export default router;

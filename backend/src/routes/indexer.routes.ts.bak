import { Router, Request, Response } from 'express';
import { immediateIndexerService } from '../services/immediate-indexer.service';
import logger from '../utils/logger';

const router = Router();

/**
 * POST /api/indexer/index-token
 * Immediately index a newly created token from transaction hash
 */
router.post('/index-token', async (req: Request, res: Response): Promise<void> => {
  try {
    const { txHash, tokenAddress, bondingCurve, creator, name, symbol } = req.body;

    if (!txHash) {
      res.status(400).json({
        success: false,
        error: 'Transaction hash is required',
      });
      return;
    }

    logger.info(`[API] Immediate index request for tx: ${txHash}`);

    // Index with retry logic (waits for confirmation)
    const token = await immediateIndexerService.indexTokenWithRetry({
      txHash,
      tokenAddress,
      bondingCurve,
      creator,
      name,
      symbol,
    });

    res.json({
      success: true,
      data: token,
    });
  } catch (error: any) {
    logger.error('[API] Error indexing token:', error);

    // Check if token already exists
    if (error.message?.includes('already indexed')) {
      res.status(200).json({
        success: true,
        message: 'Token already indexed',
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: error.message || 'Failed to index token',
    });
  }
});

/**
 * POST /api/indexer/check-status
 * Check if a token has been indexed
 */
router.post('/check-status', async (req: Request, res: Response): Promise<void> => {
  try {
    const { tokenAddress } = req.body;

    if (!tokenAddress) {
      res.status(400).json({
        success: false,
        error: 'Token address is required',
      });
      return;
    }

    const { prisma } = await import('../services/database.service');

    const token = await prisma.token.findUnique({
      where: { address: tokenAddress.toLowerCase() },
      include: {
        stats: true,
      },
    });

    res.json({
      success: true,
      data: {
        indexed: !!token,
        token: token || null,
      },
    });
  } catch (error: any) {
    logger.error('[API] Error checking token status:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to check token status',
    });
  }
});

export default router;

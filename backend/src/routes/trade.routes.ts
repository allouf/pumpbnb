import { Router } from 'express';
import { prisma } from '../services/database.service';
import { optionalAuth } from '../middleware/auth';

const router = Router();

/**
 * Get trading history for a bonding curve
 */
router.get('/:bondingCurve/history', optionalAuth, async (req, res) => {
  try {
    const { bondingCurve } = req.params;
    const { limit = '100', userAddress } = req.query;

    const trades = await prisma.trade.findMany({
      where: {
        bondingCurve: bondingCurve.toLowerCase(),
        ...(userAddress && { user: (userAddress as string).toLowerCase() }),
      },
      orderBy: { timestamp: 'desc' },
      take: parseInt(limit as string),
      select: {
        id: true,
        user: true,
        bondingCurve: true,
        type: true,
        tokenAmount: true,
        asterAmount: true,
        price: true,
        timestamp: true,
        transactionHash: true,
        blockNumber: true,
      },
    });

    res.json({
      success: true,
      data: trades,
    });
  } catch (error) {
    console.error('Error fetching trade history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch trade history',
    });
  }
});

export default router;

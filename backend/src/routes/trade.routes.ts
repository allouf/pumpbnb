import { Router } from 'express';
import { prisma } from '../services/database.service';
import { optionalAuth } from '../middleware/auth';

const router = Router();

/**
 * Get trading history for a token or bonding curve
 * Accepts either token address or bonding curve address
 */
router.get('/:address/history', optionalAuth, async (req, res) => {
  try {
    const { address } = req.params;
    const { limit = '100', userAddress } = req.query;

    const addressLower = address.toLowerCase();

    // First, try to find if this is a bonding curve address
    const token = await prisma.token.findFirst({
      where: {
        OR: [
          { address: addressLower },
          { bondingCurve: addressLower },
        ],
      },
      select: {
        address: true,
        bondingCurve: true,
      },
    });

    if (!token) {
      res.status(404).json({
        success: false,
        message: 'Token not found',
      });
      return;
    }

    // Query trades using the token address
    const trades = await prisma.trade.findMany({
      where: {
        tokenAddress: token.address,
        ...(userAddress && { trader: (userAddress as string).toLowerCase() }),
      },
      orderBy: { timestamp: 'desc' },
      take: parseInt(limit as string),
      select: {
        id: true,
        trader: true,
        tokenAddress: true,
        isBuy: true,
        amountIn: true,
        amountOut: true,
        fee: true,
        timestamp: true,
        txHash: true,
        blockNumber: true,
      },
    });

    // Transform to expected format
    const formattedTrades = trades.map(trade => ({
      transactionHash: trade.txHash,
      type: trade.isBuy ? 'buy' : 'sell',
      user: trade.trader,
      tokenAmount: trade.isBuy ? trade.amountOut : trade.amountIn,
      asterAmount: trade.isBuy ? trade.amountIn : trade.amountOut,
      timestamp: trade.timestamp,
      blockNumber: trade.blockNumber,
      bondingCurve: token.bondingCurve,
    }));

    res.json({
      success: true,
      data: formattedTrades,
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

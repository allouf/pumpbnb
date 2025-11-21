import { Router } from 'express';
import { usdPriceService } from '../services/usd-price.service';

const router = Router();

/**
 * GET /api/prices/aster
 * Get current ASTER USD price
 */
router.get('/aster', async (_req, res) => {
  try {
    const asterPrice = usdPriceService.getAsterUsdPrice();
    const bnbPrice = usdPriceService.getBnbUsdPrice();
    const priceData = usdPriceService.getPriceData();

    res.json({
      success: true,
      price: asterPrice,
      bnbPrice,
      lastUpdated: priceData?.lastUpdated || new Date(),
      isStale: usdPriceService.isStale(),
    });
  } catch (error) {
    console.error('Error getting ASTER price:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get ASTER price',
      price: 1.17, // Fallback price
    });
  }
});

/**
 * GET /api/prices/all
 * Get all price data
 */
router.get('/all', async (_req, res) => {
  try {
    const priceData = usdPriceService.getPriceData();

    res.json({
      success: true,
      data: {
        asterUsd: usdPriceService.getAsterUsdPrice(),
        bnbUsd: usdPriceService.getBnbUsdPrice(),
        lastUpdated: priceData?.lastUpdated || new Date(),
        isStale: usdPriceService.isStale(),
      },
    });
  } catch (error) {
    console.error('Error getting price data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get price data',
    });
  }
});

export default router;

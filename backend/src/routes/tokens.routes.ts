import { Router } from 'express';
import tradesController from '../controllers/trades.controller';
import tokensController from '../controllers/tokens.controller';
import holdersController from '../controllers/holders.controller';
import ohlcvController from '../controllers/ohlcv.controller';
import commentsController from '../controllers/comments.controller';

const router = Router();

/**
 * Token Info Endpoints
 */

/**
 * @route   GET /api/v2/tokens/search
 * @desc    Search tokens by name, symbol, or address
 * @access  Public
 */
router.get('/search', tokensController.searchTokens.bind(tokensController));

/**
 * @route   GET /api/v2/tokens/trending
 * @desc    Get trending tokens (by volume)
 * @access  Public
 */
router.get('/trending', tokensController.getTrendingTokens.bind(tokensController));

/**
 * @route   GET /api/v2/tokens/recent
 * @desc    Get recently created tokens
 * @access  Public
 */
router.get('/recent', tokensController.getRecentTokens.bind(tokensController));

/**
 * @route   GET /api/v2/tokens/graduated
 * @desc    Get graduated tokens (on PancakeSwap)
 * @access  Public
 */
router.get('/graduated', tokensController.getGraduatedTokens.bind(tokensController));

/**
 * @route   GET /api/v2/tokens/:address
 * @desc    Get complete token page data (token + stats + recent trades/holders/comments)
 * @access  Public
 */
router.get('/:address', tokensController.getTokenPageData.bind(tokensController));

/**
 * @route   GET /api/v2/tokens/:address/info
 * @desc    Get token basic information
 * @access  Public
 */
router.get('/:address/info', tokensController.getTokenInfo.bind(tokensController));

/**
 * @route   GET /api/v2/tokens/:address/stats
 * @desc    Get token statistics (price, market cap, volume, etc.)
 * @access  Public
 */
router.get('/:address/stats', tokensController.getTokenStats.bind(tokensController));

/**
 * Token Trades Endpoints
 */

/**
 * @route   GET /api/tokens/:address/trades
 * @desc    Get all trades for a specific token with filtering and pagination
 * @access  Public
 * @query   type - Filter type: 'all' | 'my' | 'dev' | 'tracked'
 * @query   traderAddress - Filter by trader address (required if type='my')
 * @query   minAmount - Minimum ASTER amount
 * @query   maxAmount - Maximum ASTER amount
 * @query   startTime - Start timestamp (ISO 8601)
 * @query   endTime - End timestamp (ISO 8601)
 * @query   page - Page number (default: 1)
 * @query   limit - Items per page (default: 50, max: 100)
 * @query   sortBy - Sort field: 'timestamp' | 'price' | 'volume'
 * @query   sortOrder - Sort order: 'asc' | 'desc'
 */
router.get(
  '/:address/trades',
  tradesController.getTokenTrades.bind(tradesController)
);

/**
 * @route   GET /api/tokens/:address/trades/recent
 * @desc    Get recent trades for a token (cached, faster response)
 * @access  Public
 * @query   limit - Number of trades to return (default: 20, max: 100)
 */
router.get(
  '/:address/trades/recent',
  tradesController.getRecentTrades.bind(tradesController)
);

/**
 * @route   GET /api/tokens/:address/trades/stats
 * @desc    Get trade statistics for a token
 * @access  Public
 * @query   timeWindow - Time window in milliseconds (default: 86400000 = 24h)
 */
router.get(
  '/:address/trades/stats',
  tradesController.getTradeStats.bind(tradesController)
);

/**
 * Token Holders Endpoints
 */

/**
 * @route   GET /api/v2/tokens/:address/holders
 * @desc    Get all holders for a specific token with filtering and pagination
 * @access  Public
 */
router.get(
  '/:address/holders',
  holdersController.getTokenHolders.bind(holdersController)
);

/**
 * @route   GET /api/v2/tokens/:address/holders/top
 * @desc    Get top holders for a token (cached)
 * @access  Public
 */
router.get(
  '/:address/holders/top',
  holdersController.getTopHolders.bind(holdersController)
);

/**
 * @route   GET /api/v2/tokens/:address/holders/count
 * @desc    Get holder count for a token
 * @access  Public
 */
router.get(
  '/:address/holders/count',
  holdersController.getHolderCount.bind(holdersController)
);

/**
 * @route   GET /api/v2/tokens/:address/holders/stats
 * @desc    Get holder statistics (concentration, distribution)
 * @access  Public
 */
router.get(
  '/:address/holders/stats',
  holdersController.getHolderStats.bind(holdersController)
);

/**
 * @route   GET /api/v2/tokens/:address/holders/:holderAddress
 * @desc    Get specific holder information
 * @access  Public
 */
router.get(
  '/:address/holders/:holderAddress',
  holdersController.getHolder.bind(holdersController)
);

/**
 * Token OHLCV/Chart Endpoints
 */

/**
 * @route   GET /api/v2/tokens/:address/ohlcv
 * @desc    Get OHLCV (candlestick) data for charting
 * @access  Public
 */
router.get(
  '/:address/ohlcv',
  ohlcvController.getOHLCVData.bind(ohlcvController)
);

/**
 * @route   GET /api/v2/tokens/:address/chart
 * @desc    Get chart data formatted for TradingView
 * @access  Public
 */
router.get(
  '/:address/chart',
  ohlcvController.getChartData.bind(ohlcvController)
);

/**
 * @route   GET /api/v2/tokens/:address/ohlcv/latest
 * @desc    Get latest candle for a timeframe
 * @access  Public
 */
router.get(
  '/:address/ohlcv/latest',
  ohlcvController.getLatestCandle.bind(ohlcvController)
);

/**
 * @route   POST /api/v2/tokens/:address/ohlcv/aggregate
 * @desc    Manually trigger OHLCV aggregation (admin/internal)
 * @access  Admin
 */
router.post(
  '/:address/ohlcv/aggregate',
  ohlcvController.aggregateOHLCV.bind(ohlcvController)
);

/**
 * Token Comments Endpoints
 */

/**
 * @route   GET /api/v2/tokens/:address/comments
 * @desc    Get all comments for a token with filtering and pagination
 * @access  Public
 */
router.get(
  '/:address/comments',
  commentsController.getTokenComments.bind(commentsController)
);

/**
 * @route   GET /api/v2/tokens/:address/comments/recent
 * @desc    Get recent comments for a token (cached)
 * @access  Public
 */
router.get(
  '/:address/comments/recent',
  commentsController.getRecentComments.bind(commentsController)
);

/**
 * @route   GET /api/v2/tokens/:address/comments/stats
 * @desc    Get comment statistics for a token
 * @access  Public
 */
router.get(
  '/:address/comments/stats',
  commentsController.getCommentStats.bind(commentsController)
);

/**
 * @route   POST /api/v2/tokens/:address/comments
 * @desc    Create a new comment
 * @access  Public (requires user signature in production)
 */
router.post(
  '/:address/comments',
  commentsController.createComment.bind(commentsController)
);

export default router;

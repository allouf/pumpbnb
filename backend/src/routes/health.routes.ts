import { Router, Request, Response } from 'express';
import { prisma } from '../services/database.service';
import { redisClient } from '../config/redis';
import logger from '../utils/logger';
import { ethers } from 'ethers';
import config from '../config';

const router = Router();

/**
 * Health check endpoint - provides detailed system status
 */
router.get('/health', async (req: Request, res: Response): Promise<void> => {
  const healthStatus = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    services: {
      database: { status: 'unknown', message: '' },
      redis: { status: 'unknown', message: '' },
      blockchain: { status: 'unknown', message: '' },
      indexer: { status: 'unknown', message: '' },
    },
  };

  // Check PostgreSQL Database
  try {
    await prisma.$queryRaw`SELECT 1`;
    healthStatus.services.database.status = 'healthy';
    healthStatus.services.database.message = '✅ Database connection OK';
    logger.info('[Health Check] ✅ Database: Connected');
  } catch (error: any) {
    healthStatus.services.database.status = 'unhealthy';
    healthStatus.services.database.message = `❌ Database error: ${error.message}`;
    healthStatus.status = 'degraded';
    logger.error('[Health Check] ❌ Database: Failed', error.message);
  }

  // Check Redis
  try {
    await redisClient.ping();
    healthStatus.services.redis.status = 'healthy';
    healthStatus.services.redis.message = '✅ Redis connection OK';
    logger.info('[Health Check] ✅ Redis: Connected');
  } catch (error: any) {
    healthStatus.services.redis.status = 'unhealthy';
    healthStatus.services.redis.message = `❌ Redis error: ${error.message}`;
    healthStatus.status = 'degraded';
    logger.error('[Health Check] ❌ Redis: Failed', error.message);
  }

  // Check Blockchain RPC
  try {
    const provider = new ethers.JsonRpcProvider(config.bscTestnetRpc);
    const blockNumber = await provider.getBlockNumber();
    healthStatus.services.blockchain.status = 'healthy';
    healthStatus.services.blockchain.message = `✅ BSC Testnet RPC OK (Block: ${blockNumber})`;
    logger.info(`[Health Check] ✅ Blockchain: Connected (Block ${blockNumber})`);
  } catch (error: any) {
    healthStatus.services.blockchain.status = 'unhealthy';
    healthStatus.services.blockchain.message = `❌ Blockchain RPC error: ${error.message}`;
    healthStatus.status = 'degraded';
    logger.error('[Health Check] ❌ Blockchain: Failed', error.message);
  }

  // Check Indexer Status (last indexed trade timestamp)
  try {
    const lastTrade = await prisma.trade.findFirst({
      orderBy: { timestamp: 'desc' },
      select: { timestamp: true, txHash: true },
    });

    if (lastTrade) {
      const timeSinceLastTrade = Date.now() - lastTrade.timestamp.getTime();
      const minutesAgo = Math.floor(timeSinceLastTrade / 1000 / 60);

      if (minutesAgo < 60) {
        healthStatus.services.indexer.status = 'healthy';
        healthStatus.services.indexer.message = `✅ Indexer active (last trade ${minutesAgo}m ago)`;
        logger.info(`[Health Check] ✅ Indexer: Active (last trade ${minutesAgo}m ago)`);
      } else {
        healthStatus.services.indexer.status = 'stale';
        healthStatus.services.indexer.message = `⚠️ Indexer stale (last trade ${minutesAgo}m ago)`;
        logger.warn(`[Health Check] ⚠️ Indexer: Stale (last trade ${minutesAgo}m ago)`);
      }
    } else {
      healthStatus.services.indexer.status = 'no_data';
      healthStatus.services.indexer.message = '⚠️ No trades indexed yet';
      logger.warn('[Health Check] ⚠️ Indexer: No trades indexed yet');
    }
  } catch (error: any) {
    healthStatus.services.indexer.status = 'error';
    healthStatus.services.indexer.message = `❌ Indexer check failed: ${error.message}`;
    logger.error('[Health Check] ❌ Indexer: Check failed', error.message);
  }

  // Log overall health status
  logger.info(`[Health Check] Overall Status: ${healthStatus.status.toUpperCase()}`);

  // Return appropriate HTTP status code
  const httpStatus = healthStatus.status === 'ok' ? 200 : 503;
  res.status(httpStatus).json(healthStatus);
});

/**
 * Detailed system info endpoint
 */
router.get('/health/details', async (req: Request, res: Response): Promise<void> => {
  try {
    // Database stats
    const tokenCount = await prisma.token.count();
    const tradeCount = await prisma.trade.count();
    const holderCount = await prisma.tokenHolder.count();
    const commentCount = await prisma.comment.count();

    // Redis stats
    const redisInfo = await redisClient.info('stats');
    const redisMemory = await redisClient.info('memory');

    // System stats
    const memUsage = process.memoryUsage();

    const detailedStatus = {
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: config.nodeEnv,
      database: {
        tokens: tokenCount,
        trades: tradeCount,
        holders: holderCount,
        comments: commentCount,
      },
      redis: {
        connected: redisClient.status === 'ready',
        info: redisInfo,
        memory: redisMemory,
      },
      system: {
        nodeVersion: process.version,
        platform: process.platform,
        memory: {
          rss: `${Math.round(memUsage.rss / 1024 / 1024)}MB`,
          heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`,
          heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
          external: `${Math.round(memUsage.external / 1024 / 1024)}MB`,
        },
      },
    };

    logger.info('[Health Details] System info requested');
    logger.info(`[Health Details] Tokens: ${tokenCount}, Trades: ${tradeCount}, Holders: ${holderCount}, Comments: ${commentCount}`);

    res.status(200).json(detailedStatus);
  } catch (error: any) {
    logger.error('[Health Details] Failed to get system details:', error);
    res.status(500).json({
      error: 'Failed to get system details',
      message: error.message,
    });
  }
});

export default router;

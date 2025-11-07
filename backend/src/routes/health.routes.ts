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
router.get('/health', async (_req: Request, res: Response): Promise<void> => {
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
    const dbSize = await redisClient.dbsize();
    const info = await redisClient.info('stats');

    // Extract total commands processed from info
    const commandsMatch = info.match(/total_commands_processed:(\d+)/);
    const totalCommands = commandsMatch ? parseInt(commandsMatch[1]) : 0;

    healthStatus.services.redis.status = 'healthy';
    healthStatus.services.redis.message = `✅ Redis OK (${dbSize} keys, ${totalCommands} cmds)`;
    logger.info(`[Health Check] ✅ Redis: Connected (${dbSize} keys cached, ${totalCommands} total commands)`);
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
router.get('/health/details', async (_req: Request, res: Response): Promise<void> => {
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

/**
 * Redis cache statistics endpoint
 */
router.get('/health/redis', async (_req: Request, res: Response): Promise<void> => {
  try {
    // Check connection
    const pingResult = await redisClient.ping();

    // Get Redis info sections
    const statsInfo = await redisClient.info('stats');
    const memoryInfo = await redisClient.info('memory');
    const clientsInfo = await redisClient.info('clients');

    // Get database size
    const dbSize = await redisClient.dbsize();

    // Sample some cache keys to show what's cached
    const allKeys = await redisClient.keys('*');
    const sampleKeys = allKeys.slice(0, 20); // First 20 keys as sample

    // Group keys by type
    const keysByType: Record<string, number> = {};
    for (const key of allKeys) {
      const prefix = key.split(':')[0];
      keysByType[prefix] = (keysByType[prefix] || 0) + 1;
    }

    // Parse stats
    const parseInfo = (info: string) => {
      const lines = info.split('\r\n');
      const parsed: Record<string, string> = {};
      for (const line of lines) {
        if (line && !line.startsWith('#')) {
          const [key, value] = line.split(':');
          if (key && value) {
            parsed[key] = value;
          }
        }
      }
      return parsed;
    };

    const stats = parseInfo(statsInfo);
    const memory = parseInfo(memoryInfo);
    const clients = parseInfo(clientsInfo);

    const redisStatus = {
      status: 'connected',
      ping: pingResult,
      timestamp: new Date().toISOString(),

      cache: {
        totalKeys: dbSize,
        sampleKeys: sampleKeys,
        keysByType: keysByType,
      },

      stats: {
        totalConnectionsReceived: stats.total_connections_received || '0',
        totalCommandsProcessed: stats.total_commands_processed || '0',
        instantaneousOpsPerSec: stats.instantaneous_ops_per_sec || '0',
        totalNetInputBytes: stats.total_net_input_bytes || '0',
        totalNetOutputBytes: stats.total_net_output_bytes || '0',
        keyspaceHits: stats.keyspace_hits || '0',
        keyspaceMisses: stats.keyspace_misses || '0',
      },

      memory: {
        usedMemory: memory.used_memory_human || '0',
        usedMemoryPeak: memory.used_memory_peak_human || '0',
        totalSystemMemory: memory.total_system_memory_human || '0',
        maxmemory: memory.maxmemory_human || '0',
      },

      clients: {
        connectedClients: clients.connected_clients || '0',
        blockedClients: clients.blocked_clients || '0',
      },
    };

    // Calculate cache hit rate
    const hits = parseInt(stats.keyspace_hits || '0');
    const misses = parseInt(stats.keyspace_misses || '0');
    const total = hits + misses;
    const hitRate = total > 0 ? ((hits / total) * 100).toFixed(2) : '0.00';

    logger.info(`[Redis Stats] Keys: ${dbSize}, Hit Rate: ${hitRate}%, Commands: ${stats.total_commands_processed}`);

    res.status(200).json({
      ...redisStatus,
      performance: {
        cacheHitRate: `${hitRate}%`,
        totalRequests: total,
      },
    });
  } catch (error: any) {
    logger.error('[Redis Stats] Failed to get Redis statistics:', error);
    res.status(500).json({
      status: 'error',
      error: 'Failed to get Redis statistics',
      message: error.message,
    });
  }
});

export default router;

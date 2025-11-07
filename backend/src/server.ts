import http from 'http';
import app from './app';
import config from './config';
import logger from './utils/logger';
import { initializeDatabase } from './services/database.service';
import { startBlockchainIndexer } from './services/indexer.service';
import { websocketService } from './services/websocket.service';
import { ohlcvAggregatorService } from './services/ohlcv-aggregator.service';
import { holderUpdaterService } from './services/holder-updater.service';
import { cacheWarmerService } from './services/cache-warmer.service';
import { tokenStatsUpdaterService } from './services/token-stats-updater.service';
import { offlineFallbackService } from './services/offline-fallback.service';

const server = http.createServer(app);

async function startServer(): Promise<void> {
  try {
    logger.info('');
    logger.info('========================================');
    logger.info('🚀 ASTER FUN Backend Server Starting...');
    logger.info('========================================');
    logger.info('');

    // Initialize database connections
    logger.info('📊 [1/7] Initializing database connections...');
    await initializeDatabase();
    logger.info('✅ [1/7] Database connections established');
    logger.info('');

    // Initialize offline fallback service
    logger.info('🔌 [1.5/7] Initializing offline fallback service...');
    await offlineFallbackService.initialize();
    logger.info('✅ [1.5/7] Offline fallback service initialized');
    logger.info('');

    // Initialize WebSocket server
    logger.info('🔌 [2/7] Initializing WebSocket server...');
    websocketService.initialize(server);
    logger.info('✅ [2/7] WebSocket server initialized');
    logger.info('');

    // Start blockchain indexer
    logger.info('⛓️  [3/7] Starting blockchain indexer...');
    logger.info(`    RPC: ${config.bscTestnetRpc}`);
    await startBlockchainIndexer();
    logger.info('✅ [3/7] Blockchain indexer started');
    logger.info('');

    // Start background services
    logger.info('⚙️  [4/7] Starting background services...');

    // Start OHLCV Aggregation Service
    logger.info('    📈 Starting OHLCV Aggregation Service...');
    ohlcvAggregatorService.start();
    logger.info('    ✅ OHLCV Aggregation Service started');

    // Start Holder Balance Updater Service
    logger.info('    👥 Starting Holder Balance Updater Service...');
    holderUpdaterService.start();
    logger.info('    ✅ Holder Balance Updater Service started');

    // Start Cache Warming Service
    logger.info('    🔥 Starting Cache Warming Service...');
    cacheWarmerService.start();
    logger.info('    ✅ Cache Warming Service started');

    // Start Token Stats Updater Service
    logger.info('    📊 Starting Token Stats Updater Service...');
    tokenStatsUpdaterService.start();
    logger.info('    ✅ Token Stats Updater Service started');

    logger.info('✅ [4/7] All background services started successfully');
    logger.info('');

    // Start HTTP server
    logger.info('🌐 [5/7] Starting HTTP server...');
    server.listen(config.port, config.host, () => {
      logger.info('✅ [5/7] HTTP server started');
      logger.info('');
      logger.info('========================================');
      logger.info(`🎉 Server Status: READY`);
      logger.info(`📍 URL: http://${config.host}:${config.port}`);
      logger.info(`🌍 Environment: ${config.nodeEnv}`);
      logger.info(`📊 Health Check: http://${config.host}:${config.port}/health`);
      logger.info(`📈 Detailed Status: http://${config.host}:${config.port}/health/details`);
      logger.info('========================================');
      logger.info('');
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
const gracefulShutdown = async (signal: string) => {
  logger.info(`${signal} signal received: shutting down gracefully`);

  // Stop background services
  logger.info('Stopping background services...');
  ohlcvAggregatorService.stop();
  holderUpdaterService.stop();
  cacheWarmerService.stop();
  tokenStatsUpdaterService.stop();
  logger.info('Background services stopped');

  // Close HTTP server
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });

  // Force close after 10 seconds
  setTimeout(() => {
    logger.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

startServer();

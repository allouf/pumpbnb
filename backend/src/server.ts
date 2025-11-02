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

const server = http.createServer(app);

async function startServer(): Promise<void> {
  try {
    // Initialize database connections
    logger.info('Initializing database connections...');
    await initializeDatabase();
    logger.info('Database connections established');

    // Initialize WebSocket server
    logger.info('Initializing WebSocket server...');
    websocketService.initialize(server);
    logger.info('WebSocket server initialized');

    // Start blockchain indexer
    logger.info('Starting blockchain indexer...');
    await startBlockchainIndexer();
    logger.info('Blockchain indexer started');

    // Start background services
    logger.info('Starting background services...');

    // Start OHLCV Aggregation Service
    ohlcvAggregatorService.start();
    logger.info('OHLCV Aggregation Service started');

    // Start Holder Balance Updater Service
    holderUpdaterService.start();
    logger.info('Holder Balance Updater Service started');

    // Start Cache Warming Service
    cacheWarmerService.start();
    logger.info('Cache Warming Service started');

    logger.info('All background services started successfully');

    // Start HTTP server
    server.listen(config.port, config.host, () => {
      logger.info(`Server running on http://${config.host}:${config.port}`);
      logger.info(`Environment: ${config.nodeEnv}`);
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

import http from 'http';
import app from './app';
import config from './config';
import logger from './utils/logger';
import { initializeDatabase } from './services/database.service';
import { startBlockchainIndexer } from './services/indexer.service';
import { websocketService } from './services/websocket.service';

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
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

// Unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

startServer();

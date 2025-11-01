import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import config from './config';
import { errorHandler } from './middleware/errorHandler';
import { apiLimiter } from './middleware/rateLimit';
import logger from './utils/logger';

// Import routes
import configRoutes from './routes/config.routes';
import tokenRoutes from './routes/token.routes';
import tradeRoutes from './routes/trade.routes';
import userRoutes from './routes/user.routes';
import ipfsRoutes from './routes/ipfs.routes';
import adminRoutes from './routes/admin.routes';
import indexerRoutes from './routes/indexer.routes';

const app: Application = express();

// Trust proxy - required for Render to properly handle X-Forwarded-For header
app.set('trust proxy', 1);

// Security middleware
app.use(helmet());
app.use(
  cors({
    origin: config.corsOrigin,
    credentials: true,
  })
);

// Logging middleware
app.use(
  morgan('combined', {
    stream: {
      write: (message: string) => logger.http(message.trim()),
    },
  })
);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
app.use('/api', apiLimiter);

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// API routes
app.use('/api/config', configRoutes);
app.use('/api/tokens', tokenRoutes);
app.use('/api/trades', tradeRoutes);
app.use('/api/users', userRoutes);
app.use('/api/ipfs', ipfsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/indexer', indexerRoutes);

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

export default app;

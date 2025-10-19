import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

// Import routes
import authRoutes from './routes/auth';
import tokenRoutes from './routes/tokens';
import userRoutes from './routes/users';
import commentRoutes from './routes/comments';
import tradingRoutes from './routes/trading';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet());

// CORS configuration - allow both local and production frontend URLs
const allowedOrigins: string[] = [
  process.env.FRONTEND_URL || 'http://localhost:3000',
  'http://localhost:3001',
  'https://pumpbnb.netlify.app',
  'https://pumpbnb.onrender.com',
  process.env.FRONTEND_URL_PRODUCTION,
].filter((origin): origin is string => Boolean(origin)); // Remove undefined values

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs (increased for development)
  message: 'Too many requests from this IP, please try again later.',
  skip: (req) => process.env.NODE_ENV === 'development', // Skip rate limiting in development
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging middleware
app.use(morgan('combined'));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/tokens', tokenRoutes);
app.use('/api/users', userRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/trading', tradingRoutes);

// API health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Root API endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to PumpBNB API',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      tokens: '/api/tokens',
      users: '/api/users',
      comments: '/api/comments',
      trading: '/api/trading',
    },
    documentation: 'See API_REFERENCE.md for detailed documentation',
  });
});

// API index endpoint
app.get('/api', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'PumpBNB API v1.0.0',
    status: 'operational',
    endpoints: {
      health: '/api/health',
      auth: {
        register: 'POST /api/auth/register',
        login: 'POST /api/auth/login',
        wallet: 'POST /api/auth/wallet',
        profile: 'GET /api/auth/profile',
      },
      tokens: {
        list: 'GET /api/tokens',
        trending: 'GET /api/tokens/trending',
        details: 'GET /api/tokens/:id',
        create: 'POST /api/tokens',
        update: 'PUT /api/tokens/:id',
      },
      users: 'GET /api/users',
      comments: 'GET /api/comments',
      trading: 'GET /api/trading',
    },
  });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error',
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found`,
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 PumpBNB API Server running on port ${PORT}`);
  console.log(`📱 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;
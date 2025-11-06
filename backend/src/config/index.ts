import dotenv from 'dotenv';

dotenv.config();

export const config = {
  // Server
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3001', 10),
  host: process.env.HOST || 'localhost',

  // Database
  databaseUrl: process.env.DATABASE_URL || '',
  mongodbUri: process.env.MONGODB_URI || '',
  redisUrl: process.env.REDIS_URL || '',

  // Blockchain
  bscTestnetRpc: process.env.BSC_TESTNET_RPC || 'https://bsc-testnet-rpc.publicnode.com',
  bscMainnetRpc: process.env.BSC_MAINNET_RPC || 'https://bsc-dataseed1.binance.org',
  chainId: parseInt(process.env.CHAIN_ID || '97', 10),

  // Contracts
  tokenFactoryAddress: process.env.TOKEN_FACTORY_ADDRESS || '',
  graduationManagerAddress: process.env.GRADUATION_MANAGER_ADDRESS || '',
  platformConfigAddress: process.env.PLATFORM_CONFIG_ADDRESS || '',
  asterTokenAddress: process.env.ASTER_TOKEN_ADDRESS || '',
  sampleTokenAddress: process.env.SAMPLE_TOKEN_ADDRESS || '',

  // IPFS
  pinata: {
    apiKey: process.env.PINATA_API_KEY || '',
    secretKey: process.env.PINATA_SECRET_KEY || '',
    jwt: process.env.PINATA_JWT || '',
  },

  // JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'default-secret-change-me',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },

  // Rate Limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10), // 1 minute window
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '1000', 10), // 1000 requests per minute
  },

  // CORS
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',

  // Logging
  logLevel: process.env.LOG_LEVEL || 'info',
} as const;

export default config;

import { PrismaClient } from '@prisma/client';
import { MongoClient, Db } from 'mongodb';
import Redis from 'ioredis';
import config from '../config';
import logger from '../utils/logger';

// PostgreSQL (Prisma)
export const prisma = new PrismaClient({
  log: config.nodeEnv === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

// MongoDB
let mongoDb: Db | null = null;
let mongoClient: MongoClient | null = null;

// Redis
export let redis: Redis | null = null;

export async function initializeDatabase(): Promise<void> {
  try {
    // Connect to PostgreSQL via Prisma
    await prisma.$connect();
    logger.info('PostgreSQL connected via Prisma');

    // Connect to MongoDB
    if (config.mongodbUri) {
      mongoClient = new MongoClient(config.mongodbUri);
      await mongoClient.connect();
      mongoDb = mongoClient.db();
      logger.info('MongoDB connected');
    } else {
      logger.warn('MongoDB URI not configured');
    }

    // Connect to Redis
    if (config.redisUrl) {
      redis = new Redis(config.redisUrl, {
        retryStrategy: (times) => {
          const delay = Math.min(times * 50, 2000);
          return delay;
        },
        maxRetriesPerRequest: 3,
      });

      redis.on('connect', () => logger.info('Redis connected'));
      redis.on('error', (err) => logger.error('Redis error:', err));
    } else {
      logger.warn('Redis URL not configured');
    }
  } catch (error) {
    logger.error('Database initialization failed:', error);
    throw error;
  }
}

export async function closeDatabase(): Promise<void> {
  try {
    await prisma.$disconnect();
    if (mongoClient) await mongoClient.close();
    if (redis) redis.disconnect();
    logger.info('Database connections closed');
  } catch (error) {
    logger.error('Error closing database connections:', error);
    throw error;
  }
}

export function getMongoDb(): Db {
  if (!mongoDb) {
    throw new Error('MongoDB not initialized');
  }
  return mongoDb;
}

export { prisma, redis };

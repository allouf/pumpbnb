import { PrismaClient } from '@prisma/client';
import logger from '../utils/logger';

// Singleton Prisma client instance
class DatabaseService {
  private static instance: DatabaseService;
  public prisma: PrismaClient;

  private constructor() {
    this.prisma = new PrismaClient({
      log: process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
      errorFormat: 'minimal',
    });

    // Connection lifecycle logging
    this.prisma.$connect()
      .then(() => logger.info('✅ PostgreSQL connected'))
      .catch((error) => logger.error('❌ PostgreSQL connection failed:', error));
  }

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  public async disconnect(): Promise<void> {
    await this.prisma.$disconnect();
    logger.info('PostgreSQL disconnected');
  }

  public async healthCheck(): Promise<boolean> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      logger.error('Database health check failed:', error);
      return false;
    }
  }
}

export const dbService = DatabaseService.getInstance();
export const prisma = dbService.prisma;
export default dbService;

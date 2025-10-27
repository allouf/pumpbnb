import rateLimit from 'express-rate-limit';
// import RedisStore from 'rate-limit-redis'; // Temporarily disabled
import Redis from 'ioredis';
import config from '../config';
import logger from '../utils/logger';

let redis: Redis | undefined;

try {
  redis = new Redis(config.redisUrl);
  redis.on('error', (err) => logger.error('Redis Client Error:', err));
} catch (error) {
  logger.warn('Redis not available, using memory store for rate limiting');
}

export const apiLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  // Redis store temporarily disabled due to type issues
  // Will use in-memory store for now
  // ...(redis && {
  //   store: new RedisStore({
  //     client: redis as any,
  //     prefix: 'rl:',
  //   }),
  // }),
});

export const strictLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: Math.floor(config.rateLimit.maxRequests / 2),
  message: 'Rate limit exceeded for this endpoint.',
  standardHeaders: true,
  legacyHeaders: false,
  // Redis store temporarily disabled due to type issues
  // Will use in-memory store for now
  // ...(redis && {
  //   store: new RedisStore({
  //     client: redis as any,
  //     prefix: 'rl:strict:',
  //   }),
  // }),
});

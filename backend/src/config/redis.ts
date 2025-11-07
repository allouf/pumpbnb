import Redis from 'ioredis';

// Main Redis client for general caching
export const redisClient = process.env.REDIS_URL
  ? new Redis(process.env.REDIS_URL, {
      retryStrategy: (times: number) => {
        if (times > 3) {
          console.warn('⚠️ Redis connection failed after 3 attempts, continuing without cache');
          return null; // Stop retrying
        }
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      maxRetriesPerRequest: 3,
      lazyConnect: true, // Don't block startup on Redis connection
      enableReadyCheck: false,
      connectTimeout: 5000, // 5 second timeout
    })
  : new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      db: parseInt(process.env.REDIS_DB || '0'),
      retryStrategy: (times: number) => {
        if (times > 3) return null;
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      maxRetriesPerRequest: 3,
      lazyConnect: true,
      connectTimeout: 5000,
    });

// Separate client for pub/sub (Socket.io adapter)
export const redisPubClient = process.env.REDIS_URL
  ? new Redis(process.env.REDIS_URL, {
      retryStrategy: (times: number) => (times > 3 ? null : Math.min(times * 50, 2000)),
      maxRetriesPerRequest: 3,
      lazyConnect: true,
      connectTimeout: 5000,
    })
  : new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      db: parseInt(process.env.REDIS_DB || '0'),
      retryStrategy: (times: number) => (times > 3 ? null : Math.min(times * 50, 2000)),
      maxRetriesPerRequest: 3,
      lazyConnect: true,
      connectTimeout: 5000,
    });

export const redisSubClient = process.env.REDIS_URL
  ? new Redis(process.env.REDIS_URL, {
      retryStrategy: (times: number) => (times > 3 ? null : Math.min(times * 50, 2000)),
      maxRetriesPerRequest: 3,
      lazyConnect: true,
      connectTimeout: 5000,
    })
  : new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      db: parseInt(process.env.REDIS_DB || '0'),
      retryStrategy: (times: number) => (times > 3 ? null : Math.min(times * 50, 2000)),
      maxRetriesPerRequest: 3,
      lazyConnect: true,
      connectTimeout: 5000,
    });

// Handle connection events
redisClient.on('connect', () => {
  console.log('✅ Redis client connected');
});

redisClient.on('error', (err) => {
  console.error('❌ Redis client error:', err);
});

// Keep Redis connection alive with periodic pings (every 5 minutes)
setInterval(async () => {
  try {
    await redisClient.ping();
  } catch (error) {
    console.warn('⚠️ Redis keepalive ping failed:', error);
  }
}, 5 * 60 * 1000); // 5 minutes

redisPubClient.on('connect', () => {
  console.log('✅ Redis pub client connected');
});

redisSubClient.on('connect', () => {
  console.log('✅ Redis sub client connected');
});

// Cache helper functions with graceful fallback
export const cache = {
  /**
   * Get cached data
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const data = await redisClient.get(key);
      if (!data) return null;
      return JSON.parse(data) as T;
    } catch (error) {
      console.warn(`⚠️ Redis get failed for key ${key}, returning null:`, error);
      return null;
    }
  },

  /**
   * Set cached data with optional TTL (in seconds)
   */
  async set(key: string, value: any, ttl?: number): Promise<void> {
    try {
      const serialized = JSON.stringify(value);
      if (ttl) {
        await redisClient.setex(key, ttl, serialized);
      } else {
        await redisClient.set(key, serialized);
      }
    } catch (error) {
      console.warn(`⚠️ Redis set failed for key ${key}, continuing without cache:`, error);
    }
  },

  /**
   * Delete cached data
   */
  async del(key: string): Promise<void> {
    try {
      await redisClient.del(key);
    } catch (error) {
      console.warn(`⚠️ Redis del failed for key ${key}:`, error);
    }
  },

  /**
   * Delete all keys matching pattern
   */
  async delPattern(pattern: string): Promise<void> {
    try {
      const keys = await redisClient.keys(pattern);
      if (keys.length > 0) {
        await redisClient.del(...keys);
      }
    } catch (error) {
      console.warn(`⚠️ Redis delPattern failed for pattern ${pattern}:`, error);
    }
  },

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    try {
      const result = await redisClient.exists(key);
      return result === 1;
    } catch (error) {
      console.warn(`⚠️ Redis exists failed for key ${key}:`, error);
      return false;
    }
  },

  /**
   * Increment counter
   */
  async incr(key: string, ttl?: number): Promise<number> {
    try {
      const result = await redisClient.incr(key);
      if (ttl && result === 1) {
        await redisClient.expire(key, ttl);
      }
      return result;
    } catch (error) {
      console.warn(`⚠️ Redis incr failed for key ${key}:`, error);
      return 0;
    }
  },

  /**
   * Get multiple keys
   */
  async mget<T>(keys: string[]): Promise<(T | null)[]> {
    try {
      if (keys.length === 0) return [];
      const values = await redisClient.mget(keys);
      return values.map((v) => (v ? JSON.parse(v) as T : null));
    } catch (error) {
      console.warn(`⚠️ Redis mget failed:`, error);
      return keys.map(() => null);
    }
  },

  /**
   * Set multiple keys
   */
  async mset(data: Record<string, any>, ttl?: number): Promise<void> {
    try {
      const pairs: string[] = [];
      for (const [key, value] of Object.entries(data)) {
        pairs.push(key, JSON.stringify(value));
      }
      await redisClient.mset(pairs);

      if (ttl) {
        for (const key of Object.keys(data)) {
          await redisClient.expire(key, ttl);
        }
      }
    } catch (error) {
      console.warn(`⚠️ Redis mset failed:`, error);
    }
  },
};

// Cache key generators
export const cacheKeys = {
  token: (address: string) => `token:${address.toLowerCase()}`,
  tokenStats: (address: string) => `token:stats:${address.toLowerCase()}`,
  tokenHolders: (address: string) => `token:holders:${address.toLowerCase()}`,
  tokenTrades: (address: string, limit: number) => `token:trades:${address.toLowerCase()}:${limit}`,
  tokenComments: (address: string, limit: number) => `token:comments:${address.toLowerCase()}:${limit}`,
  ohlcv: (address: string, timeframe: string, from: number, to: number) =>
    `ohlcv:${address.toLowerCase()}:${timeframe}:${from}:${to}`,
  userSession: (address: string) => `session:${address.toLowerCase()}`,
  userNonce: (address: string) => `nonce:${address.toLowerCase()}`,
  rateLimit: (identifier: string, window: string) => `ratelimit:${window}:${identifier}`,
};

export default redisClient;

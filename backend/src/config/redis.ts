import Redis from 'ioredis';

// Support both REDIS_URL (Render default) and individual env vars
const redisConfig = process.env.REDIS_URL
  ? process.env.REDIS_URL // Use connection string if available (Render format)
  : {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      db: parseInt(process.env.REDIS_DB || '0'),
      retryStrategy: (times: number) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      maxRetriesPerRequest: 3,
    };

// Main Redis client for general caching
export const redisClient = new Redis(redisConfig);

// Separate client for pub/sub (Socket.io adapter)
export const redisPubClient = new Redis(redisConfig);
export const redisSubClient = new Redis(redisConfig);

// Handle connection events
redisClient.on('connect', () => {
  console.log('✅ Redis client connected');
});

redisClient.on('error', (err) => {
  console.error('❌ Redis client error:', err);
});

redisPubClient.on('connect', () => {
  console.log('✅ Redis pub client connected');
});

redisSubClient.on('connect', () => {
  console.log('✅ Redis sub client connected');
});

// Cache helper functions
export const cache = {
  /**
   * Get cached data
   */
  async get<T>(key: string): Promise<T | null> {
    const data = await redisClient.get(key);
    if (!data) return null;
    return JSON.parse(data) as T;
  },

  /**
   * Set cached data with optional TTL (in seconds)
   */
  async set(key: string, value: any, ttl?: number): Promise<void> {
    const serialized = JSON.stringify(value);
    if (ttl) {
      await redisClient.setex(key, ttl, serialized);
    } else {
      await redisClient.set(key, serialized);
    }
  },

  /**
   * Delete cached data
   */
  async del(key: string): Promise<void> {
    await redisClient.del(key);
  },

  /**
   * Delete all keys matching pattern
   */
  async delPattern(pattern: string): Promise<void> {
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      await redisClient.del(...keys);
    }
  },

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    const result = await redisClient.exists(key);
    return result === 1;
  },

  /**
   * Increment counter
   */
  async incr(key: string, ttl?: number): Promise<number> {
    const result = await redisClient.incr(key);
    if (ttl && result === 1) {
      await redisClient.expire(key, ttl);
    }
    return result;
  },

  /**
   * Get multiple keys
   */
  async mget<T>(keys: string[]): Promise<(T | null)[]> {
    if (keys.length === 0) return [];
    const values = await redisClient.mget(keys);
    return values.map((v) => (v ? JSON.parse(v) as T : null));
  },

  /**
   * Set multiple keys
   */
  async mset(data: Record<string, any>, ttl?: number): Promise<void> {
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

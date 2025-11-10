// Redis client setup for token blacklisting and session management

import { createClient, type RedisClientType } from 'redis';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

export const redis: RedisClientType = createClient({
  url: redisUrl,
});

redis.on('error', (err) => {
  // eslint-disable-next-line no-console
  console.error('Redis Client Error:', err);
});

// Connect to Redis - using top-level await requires module type
await redis.connect().catch((error) => {
  // eslint-disable-next-line no-console
  console.error('Failed to connect to Redis:', error);
});

export default redis;

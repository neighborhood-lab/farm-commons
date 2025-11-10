// Redis client connection for session management and caching

import { createClient } from 'redis';
import pino from 'pino';

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: process.env.NODE_ENV === 'development' ? {
    target: 'pino-pretty',
    options: {
      colorize: true,
    },
  } : undefined,
});

// Redis client configuration
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

// Create Redis client
const redisClient = createClient({
  url: redisUrl,
  socket: {
    reconnectStrategy: (retries) => {
      if (retries > 10) {
        logger.error('Redis reconnection failed after 10 attempts');
        return new Error('Redis reconnection limit exceeded');
      }
      // Exponential backoff: 100ms, 200ms, 400ms, etc.
      return Math.min(retries * 100, 3000);
    },
  },
});

// Error handling
redisClient.on('error', (err) => {
  logger.error({ err }, 'Redis client error');
});

redisClient.on('connect', () => {
  logger.info('Redis client connected');
});

redisClient.on('reconnecting', () => {
  logger.warn('Redis client reconnecting');
});

redisClient.on('ready', () => {
  logger.info('Redis client ready');
});

// Connect to Redis
let isConnecting = false;
let isConnected = false;

export async function connectRedis(): Promise<void> {
  if (isConnected || isConnecting) {
    return;
  }

  isConnecting = true;
  try {
    await redisClient.connect();
    isConnected = true;
    logger.info('Successfully connected to Redis');
  } catch (error) {
    logger.error({ error }, 'Failed to connect to Redis');
    isConnected = false;
    throw error;
  } finally {
    isConnecting = false;
  }
}

// Graceful disconnect
export async function disconnectRedis(): Promise<void> {
  if (!isConnected) {
    return;
  }

  try {
    await redisClient.quit();
    isConnected = false;
    logger.info('Redis client disconnected');
  } catch (error) {
    logger.error({ error }, 'Error disconnecting Redis client');
    throw error;
  }
}

// Export the client
export default redisClient;

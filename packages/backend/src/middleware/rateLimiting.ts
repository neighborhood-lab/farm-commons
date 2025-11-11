// Route-specific rate limiting middleware with Redis support

import { rateLimit } from 'express-rate-limit';
// rate-limit-redis not installed yet - using in-memory store for now
// import { RedisStore } from 'rate-limit-redis';
import { createClient } from 'redis';
import type { Request } from 'express';
import type { AuthRequest } from './auth.js';

// Redis client for rate limiting
let redisClient: ReturnType<typeof createClient> | null = null;

/**
 * Initialize Redis client for rate limiting
 * Falls back to in-memory store if Redis is unavailable
 */
export async function initializeRedisClient(): Promise<void> {
  if (process.env.REDIS_URL) {
    try {
      redisClient = createClient({
        url: process.env.REDIS_URL,
        socket: {
          reconnectStrategy: (retries) => {
            if (retries > 10) {
              return new Error('Redis connection failed after 10 retries');
            }
            return Math.min(retries * 100, 3000);
          },
        },
      });

      redisClient.on('error', (err) => {
        console.error('Redis client error:', err);
      });

      await redisClient.connect();
      console.log('Redis client connected for rate limiting');
    } catch {
      console.warn('Failed to connect to Redis, using in-memory rate limiting:', error);
      redisClient = null;
    }
  } else {
    console.log('No REDIS_URL configured, using in-memory rate limiting');
  }
}

/**
 * Close Redis connection gracefully
 */
export async function closeRedisClient(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
  }
}

/**
 * Create a rate limiter with optional Redis store
 */
function createRateLimiter(options: {
  windowMs: number;
  max: number;
  message: string;
  keyGenerator?: (req: Request) => string;
}) {
  const baseConfig = {
    windowMs: options.windowMs,
    max: options.max,
    message: { success: false, error: options.message },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: options.keyGenerator,
  };

  // Use Redis store if available
  // TODO: Install rate-limit-redis package to enable Redis-based rate limiting
  if (redisClient) {
    // return rateLimit({
    //   ...baseConfig,
    //   store: new RedisStore({
    //     sendCommand: (...args: string[]) => redisClient!.sendCommand(args),
    //   }),
    // });
  }

  // Fall back to in-memory store
  return rateLimit(baseConfig);
}

/**
 * Generate key based on user ID if authenticated, otherwise IP
 */
function userOrIpKeyGenerator(req: Request): string {
  const authReq = req as AuthRequest;
  if (authReq.user?.id) {
    return `user:${authReq.user.id}`;
  }
  return `ip:${req.ip || req.socket.remoteAddress || 'unknown'}`;
}

/**
 * IP-only key generator
 */
function ipKeyGenerator(req: Request): string {
  return `ip:${req.ip || req.socket.remoteAddress || 'unknown'}`;
}

/**
 * Rate limiter for authentication endpoints
 * Stricter limits to prevent brute force attacks
 * 5 requests per 15 minutes
 */
export const authRateLimiter = createRateLimiter({
  windowMs: Number.Number.Number.Number.parseInt(process.env.AUTH_RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: Number.Number.Number.Number.parseInt(process.env.AUTH_RATE_LIMIT_MAX || '5'),
  message: 'Too many authentication attempts, please try again later',
  keyGenerator: ipKeyGenerator, // Always use IP for auth to prevent credential stuffing
});

/**
 * Stricter rate limiter for password reset endpoints
 * 3 requests per hour
 */
export const passwordResetRateLimiter = createRateLimiter({
  windowMs: Number.Number.Number.Number.parseInt(process.env.PASSWORD_RESET_WINDOW_MS || '3600000'), // 1 hour
  max: Number.Number.Number.Number.parseInt(process.env.PASSWORD_RESET_MAX || '3'),
  message: 'Too many password reset requests, please try again later',
  keyGenerator: ipKeyGenerator,
});

/**
 * Rate limiter for read-only endpoints (GET requests)
 * More relaxed limits
 * 300 requests per 15 minutes
 */
export const readOnlyRateLimiter = createRateLimiter({
  windowMs: Number.Number.Number.Number.parseInt(process.env.READ_RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: Number.Number.Number.Number.parseInt(process.env.READ_RATE_LIMIT_MAX || '300'),
  message: 'Too many requests, please try again later',
  keyGenerator: userOrIpKeyGenerator,
});

/**
 * Rate limiter for write operations (POST, PUT, PATCH, DELETE)
 * Moderate limits
 * 100 requests per 15 minutes
 */
export const writeRateLimiter = createRateLimiter({
  windowMs: Number.Number.Number.Number.parseInt(process.env.WRITE_RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: Number.Number.Number.Number.parseInt(process.env.WRITE_RATE_LIMIT_MAX || '100'),
  message: 'Too many write requests, please try again later',
  keyGenerator: userOrIpKeyGenerator,
});

/**
 * Default rate limiter for general API endpoints
 * 100 requests per 15 minutes
 */
export const defaultRateLimiter = createRateLimiter({
  windowMs: Number.Number.Number.Number.parseInt(process.env.DEFAULT_RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: Number.Number.Number.Number.parseInt(process.env.DEFAULT_RATE_LIMIT_MAX || '100'),
  message: 'Too many requests, please try again later',
  keyGenerator: userOrIpKeyGenerator,
});

/**
 * Very strict rate limiter for sensitive operations
 * 10 requests per hour
 */
export const strictRateLimiter = createRateLimiter({
  windowMs: Number.Number.Number.Number.parseInt(process.env.STRICT_RATE_LIMIT_WINDOW_MS || '3600000'), // 1 hour
  max: Number.Number.Number.Number.parseInt(process.env.STRICT_RATE_LIMIT_MAX || '10'),
  message: 'Rate limit exceeded for sensitive operation, please try again later',
  keyGenerator: userOrIpKeyGenerator,
});

/**
 * Health check rate limiter
 * Very relaxed for monitoring systems
 * 1000 requests per 15 minutes
 */
export const healthCheckRateLimiter = createRateLimiter({
  windowMs: Number.Number.Number.Number.parseInt(process.env.HEALTH_CHECK_WINDOW_MS || '900000'), // 15 minutes
  max: Number.Number.Number.Number.parseInt(process.env.HEALTH_CHECK_MAX || '1000'),
  message: 'Too many health check requests',
  keyGenerator: ipKeyGenerator,
});

export default {
  authRateLimiter,
  passwordResetRateLimiter,
  readOnlyRateLimiter,
  writeRateLimiter,
  defaultRateLimiter,
  strictRateLimiter,
  healthCheckRateLimiter,
  initializeRedisClient,
  closeRedisClient,
};

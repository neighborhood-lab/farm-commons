// API Response Caching Middleware
import type { Request, Response, NextFunction } from 'express';
import { redisClient } from '../lib/redis.js';
import pino from 'pino';

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  name: 'cache',
});

// Cache statistics for monitoring
export const cacheStats = {
  hits: 0,
  misses: 0,
  errors: 0,
  lastReset: new Date(),
};

export interface CacheOptions {
  /** Cache TTL in seconds (default: 300 = 5 minutes) */
  ttl?: number;
  /** Custom cache key generator function */
  keyGenerator?: (req: Request) => string;
  /** Whether to cache only successful responses (2xx status codes) */
  onlySuccessful?: boolean;
  /** Prefix for cache keys */
  prefix?: string;
  /** Whether to skip caching if query params exist */
  skipQueryParams?: string[];
}

/**
 * Generate a cache key from the request
 */
export function generateCacheKey(req: Request, prefix = 'api'): string {
  const { method, originalUrl, user } = req as any;
  const userId = user?.id || 'anonymous';

  // Include method, URL, and user ID in cache key
  const key = `${prefix}:${method}:${originalUrl}:${userId}`;
  return key;
}

/**
 * Cache middleware for API responses
 *
 * @example
 * // Cache for 5 minutes (default)
 * router.get('/api/workers', cache(), getWorkers);
 *
 * // Cache for 1 hour
 * router.get('/api/stats', cache({ ttl: 3600 }), getStats);
 *
 * // Custom key generator
 * router.get('/api/fields', cache({
 *   keyGenerator: (req) => `fields:farm:${req.user.farm_id}`
 * }), getFields);
 */
export function cache(options: CacheOptions = {}) {
  const {
    ttl = 300, // 5 minutes default
    keyGenerator = generateCacheKey,
    onlySuccessful = true,
    prefix = 'api',
    skipQueryParams = [],
  } = options;

  return async (req: Request, res: Response, next: NextFunction) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Skip caching if specified query params are present
    if (skipQueryParams.length > 0) {
      const hasSkipParam = skipQueryParams.some((param) => req.query[param]);
      if (hasSkipParam) {
        return next();
      }
    }

    try {
      // Generate cache key
      const cacheKey = keyGenerator(req);

      // Try to get cached response
      const cachedResponse = await redisClient.get(cacheKey);

      if (cachedResponse) {
        // Cache hit
        cacheStats.hits++;
        logger.debug({ cacheKey, source: 'cache' }, 'Cache hit');

        const parsed = JSON.parse(cachedResponse);
        res.setHeader('X-Cache', 'HIT');
        res.setHeader('X-Cache-Key', cacheKey);
        res.status(parsed.status || 200).json(parsed.data);
        return;
      }

      // Cache miss - intercept the response
      cacheStats.misses++;
      logger.debug({ cacheKey }, 'Cache miss');

      // Store the original json method
      const originalJson = res.json.bind(res);

      // Override the json method to cache the response
      res.json = function (data: any) {
        const statusCode = res.statusCode;

        // Only cache successful responses if configured
        if (!onlySuccessful || (statusCode >= 200 && statusCode < 300)) {
          // Cache the response asynchronously (don't block the response)
          const cacheData = {
            status: statusCode,
            data,
          };

          redisClient
            .setEx(cacheKey, ttl, JSON.stringify(cacheData))
            .then(() => {
              logger.debug({ cacheKey, ttl }, 'Response cached');
            })
            .catch((err) => {
              logger.error({ err, cacheKey }, 'Failed to cache response');
              cacheStats.errors++;
            });
        }

        // Set cache headers
        res.setHeader('X-Cache', 'MISS');
        res.setHeader('X-Cache-Key', cacheKey);

        // Call the original json method
        return originalJson(data);
      };

      next();
    } catch (error) {
      cacheStats.errors++;
      logger.error({ error }, 'Cache middleware error');
      // On error, continue without caching
      next();
    }
  };
}

/**
 * Invalidate cache entries by pattern
 *
 * @example
 * // Invalidate all worker-related cache entries
 * await invalidateCache('api:GET:/api/workers*');
 *
 * // Invalidate all cache entries for a specific user
 * await invalidateCache('*:user:123:*');
 */
export async function invalidateCache(pattern: string): Promise<number> {
  try {
    logger.info({ pattern }, 'Invalidating cache');

    let cursor = 0;
    let deletedCount = 0;

    do {
      // Scan for keys matching the pattern
      const result = await redisClient.scan(cursor, {
        MATCH: pattern,
        COUNT: 100,
      });

      cursor = result.cursor;
      const keys = result.keys;

      // Delete matched keys
      if (keys.length > 0) {
        const deleted = await redisClient.del(keys);
        deletedCount += deleted;
      }
    } while (cursor !== 0);

    logger.info({ pattern, deletedCount }, 'Cache invalidated');
    return deletedCount;
  } catch (error) {
    logger.error({ error, pattern }, 'Failed to invalidate cache');
    throw error;
  }
}

/**
 * Invalidate cache for a specific resource type
 *
 * @example
 * // After creating/updating/deleting a worker
 * await invalidateCacheByResource('workers');
 */
export async function invalidateCacheByResource(resource: string): Promise<number> {
  const pattern = `api:GET:/api/${resource}*`;
  return invalidateCache(pattern);
}

/**
 * Invalidate all cache entries
 */
export async function invalidateAllCache(): Promise<void> {
  try {
    await redisClient.flushDb();
    logger.info('All cache invalidated');
  } catch (error) {
    logger.error({ error }, 'Failed to invalidate all cache');
    throw error;
  }
}

/**
 * Get cache statistics
 */
export function getCacheStats() {
  const totalRequests = cacheStats.hits + cacheStats.misses;
  const hitRate = totalRequests > 0 ? (cacheStats.hits / totalRequests) * 100 : 0;
  const uptime = Date.now() - cacheStats.lastReset.getTime();

  return {
    hits: cacheStats.hits,
    misses: cacheStats.misses,
    errors: cacheStats.errors,
    total: totalRequests,
    hitRate: hitRate.toFixed(2) + '%',
    uptime: Math.floor(uptime / 1000), // seconds
    lastReset: cacheStats.lastReset.toISOString(),
  };
}

/**
 * Reset cache statistics
 */
export function resetCacheStats() {
  cacheStats.hits = 0;
  cacheStats.misses = 0;
  cacheStats.errors = 0;
  cacheStats.lastReset = new Date();
  logger.info('Cache statistics reset');
}

/**
 * Warm cache by pre-loading common queries
 *
 * @example
 * // Warm cache on server startup
 * await warmCache([
 *   { key: 'api:workers:all', fetcher: () => fetchAllWorkers() },
 *   { key: 'api:fields:all', fetcher: () => fetchAllFields() },
 * ]);
 */
export interface CacheWarmer {
  key: string;
  fetcher: () => Promise<any>;
  ttl?: number;
}

export async function warmCache(warmers: CacheWarmer[]): Promise<void> {
  logger.info({ count: warmers.length }, 'Warming cache');

  const results = await Promise.allSettled(
    warmers.map(async ({ key, fetcher, ttl = 300 }) => {
      try {
        const data = await fetcher();
        await redisClient.setEx(
          key,
          ttl,
          JSON.stringify({
            status: 200,
            data,
          })
        );
        logger.debug({ key, ttl }, 'Cache warmed');
      } catch (error) {
        logger.error({ error, key }, 'Failed to warm cache');
        throw error;
      }
    })
  );

  const successful = results.filter((r) => r.status === 'fulfilled').length;
  const failed = results.filter((r) => r.status === 'rejected').length;

  logger.info({ successful, failed, total: warmers.length }, 'Cache warming completed');
}

/**
 * Middleware to automatically invalidate cache on data mutations
 */
export function cacheInvalidator(resource: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Store the original json method
    const originalJson = res.json.bind(res);

    // Override json method to invalidate cache after successful mutations
    res.json = function (data: any) {
      const statusCode = res.statusCode;

      // Invalidate cache on successful mutations (2xx status codes)
      if (statusCode >= 200 && statusCode < 300) {
        // Invalidate asynchronously (don't block the response)
        invalidateCacheByResource(resource)
          .then((count) => {
            logger.info({ resource, count }, 'Cache invalidated after mutation');
          })
          .catch((err) => {
            logger.error({ err, resource }, 'Failed to invalidate cache after mutation');
          });
      }

      return originalJson(data);
    };

    next();
  };
}

// Cache middleware tests
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { Request, Response, NextFunction } from 'express';
import {
  cache,
  generateCacheKey,
  invalidateCache,
  invalidateCacheByResource,
  invalidateAllCache,
  getCacheStats,
  resetCacheStats,
  warmCache,
  cacheInvalidator,
  cacheStats,
} from '../cache.js';
import { redisClient } from '../../lib/redis.js';

// Mock Redis client
vi.mock('../../lib/redis.js', () => ({
  redisClient: {
    get: vi.fn(),
    setEx: vi.fn(),
    del: vi.fn(),
    scan: vi.fn(),
    flushDb: vi.fn(),
    connect: vi.fn(),
    quit: vi.fn(),
    on: vi.fn(),
  },
}));

// Mock pino logger
vi.mock('pino', () => ({
  default: () => ({
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  }),
}));

describe('Cache Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;
  let jsonMock: ReturnType<typeof vi.fn>;
  let statusMock: ReturnType<typeof vi.fn>;
  let setHeaderMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    resetCacheStats();

    // Setup mock request
    mockRequest = {
      method: 'GET',
      originalUrl: '/api/workers',
      query: {},
      user: { id: '123', role: 'admin' },
    } as any;

    // Setup mock response
    jsonMock = vi.fn().mockReturnThis();
    statusMock = vi.fn().mockReturnThis();
    setHeaderMock = vi.fn().mockReturnThis();

    mockResponse = {
      json: jsonMock,
      status: statusMock,
      statusCode: 200,
      setHeader: setHeaderMock,
    } as any;

    nextFunction = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('generateCacheKey', () => {
    it('should generate a cache key with method, URL, and user ID', () => {
      const key = generateCacheKey(mockRequest as Request);
      expect(key).toBe('api:GET:/api/workers:123');
    });

    it('should use anonymous for unauthenticated requests', () => {
      mockRequest.user = undefined;
      const key = generateCacheKey(mockRequest as Request);
      expect(key).toBe('api:GET:/api/workers:anonymous');
    });

    it('should use custom prefix', () => {
      const key = generateCacheKey(mockRequest as Request, 'custom');
      expect(key).toBe('custom:GET:/api/workers:123');
    });
  });

  describe('cache middleware', () => {
    it('should only cache GET requests', async () => {
      mockRequest.method = 'POST';

      const middleware = cache();
      await middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalled();
      expect(redisClient.get).not.toHaveBeenCalled();
    });

    it('should return cached response on cache hit', async () => {
      const cachedData = {
        status: 200,
        data: { users: [] },
      };

      vi.mocked(redisClient.get).mockResolvedValue(JSON.stringify(cachedData));

      const middleware = cache();
      await middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(redisClient.get).toHaveBeenCalledWith('api:GET:/api/workers:123');
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({ users: [] });
      expect(setHeaderMock).toHaveBeenCalledWith('X-Cache', 'HIT');
      expect(nextFunction).not.toHaveBeenCalled();
      expect(cacheStats.hits).toBe(1);
    });

    it('should cache response on cache miss', async () => {
      vi.mocked(redisClient.get).mockResolvedValue(null);
      vi.mocked(redisClient.setEx).mockResolvedValue('OK');

      const middleware = cache({ ttl: 600 });
      await middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(redisClient.get).toHaveBeenCalledWith('api:GET:/api/workers:123');
      expect(setHeaderMock).toHaveBeenCalledWith('X-Cache', 'MISS');
      expect(nextFunction).toHaveBeenCalled();
      expect(cacheStats.misses).toBe(1);

      // Simulate the response being sent
      const modifiedJson = (mockResponse.json as any);
      expect(typeof modifiedJson).toBe('function');
    });

    it('should use custom TTL', async () => {
      vi.mocked(redisClient.get).mockResolvedValue(null);
      vi.mocked(redisClient.setEx).mockResolvedValue('OK');

      const middleware = cache({ ttl: 3600 });
      await middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalled();

      // Call the overridden json method
      const responseData = { data: 'test' };
      await (mockResponse.json as any)(responseData);

      // Wait for async cache operation
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(redisClient.setEx).toHaveBeenCalledWith(
        'api:GET:/api/workers:123',
        3600,
        expect.any(String)
      );
    });

    it('should skip caching if specified query params are present', async () => {
      mockRequest.query = { nocache: 'true' };

      const middleware = cache({ skipQueryParams: ['nocache'] });
      await middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalled();
      expect(redisClient.get).not.toHaveBeenCalled();
    });

    it('should handle cache errors gracefully', async () => {
      vi.mocked(redisClient.get).mockRejectedValue(new Error('Redis error'));

      const middleware = cache();
      await middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalled();
      expect(cacheStats.errors).toBe(1);
    });

    it('should use custom key generator', async () => {
      const customKeyGenerator = vi.fn().mockReturnValue('custom:key:123');
      vi.mocked(redisClient.get).mockResolvedValue(null);

      const middleware = cache({ keyGenerator: customKeyGenerator });
      await middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(customKeyGenerator).toHaveBeenCalledWith(mockRequest);
      expect(redisClient.get).toHaveBeenCalledWith('custom:key:123');
    });

    it('should only cache successful responses when onlySuccessful is true', async () => {
      vi.mocked(redisClient.get).mockResolvedValue(null);
      vi.mocked(redisClient.setEx).mockResolvedValue('OK');

      mockResponse.statusCode = 500;

      const middleware = cache({ onlySuccessful: true });
      await middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalled();

      // Call the overridden json method with error status
      await (mockResponse.json as any)({ error: 'Internal error' });

      // Wait for async operation
      await new Promise(resolve => setTimeout(resolve, 10));

      // Should not cache error responses
      expect(redisClient.setEx).not.toHaveBeenCalled();
    });
  });

  describe('invalidateCache', () => {
    it('should invalidate cache by pattern', async () => {
      vi.mocked(redisClient.scan).mockResolvedValueOnce({
        cursor: 10,
        keys: ['key1', 'key2', 'key3'],
      } as any).mockResolvedValueOnce({
        cursor: 0,
        keys: ['key4'],
      } as any);

      vi.mocked(redisClient.del).mockResolvedValue(3).mockResolvedValue(1);

      const count = await invalidateCache('api:GET:/api/workers*');

      expect(count).toBe(4);
      expect(redisClient.scan).toHaveBeenCalledTimes(2);
      expect(redisClient.del).toHaveBeenCalledTimes(2);
    });

    it('should handle empty scan results', async () => {
      vi.mocked(redisClient.scan).mockResolvedValue({
        cursor: 0,
        keys: [],
      } as any);

      const count = await invalidateCache('api:GET:/api/nonexistent*');

      expect(count).toBe(0);
      expect(redisClient.del).not.toHaveBeenCalled();
    });

    it('should handle scan errors', async () => {
      vi.mocked(redisClient.scan).mockRejectedValue(new Error('Scan error'));

      await expect(invalidateCache('api:*')).rejects.toThrow('Scan error');
    });
  });

  describe('invalidateCacheByResource', () => {
    it('should invalidate cache for a specific resource', async () => {
      vi.mocked(redisClient.scan).mockResolvedValue({
        cursor: 0,
        keys: ['api:GET:/api/workers:123', 'api:GET:/api/workers/1:123'],
      } as any);
      vi.mocked(redisClient.del).mockResolvedValue(2);

      const count = await invalidateCacheByResource('workers');

      expect(count).toBe(2);
      expect(redisClient.scan).toHaveBeenCalled();
    });
  });

  describe('invalidateAllCache', () => {
    it('should clear all cache entries', async () => {
      vi.mocked(redisClient.flushDb).mockResolvedValue('OK');

      await invalidateAllCache();

      expect(redisClient.flushDb).toHaveBeenCalled();
    });

    it('should handle flush errors', async () => {
      vi.mocked(redisClient.flushDb).mockRejectedValue(new Error('Flush error'));

      await expect(invalidateAllCache()).rejects.toThrow('Flush error');
    });
  });

  describe('getCacheStats', () => {
    it('should return cache statistics', () => {
      cacheStats.hits = 75;
      cacheStats.misses = 25;
      cacheStats.errors = 2;

      const stats = getCacheStats();

      expect(stats.hits).toBe(75);
      expect(stats.misses).toBe(25);
      expect(stats.errors).toBe(2);
      expect(stats.total).toBe(100);
      expect(stats.hitRate).toBe('75.10%');
      expect(stats.uptime).toBeGreaterThanOrEqual(0);
    });

    it('should handle zero requests', () => {
      cacheStats.hits = 0;
      cacheStats.misses = 0;

      const stats = getCacheStats();

      expect(stats.hitRate).toBe('0.10%');
    });
  });

  describe('resetCacheStats', () => {
    it('should reset statistics', () => {
      cacheStats.hits = 100;
      cacheStats.misses = 50;
      cacheStats.errors = 5;

      resetCacheStats();

      expect(cacheStats.hits).toBe(0);
      expect(cacheStats.misses).toBe(0);
      expect(cacheStats.errors).toBe(0);
    });
  });

  describe('warmCache', () => {
    it('should warm cache with provided warmers', async () => {
      vi.mocked(redisClient.setEx).mockResolvedValue('OK');

      const warmers = [
        {
          key: 'api:workers:all',
          fetcher: vi.fn().mockResolvedValue({ data: 'workers' }),
          ttl: 600,
        },
        {
          key: 'api:fields:all',
          fetcher: vi.fn().mockResolvedValue({ data: 'fields' }),
          ttl: 300,
        },
      ];

      await warmCache(warmers);

      expect(warmers[0].fetcher).toHaveBeenCalled();
      expect(warmers[1].fetcher).toHaveBeenCalled();
      expect(redisClient.setEx).toHaveBeenCalledTimes(2);
    });

    it('should handle warmer errors gracefully', async () => {
      const warmers = [
        {
          key: 'api:workers:all',
          fetcher: vi.fn().mockResolvedValue({ data: 'workers' }),
        },
        {
          key: 'api:error:all',
          fetcher: vi.fn().mockRejectedValue(new Error('Fetch error')),
        },
      ];

      vi.mocked(redisClient.setEx).mockResolvedValue('OK');

      // Should not throw
      await warmCache(warmers);

      expect(warmers[0].fetcher).toHaveBeenCalled();
      expect(warmers[1].fetcher).toHaveBeenCalled();
    });
  });

  describe('cacheInvalidator', () => {
    it('should invalidate cache after successful mutation', async () => {
      vi.mocked(redisClient.scan).mockResolvedValue({
        cursor: 0,
        keys: ['api:GET:/api/workers:123'],
      } as any);
      vi.mocked(redisClient.del).mockResolvedValue(1);

      const middleware = cacheInvalidator('workers');
      await middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalled();

      // Call the overridden json method
      mockResponse.statusCode = 201;
      await (mockResponse.json as any)({ success: true });

      // Wait for async invalidation
      await new Promise(resolve => setTimeout(resolve, 50));

      expect(redisClient.scan).toHaveBeenCalled();
      expect(redisClient.del).toHaveBeenCalled();
    });

    it('should not invalidate cache on error responses', async () => {
      const middleware = cacheInvalidator('workers');
      await middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalled();

      // Call the overridden json method with error status
      mockResponse.statusCode = 400;
      await (mockResponse.json as any)({ error: 'Bad request' });

      // Wait for potential async operations
      await new Promise(resolve => setTimeout(resolve, 50));

      // Should not attempt to invalidate cache
      expect(redisClient.scan).not.toHaveBeenCalled();
    });
  });
});

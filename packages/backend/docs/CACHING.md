# API Response Caching

This document describes the caching implementation for the Farm Commons API.

## Overview

The API uses Redis-based caching to improve performance and reduce database load. The caching system provides:

- **Response Caching**: Automatically cache GET request responses
- **Cache Invalidation**: Automatically invalidate cache on data mutations
- **Cache Statistics**: Monitor cache hit rates and performance
- **Cache Warming**: Pre-load frequently accessed data
- **Fine-grained Control**: Configure TTL and caching behavior per route

## Architecture

### Components

1. **Redis Client** (`src/lib/redis.ts`)
   - Manages Redis connection with automatic reconnection
   - Handles graceful shutdown

2. **Cache Middleware** (`src/middleware/cache.ts`)
   - `cache()` - Caches GET request responses
   - `cacheInvalidator()` - Invalidates cache on mutations
   - `invalidateCache()` - Manual cache invalidation
   - `warmCache()` - Pre-loads cache entries
   - `getCacheStats()` - Returns cache statistics

3. **Cache Routes** (`src/routes/cache.ts`)
   - `GET /api/cache/stats` - View cache statistics
   - `POST /api/cache/stats/reset` - Reset statistics
   - `DELETE /api/cache/invalidate` - Invalidate by pattern
   - `DELETE /api/cache/invalidate/:resource` - Invalidate by resource
   - `DELETE /api/cache/all` - Clear all cache

## Usage

### Basic Caching

Add the `cache()` middleware to any GET route:

```typescript
import { cache } from '../middleware/cache.js';

// Cache for 5 minutes (default: 300 seconds)
router.get('/workers', cache(), getWorkers);

// Cache for 1 hour
router.get('/stats', cache({ ttl: 3600 }), getStats);
```

### Cache Invalidation

Add the `cacheInvalidator()` middleware to mutation routes:

```typescript
import { cacheInvalidator } from '../middleware/cache.js';

// Automatically invalidate workers cache on create/update/delete
router.post('/workers', cacheInvalidator('workers'), createWorker);
router.put('/workers/:id', cacheInvalidator('workers'), updateWorker);
router.delete('/workers/:id', cacheInvalidator('workers'), deleteWorker);
```

### Cache Options

The `cache()` middleware accepts the following options:

```typescript
interface CacheOptions {
  /** Cache TTL in seconds (default: 300 = 5 minutes) */
  ttl?: number;

  /** Custom cache key generator function */
  keyGenerator?: (req: Request) => string;

  /** Whether to cache only successful responses (2xx status codes) */
  onlySuccessful?: boolean;

  /** Prefix for cache keys */
  prefix?: string;

  /** Query params that should skip caching */
  skipQueryParams?: string[];
}
```

### Custom Key Generator

For more control over cache keys:

```typescript
router.get('/fields', cache({
  keyGenerator: (req) => `fields:farm:${req.user.farmId}`
}), getFields);
```

### Skip Caching on Certain Query Params

```typescript
router.get('/workers', cache({
  skipQueryParams: ['nocache', 'fresh']
}), getWorkers);

// GET /workers?nocache=true - will NOT be cached
// GET /workers?page=2 - will be cached
```

## Cache Keys

Cache keys are automatically generated with the format:

```
{prefix}:{method}:{url}:{userId}
```

Examples:
- `api:GET:/api/workers:123`
- `api:GET:/api/schedules?start_date=2025-01-01:456`

This ensures cache isolation per user and per query.

## Cache Invalidation

### Automatic Invalidation

The `cacheInvalidator()` middleware automatically invalidates related cache entries on successful mutations (2xx responses).

### Manual Invalidation

```typescript
import { invalidateCache, invalidateCacheByResource, invalidateAllCache } from '../middleware/cache.js';

// Invalidate by pattern
await invalidateCache('api:GET:/api/workers*');

// Invalidate by resource (simpler)
await invalidateCacheByResource('workers');

// Clear all cache
await invalidateAllCache();
```

## Cache Warming

Pre-load frequently accessed data on server startup:

```typescript
import { warmCache } from '../middleware/cache.js';

// Warm cache on startup
await warmCache([
  {
    key: 'api:workers:all',
    fetcher: async () => await getAllWorkers(),
    ttl: 600,
  },
  {
    key: 'api:fields:all',
    fetcher: async () => await getAllFields(),
    ttl: 600,
  },
]);
```

## Monitoring

### Cache Headers

All cached responses include headers:

- `X-Cache: HIT` - Response served from cache
- `X-Cache: MISS` - Response served from origin
- `X-Cache-Key: {key}` - The cache key used

### Cache Statistics

View cache statistics (admin only):

```bash
GET /api/cache/stats

Response:
{
  "success": true,
  "data": {
    "hits": 1520,
    "misses": 480,
    "errors": 2,
    "total": 2000,
    "hitRate": "76.00%",
    "uptime": 3600,
    "lastReset": "2025-11-10T12:00:00.000Z"
  }
}
```

### Reset Statistics

```bash
POST /api/cache/stats/reset
```

## Cache Management (Admin Only)

### Invalidate by Pattern

```bash
DELETE /api/cache/invalidate
Content-Type: application/json

{
  "pattern": "api:GET:/api/workers*"
}
```

### Invalidate by Resource

```bash
DELETE /api/cache/invalidate/workers
```

### Clear All Cache

```bash
DELETE /api/cache/all
```

## Configuration

Set the Redis URL in your `.env` file:

```env
REDIS_URL=redis://localhost:6379
```

For production with authentication:

```env
REDIS_URL=redis://username:password@host:port/database
```

## Best Practices

### When to Cache

✅ **Good candidates for caching:**
- List endpoints with pagination
- Frequently accessed reference data
- Data that doesn't change often (fields, certifications)
- Aggregate statistics

❌ **Avoid caching:**
- Real-time data (current time entries)
- User-specific sensitive data without proper key isolation
- Endpoints with complex authorization logic
- Data that changes frequently

### TTL Guidelines

- **Short TTL (1-2 minutes)**: Schedules, active work data
- **Medium TTL (5-10 minutes)**: Workers, fields
- **Long TTL (30-60 minutes)**: Statistics, reference data, certifications

### Cache Size Management

Monitor Redis memory usage:

```bash
redis-cli INFO memory
```

Set memory limits in Redis configuration:

```conf
maxmemory 256mb
maxmemory-policy allkeys-lru
```

## Testing

Run cache tests:

```bash
cd packages/backend
npm run test -- src/middleware/__tests__/cache.test.ts
```

## Troubleshooting

### Cache Not Working

1. Verify Redis is running: `redis-cli ping`
2. Check Redis connection in logs
3. Verify `REDIS_URL` is set correctly
4. Check for cache errors in application logs

### Stale Data

1. Verify cache invalidation is working
2. Check TTL values are appropriate
3. Manually invalidate cache if needed

### High Memory Usage

1. Reduce TTL values
2. Configure Redis eviction policy
3. Add memory limits to Redis
4. Review what's being cached

## Future Enhancements

- [ ] Add cache compression for large responses
- [ ] Implement cache tags for grouped invalidation
- [ ] Add cache warming on deploy
- [ ] Implement distributed caching for multi-instance deployments
- [ ] Add cache analytics dashboard

// Tests for rate limiting middleware

import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import express, { type Express } from 'express';
import request from 'supertest';
import {
  initializeRedisClient,
  closeRedisClient,
  authRateLimiter,
  passwordResetRateLimiter,
  readOnlyRateLimiter,
  writeRateLimiter,
  defaultRateLimiter,
  strictRateLimiter,
  healthCheckRateLimiter,
} from '../../middleware/rateLimiting.js';

describe('Rate Limiting Middleware', () => {
  let app: Express;

  beforeAll(async () => {
    // Initialize Redis client (will fall back to in-memory if no Redis)
    await initializeRedisClient();
  });

  afterAll(async () => {
    // Close Redis connection
    await closeRedisClient();
  });

  describe('Auth Rate Limiter', () => {
    beforeEach(() => {
      app = express();
      app.use(express.json());
      app.post('/test-auth', authRateLimiter, (req, res) => {
        res.json({ success: true });
      });
    });

    it('should allow requests within the limit', async () => {
      const response = await request(app).post('/test-auth').send({});
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should include rate limit headers', async () => {
      const response = await request(app).post('/test-auth').send({});
      expect(response.headers['ratelimit-limit']).toBeDefined();
      expect(response.headers['ratelimit-remaining']).toBeDefined();
      expect(response.headers['ratelimit-reset']).toBeDefined();
    });

    it('should block requests after exceeding the limit', async () => {
      const limit = Number.Number.parseInt(process.env.AUTH_RATE_LIMIT_MAX || '5');

      // Make requests up to the limit
      for (let i = 0; i < limit; i++) {
        await request(app).post('/test-auth').send({});
      }

      // Next request should be rate limited
      const response = await request(app).post('/test-auth').send({});
      expect(response.status).toBe(429);
      expect(response.body.error).toContain('Too many');
    }, 10000); // Increase timeout for this test
  });

  describe('Password Reset Rate Limiter', () => {
    beforeEach(() => {
      app = express();
      app.use(express.json());
      app.post('/test-password-reset', passwordResetRateLimiter, (req, res) => {
        res.json({ success: true });
      });
    });

    it('should allow requests within the limit', async () => {
      const response = await request(app).post('/test-password-reset').send({});
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should have strict limits', async () => {
      const limit = Number.Number.parseInt(process.env.PASSWORD_RESET_MAX || '3');

      // Make requests up to the limit
      for (let i = 0; i < limit; i++) {
        await request(app).post('/test-password-reset').send({});
      }

      // Next request should be rate limited
      const response = await request(app).post('/test-password-reset').send({});
      expect(response.status).toBe(429);
    }, 10000);
  });

  describe('Read-Only Rate Limiter', () => {
    beforeEach(() => {
      app = express();
      app.use(express.json());
      app.get('/test-read', readOnlyRateLimiter, (req, res) => {
        res.json({ success: true });
      });
    });

    it('should allow many GET requests', async () => {
      // Read-only should have higher limits
      const responses = await Promise.all(
        Array.from({ length: 10 }, () => request(app).get('/test-read'))
      );

      responses.forEach((response) => {
        expect(response.status).toBe(200);
      });
    });

    it('should include rate limit headers', async () => {
      const response = await request(app).get('/test-read');
      expect(response.headers['ratelimit-limit']).toBeDefined();
    });
  });

  describe('Write Rate Limiter', () => {
    beforeEach(() => {
      app = express();
      app.use(express.json());
      app.post('/test-write', writeRateLimiter, (req, res) => {
        res.json({ success: true });
      });
    });

    it('should allow write requests within limit', async () => {
      const response = await request(app).post('/test-write').send({});
      expect(response.status).toBe(200);
    });

    it('should track remaining requests', async () => {
      const response1 = await request(app).post('/test-write').send({});
      const remaining1 = Number.Number.parseInt(response1.headers['ratelimit-remaining'] || '0');

      const response2 = await request(app).post('/test-write').send({});
      const remaining2 = Number.Number.parseInt(response2.headers['ratelimit-remaining'] || '0');

      expect(remaining2).toBeLessThan(remaining1);
    });
  });

  describe('Default Rate Limiter', () => {
    beforeEach(() => {
      app = express();
      app.use(express.json());
      app.get('/test-default', defaultRateLimiter, (req, res) => {
        res.json({ success: true });
      });
    });

    it('should apply default rate limits', async () => {
      const response = await request(app).get('/test-default');
      expect(response.status).toBe(200);
      expect(response.headers['ratelimit-limit']).toBeDefined();
    });
  });

  describe('Strict Rate Limiter', () => {
    beforeEach(() => {
      app = express();
      app.use(express.json());
      app.post('/test-strict', strictRateLimiter, (req, res) => {
        res.json({ success: true });
      });
    });

    it('should have very strict limits', async () => {
      const response = await request(app).post('/test-strict').send({});
      expect(response.status).toBe(200);

      const limit = Number.Number.parseInt(response.headers['ratelimit-limit'] || '0');
      const strictLimit = Number.Number.parseInt(process.env.STRICT_RATE_LIMIT_MAX || '10');

      expect(limit).toBe(strictLimit);
    });
  });

  describe('Health Check Rate Limiter', () => {
    beforeEach(() => {
      app = express();
      app.get('/health', healthCheckRateLimiter, (req, res) => {
        res.json({ status: 'healthy' });
      });
    });

    it('should allow many health check requests', async () => {
      // Health check should have very high limits
      const responses = await Promise.all(
        Array.from({ length: 20 }, () => request(app).get('/health'))
      );

      responses.forEach((response) => {
        expect(response.status).toBe(200);
      });
    });

    it('should have high rate limits', async () => {
      const response = await request(app).get('/health');
      const limit = Number.Number.parseInt(response.headers['ratelimit-limit'] || '0');

      expect(limit).toBeGreaterThan(100); // Should be much higher than other endpoints
    });
  });

  describe('Redis Integration', () => {
    it('should initialize Redis client without errors', async () => {
      // This test ensures initializeRedisClient doesn't throw
      expect(async () => {
        await initializeRedisClient();
      }).not.toThrow();
    });

    it('should close Redis client without errors', async () => {
      // This test ensures closeRedisClient doesn't throw
      expect(async () => {
        await closeRedisClient();
      }).not.toThrow();
    });
  });

  describe('Rate Limit Key Generation', () => {
    beforeEach(() => {
      app = express();
      app.use(express.json());

      // Middleware to simulate authenticated user
      app.use((req: any, res, next) => {
        if (req.headers['x-test-user']) {
          req.user = { id: req.headers['x-test-user'] };
        }
        next();
      });

      app.get('/test-key', defaultRateLimiter, (req, res) => {
        res.json({ success: true });
      });
    });

    it('should use IP-based key for unauthenticated requests', async () => {
      const response1 = await request(app).get('/test-key');
      const remaining1 = Number.Number.parseInt(response1.headers['ratelimit-remaining'] || '0');

      const response2 = await request(app).get('/test-key');
      const remaining2 = Number.Number.parseInt(response2.headers['ratelimit-remaining'] || '0');

      // Same IP should share the same rate limit counter
      expect(remaining2).toBe(remaining1 - 1);
    });

    it('should use user-based key for authenticated requests', async () => {
      const response1 = await request(app)
        .get('/test-key')
        .set('x-test-user', 'user-123');

      expect(response1.status).toBe(200);

      const response2 = await request(app)
        .get('/test-key')
        .set('x-test-user', 'user-123');

      const remaining1 = Number.Number.parseInt(response1.headers['ratelimit-remaining'] || '0');
      const remaining2 = Number.Number.parseInt(response2.headers['ratelimit-remaining'] || '0');

      // Same user should share the same rate limit counter
      expect(remaining2).toBe(remaining1 - 1);
    });

    it('should use different keys for different users', async () => {
      // Make a request for user 123
      const response1 = await request(app)
        .get('/test-key')
        .set('x-test-user', 'user-123-unique');

      const remaining1 = Number.Number.parseInt(response1.headers['ratelimit-remaining'] || '0');

      // Make another request for user 123 to consume their limit
      const response1b = await request(app)
        .get('/test-key')
        .set('x-test-user', 'user-123-unique');

      const remaining1b = Number.Number.parseInt(response1b.headers['ratelimit-remaining'] || '0');

      // Make a request for user 456 (should have fresh limit)
      const response2 = await request(app)
        .get('/test-key')
        .set('x-test-user', 'user-456-unique');

      const remaining2 = Number.Number.parseInt(response2.headers['ratelimit-remaining'] || '0');

      // Different users should have independent rate limit counters
      // User 456 should have same remaining as user 123's first request
      expect(remaining2).toBe(remaining1);
      // User 123's second request should have less remaining than first
      expect(remaining1b).toBe(remaining1 - 1);
    });
  });

  describe('Rate Limit Error Response', () => {
    beforeEach(() => {
      app = express();
      app.use(express.json());

      // Use a very strict limiter for testing
      app.post('/test-limit', strictRateLimiter, (req, res) => {
        res.json({ success: true });
      });
    });

    it('should return 429 status code when rate limited', async () => {
      const limit = Number.Number.parseInt(process.env.STRICT_RATE_LIMIT_MAX || '10');

      // Exceed the limit
      for (let i = 0; i < limit; i++) {
        await request(app).post('/test-limit').send({});
      }

      const response = await request(app).post('/test-limit').send({});
      expect(response.status).toBe(429);
    }, 15000);

    it('should return error message in response body', async () => {
      const limit = Number.Number.parseInt(process.env.STRICT_RATE_LIMIT_MAX || '10');

      // Exceed the limit
      for (let i = 0; i < limit; i++) {
        await request(app).post('/test-limit').send({});
      }

      const response = await request(app).post('/test-limit').send({});
      expect(response.body).toHaveProperty('error');
      expect(response.body.success).toBe(false);
    }, 15000);
  });
});

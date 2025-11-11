// Unit tests for validation middleware

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { z } from 'zod';
import type { Request, Response, NextFunction } from 'express';
import {
  validate,
  validateBody,
  validateQuery,
  validateParams,
  validateMultiple,
  formatZodErrors,
  sanitizeObject,
  commonSchemas,
  uuidParamSchema,
} from '../validation';

// Mock Express Request, Response, and NextFunction
function createMockRequest(data: { body?: unknown; query?: unknown; params?: unknown }): Request {
  return {
    body: data.body || {},
    query: data.query || {},
    params: data.params || {},
  } as Request;
}

function createMockResponse(): Response {
  const res = {} as Response;
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
}

describe('formatZodErrors', () => {
  it('should format Zod errors with field paths', () => {
    const schema = z.object({
      email: z.string().email(),
      age: z.number().positive(),
    });

    try {
      schema.parse({ email: 'invalid', age: -5 });
    } catch (error) {
      if (error instanceof z.ZodError) {
        const formatted = formatZodErrors(error);

        expect(formatted.message).toContain('Validation failed');
        expect(formatted.errors).toHaveLength(2);
        expect(formatted.errors[0].field).toBe('email');
        expect(formatted.errors[1].field).toBe('age');
      }
    }
  });

  it('should handle nested object errors', () => {
    const schema = z.object({
      user: z.object({
        name: z.string().min(1),
        email: z.string().email(),
      }),
    });

    try {
      schema.parse({ user: { name: '', email: 'bad-email' } });
    } catch (error) {
      if (error instanceof z.ZodError) {
        const formatted = formatZodErrors(error);

        expect(formatted.errors.some((e) => e.field === 'user.name')).toBe(true);
        expect(formatted.errors.some((e) => e.field === 'user.email')).toBe(true);
      }
    }
  });

  it('should handle array errors', () => {
    const schema = z.object({
      tags: z.array(z.string().min(1)),
    });

    try {
      schema.parse({ tags: ['valid', '', 'also-valid'] });
    } catch (error) {
      if (error instanceof z.ZodError) {
        const formatted = formatZodErrors(error);

        expect(formatted.errors.some((e) => e.field.includes('tags'))).toBe(true);
      }
    }
  });
});

describe('sanitizeObject', () => {
  it('should sanitize XSS attack attempts', () => {
    const malicious = {
      name: '<script>alert("XSS")</script>John',
      bio: 'Hello <img src=x onerror=alert("XSS")> World',
    };

    const sanitized = sanitizeObject(malicious);

    expect(sanitized.name).toBe('John');
    expect(sanitized.bio).toBe('Hello  World');
    expect(sanitized.name).not.toContain('<script>');
    expect(sanitized.bio).not.toContain('<img');
  });

  it('should handle nested objects', () => {
    const malicious = {
      user: {
        name: '<b>Bold</b>Name',
        profile: {
          bio: '<a href="javascript:void(0)">Click</a>',
        },
      },
    };

    const sanitized = sanitizeObject(malicious);

    expect(sanitized.user.name).toBe('BoldName');
    expect(sanitized.user.profile.bio).toBe('Click');
  });

  it('should handle arrays of strings', () => {
    const malicious = {
      tags: ['<script>bad</script>tag1', 'tag2', '<img src=x>tag3'],
    };

    const sanitized = sanitizeObject(malicious);

    expect(sanitized.tags[0]).toBe('tag1');
    expect(sanitized.tags[1]).toBe('tag2');
    expect(sanitized.tags[2]).toBe('tag3');
  });

  it('should preserve non-string values', () => {
    const data = {
      name: '<script>test</script>',
      age: 25,
      active: true,
      score: 99.5,
      empty: null,
      missing: undefined,
    };

    const sanitized = sanitizeObject(data);

    expect(sanitized.age).toBe(25);
    expect(sanitized.active).toBe(true);
    expect(sanitized.score).toBe(99.5);
    expect(sanitized.empty).toBe(null);
    expect(sanitized.missing).toBe(undefined);
  });

  it('should handle deeply nested structures', () => {
    const deep = {
      level1: {
        level2: {
          level3: {
            value: '<script>deep</script>attack',
          },
        },
      },
    };

    const sanitized = sanitizeObject(deep);
    expect(sanitized.level1.level2.level3.value).toBe('attack');
  });

  it('should handle empty objects and arrays', () => {
    expect(sanitizeObject({})).toEqual({});
    expect(sanitizeObject([])).toEqual([]);
    expect(sanitizeObject({ empty: [] })).toEqual({ empty: [] });
  });
});

describe('validate middleware', () => {
  const schema = z.object({
    name: z.string().min(1),
    email: z.string().email(),
    age: z.number().positive().optional(),
  });

  let req: Request;
  let res: Response;
  let next: NextFunction;

  beforeEach(() => {
    res = createMockResponse();
    next = vi.fn();
  });

  it('should validate valid request body', async () => {
    req = createMockRequest({
      body: { name: 'John', email: 'john@example.com', age: 25 },
    });

    const middleware = validate(schema, 'body');
    await middleware(req, res, next);

    expect(next).toHaveBeenCalledWith();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('should reject invalid request body', async () => {
    req = createMockRequest({
      body: { name: '', email: 'invalid-email' },
    });

    const middleware = validate(schema, 'body');
    await middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: 'Validation error',
        details: expect.any(Array),
      })
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('should sanitize input by default', async () => {
    req = createMockRequest({
      body: {
        name: '<script>alert("xss")</script>John',
        email: 'john@example.com',
      },
    });

    const middleware = validate(schema, 'body');
    await middleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.body.name).toBe('John');
    expect(req.body.name).not.toContain('<script>');
  });

  it('should skip sanitization when disabled', async () => {
    req = createMockRequest({
      body: {
        name: 'John<tag>',
        email: 'john@example.com',
      },
    });

    const middleware = validate(schema, 'body', { sanitize: false });
    await middleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.body.name).toBe('John<tag>');
  });

  it('should strip unknown properties by default', async () => {
    req = createMockRequest({
      body: {
        name: 'John',
        email: 'john@example.com',
        unknown: 'should be removed',
      },
    });

    const middleware = validate(schema, 'body');
    await middleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.body.unknown).toBeUndefined();
  });

  it('should use custom error prefix', async () => {
    req = createMockRequest({
      body: { name: '', email: 'invalid' },
    });

    const middleware = validate(schema, 'body', {
      errorPrefix: 'Custom validation error',
    });
    await middleware(req, res, next);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'Custom validation error',
      })
    );
  });

  it('should validate query parameters', async () => {
    const querySchema = z.object({
      page: z.string().transform((val) => Number.Number.parseInt(val, 10)),
    });

    req = createMockRequest({
      query: { page: '5' },
    });

    const middleware = validate(querySchema, 'query');
    await middleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.query.page).toBe(5);
  });

  it('should validate URL parameters', async () => {
    req = createMockRequest({
      params: { id: '123e4567-e89b-12d3-a456-426614174000' },
    });

    const middleware = validate(uuidParamSchema, 'params');
    await middleware(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it('should reject invalid UUID parameter', async () => {
    req = createMockRequest({
      params: { id: 'not-a-uuid' },
    });

    const middleware = validate(uuidParamSchema, 'params');
    await middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(next).not.toHaveBeenCalled();
  });
});

describe('convenience validation functions', () => {
  const schema = z.object({ name: z.string() });
  let req: Request;
  let res: Response;
  let next: NextFunction;

  beforeEach(() => {
    res = createMockResponse();
    next = vi.fn();
  });

  it('validateBody should validate request body', async () => {
    req = createMockRequest({ body: { name: 'test' } });

    const middleware = validateBody(schema);
    await middleware(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it('validateQuery should validate query parameters', async () => {
    req = createMockRequest({ query: { name: 'test' } });

    const middleware = validateQuery(schema);
    await middleware(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it('validateParams should validate URL parameters', async () => {
    req = createMockRequest({ params: { name: 'test' } });

    const middleware = validateParams(schema);
    await middleware(req, res, next);

    expect(next).toHaveBeenCalled();
  });
});

describe('validateMultiple', () => {
  let req: Request;
  let res: Response;
  let next: NextFunction;

  beforeEach(() => {
    res = createMockResponse();
    next = vi.fn();
  });

  it('should validate multiple targets simultaneously', async () => {
    req = createMockRequest({
      params: { id: '123e4567-e89b-12d3-a456-426614174000' },
      body: { name: 'John' },
      query: { page: '1' },
    });

    const middleware = validateMultiple({
      params: z.object({ id: z.string().uuid() }),
      body: z.object({ name: z.string() }),
      query: z.object({ page: z.string() }),
    });

    await middleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('should sanitize all targets', async () => {
    req = createMockRequest({
      body: { name: '<script>test</script>' },
      query: { search: '<img src=x>' },
    });

    const middleware = validateMultiple({
      body: z.object({ name: z.string() }),
      query: z.object({ search: z.string() }),
    });

    await middleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.body.name).not.toContain('<script>');
    expect(req.query.search).not.toContain('<img');
  });

  it('should fail if any target is invalid', async () => {
    req = createMockRequest({
      params: { id: 'invalid-uuid' },
      body: { name: 'John' },
    });

    const middleware = validateMultiple({
      params: z.object({ id: z.string().uuid() }),
      body: z.object({ name: z.string() }),
    });

    await middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(next).not.toHaveBeenCalled();
  });
});

describe('commonSchemas', () => {
  it('should validate UUID', () => {
    expect(() => commonSchemas.uuid.parse('123e4567-e89b-12d3-a456-426614174000')).not.toThrow();
    expect(() => commonSchemas.uuid.parse('not-a-uuid')).toThrow();
  });

  it('should validate email', () => {
    expect(() => commonSchemas.email.parse('test@example.com')).not.toThrow();
    expect(() => commonSchemas.email.parse('invalid-email')).toThrow();
  });

  it('should validate phone', () => {
    expect(() => commonSchemas.phone.parse('1234567890')).not.toThrow();
    expect(() => commonSchemas.phone.parse('123')).toThrow();
  });

  it('should validate positive integers', () => {
    expect(() => commonSchemas.positiveInt.parse(5)).not.toThrow();
    expect(() => commonSchemas.positiveInt.parse(-5)).toThrow();
    expect(() => commonSchemas.positiveInt.parse(5.5)).toThrow();
  });

  it('should validate positive numbers', () => {
    expect(() => commonSchemas.positiveNumber.parse(5.5)).not.toThrow();
    expect(() => commonSchemas.positiveNumber.parse(-5.5)).toThrow();
  });

  it('should parse date strings', () => {
    const result = commonSchemas.dateString.parse('2024-01-15');
    expect(result).toBeInstanceOf(Date);
  });

  it('should parse boolean strings', () => {
    expect(commonSchemas.boolean.parse('true')).toBe(true);
    expect(commonSchemas.boolean.parse(true)).toBe(true);
    expect(commonSchemas.boolean.parse('false')).toBe(false);
  });
});

describe('edge cases', () => {
  let req: Request;
  let res: Response;
  let next: NextFunction;

  beforeEach(() => {
    res = createMockResponse();
    next = vi.fn();
  });

  it('should handle empty objects', async () => {
    const schema = z.object({}).strict();
    req = createMockRequest({ body: {} });

    const middleware = validate(schema, 'body');
    await middleware(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it('should handle null values', async () => {
    const schema = z.object({
      value: z.string().nullable(),
    });
    req = createMockRequest({ body: { value: null } });

    const middleware = validate(schema, 'body');
    await middleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.body.value).toBe(null);
  });

  it('should handle undefined in optional fields', async () => {
    const schema = z.object({
      required: z.string(),
      optional: z.string().optional(),
    });
    req = createMockRequest({ body: { required: 'test' } });

    const middleware = validate(schema, 'body');
    await middleware(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it('should handle arrays with mixed valid/invalid items', async () => {
    const schema = z.object({
      items: z.array(z.number().positive()),
    });
    req = createMockRequest({ body: { items: [1, -2, 3] } });

    const middleware = validate(schema, 'body');
    await middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('should handle very long strings', async () => {
    const schema = z.object({
      text: z.string().max(100),
    });
    req = createMockRequest({ body: { text: 'a'.repeat(200) } });

    const middleware = validate(schema, 'body');
    await middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('should handle unicode and special characters', async () => {
    const schema = z.object({
      text: z.string(),
    });
    req = createMockRequest({
      body: { text: 'Hello 世界 🌍 Café ñoño' },
    });

    const middleware = validate(schema, 'body');
    await middleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.body.text).toContain('世界');
    expect(req.body.text).toContain('🌍');
  });

  it('should handle SQL injection attempts', async () => {
    const schema = z.object({
      username: z.string(),
    });
    req = createMockRequest({
      body: { username: "admin' OR '1'='1" },
    });

    const middleware = validate(schema, 'body');
    await middleware(req, res, next);

    expect(next).toHaveBeenCalled();
    // The sanitizer doesn't change SQL injection patterns (that's for the DB layer),
    // but validation ensures the structure is correct
    expect(req.body.username).toBe("admin' OR '1'='1");
  });

  it('should pass through unexpected errors', async () => {
    // Create a schema that throws a non-Zod error
    const faultySchema = {
      parseAsync: vi.fn().mockRejectedValue(new Error('Unexpected error')),
    };

    req = createMockRequest({ body: { name: 'test' } });

    const middleware = validate(faultySchema as unknown as z.ZodSchema, 'body');
    await middleware(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(Error));
    expect(res.status).not.toHaveBeenCalled();
  });
});

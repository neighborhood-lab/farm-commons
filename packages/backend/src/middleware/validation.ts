// Request validation middleware
// Centralized Zod schema validation with sanitization

import type { Request, Response, NextFunction } from 'express';
import { z, ZodError, ZodSchema } from 'zod';
import DOMPurify from 'isomorphic-dompurify';

/**
 * Validation target (what part of the request to validate)
 */
export type ValidationTarget = 'body' | 'query' | 'params';

/**
 * Validation options
 */
export interface ValidationOptions {
  /** Strip unknown properties from the validated object */
  stripUnknown?: boolean;
  /** Sanitize string inputs to prevent XSS */
  sanitize?: boolean;
  /** Custom error message prefix */
  errorPrefix?: string;
}

/**
 * Format Zod validation errors into a more user-friendly structure
 */
export function formatZodErrors(error: ZodError): {
  message: string;
  errors: Array<{ field: string; message: string }>;
} {
  const formattedErrors = error.issues.map((err) => ({
    field: err.path.join('.') || 'root',
    message: err.message,
  }));

  // Create a human-readable summary
  const fieldNames = formattedErrors
    .map((e: { field: string; message: string }) => e.field)
    .join(', ');
  const message = `Validation failed for: ${fieldNames}`;

  return {
    message,
    errors: formattedErrors,
  };
}

/**
 * Recursively sanitize all string values in an object to prevent XSS attacks
 */
export function sanitizeObject<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === 'string') {
    // Sanitize the string, stripping all HTML tags by default
    // isomorphic-dompurify works in both Node.js and browser environments
    return DOMPurify.sanitize(obj, {
      ALLOWED_TAGS: [],
      ALLOWED_ATTR: [],
      KEEP_CONTENT: true,
    }) as T;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeObject(item)) as T;
  }

  if (typeof obj === 'object') {
    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      sanitized[key] = sanitizeObject(value);
    }
    return sanitized as T;
  }

  return obj;
}

/**
 * Create a validation middleware for a specific Zod schema
 *
 * @param schema - Zod schema to validate against
 * @param target - Which part of the request to validate (body, query, or params)
 * @param options - Validation options
 *
 * @example
 * ```typescript
 * app.post('/api/workers',
 *   validate(createWorkerSchema, 'body', { sanitize: true }),
 *   createWorkerHandler
 * );
 * ```
 */
export function validate<T extends ZodSchema>(
  schema: T,
  target: ValidationTarget = 'body',
  options: ValidationOptions = {}
) {
  const { sanitize = true, errorPrefix = 'Validation error' } = options;

  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Get the data to validate based on target
      let data = req[target];

      // Sanitize input if enabled
      if (sanitize && data) {
        data = sanitizeObject(data);
      }

      // Parse and validate with Zod
      const validated = await schema.parseAsync(data);

      // Replace the request data with validated and potentially sanitized data
      (req as unknown as Record<string, unknown>)[target] = validated;

      next();
    } catch {
      if (error instanceof ZodError) {
        const formatted = formatZodErrors(error);
        res.status(400).json({
          success: false,
          error: errorPrefix,
          message: formatted.message,
          details: formatted.errors,
        });
        return;
      }

      // Re-throw unexpected errors
      next(error);
    }
  };
}

/**
 * Validate request body
 *
 * @example
 * ```typescript
 * app.post('/api/workers', validateBody(createWorkerSchema), handler);
 * ```
 */
export function validateBody<T extends ZodSchema>(schema: T, options?: ValidationOptions) {
  return validate(schema, 'body', options);
}

/**
 * Validate query parameters
 *
 * @example
 * ```typescript
 * app.get('/api/workers', validateQuery(paginationSchema), handler);
 * ```
 */
export function validateQuery<T extends ZodSchema>(schema: T, options?: ValidationOptions) {
  return validate(schema, 'query', options);
}

/**
 * Validate URL parameters
 *
 * @example
 * ```typescript
 * app.get('/api/workers/:id', validateParams(z.object({ id: z.string().uuid() })), handler);
 * ```
 */
export function validateParams<T extends ZodSchema>(schema: T, options?: ValidationOptions) {
  return validate(schema, 'params', options);
}

/**
 * Validate multiple targets at once
 *
 * @example
 * ```typescript
 * app.put('/api/workers/:id',
 *   validateMultiple({
 *     params: z.object({ id: z.string().uuid() }),
 *     body: updateWorkerSchema
 *   }),
 *   handler
 * );
 * ```
 */
export function validateMultiple(
  schemas: {
    body?: ZodSchema;
    query?: ZodSchema;
    params?: ZodSchema;
  },
  options?: ValidationOptions
) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { sanitize = true } = options || {};

      // Validate each target that has a schema
      for (const [target, schema] of Object.entries(schemas)) {
        if (!schema) continue;

        let data = req[target as ValidationTarget];

        // Sanitize if enabled
        if (sanitize && data) {
          data = sanitizeObject(data);
        }

        // Validate with Zod
        const validated = await schema.parseAsync(data);

        // Update request with validated data
        (req as unknown as Record<string, unknown>)[target] = validated;
      }

      next();
    } catch {
      if (error instanceof ZodError) {
        const formatted = formatZodErrors(error);
        res.status(400).json({
          success: false,
          error: 'Validation error',
          message: formatted.message,
          details: formatted.errors,
        });
        return;
      }

      next(error);
    }
  };
}

/**
 * Create a schema for validating UUID parameters
 */
export const uuidParamSchema = z.object({
  id: z.string().uuid('Invalid ID format'),
});

/**
 * Common validation schemas for reuse
 */
export const commonSchemas = {
  uuid: z.string().uuid(),
  email: z.string().email(),
  phone: z.string().min(10).max(20),
  positiveInt: z.number().int().positive(),
  positiveNumber: z.number().positive(),
  dateString: z
    .string()
    .or(z.date())
    .transform((val) => new Date(val)),
  boolean: z.boolean().or(z.string().transform((val) => val === 'true')),
};

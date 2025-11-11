// Global error handling middleware

import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { captureException } from '../monitoring/sentry.js';
import { recordError } from '../monitoring/prometheus.js';

export interface ApiError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export class AppError extends Error implements ApiError {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode = 500, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

export function errorHandler(
  err: ApiError | ZodError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  const route = req.route?.path || req.path || 'unknown';

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    // Record validation error in Prometheus
    recordError('ValidationError', route);

    res.status(400).json({
      success: false,
      error: 'Validation error',
      details: err.issues,
    });
    return;
  }

  // Handle operational errors
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';

  // Record error in monitoring
  const errorType = err.constructor.name || 'UnknownError';
  recordError(errorType, route);

  // For non-operational errors (unexpected errors), capture in Sentry
  if (!err.isOperational || statusCode >= 500) {
    captureException(err, {
      url: req.url,
      method: req.method,
      statusCode,
      body: req.body,
      query: req.query,
    });
  }

  // eslint-disable-next-line no-console
  console.error('Error:', {
    message: err.message,
    statusCode,
    stack: err.stack,
  });

  res.status(statusCode).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
}

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    error: `Route ${req.method} ${req.url} not found`,
  });
}

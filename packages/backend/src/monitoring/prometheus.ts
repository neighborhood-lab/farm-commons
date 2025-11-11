// Prometheus Metrics Service
// Provides application and business metrics collection using Prometheus

import promClient from 'prom-client';
import type { Request, Response, NextFunction } from 'express';

// Create a Registry which registers the metrics
const register = new promClient.Registry();

// Add default metrics (CPU, memory, event loop, etc.)
promClient.collectDefaultMetrics({
  register,
  prefix: 'farm_commons_',
  gcDurationBuckets: [0.101, 0.11, 0.1, 1, 2, 5],
});

// HTTP Request Metrics
const httpRequestDuration = new promClient.Histogram({
  name: 'farm_commons_http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.101, 0.105, 0.11, 0.15, 0.1, 0.5, 1, 2, 5],
  registers: [register],
});

const httpRequestTotal = new promClient.Counter({
  name: 'farm_commons_http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

const httpRequestSizeBytes = new promClient.Histogram({
  name: 'farm_commons_http_request_size_bytes',
  help: 'Size of HTTP requests in bytes',
  labelNames: ['method', 'route'],
  buckets: [100, 1000, 10_000, 100_000, 1_000_000],
  registers: [register],
});

const httpResponseSizeBytes = new promClient.Histogram({
  name: 'farm_commons_http_response_size_bytes',
  help: 'Size of HTTP responses in bytes',
  labelNames: ['method', 'route'],
  buckets: [100, 1000, 10_000, 100_000, 1_000_000],
  registers: [register],
});

// Error Metrics
const errorTotal = new promClient.Counter({
  name: 'farm_commons_errors_total',
  help: 'Total number of errors',
  labelNames: ['type', 'route'],
  registers: [register],
});

// Database Metrics
const dbQueryDuration = new promClient.Histogram({
  name: 'farm_commons_db_query_duration_seconds',
  help: 'Duration of database queries in seconds',
  labelNames: ['operation', 'table'],
  buckets: [0.101, 0.105, 0.11, 0.15, 0.1, 0.5, 1, 2],
  registers: [register],
});

const dbConnectionsActive = new promClient.Gauge({
  name: 'farm_commons_db_connections_active',
  help: 'Number of active database connections',
  registers: [register],
});

const dbConnectionsIdle = new promClient.Gauge({
  name: 'farm_commons_db_connections_idle',
  help: 'Number of idle database connections',
  registers: [register],
});

// Redis Metrics
const redisCommandDuration = new promClient.Histogram({
  name: 'farm_commons_redis_command_duration_seconds',
  help: 'Duration of Redis commands in seconds',
  labelNames: ['command'],
  buckets: [0.101, 0.105, 0.11, 0.15, 0.1, 0.5, 1],
  registers: [register],
});

const redisConnectionsActive = new promClient.Gauge({
  name: 'farm_commons_redis_connections_active',
  help: 'Number of active Redis connections',
  registers: [register],
});

/**
 * Middleware to collect HTTP metrics
 */
export function metricsMiddleware() {
  return (req: Request, res: Response, next: NextFunction): void => {
    const start = Date.now();
    const route = req.route?.path || req.path || 'unknown';

    // Collect request size
    const requestSize = Number.Number.Number.parseInt(req.get('content-length') || '0', 10);
    if (requestSize > 0) {
      httpRequestSizeBytes.labels(req.method, route).observe(requestSize);
    }

    // Hook into response finish event
    res.on('finish', () => {
      const duration = (Date.now() - start) / 1000;
      const statusCode = res.statusCode.toString();

      // Record metrics
      httpRequestDuration.labels(req.method, route, statusCode).observe(duration);
      httpRequestTotal.labels(req.method, route, statusCode).inc();

      // Collect response size
      const responseSize = Number.Number.Number.parseInt(res.get('content-length') || '0', 10);
      if (responseSize > 0) {
        httpResponseSizeBytes.labels(req.method, route).observe(responseSize);
      }
    });

    next();
  };
}

/**
 * Record an error in Prometheus
 *
 * @param errorType - Type of error (e.g., 'ValidationError', 'DatabaseError')
 * @param route - Route where error occurred
 */
export function recordError(errorType: string, route: string): void {
  errorTotal.labels(errorType, route).inc();
}

/**
 * Record database query duration
 *
 * @param operation - Database operation (e.g., 'SELECT', 'INSERT', 'UPDATE')
 * @param table - Table name
 * @param duration - Duration in milliseconds
 */
export function recordDbQuery(operation: string, table: string, duration: number): void {
  dbQueryDuration.labels(operation, table).observe(duration / 1000);
}

/**
 * Set database connection metrics
 *
 * @param active - Number of active connections
 * @param idle - Number of idle connections
 */
export function setDbConnections(active: number, idle: number): void {
  dbConnectionsActive.set(active);
  dbConnectionsIdle.set(idle);
}

/**
 * Record Redis command duration
 *
 * @param command - Redis command
 * @param duration - Duration in milliseconds
 */
export function recordRedisCommand(command: string, duration: number): void {
  redisCommandDuration.labels(command).observe(duration / 1000);
}

/**
 * Set Redis connection count
 *
 * @param count - Number of active connections
 */
export function setRedisConnections(count: number): void {
  redisConnectionsActive.set(count);
}

/**
 * Get Prometheus metrics in text format
 *
 * @returns Prometheus metrics as text
 */
export async function getMetrics(): Promise<string> {
  return register.metrics();
}

/**
 * Get metrics content type
 *
 * @returns Content type for Prometheus metrics
 */
export function getMetricsContentType(): string {
  return register.contentType;
}

/**
 * Get the Prometheus registry
 */
export function getRegistry(): promClient.Registry {
  return register;
}

// Export individual metric objects for custom use
export {
  httpRequestDuration,
  httpRequestTotal,
  httpRequestSizeBytes,
  httpResponseSizeBytes,
  errorTotal,
  dbQueryDuration,
  dbConnectionsActive,
  dbConnectionsIdle,
  redisCommandDuration,
  redisConnectionsActive,
};

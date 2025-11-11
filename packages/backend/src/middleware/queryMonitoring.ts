/**
 * Query Performance Monitoring Middleware
 *
 * This module provides middleware for monitoring database query performance:
 * - Logs slow queries
 * - Tracks query execution time
 * - Provides metrics for optimization
 */

import type { Knex } from 'knex';
import db from '../db/connection.js';

/**
 * Configuration for query monitoring
 */
interface QueryMonitoringConfig {
  /** Threshold in milliseconds for slow query logging */
  slowQueryThreshold: number;
  /** Whether to log all queries (useful for debugging) */
  logAllQueries: boolean;
  /** Whether to enable query monitoring */
  enabled: boolean;
}

/**
 * Query metrics tracker
 */
class QueryMetrics {
  private totalQueries = 0;
  private slowQueries = 0;
  private totalExecutionTime = 0;
  private queryTypes = new Map<string, number>();

  recordQuery(sql: string, executionTime: number, isSlow: boolean) {
    this.totalQueries++;
    this.totalExecutionTime += executionTime;

    if (isSlow) {
      this.slowQueries++;
    }

    // Extract query type (SELECT, INSERT, UPDATE, DELETE)
    const queryType = sql.trim().split(' ')[0].toUpperCase();
    this.queryTypes.set(queryType, (this.queryTypes.get(queryType) || 0) + 1);
  }

  getMetrics() {
    return {
      total_queries: this.totalQueries,
      slow_queries: this.slowQueries,
      total_execution_time_ms: Math.round(this.totalExecutionTime),
      avg_execution_time_ms:
        this.totalQueries > 0 ? Math.round(this.totalExecutionTime / this.totalQueries) : 0,
      query_types: Object.fromEntries(this.queryTypes),
    };
  }

  reset() {
    this.totalQueries = 0;
    this.slowQueries = 0;
    this.totalExecutionTime = 0;
    this.queryTypes.clear();
  }
}

const metrics = new QueryMetrics();

/**
 * Default configuration
 */
const defaultConfig: QueryMonitoringConfig = {
  slowQueryThreshold: Number.parseInt(process.env.SLOW_QUERY_THRESHOLD || '100', 10), // 100ms default
  logAllQueries: process.env.LOG_ALL_QUERIES === 'true',
  enabled: process.env.QUERY_MONITORING_ENABLED !== 'false', // Enabled by default
};

/**
 * Setup query monitoring on the database connection
 */
export function setupQueryMonitoring(config: Partial<QueryMonitoringConfig> = {}) {
  const finalConfig = { ...defaultConfig, ...config };

  if (!finalConfig.enabled) {
    console.log('Query monitoring is disabled');
    return;
  }

  // Listen to query events
  db.on('query', (query: Knex.Sql) => {
    // Attach start time to the query
    (query as any).__startTime = Date.now();

    if (finalConfig.logAllQueries) {
      console.log('[DB Query]', query.sql, query.bindings);
    }
  });

  db.on('query-response', (response: any, query: Knex.Sql) => {
    const startTime = (query as any).__startTime;
    if (!startTime) return;

    const executionTime = Date.now() - startTime;
    const isSlow = executionTime >= finalConfig.slowQueryThreshold;

    // Record metrics
    metrics.recordQuery(query.sql, executionTime, isSlow);

    // Log slow queries
    if (isSlow) {
      console.warn(
        `[SLOW QUERY] ${executionTime}ms - ${query.sql.substring(0, 200)}${query.sql.length > 200 ? '...' : ''}`,
        {
          bindings: query.bindings,
          execution_time_ms: executionTime,
        }
      );
    }
  });

  db.on('query-error', (error: Error, query: Knex.Sql) => {
    const startTime = (query as any).__startTime;
    const executionTime = startTime ? Date.now() - startTime : 0;

    console.error('[DB Query Error]', {
      error: error.message,
      sql: query.sql,
      bindings: query.bindings,
      execution_time_ms: executionTime,
    });
  });

  console.log('Query monitoring enabled', {
    slowQueryThreshold: `${finalConfig.slowQueryThreshold}ms`,
    logAllQueries: finalConfig.logAllQueries,
  });
}

/**
 * Get current query metrics
 */
export function getQueryMetrics() {
  return metrics.getMetrics();
}

/**
 * Reset query metrics
 */
export function resetQueryMetrics() {
  metrics.reset();
}

/**
 * Middleware to add query metrics to response headers (for debugging)
 */
export function queryMetricsMiddleware(
  req: any,
  res: any,
  next: any
) {
  // Save initial metrics
  const initialMetrics = metrics.getMetrics();
  const requestStartTime = Date.now();

  // Add metrics to response after request completes
  res.on('finish', () => {
    const currentMetrics = metrics.getMetrics();
    const requestDuration = Date.now() - requestStartTime;

    // Calculate queries made during this request
    const queriesDuringRequest = currentMetrics.total_queries - initialMetrics.total_queries;
    const slowQueriesDuringRequest = currentMetrics.slow_queries - initialMetrics.slow_queries;

    // Add to response headers (useful for debugging)
    if (process.env.NODE_ENV === 'development') {
      res.setHeader('X-Query-Count', queriesDuringRequest.toString());
      res.setHeader('X-Slow-Query-Count', slowQueriesDuringRequest.toString());
      res.setHeader('X-Request-Duration', `${requestDuration}ms`);
    }
  });

  next();
}

/**
 * Express route to get query metrics
 * Should be protected/admin-only in production
 */
export function createMetricsRoute() {
  return (_req: any, res: any) => {
    const currentMetrics = getQueryMetrics();
    res.json({
      success: true,
      data: currentMetrics,
      timestamp: new Date().toISOString(),
    });
  };
}

/**
 * Analyze a query plan (PostgreSQL EXPLAIN)
 * Useful for debugging slow queries
 */
export async function analyzeQuery(sql: string, bindings?: any[]) {
  try {
    const explainQuery = `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) ${sql}`;
    const result = await db.raw(explainQuery, bindings);
    return result.rows[0]['QUERY PLAN'];
  } catch {
    console.error('Error analyzing query:', error);
    throw error;
  }
}

/**
 * Get table statistics
 * Useful for understanding query performance
 */
export async function getTableStats(tableName: string) {
  const result = await db.raw(
    `
    SELECT
      schemaname,
      tablename,
      pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS total_size,
      pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) AS table_size,
      pg_size_pretty(pg_indexes_size(schemaname||'.'||tablename)) AS indexes_size,
      n_tup_ins AS inserts,
      n_tup_upd AS updates,
      n_tup_del AS deletes,
      n_live_tup AS live_rows,
      n_dead_tup AS dead_rows,
      last_vacuum,
      last_autovacuum,
      last_analyze,
      last_autoanalyze
    FROM pg_stat_user_tables
    WHERE tablename = ?
    `,
    [tableName]
  );

  return result.rows[0] || null;
}

/**
 * Get index usage statistics
 */
export async function getIndexStats(tableName?: string) {
  let query = `
    SELECT
      schemaname,
      tablename,
      indexname,
      idx_scan AS index_scans,
      idx_tup_read AS tuples_read,
      idx_tup_fetch AS tuples_fetched,
      pg_size_pretty(pg_relation_size(indexrelid)) AS index_size
    FROM pg_stat_user_indexes
  `;

  const bindings: any[] = [];
  if (tableName) {
    query += ' WHERE tablename = ?';
    bindings.push(tableName);
  }

  query += ' ORDER BY idx_scan DESC';

  const result = await db.raw(query, bindings);
  return result.rows;
}

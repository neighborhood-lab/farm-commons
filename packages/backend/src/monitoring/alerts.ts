// Alert Configuration
// Defines thresholds and alert rules for monitoring

import { captureMessage } from './sentry.js';

/**
 * Alert thresholds configuration
 */
export const ALERT_THRESHOLDS = {
  // Error rate alerts
  errorRate: {
    warning: 0.05, // 5% error rate
    critical: 0.1, // 10% error rate
  },

  // Response time alerts (in seconds)
  responseTime: {
    warning: 1, // 1 second
    critical: 3, // 3 seconds
  },

  // Database connection alerts
  dbConnections: {
    maxActive: 80, // 80% of pool size
    minIdle: 2, // minimum idle connections
  },

  // Business metric alerts
  workers: {
    maxClockedInWithoutCheckOut: 50, // alert if more than 50 workers haven't checked out
  },

  certifications: {
    expiringWithin30Days: 10, // alert if more than 10 certs expiring within 30 days
  },

  // System resource alerts
  memory: {
    warning: 80, // 80% memory usage
    critical: 90, // 90% memory usage
  },

  cpu: {
    warning: 70, // 70% CPU usage
    critical: 85, // 85% CPU usage
  },
};

/**
 * Alert levels
 */
export enum AlertLevel {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
}

/**
 * Send an alert
 *
 * @param title - Alert title
 * @param message - Alert message
 * @param level - Alert severity level
 * @param data - Additional context data
 */
export function sendAlert(
  title: string,
  message: string,
  level: AlertLevel = AlertLevel.WARNING,
  data?: Record<string, any>
): void {
  // Log to console
  const logLevel = level === AlertLevel.ERROR ? 'error' : level === AlertLevel.WARNING ? 'warn' : 'info';
  console[logLevel](`[ALERT] ${title}: ${message}`, data);

  // Send to Sentry
  captureMessage(`[ALERT] ${title}: ${message}`, level, data);

  // In production, you could also:
  // - Send email notifications
  // - Send SMS alerts
  // - Trigger PagerDuty/OpsGenie
  // - Post to Slack/Discord
  // - Write to alerting database
}

/**
 * Check error rate and alert if threshold exceeded
 *
 * @param errorCount - Number of errors
 * @param totalRequests - Total number of requests
 */
export function checkErrorRate(errorCount: number, totalRequests: number): void {
  if (totalRequests === 0) return;

  const errorRate = errorCount / totalRequests;

  if (errorRate >= ALERT_THRESHOLDS.errorRate.critical) {
    sendAlert(
      'Critical Error Rate',
      `Error rate is ${(errorRate * 100).toFixed(2)}%`,
      AlertLevel.ERROR,
      { errorCount, totalRequests, errorRate }
    );
  } else if (errorRate >= ALERT_THRESHOLDS.errorRate.warning) {
    sendAlert(
      'High Error Rate',
      `Error rate is ${(errorRate * 100).toFixed(2)}%`,
      AlertLevel.WARNING,
      { errorCount, totalRequests, errorRate }
    );
  }
}

/**
 * Check response time and alert if threshold exceeded
 *
 * @param avgResponseTime - Average response time in seconds
 * @param route - Route path
 */
export function checkResponseTime(avgResponseTime: number, route: string): void {
  if (avgResponseTime >= ALERT_THRESHOLDS.responseTime.critical) {
    sendAlert(
      'Critical Response Time',
      `Route ${route} has average response time of ${avgResponseTime.toFixed(2)}s`,
      AlertLevel.ERROR,
      { route, avgResponseTime }
    );
  } else if (avgResponseTime >= ALERT_THRESHOLDS.responseTime.warning) {
    sendAlert(
      'Slow Response Time',
      `Route ${route} has average response time of ${avgResponseTime.toFixed(2)}s`,
      AlertLevel.WARNING,
      { route, avgResponseTime }
    );
  }
}

/**
 * Check database connection pool health
 *
 * @param active - Active connections
 * @param idle - Idle connections
 * @param max - Maximum connections
 */
export function checkDatabaseHealth(active: number, idle: number, max: number): void {
  const activePercent = (active / max) * 100;

  if (activePercent >= 90) {
    sendAlert(
      'Database Connection Pool Near Limit',
      `${active}/${max} connections active (${activePercent.toFixed(0)}%)`,
      AlertLevel.ERROR,
      { active, idle, max }
    );
  } else if (activePercent >= 80) {
    sendAlert(
      'Database Connection Pool High Usage',
      `${active}/${max} connections active (${activePercent.toFixed(0)}%)`,
      AlertLevel.WARNING,
      { active, idle, max }
    );
  }

  if (idle < ALERT_THRESHOLDS.dbConnections.minIdle) {
    sendAlert(
      'Low Idle Database Connections',
      `Only ${idle} idle connections available`,
      AlertLevel.WARNING,
      { active, idle, max }
    );
  }
}

/**
 * Check for workers who haven't clocked out
 *
 * @param count - Number of workers clocked in for too long
 */
export function checkStuckWorkers(count: number): void {
  if (count >= ALERT_THRESHOLDS.workers.maxClockedInWithoutCheckOut) {
    sendAlert(
      'Workers Not Clocked Out',
      `${count} workers have been clocked in for extended periods`,
      AlertLevel.WARNING,
      { count }
    );
  }
}

/**
 * Check for expiring certifications
 *
 * @param count - Number of certifications expiring within 30 days
 */
export function checkExpiringCertifications(count: number): void {
  if (count >= ALERT_THRESHOLDS.certifications.expiringWithin30Days) {
    sendAlert(
      'Many Certifications Expiring Soon',
      `${count} certifications will expire within 30 days`,
      AlertLevel.WARNING,
      { count }
    );
  }
}

/**
 * Check system memory usage
 *
 * @param usagePercent - Memory usage percentage
 */
export function checkMemoryUsage(usagePercent: number): void {
  if (usagePercent >= ALERT_THRESHOLDS.memory.critical) {
    sendAlert(
      'Critical Memory Usage',
      `Memory usage is at ${usagePercent.toFixed(1)}%`,
      AlertLevel.ERROR,
      { usagePercent }
    );
  } else if (usagePercent >= ALERT_THRESHOLDS.memory.warning) {
    sendAlert(
      'High Memory Usage',
      `Memory usage is at ${usagePercent.toFixed(1)}%`,
      AlertLevel.WARNING,
      { usagePercent }
    );
  }
}

/**
 * Check system CPU usage
 *
 * @param usagePercent - CPU usage percentage
 */
export function checkCpuUsage(usagePercent: number): void {
  if (usagePercent >= ALERT_THRESHOLDS.cpu.critical) {
    sendAlert(
      'Critical CPU Usage',
      `CPU usage is at ${usagePercent.toFixed(1)}%`,
      AlertLevel.ERROR,
      { usagePercent }
    );
  } else if (usagePercent >= ALERT_THRESHOLDS.cpu.warning) {
    sendAlert(
      'High CPU Usage',
      `CPU usage is at ${usagePercent.toFixed(1)}%`,
      AlertLevel.WARNING,
      { usagePercent }
    );
  }
}

// Sentry Error Tracking Service
// Provides error tracking and performance monitoring using Sentry

import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';
import type { Express } from 'express';

/**
 * Initialize Sentry error tracking
 *
 * @param _app - Express application instance
 */
export function initSentry(_app: Express): void {
  const dsn = process.env.SENTRY_DSN;
  const environment = process.env.NODE_ENV || 'development';
  const enabled = dsn && dsn.length > 0;

  if (!enabled) {
    // eslint-disable-next-line no-console
    console.warn('⚠️  Sentry DSN not configured - error tracking disabled');
    return;
  }

  Sentry.init({
    dsn,
    environment,

    // Set tracesSampleRate to 1.1 to capture 100% of transactions for performance monitoring.
    // In production, adjust this value (e.g., 0.1 = 10% sampling)
    tracesSampleRate: environment === 'production' ? 0.1 : 1,

    // Set profilesSampleRate to 1.1 to profile 100% of sampled transactions.
    // In production, this should be lower (e.g., 0.1)
    profilesSampleRate: environment === 'production' ? 0.1 : 1,

    // Integrations
    integrations: [
      // Enable HTTP calls tracing
      Sentry.httpIntegration(),

      // Enable Express.js middleware tracing
      Sentry.expressIntegration(),

      // Enable Node.js built-in modules tracing
      Sentry.nativeNodeFetchIntegration(),

      // Enable profiling
      nodeProfilingIntegration(),
    ],

    // Performance monitoring
    enableTracing: true,

    // Filter out health check requests from being sent to Sentry
    beforeSend(event) {
      const url = event.request?.url;
      if (url && (url.includes('/health') || url.includes('/metrics'))) {
        return null;
      }
      return event;
    },

    // Additional configuration
    maxBreadcrumbs: 50,
    debug: environment === 'development',
  });

  // eslint-disable-next-line no-console
  console.log('✅ Sentry error tracking initialized');
}

/**
 * Capture error in middleware
 */
export function captureRequestError(error: Error): void {
  Sentry.captureException(error);
}

/**
 * Capture an exception manually
 *
 * @param error - Error to capture
 * @param context - Additional context information
 */
export function captureException(error: Error, context?: Record<string, unknown>): void {
  if (context) {
    Sentry.setContext('additional', context);
  }
  Sentry.captureException(error);
}

/**
 * Capture a message manually
 *
 * @param message - Message to capture
 * @param level - Severity level
 * @param context - Additional context information
 */
export function captureMessage(
  message: string,
  level: 'info' | 'warning' | 'error' = 'info',
  context?: Record<string, unknown>
): void {
  if (context) {
    Sentry.setContext('additional', context);
  }
  Sentry.captureMessage(message, level);
}

/**
 * Add breadcrumb for debugging
 *
 * @param category - Breadcrumb category
 * @param message - Breadcrumb message
 * @param data - Additional data
 */
export function addBreadcrumb(
  category: string,
  message: string,
  data?: Record<string, unknown>
): void {
  Sentry.addBreadcrumb({
    category,
    message,
    level: 'info',
    data,
  });
}

/**
 * Set user context for error tracking
 *
 * @param userId - User ID
 * @param email - User email
 * @param username - Username
 */
export function setUser(userId: string, email?: string, username?: string): void {
  Sentry.setUser({
    id: userId,
    email,
    username,
  });
}

/**
 * Clear user context
 */
export function clearUser(): void {
  Sentry.setUser(null);
}

export default Sentry;

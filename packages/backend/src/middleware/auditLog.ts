// Audit logging middleware

import type { Request, Response, NextFunction } from 'express';
import type { AuthRequest } from './auth.js';
import db from '../db/connection.js';

export interface AuditLogEntry {
  farmId?: string;
  userId?: string;
  action: string;
  resourceType?: string;
  resourceId?: string;
  changes?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Log an audit event to the database
 */
export async function logAuditEvent(entry: AuditLogEntry): Promise<void> {
  try {
    await db('audit_logs').insert({
      farm_id: entry.farmId,
      user_id: entry.userId,
      action: entry.action,
      resource_type: entry.resourceType,
      resource_id: entry.resourceId,
      changes: entry.changes ? JSON.stringify(entry.changes) : null,
      ip_address: entry.ipAddress,
      user_agent: entry.userAgent,
    });
  } catch (error) {
    // Log error but don't fail the request
    console.error('Failed to create audit log:', error);
  }
}

/**
 * Extract IP address from request, handling proxies
 */
function getClientIp(req: Request): string | undefined {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  return req.ip || req.socket.remoteAddress;
}

/**
 * Middleware to automatically log data modification operations
 * Use this middleware after operations that modify data
 */
export function auditLog(action: string, resourceType?: string) {
  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    const originalJson = res.json.bind(res);

    // Intercept the response to log after successful operations
    res.json = function (body: any): Response {
      // Only log successful operations (status 2xx)
      if (res.statusCode >= 200 && res.statusCode < 300) {
        // Extract resource ID from response if available
        let resourceId: string | undefined;
        if (body?.data?.id) {
          resourceId = body.data.id;
        } else if (req.params?.id) {
          resourceId = req.params.id;
        }

        // Prepare audit log entry
        const entry: AuditLogEntry = {
          farmId: req.user?.farmId,
          userId: req.user?.id,
          action,
          resourceType,
          resourceId,
          ipAddress: getClientIp(req),
          userAgent: req.headers['user-agent'],
        };

        // For updates, capture the changes
        if (action === 'update' && req.body) {
          entry.changes = {
            updated: req.body,
          };
        }

        // For deletes, log the resource ID
        if (action === 'delete' && resourceId) {
          entry.changes = {
            deletedId: resourceId,
          };
        }

        // For creates, log the created data (excluding sensitive fields)
        if (action === 'create' && req.body) {
          const sanitizedBody = { ...req.body };
          // Remove sensitive fields
          delete sanitizedBody.password;
          delete sanitizedBody.password_hash;
          delete sanitizedBody.passwordHash;
          entry.changes = {
            created: sanitizedBody,
          };
        }

        // Log asynchronously without blocking response
        logAuditEvent(entry).catch((error) => {
          console.error('Audit log error:', error);
        });
      }

      return originalJson(body);
    };

    next();
  };
}

/**
 * Log authentication events (login, logout, failed attempts)
 */
export async function logAuthEvent(
  action: 'login' | 'logout' | 'login_failed' | 'token_refresh',
  req: AuthRequest,
  userId?: string,
  additionalInfo?: Record<string, any>
): Promise<void> {
  const entry: AuditLogEntry = {
    userId,
    farmId: req.user?.farmId,
    action,
    resourceType: 'auth',
    ipAddress: getClientIp(req),
    userAgent: req.headers['user-agent'],
    changes: additionalInfo,
  };

  await logAuditEvent(entry);
}

/**
 * Log access to sensitive personal data
 */
export async function logDataAccess(
  req: AuthRequest,
  resourceType: string,
  resourceId: string,
  accessType: 'read' | 'list' = 'read'
): Promise<void> {
  // Only log access to personal data
  const personalDataTypes = ['worker', 'user', 'certification'];

  if (!personalDataTypes.includes(resourceType)) {
    return;
  }

  const entry: AuditLogEntry = {
    userId: req.user?.id,
    farmId: req.user?.farmId,
    action: `${accessType}_${resourceType}`,
    resourceType,
    resourceId: accessType === 'read' ? resourceId : undefined,
    ipAddress: getClientIp(req),
    userAgent: req.headers['user-agent'],
  };

  await logAuditEvent(entry);
}

/**
 * Middleware to log read access to sensitive resources
 */
export function auditReadAccess(resourceType: string) {
  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    const originalJson = res.json.bind(res);

    res.json = function (body: any): Response {
      // Only log successful reads
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const resourceId = req.params?.id || body?.data?.id;

        if (resourceId) {
          logDataAccess(req, resourceType, resourceId, 'read').catch((error) => {
            console.error('Audit log error:', error);
          });
        }
      }

      return originalJson(body);
    };

    next();
  };
}

/**
 * Middleware to log bulk operations (list endpoints)
 */
export function auditListAccess(resourceType: string) {
  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    const originalJson = res.json.bind(res);

    res.json = function (body: any): Response {
      // Only log successful list operations
      if (res.statusCode >= 200 && res.statusCode < 300) {
        logDataAccess(req, resourceType, '', 'list').catch((error) => {
          console.error('Audit log error:', error);
        });
      }

      return originalJson(body);
    };

    next();
  };
}

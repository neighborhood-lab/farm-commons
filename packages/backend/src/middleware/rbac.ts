// Role-Based Access Control (RBAC) middleware
// Fine-grained permission system for Farm Commons

import type { Response, NextFunction } from 'express';
import type { UserRole } from '@farm-commons/shared';
import type { AuthRequest } from './auth.js';
import db from '../db/connection.js';
import { AppError } from './errorHandler.js';

// Permission types
export enum Permission {
  READ = 'read',
  WRITE = 'write',
  DELETE = 'delete',
  VERIFY = 'verify',
  MANAGE_USERS = 'manage_users',
}

// Resource types
export enum Resource {
  WORKER = 'worker',
  SCHEDULE = 'schedule',
  TIME_ENTRY = 'time_entry',
  FIELD = 'field',
  CERTIFICATION = 'certification',
  FARM = 'farm',
  USER = 'user',
  STATS = 'stats',
}

// Role permissions matrix
// Defines what permissions each role has for each resource
const ROLE_PERMISSIONS: Record<UserRole, Record<Resource, Permission[]>> = {
  worker: {
    [Resource.WORKER]: [Permission.READ], // Can only read own data
    [Resource.SCHEDULE]: [Permission.READ], // Can only read own schedules
    [Resource.TIME_ENTRY]: [Permission.READ, Permission.WRITE], // Can read own and clock in/out
    [Resource.FIELD]: [Permission.READ], // Can read fields (for tasks)
    [Resource.CERTIFICATION]: [Permission.READ], // Can only read own certifications
    [Resource.FARM]: [], // No access
    [Resource.USER]: [], // No access
    [Resource.STATS]: [Permission.READ], // Can only read own stats
  },
  manager: {
    [Resource.WORKER]: [Permission.READ, Permission.WRITE, Permission.DELETE],
    [Resource.SCHEDULE]: [Permission.READ, Permission.WRITE, Permission.DELETE],
    [Resource.TIME_ENTRY]: [Permission.READ, Permission.WRITE, Permission.VERIFY],
    [Resource.FIELD]: [Permission.READ, Permission.WRITE, Permission.DELETE],
    [Resource.CERTIFICATION]: [Permission.READ, Permission.WRITE, Permission.DELETE],
    [Resource.FARM]: [Permission.READ, Permission.WRITE],
    [Resource.USER]: [Permission.READ], // Can read users in farm
    [Resource.STATS]: [Permission.READ], // Can read all farm stats
  },
  admin: {
    [Resource.WORKER]: [Permission.READ, Permission.WRITE, Permission.DELETE],
    [Resource.SCHEDULE]: [Permission.READ, Permission.WRITE, Permission.DELETE],
    [Resource.TIME_ENTRY]: [Permission.READ, Permission.WRITE, Permission.DELETE, Permission.VERIFY],
    [Resource.FIELD]: [Permission.READ, Permission.WRITE, Permission.DELETE],
    [Resource.CERTIFICATION]: [Permission.READ, Permission.WRITE, Permission.DELETE],
    [Resource.FARM]: [Permission.READ, Permission.WRITE, Permission.DELETE],
    [Resource.USER]: [Permission.READ, Permission.WRITE, Permission.DELETE, Permission.MANAGE_USERS],
    [Resource.STATS]: [Permission.READ], // Can read all farm stats
  },
};

/**
 * Check if a role has a specific permission for a resource
 */
export function hasPermission(
  role: UserRole,
  resource: Resource,
  permission: Permission
): boolean {
  const permissions = ROLE_PERMISSIONS[role]?.[resource] || [];
  return permissions.includes(permission);
}

/**
 * Middleware to check if user has permission for a resource
 * @param resource - The resource type being accessed
 * @param permission - The permission required
 */
export function requirePermission(resource: Resource, permission: Permission) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    const userRole = req.user.role;

    if (!hasPermission(userRole, resource, permission)) {
      res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
        details: `Role '${userRole}' does not have '${permission}' permission for '${resource}'`,
      });
      return;
    }

    next();
  };
}

/**
 * Check if user owns a worker record or has manager/admin privileges
 */
export async function checkWorkerOwnership(
  userId: string,
  workerId: string,
  userRole: UserRole,
  farmId: string
): Promise<boolean> {
  // Managers and admins can access all workers in their farm
  if (userRole === 'manager' || userRole === 'admin') {
    // Verify worker belongs to the same farm
    const worker = await db('workers')
      .where({ id: workerId, farm_id: farmId })
      .first();
    return !!worker;
  }

  // Workers can only access their own data
  if (userRole === 'worker') {
    const worker = await db('workers')
      .where({ id: workerId, user_id: userId, farm_id: farmId })
      .first();
    return !!worker;
  }

  return false;
}

/**
 * Middleware to check worker resource ownership
 * Allows access if user is the worker owner OR has manager/admin role
 */
export function requireWorkerOwnership() {
  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    const workerId = req.params.workerId || req.params.id;
    if (!workerId) {
      res.status(400).json({
        success: false,
        error: 'Worker ID required',
      });
      return;
    }

    try {
      const hasAccess = await checkWorkerOwnership(
        req.user.id,
        workerId,
        req.user.role,
        req.user.farm_id
      );

      if (!hasAccess) {
        res.status(403).json({
          success: false,
          error: 'Access denied: You can only access your own worker data',
        });
        return;
      }

      next();
    } catch {
      next(error);
    }
  };
}

/**
 * Check if user owns a time entry or has manager/admin privileges
 */
export async function checkTimeEntryOwnership(
  userId: string,
  timeEntryId: string,
  userRole: UserRole,
  farmId: string
): Promise<boolean> {
  // Managers and admins can access all time entries in their farm
  if (userRole === 'manager' || userRole === 'admin') {
    const entry = await db('time_entries')
      .where({ id: timeEntryId, farm_id: farmId })
      .first();
    return !!entry;
  }

  // Workers can only access their own time entries
  if (userRole === 'worker') {
    const entry = await db('time_entries')
      .join('workers', 'time_entries.worker_id', 'workers.id')
      .where({
        'time_entries.id': timeEntryId,
        'time_entries.farm_id': farmId,
        'workers.user_id': userId,
      })
      .first();
    return !!entry;
  }

  return false;
}

/**
 * Middleware to check time entry resource ownership
 */
export function requireTimeEntryOwnership() {
  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    const timeEntryId = req.params.id;
    if (!timeEntryId) {
      res.status(400).json({
        success: false,
        error: 'Time entry ID required',
      });
      return;
    }

    try {
      const hasAccess = await checkTimeEntryOwnership(
        req.user.id,
        timeEntryId,
        req.user.role,
        req.user.farm_id
      );

      if (!hasAccess) {
        res.status(403).json({
          success: false,
          error: 'Access denied: You can only access your own time entries',
        });
        return;
      }

      next();
    } catch {
      next(error);
    }
  };
}

/**
 * Check if user owns a schedule or has manager/admin privileges
 */
export async function checkScheduleOwnership(
  userId: string,
  scheduleId: string,
  userRole: UserRole,
  farmId: string
): Promise<boolean> {
  // Managers and admins can access all schedules in their farm
  if (userRole === 'manager' || userRole === 'admin') {
    const schedule = await db('schedules')
      .where({ id: scheduleId, farm_id: farmId })
      .first();
    return !!schedule;
  }

  // Workers can only access their own schedules
  if (userRole === 'worker') {
    const schedule = await db('schedules')
      .join('workers', 'schedules.worker_id', 'workers.id')
      .where({
        'schedules.id': scheduleId,
        'schedules.farm_id': farmId,
        'workers.user_id': userId,
      })
      .first();
    return !!schedule;
  }

  return false;
}

/**
 * Middleware to check schedule resource ownership
 */
export function requireScheduleOwnership() {
  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    const scheduleId = req.params.id;
    if (!scheduleId) {
      res.status(400).json({
        success: false,
        error: 'Schedule ID required',
      });
      return;
    }

    try {
      const hasAccess = await checkScheduleOwnership(
        req.user.id,
        scheduleId,
        req.user.role,
        req.user.farm_id
      );

      if (!hasAccess) {
        res.status(403).json({
          success: false,
          error: 'Access denied: You can only access your own schedules',
        });
        return;
      }

      next();
    } catch {
      next(error);
    }
  };
}

/**
 * Check if user owns a certification or has manager/admin privileges
 */
export async function checkCertificationOwnership(
  userId: string,
  certificationId: string,
  userRole: UserRole,
  farmId: string
): Promise<boolean> {
  // Managers and admins can access all certifications in their farm
  if (userRole === 'manager' || userRole === 'admin') {
    const cert = await db('certifications')
      .join('workers', 'certifications.worker_id', 'workers.id')
      .where({
        'certifications.id': certificationId,
        'workers.farm_id': farmId,
      })
      .first();
    return !!cert;
  }

  // Workers can only access their own certifications
  if (userRole === 'worker') {
    const cert = await db('certifications')
      .join('workers', 'certifications.worker_id', 'workers.id')
      .where({
        'certifications.id': certificationId,
        'workers.farm_id': farmId,
        'workers.user_id': userId,
      })
      .first();
    return !!cert;
  }

  return false;
}

/**
 * Middleware to check certification resource ownership
 */
export function requireCertificationOwnership() {
  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    const certificationId = req.params.id;
    if (!certificationId) {
      res.status(400).json({
        success: false,
        error: 'Certification ID required',
      });
      return;
    }

    try {
      const hasAccess = await checkCertificationOwnership(
        req.user.id,
        certificationId,
        req.user.role,
        req.user.farm_id
      );

      if (!hasAccess) {
        res.status(403).json({
          success: false,
          error: 'Access denied: You can only access your own certifications',
        });
        return;
      }

      next();
    } catch {
      next(error);
    }
  };
}

/**
 * Filter query results based on user role
 * Workers only see their own data, managers/admins see all farm data
 */
export async function getWorkerIdForUser(userId: string, farmId: string): Promise<string | null> {
  const worker = await db('workers')
    .where({ user_id: userId, farm_id: farmId })
    .first();
  return worker?.id || null;
}

/**
 * Utility to check if user can manage other users
 * Only admins can manage users
 */
export function canManageUsers(role: UserRole): boolean {
  return hasPermission(role, Resource.USER, Permission.MANAGE_USERS);
}

/**
 * Utility to check if user can verify time entries
 * Managers and admins can verify
 */
export function canVerifyTimeEntries(role: UserRole): boolean {
  return hasPermission(role, Resource.TIME_ENTRY, Permission.VERIFY);
}

/**
 * Middleware to ensure only admins can access user management endpoints
 */
export function requireUserManagement() {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    if (!canManageUsers(req.user.role)) {
      res.status(403).json({
        success: false,
        error: 'Only administrators can manage users',
      });
      return;
    }

    next();
  };
}

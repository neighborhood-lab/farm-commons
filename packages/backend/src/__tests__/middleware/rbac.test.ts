// RBAC Middleware Integration Tests
import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { Response, NextFunction } from 'express';
import type { UserRole } from '@farm-commons/shared';
import {
  hasPermission,
  Permission,
  Resource,
  requirePermission,
  checkWorkerOwnership,
  checkTimeEntryOwnership,
  checkScheduleOwnership,
  checkCertificationOwnership,
  requireWorkerOwnership,
  requireTimeEntryOwnership,
  requireScheduleOwnership,
  requireCertificationOwnership,
  canManageUsers,
  canVerifyTimeEntries,
  requireUserManagement,
  getWorkerIdForUser,
} from '../../middleware/rbac.js';
import type { AuthRequest } from '../../middleware/auth.js';
import db from '../../db/connection.js';

// Mock database
vi.mock('../../db/connection.js', () => ({
  default: vi.fn(),
}));

describe('RBAC Middleware', () => {
  describe('hasPermission', () => {
    it('should return true when admin has manage_users permission', () => {
      expect(hasPermission('admin', Resource.USER, Permission.MANAGE_USERS)).toBe(true);
    });

    it('should return false when manager does not have manage_users permission', () => {
      expect(hasPermission('manager', Resource.USER, Permission.MANAGE_USERS)).toBe(false);
    });

    it('should return false when worker does not have manage_users permission', () => {
      expect(hasPermission('worker', Resource.USER, Permission.MANAGE_USERS)).toBe(false);
    });

    it('should return true when manager has read permission for workers', () => {
      expect(hasPermission('manager', Resource.WORKER, Permission.READ)).toBe(true);
    });

    it('should return true when worker has read permission for own data', () => {
      expect(hasPermission('worker', Resource.WORKER, Permission.READ)).toBe(true);
    });

    it('should return false when worker does not have write permission for workers', () => {
      expect(hasPermission('worker', Resource.WORKER, Permission.WRITE)).toBe(false);
    });

    it('should return true when manager has verify permission for time entries', () => {
      expect(hasPermission('manager', Resource.TIME_ENTRY, Permission.VERIFY)).toBe(true);
    });

    it('should return false when worker does not have verify permission for time entries', () => {
      expect(hasPermission('worker', Resource.TIME_ENTRY, Permission.VERIFY)).toBe(false);
    });

    it('should return true when admin has all permissions', () => {
      expect(hasPermission('admin', Resource.WORKER, Permission.DELETE)).toBe(true);
      expect(hasPermission('admin', Resource.TIME_ENTRY, Permission.DELETE)).toBe(true);
      expect(hasPermission('admin', Resource.FARM, Permission.DELETE)).toBe(true);
    });
  });

  describe('requirePermission middleware', () => {
    let mockReq: Partial<AuthRequest>;
    let mockRes: Partial<Response>;
    let mockNext: NextFunction;

    beforeEach(() => {
      mockReq = {
        user: {
          id: 'user-1',
          email: 'test@example.com',
          role: 'worker',
          farm_id: 'farm-1',
        },
      };
      mockRes = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };
      mockNext = vi.fn();
    });

    it('should call next when user has required permission', () => {
      mockReq.user!.role = 'manager';
      const middleware = requirePermission(Resource.WORKER, Permission.WRITE);
      middleware(mockReq as AuthRequest, mockRes as Response, mockNext);
      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should return 403 when user lacks required permission', () => {
      mockReq.user!.role = 'worker';
      const middleware = requirePermission(Resource.WORKER, Permission.WRITE);
      middleware(mockReq as AuthRequest, mockRes as Response, mockNext);
      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Insufficient permissions',
        })
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 when user is not authenticated', () => {
      mockReq.user = undefined;
      const middleware = requirePermission(Resource.WORKER, Permission.READ);
      middleware(mockReq as AuthRequest, mockRes as Response, mockNext);
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Authentication required',
        })
      );
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('checkWorkerOwnership', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should return true when admin accesses worker in same farm', async () => {
      const mockDb = vi.fn(() => ({
        where: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue({ id: 'worker-1', farm_id: 'farm-1' }),
      }));
      (db as any).mockImplementation(mockDb);

      const result = await checkWorkerOwnership('user-1', 'worker-1', 'admin', 'farm-1');
      expect(result).toBe(true);
    });

    it('should return true when manager accesses worker in same farm', async () => {
      const mockDb = vi.fn(() => ({
        where: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue({ id: 'worker-1', farm_id: 'farm-1' }),
      }));
      (db as any).mockImplementation(mockDb);

      const result = await checkWorkerOwnership('user-1', 'worker-1', 'manager', 'farm-1');
      expect(result).toBe(true);
    });

    it('should return false when manager tries to access worker from different farm', async () => {
      const mockDb = vi.fn(() => ({
        where: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue(null),
      }));
      (db as any).mockImplementation(mockDb);

      const result = await checkWorkerOwnership('user-1', 'worker-1', 'manager', 'farm-1');
      expect(result).toBe(false);
    });

    it('should return true when worker accesses own data', async () => {
      const mockDb = vi.fn(() => ({
        where: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue({ id: 'worker-1', user_id: 'user-1', farm_id: 'farm-1' }),
      }));
      (db as any).mockImplementation(mockDb);

      const result = await checkWorkerOwnership('user-1', 'worker-1', 'worker', 'farm-1');
      expect(result).toBe(true);
    });

    it('should return false when worker tries to access another worker\'s data', async () => {
      const mockDb = vi.fn(() => ({
        where: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue(null),
      }));
      (db as any).mockImplementation(mockDb);

      const result = await checkWorkerOwnership('user-1', 'worker-2', 'worker', 'farm-1');
      expect(result).toBe(false);
    });
  });

  describe('checkTimeEntryOwnership', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should return true when admin accesses time entry in same farm', async () => {
      const mockDb = vi.fn(() => ({
        where: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue({ id: 'entry-1', farm_id: 'farm-1' }),
      }));
      (db as any).mockImplementation(mockDb);

      const result = await checkTimeEntryOwnership('user-1', 'entry-1', 'admin', 'farm-1');
      expect(result).toBe(true);
    });

    it('should return true when worker accesses own time entry', async () => {
      const mockDb = vi.fn(() => ({
        join: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue({
          id: 'entry-1',
          farm_id: 'farm-1',
          worker_id: 'worker-1',
        }),
      }));
      (db as any).mockImplementation(mockDb);

      const result = await checkTimeEntryOwnership('user-1', 'entry-1', 'worker', 'farm-1');
      expect(result).toBe(true);
    });

    it('should return false when worker tries to access another worker\'s time entry', async () => {
      const mockDb = vi.fn(() => ({
        join: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue(null),
      }));
      (db as any).mockImplementation(mockDb);

      const result = await checkTimeEntryOwnership('user-1', 'entry-2', 'worker', 'farm-1');
      expect(result).toBe(false);
    });
  });

  describe('checkScheduleOwnership', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should return true when manager accesses schedule in same farm', async () => {
      const mockDb = vi.fn(() => ({
        where: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue({ id: 'schedule-1', farm_id: 'farm-1' }),
      }));
      (db as any).mockImplementation(mockDb);

      const result = await checkScheduleOwnership('user-1', 'schedule-1', 'manager', 'farm-1');
      expect(result).toBe(true);
    });

    it('should return true when worker accesses own schedule', async () => {
      const mockDb = vi.fn(() => ({
        join: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue({
          id: 'schedule-1',
          farm_id: 'farm-1',
          worker_id: 'worker-1',
        }),
      }));
      (db as any).mockImplementation(mockDb);

      const result = await checkScheduleOwnership('user-1', 'schedule-1', 'worker', 'farm-1');
      expect(result).toBe(true);
    });

    it('should return false when worker tries to access another worker\'s schedule', async () => {
      const mockDb = vi.fn(() => ({
        join: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue(null),
      }));
      (db as any).mockImplementation(mockDb);

      const result = await checkScheduleOwnership('user-1', 'schedule-2', 'worker', 'farm-1');
      expect(result).toBe(false);
    });
  });

  describe('checkCertificationOwnership', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should return true when admin accesses certification in same farm', async () => {
      const mockDb = vi.fn(() => ({
        join: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue({
          id: 'cert-1',
          worker_id: 'worker-1',
          farm_id: 'farm-1',
        }),
      }));
      (db as any).mockImplementation(mockDb);

      const result = await checkCertificationOwnership('user-1', 'cert-1', 'admin', 'farm-1');
      expect(result).toBe(true);
    });

    it('should return true when worker accesses own certification', async () => {
      const mockDb = vi.fn(() => ({
        join: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue({
          id: 'cert-1',
          worker_id: 'worker-1',
          user_id: 'user-1',
          farm_id: 'farm-1',
        }),
      }));
      (db as any).mockImplementation(mockDb);

      const result = await checkCertificationOwnership('user-1', 'cert-1', 'worker', 'farm-1');
      expect(result).toBe(true);
    });

    it('should return false when worker tries to access another worker\'s certification', async () => {
      const mockDb = vi.fn(() => ({
        join: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue(null),
      }));
      (db as any).mockImplementation(mockDb);

      const result = await checkCertificationOwnership('user-1', 'cert-2', 'worker', 'farm-1');
      expect(result).toBe(false);
    });
  });

  describe('requireWorkerOwnership middleware', () => {
    let mockReq: Partial<AuthRequest>;
    let mockRes: Partial<Response>;
    let mockNext: NextFunction;

    beforeEach(() => {
      vi.clearAllMocks();
      mockReq = {
        user: {
          id: 'user-1',
          email: 'test@example.com',
          role: 'worker',
          farm_id: 'farm-1',
        },
        params: { id: 'worker-1' },
      };
      mockRes = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };
      mockNext = vi.fn();
    });

    it('should call next when user has access to worker', async () => {
      const mockDb = vi.fn(() => ({
        where: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue({ id: 'worker-1', user_id: 'user-1', farm_id: 'farm-1' }),
      }));
      (db as any).mockImplementation(mockDb);

      const middleware = requireWorkerOwnership();
      await middleware(mockReq as AuthRequest, mockRes as Response, mockNext);
      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should return 403 when user does not have access to worker', async () => {
      const mockDb = vi.fn(() => ({
        where: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue(null),
      }));
      (db as any).mockImplementation(mockDb);

      const middleware = requireWorkerOwnership();
      await middleware(mockReq as AuthRequest, mockRes as Response, mockNext);
      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Access denied: You can only access your own worker data',
        })
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 400 when worker ID is missing', async () => {
      mockReq.params = {};
      const middleware = requireWorkerOwnership();
      await middleware(mockReq as AuthRequest, mockRes as Response, mockNext);
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Worker ID required',
        })
      );
    });

    it('should return 401 when user is not authenticated', async () => {
      mockReq.user = undefined;
      const middleware = requireWorkerOwnership();
      await middleware(mockReq as AuthRequest, mockRes as Response, mockNext);
      expect(mockRes.status).toHaveBeenCalledWith(401);
    });
  });

  describe('canManageUsers', () => {
    it('should return true for admin', () => {
      expect(canManageUsers('admin')).toBe(true);
    });

    it('should return false for manager', () => {
      expect(canManageUsers('manager')).toBe(false);
    });

    it('should return false for worker', () => {
      expect(canManageUsers('worker')).toBe(false);
    });
  });

  describe('canVerifyTimeEntries', () => {
    it('should return true for admin', () => {
      expect(canVerifyTimeEntries('admin')).toBe(true);
    });

    it('should return true for manager', () => {
      expect(canVerifyTimeEntries('manager')).toBe(true);
    });

    it('should return false for worker', () => {
      expect(canVerifyTimeEntries('worker')).toBe(false);
    });
  });

  describe('requireUserManagement middleware', () => {
    let mockReq: Partial<AuthRequest>;
    let mockRes: Partial<Response>;
    let mockNext: NextFunction;

    beforeEach(() => {
      mockReq = {
        user: {
          id: 'user-1',
          email: 'test@example.com',
          role: 'admin',
          farm_id: 'farm-1',
        },
      };
      mockRes = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };
      mockNext = vi.fn();
    });

    it('should call next when user is admin', () => {
      const middleware = requireUserManagement();
      middleware(mockReq as AuthRequest, mockRes as Response, mockNext);
      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should return 403 when user is not admin', () => {
      mockReq.user!.role = 'manager';
      const middleware = requireUserManagement();
      middleware(mockReq as AuthRequest, mockRes as Response, mockNext);
      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Only administrators can manage users',
        })
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 when user is not authenticated', () => {
      mockReq.user = undefined;
      const middleware = requireUserManagement();
      middleware(mockReq as AuthRequest, mockRes as Response, mockNext);
      expect(mockRes.status).toHaveBeenCalledWith(401);
    });
  });

  describe('getWorkerIdForUser', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should return worker ID when worker exists for user', async () => {
      const mockDb = vi.fn(() => ({
        where: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue({ id: 'worker-1', user_id: 'user-1' }),
      }));
      (db as any).mockImplementation(mockDb);

      const result = await getWorkerIdForUser('user-1', 'farm-1');
      expect(result).toBe('worker-1');
    });

    it('should return null when worker does not exist for user', async () => {
      const mockDb = vi.fn(() => ({
        where: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue(null),
      }));
      (db as any).mockImplementation(mockDb);

      const result = await getWorkerIdForUser('user-1', 'farm-1');
      expect(result).toBe(null);
    });
  });

  describe('Permission Matrix - Worker Role', () => {
    it('should have correct permissions for worker role', () => {
      // Workers can only read their own data
      expect(hasPermission('worker', Resource.WORKER, Permission.READ)).toBe(true);
      expect(hasPermission('worker', Resource.WORKER, Permission.WRITE)).toBe(false);
      expect(hasPermission('worker', Resource.WORKER, Permission.DELETE)).toBe(false);

      // Workers can read and write their own time entries
      expect(hasPermission('worker', Resource.TIME_ENTRY, Permission.READ)).toBe(true);
      expect(hasPermission('worker', Resource.TIME_ENTRY, Permission.WRITE)).toBe(true);
      expect(hasPermission('worker', Resource.TIME_ENTRY, Permission.DELETE)).toBe(false);
      expect(hasPermission('worker', Resource.TIME_ENTRY, Permission.VERIFY)).toBe(false);

      // Workers can only read schedules
      expect(hasPermission('worker', Resource.SCHEDULE, Permission.READ)).toBe(true);
      expect(hasPermission('worker', Resource.SCHEDULE, Permission.WRITE)).toBe(false);

      // Workers cannot access farm management
      expect(hasPermission('worker', Resource.FARM, Permission.READ)).toBe(false);
      expect(hasPermission('worker', Resource.FARM, Permission.WRITE)).toBe(false);
    });
  });

  describe('Permission Matrix - Manager Role', () => {
    it('should have correct permissions for manager role', () => {
      // Managers can manage workers
      expect(hasPermission('manager', Resource.WORKER, Permission.READ)).toBe(true);
      expect(hasPermission('manager', Resource.WORKER, Permission.WRITE)).toBe(true);
      expect(hasPermission('manager', Resource.WORKER, Permission.DELETE)).toBe(true);

      // Managers can manage time entries and verify them
      expect(hasPermission('manager', Resource.TIME_ENTRY, Permission.READ)).toBe(true);
      expect(hasPermission('manager', Resource.TIME_ENTRY, Permission.WRITE)).toBe(true);
      expect(hasPermission('manager', Resource.TIME_ENTRY, Permission.VERIFY)).toBe(true);
      expect(hasPermission('manager', Resource.TIME_ENTRY, Permission.DELETE)).toBe(false);

      // Managers can manage schedules
      expect(hasPermission('manager', Resource.SCHEDULE, Permission.READ)).toBe(true);
      expect(hasPermission('manager', Resource.SCHEDULE, Permission.WRITE)).toBe(true);
      expect(hasPermission('manager', Resource.SCHEDULE, Permission.DELETE)).toBe(true);

      // Managers can read and write farm data
      expect(hasPermission('manager', Resource.FARM, Permission.READ)).toBe(true);
      expect(hasPermission('manager', Resource.FARM, Permission.WRITE)).toBe(true);
      expect(hasPermission('manager', Resource.FARM, Permission.DELETE)).toBe(false);

      // Managers cannot manage users
      expect(hasPermission('manager', Resource.USER, Permission.MANAGE_USERS)).toBe(false);
    });
  });

  describe('Permission Matrix - Admin Role', () => {
    it('should have correct permissions for admin role', () => {
      // Admins have full access to everything
      expect(hasPermission('admin', Resource.WORKER, Permission.READ)).toBe(true);
      expect(hasPermission('admin', Resource.WORKER, Permission.WRITE)).toBe(true);
      expect(hasPermission('admin', Resource.WORKER, Permission.DELETE)).toBe(true);

      expect(hasPermission('admin', Resource.TIME_ENTRY, Permission.READ)).toBe(true);
      expect(hasPermission('admin', Resource.TIME_ENTRY, Permission.WRITE)).toBe(true);
      expect(hasPermission('admin', Resource.TIME_ENTRY, Permission.DELETE)).toBe(true);
      expect(hasPermission('admin', Resource.TIME_ENTRY, Permission.VERIFY)).toBe(true);

      expect(hasPermission('admin', Resource.FARM, Permission.READ)).toBe(true);
      expect(hasPermission('admin', Resource.FARM, Permission.WRITE)).toBe(true);
      expect(hasPermission('admin', Resource.FARM, Permission.DELETE)).toBe(true);

      expect(hasPermission('admin', Resource.USER, Permission.READ)).toBe(true);
      expect(hasPermission('admin', Resource.USER, Permission.WRITE)).toBe(true);
      expect(hasPermission('admin', Resource.USER, Permission.DELETE)).toBe(true);
      expect(hasPermission('admin', Resource.USER, Permission.MANAGE_USERS)).toBe(true);
    });
  });
});

// Tests for audit logging middleware

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { Request, Response, NextFunction } from 'express';
import type { AuthRequest } from '../auth.js';
import {
  logAuditEvent,
  auditLog,
  logAuthEvent,
  logDataAccess,
  auditReadAccess,
  auditListAccess,
} from '../auditLog.js';
import db from '../../db/connection.js';

// Mock the database
vi.mock('../../db/connection.js', () => ({
  default: vi.fn(() => ({
    insert: vi.fn().mockReturnThis(),
  })),
}));

describe('Audit Logging Middleware', () => {
  let mockRequest: Partial<AuthRequest>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;
  let jsonSpy: any;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();

    // Mock console.error to suppress error logs in tests
    vi.spyOn(console, 'error').mockImplementation(() => {});

    // Setup mock request
    mockRequest = {
      user: {
        id: 'user-123',
        farm_id: 'farm-123',
        email: 'test@example.com',
        role: 'manager',
      },
      params: {},
      body: {},
      headers: {
        'user-agent': 'test-agent',
      },
      ip: '127.1.1.1',
    };

    // Setup mock response with json spy
    jsonSpy = vi.fn().mockImplementation(function (this: any, body: any) {
      return this;
    });

    mockResponse = {
      json: jsonSpy,
      statusCode: 200,
    };

    nextFunction = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('logAuditEvent', () => {
    it('should log an audit event to the database', async () => {
      const mockInsert = vi.fn().mockResolvedValue([{ id: 'log-123' }]);
      const mockDb = vi.fn(() => ({
        insert: mockInsert,
      }));
      (db as any).mockImplementation(mockDb);

      await logAuditEvent({
        farm_id: 'farm-123',
        userId: 'user-123',
        action: 'create',
        resourceType: 'worker',
        resourceId: 'worker-123',
        ipAddress: '127.1.1.1',
        userAgent: 'test-agent',
      });

      expect(mockDb).toHaveBeenCalledWith('audit_logs');
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          farm_id: 'farm-123',
          user_id: 'user-123',
          action: 'create',
          resource_type: 'worker',
          resource_id: 'worker-123',
          ip_address: '127.1.1.1',
          user_agent: 'test-agent',
        })
      );
    });

    it('should handle errors gracefully', async () => {
      const mockInsert = vi.fn().mockRejectedValue(new Error('DB error'));
      const mockDb = vi.fn(() => ({
        insert: mockInsert,
      }));
      (db as any).mockImplementation(mockDb);

      // Should not throw
      await expect(
        logAuditEvent({
          farm_id: 'farm-123',
          userId: 'user-123',
          action: 'create',
        })
      ).resolves.not.toThrow();

      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('auditLog middleware', () => {
    it('should log create actions on successful response', async () => {
      const middleware = auditLog('create', 'worker');
      mockResponse.statusCode = 201;
      mockRequest.body = { first_name: 'John', last_name: 'Doe' };

      const mockInsert = vi.fn().mockResolvedValue([{ id: 'log-123' }]);
      const mockDb = vi.fn(() => ({
        insert: mockInsert,
      }));
      (db as any).mockImplementation(mockDb);

      middleware(mockRequest as AuthRequest, mockResponse as Response, nextFunction);

      // Call the intercepted json method
      mockResponse.json!({ success: true, data: { id: 'worker-123' } });

      // Wait for async operations
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(nextFunction).toHaveBeenCalled();
      expect(mockDb).toHaveBeenCalledWith('audit_logs');
    });

    it('should log update actions with changes', async () => {
      const middleware = auditLog('update', 'worker');
      mockRequest.params = { id: 'worker-123' };
      mockRequest.body = { hourly_rate: 15.5 };

      const mockInsert = vi.fn().mockResolvedValue([{ id: 'log-123' }]);
      const mockDb = vi.fn(() => ({
        insert: mockInsert,
      }));
      (db as any).mockImplementation(mockDb);

      middleware(mockRequest as AuthRequest, mockResponse as Response, nextFunction);

      // Call the intercepted json method
      mockResponse.json!({ success: true, data: { id: 'worker-123' } });

      // Wait for async operations
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(mockDb).toHaveBeenCalledWith('audit_logs');
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'update',
          resource_type: 'worker',
          resource_id: 'worker-123',
        })
      );
    });

    it('should log delete actions', async () => {
      const middleware = auditLog('delete', 'worker');
      mockRequest.params = { id: 'worker-123' };

      const mockInsert = vi.fn().mockResolvedValue([{ id: 'log-123' }]);
      const mockDb = vi.fn(() => ({
        insert: mockInsert,
      }));
      (db as any).mockImplementation(mockDb);

      middleware(mockRequest as AuthRequest, mockResponse as Response, nextFunction);

      // Call the intercepted json method
      mockResponse.json!({ success: true, message: 'Deleted' });

      // Wait for async operations
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(mockDb).toHaveBeenCalledWith('audit_logs');
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'delete',
          resource_type: 'worker',
          resource_id: 'worker-123',
        })
      );
    });

    it('should not log on error responses', async () => {
      const middleware = auditLog('create', 'worker');
      mockResponse.statusCode = 400;

      const mockDb = vi.fn();
      (db as any).mockImplementation(mockDb);

      middleware(mockRequest as AuthRequest, mockResponse as Response, nextFunction);

      // Call the intercepted json method
      mockResponse.json!({ success: false, error: 'Bad request' });

      // Wait for async operations
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Should not have called db
      expect(mockDb).not.toHaveBeenCalled();
    });

    it('should sanitize sensitive fields from logged data', async () => {
      const middleware = auditLog('create', 'user');
      mockRequest.body = {
        email: 'user@example.com',
        password: 'secret123',
        password_hash: 'hashed',
      };

      const mockInsert = vi.fn().mockResolvedValue([{ id: 'log-123' }]);
      const mockDb = vi.fn(() => ({
        insert: mockInsert,
      }));
      (db as any).mockImplementation(mockDb);

      middleware(mockRequest as AuthRequest, mockResponse as Response, nextFunction);

      // Call the intercepted json method
      mockResponse.json!({ success: true, data: { id: 'user-123' } });

      // Wait for async operations
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          changes: expect.not.stringContaining('password'),
        })
      );
    });
  });

  describe('logAuthEvent', () => {
    it('should log login events', async () => {
      const mockInsert = vi.fn().mockResolvedValue([{ id: 'log-123' }]);
      const mockDb = vi.fn(() => ({
        insert: mockInsert,
      }));
      (db as any).mockImplementation(mockDb);

      await logAuthEvent('login', mockRequest as AuthRequest, 'user-123', {
        email: 'test@example.com',
      });

      expect(mockDb).toHaveBeenCalledWith('audit_logs');
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'login',
          resource_type: 'auth',
          user_id: 'user-123',
        })
      );
    });

    it('should log failed login attempts', async () => {
      const mockInsert = vi.fn().mockResolvedValue([{ id: 'log-123' }]);
      const mockDb = vi.fn(() => ({
        insert: mockInsert,
      }));
      (db as any).mockImplementation(mockDb);

      await logAuthEvent('login_failed', mockRequest as AuthRequest, undefined, {
        email: 'test@example.com',
        reason: 'invalid_password',
      });

      expect(mockDb).toHaveBeenCalledWith('audit_logs');
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'login_failed',
          resource_type: 'auth',
        })
      );
    });
  });

  describe('logDataAccess', () => {
    it('should log access to personal data', async () => {
      const mockInsert = vi.fn().mockResolvedValue([{ id: 'log-123' }]);
      const mockDb = vi.fn(() => ({
        insert: mockInsert,
      }));
      (db as any).mockImplementation(mockDb);

      await logDataAccess(
        mockRequest as AuthRequest,
        'worker',
        'worker-123',
        'read'
      );

      expect(mockDb).toHaveBeenCalledWith('audit_logs');
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'read_worker',
          resource_type: 'worker',
          resource_id: 'worker-123',
        })
      );
    });

    it('should not log access to non-personal data', async () => {
      const mockDb = vi.fn();
      (db as any).mockImplementation(mockDb);

      await logDataAccess(
        mockRequest as AuthRequest,
        'schedule',
        'schedule-123',
        'read'
      );

      // Should not have called db for non-personal data
      expect(mockDb).not.toHaveBeenCalled();
    });
  });

  describe('auditReadAccess middleware', () => {
    it('should log read access to sensitive resources', async () => {
      const middleware = auditReadAccess('worker');
      mockRequest.params = { id: 'worker-123' };

      const mockInsert = vi.fn().mockResolvedValue([{ id: 'log-123' }]);
      const mockDb = vi.fn(() => ({
        insert: mockInsert,
      }));
      (db as any).mockImplementation(mockDb);

      middleware(mockRequest as AuthRequest, mockResponse as Response, nextFunction);

      // Call the intercepted json method
      mockResponse.json!({ success: true, data: { id: 'worker-123' } });

      // Wait for async operations
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(mockDb).toHaveBeenCalledWith('audit_logs');
    });
  });

  describe('auditListAccess middleware', () => {
    it('should log list access to sensitive resources', async () => {
      const middleware = auditListAccess('worker');

      const mockInsert = vi.fn().mockResolvedValue([{ id: 'log-123' }]);
      const mockDb = vi.fn(() => ({
        insert: mockInsert,
      }));
      (db as any).mockImplementation(mockDb);

      middleware(mockRequest as AuthRequest, mockResponse as Response, nextFunction);

      // Call the intercepted json method
      mockResponse.json!({ success: true, data: [] });

      // Wait for async operations
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(mockDb).toHaveBeenCalledWith('audit_logs');
    });
  });
});

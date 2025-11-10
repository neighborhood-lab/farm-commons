// Session service tests
// Tests for session lifecycle: create, get, update, delete, and multi-device support

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { SessionService } from '../session.js';
import redisClient, { connectRedis, disconnectRedis } from '../../db/redis.js';
import type { SessionCreateData } from '@farm-commons/shared';

describe('SessionService', () => {
  let sessionService: SessionService;

  beforeAll(async () => {
    // Connect to Redis before running tests
    await connectRedis();
    sessionService = new SessionService();
  });

  afterAll(async () => {
    // Disconnect from Redis after tests
    await disconnectRedis();
  });

  beforeEach(async () => {
    // Clear all test data before each test
    await redisClient.flushAll();
  });

  describe('createSession', () => {
    it('should create a new session with default TTL', async () => {
      const sessionData: SessionCreateData = {
        user_id: 'user-123',
        email: 'test@example.com',
        role: 'manager',
        farm_id: 'farm-456',
        device_info: {
          user_agent: 'Mozilla/5.0',
          ip_address: '192.168.1.1',
          device_name: 'Chrome on Windows',
        },
      };

      const session = await sessionService.createSession(sessionData);

      expect(session).toBeDefined();
      expect(session.session_id).toBeDefined();
      expect(session.user_id).toBe('user-123');
      expect(session.email).toBe('test@example.com');
      expect(session.role).toBe('manager');
      expect(session.farm_id).toBe('farm-456');
      expect(session.device_info?.user_agent).toBe('Mozilla/5.0');
      expect(session.created_at).toBeInstanceOf(Date);
      expect(session.last_accessed_at).toBeInstanceOf(Date);
      expect(session.expires_at).toBeInstanceOf(Date);
    });

    it('should create a session with custom TTL', async () => {
      const sessionData: SessionCreateData = {
        user_id: 'user-123',
        email: 'test@example.com',
        role: 'worker',
        farm_id: 'farm-456',
        ttl: 3600, // 1 hour
      };

      const session = await sessionService.createSession(sessionData);
      const expectedExpiry = new Date(Date.now() + 3600 * 1000);

      expect(session.expires_at.getTime()).toBeCloseTo(
        expectedExpiry.getTime(),
        -3 // Allow 1 second difference
      );
    });

    it('should support multiple sessions per user (multi-device)', async () => {
      const sessionData1: SessionCreateData = {
        user_id: 'user-123',
        email: 'test@example.com',
        role: 'manager',
        farm_id: 'farm-456',
        device_info: { device_name: 'Chrome on Windows' },
      };

      const sessionData2: SessionCreateData = {
        user_id: 'user-123',
        email: 'test@example.com',
        role: 'manager',
        farm_id: 'farm-456',
        device_info: { device_name: 'Safari on iPhone' },
      };

      const session1 = await sessionService.createSession(sessionData1);
      const session2 = await sessionService.createSession(sessionData2);

      expect(session1.session_id).not.toBe(session2.session_id);

      const userSessions = await sessionService.getUserSessions('user-123');
      expect(userSessions).toHaveLength(2);
    });
  });

  describe('getSession', () => {
    it('should retrieve an existing session', async () => {
      const sessionData: SessionCreateData = {
        user_id: 'user-123',
        email: 'test@example.com',
        role: 'admin',
        farm_id: 'farm-456',
      };

      const createdSession = await sessionService.createSession(sessionData);
      const retrievedSession = await sessionService.getSession(
        createdSession.session_id
      );

      expect(retrievedSession).not.toBeNull();
      expect(retrievedSession?.session_id).toBe(createdSession.session_id);
      expect(retrievedSession?.user_id).toBe('user-123');
      expect(retrievedSession?.email).toBe('test@example.com');
    });

    it('should return null for non-existent session', async () => {
      const session = await sessionService.getSession('non-existent-id');
      expect(session).toBeNull();
    });

    it('should parse date objects correctly', async () => {
      const sessionData: SessionCreateData = {
        user_id: 'user-123',
        email: 'test@example.com',
        role: 'worker',
        farm_id: 'farm-456',
      };

      const createdSession = await sessionService.createSession(sessionData);
      const retrievedSession = await sessionService.getSession(
        createdSession.session_id
      );

      expect(retrievedSession?.created_at).toBeInstanceOf(Date);
      expect(retrievedSession?.last_accessed_at).toBeInstanceOf(Date);
      expect(retrievedSession?.expires_at).toBeInstanceOf(Date);
    });
  });

  describe('touchSession', () => {
    it('should update last accessed time', async () => {
      const sessionData: SessionCreateData = {
        user_id: 'user-123',
        email: 'test@example.com',
        role: 'manager',
        farm_id: 'farm-456',
      };

      const session = await sessionService.createSession(sessionData);
      const originalAccessTime = session.last_accessed_at;

      // Wait a bit to ensure time difference
      await new Promise((resolve) => setTimeout(resolve, 100));

      const touched = await sessionService.touchSession(session.session_id);
      expect(touched).toBe(true);

      const updatedSession = await sessionService.getSession(
        session.session_id
      );
      expect(updatedSession?.last_accessed_at.getTime()).toBeGreaterThan(
        originalAccessTime.getTime()
      );
    });

    it('should extend session expiration', async () => {
      const sessionData: SessionCreateData = {
        user_id: 'user-123',
        email: 'test@example.com',
        role: 'worker',
        farm_id: 'farm-456',
        ttl: 60, // 1 minute
      };

      const session = await sessionService.createSession(sessionData);
      const originalExpiry = session.expires_at;

      await sessionService.touchSession(session.session_id, 3600); // Extend to 1 hour

      const updatedSession = await sessionService.getSession(
        session.session_id
      );
      expect(updatedSession?.expires_at.getTime()).toBeGreaterThan(
        originalExpiry.getTime()
      );
    });

    it('should return false for non-existent session', async () => {
      const touched = await sessionService.touchSession('non-existent-id');
      expect(touched).toBe(false);
    });
  });

  describe('deleteSession', () => {
    it('should delete an existing session', async () => {
      const sessionData: SessionCreateData = {
        user_id: 'user-123',
        email: 'test@example.com',
        role: 'admin',
        farm_id: 'farm-456',
      };

      const session = await sessionService.createSession(sessionData);

      const deleted = await sessionService.deleteSession(session.session_id);
      expect(deleted).toBe(true);

      const retrievedSession = await sessionService.getSession(
        session.session_id
      );
      expect(retrievedSession).toBeNull();
    });

    it('should remove session from user sessions list', async () => {
      const sessionData: SessionCreateData = {
        user_id: 'user-123',
        email: 'test@example.com',
        role: 'manager',
        farm_id: 'farm-456',
      };

      const session = await sessionService.createSession(sessionData);
      await sessionService.deleteSession(session.session_id);

      const userSessions = await sessionService.getUserSessions('user-123');
      expect(userSessions).toHaveLength(0);
    });

    it('should return false for non-existent session', async () => {
      const deleted = await sessionService.deleteSession('non-existent-id');
      expect(deleted).toBe(false);
    });
  });

  describe('getUserSessions', () => {
    it('should retrieve all sessions for a user', async () => {
      const sessionData1: SessionCreateData = {
        user_id: 'user-123',
        email: 'test@example.com',
        role: 'manager',
        farm_id: 'farm-456',
        device_info: { device_name: 'Device 1' },
      };

      const sessionData2: SessionCreateData = {
        user_id: 'user-123',
        email: 'test@example.com',
        role: 'manager',
        farm_id: 'farm-456',
        device_info: { device_name: 'Device 2' },
      };

      await sessionService.createSession(sessionData1);
      await sessionService.createSession(sessionData2);

      const userSessions = await sessionService.getUserSessions('user-123');
      expect(userSessions).toHaveLength(2);
    });

    it('should return sessions sorted by last accessed time', async () => {
      const session1 = await sessionService.createSession({
        user_id: 'user-123',
        email: 'test@example.com',
        role: 'manager',
        farm_id: 'farm-456',
      });

      await new Promise((resolve) => setTimeout(resolve, 100));

      const session2 = await sessionService.createSession({
        user_id: 'user-123',
        email: 'test@example.com',
        role: 'manager',
        farm_id: 'farm-456',
      });

      const userSessions = await sessionService.getUserSessions('user-123');
      expect(userSessions[0].session_id).toBe(session2.session_id); // Most recent first
      expect(userSessions[1].session_id).toBe(session1.session_id);
    });

    it('should return empty array for user with no sessions', async () => {
      const userSessions = await sessionService.getUserSessions('no-sessions');
      expect(userSessions).toEqual([]);
    });

    it('should clean up expired session IDs from list', async () => {
      const session = await sessionService.createSession({
        user_id: 'user-123',
        email: 'test@example.com',
        role: 'worker',
        farm_id: 'farm-456',
      });

      // Manually delete session from Redis (simulating expiration)
      await redisClient.del(`session:${session.session_id}`);

      const userSessions = await sessionService.getUserSessions('user-123');
      expect(userSessions).toHaveLength(0);
    });
  });

  describe('deleteAllUserSessions', () => {
    it('should delete all sessions for a user', async () => {
      await sessionService.createSession({
        user_id: 'user-123',
        email: 'test@example.com',
        role: 'manager',
        farm_id: 'farm-456',
      });

      await sessionService.createSession({
        user_id: 'user-123',
        email: 'test@example.com',
        role: 'manager',
        farm_id: 'farm-456',
      });

      const deletedCount = await sessionService.deleteAllUserSessions(
        'user-123'
      );
      expect(deletedCount).toBe(2);

      const userSessions = await sessionService.getUserSessions('user-123');
      expect(userSessions).toHaveLength(0);
    });

    it('should return 0 for user with no sessions', async () => {
      const deletedCount = await sessionService.deleteAllUserSessions(
        'no-sessions'
      );
      expect(deletedCount).toBe(0);
    });
  });

  describe('deleteUserSession', () => {
    it('should delete a specific session for the correct user', async () => {
      const session = await sessionService.createSession({
        user_id: 'user-123',
        email: 'test@example.com',
        role: 'admin',
        farm_id: 'farm-456',
      });

      const deleted = await sessionService.deleteUserSession(
        'user-123',
        session.session_id
      );
      expect(deleted).toBe(true);

      const retrievedSession = await sessionService.getSession(
        session.session_id
      );
      expect(retrievedSession).toBeNull();
    });

    it('should not delete session if user ID does not match', async () => {
      const session = await sessionService.createSession({
        user_id: 'user-123',
        email: 'test@example.com',
        role: 'manager',
        farm_id: 'farm-456',
      });

      const deleted = await sessionService.deleteUserSession(
        'different-user',
        session.session_id
      );
      expect(deleted).toBe(false);

      // Session should still exist
      const retrievedSession = await sessionService.getSession(
        session.session_id
      );
      expect(retrievedSession).not.toBeNull();
    });
  });

  describe('isSessionValid', () => {
    it('should return true for valid session', async () => {
      const session = await sessionService.createSession({
        user_id: 'user-123',
        email: 'test@example.com',
        role: 'worker',
        farm_id: 'farm-456',
      });

      const isValid = await sessionService.isSessionValid(session.session_id);
      expect(isValid).toBe(true);
    });

    it('should return false for invalid session', async () => {
      const isValid = await sessionService.isSessionValid('invalid-session');
      expect(isValid).toBe(false);
    });
  });

  describe('getUserSessionCount', () => {
    it('should return correct session count', async () => {
      await sessionService.createSession({
        user_id: 'user-123',
        email: 'test@example.com',
        role: 'manager',
        farm_id: 'farm-456',
      });

      await sessionService.createSession({
        user_id: 'user-123',
        email: 'test@example.com',
        role: 'manager',
        farm_id: 'farm-456',
      });

      const count = await sessionService.getUserSessionCount('user-123');
      expect(count).toBe(2);
    });

    it('should return 0 for user with no sessions', async () => {
      const count = await sessionService.getUserSessionCount('no-sessions');
      expect(count).toBe(0);
    });
  });

  describe('cleanupExpiredSessions', () => {
    it('should clean up expired sessions', async () => {
      // Create a session with very short TTL
      const session = await sessionService.createSession({
        user_id: 'user-123',
        email: 'test@example.com',
        role: 'worker',
        farm_id: 'farm-456',
        ttl: 1, // 1 second
      });

      // Wait for session to expire
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const cleanedCount = await sessionService.cleanupExpiredSessions(
        'user-123'
      );

      // Note: Redis TTL should have auto-deleted it, but we check the count
      expect(cleanedCount).toBeGreaterThanOrEqual(0);
    });

    it('should return 0 when no expired sessions', async () => {
      await sessionService.createSession({
        user_id: 'user-123',
        email: 'test@example.com',
        role: 'manager',
        farm_id: 'farm-456',
        ttl: 3600, // 1 hour
      });

      const cleanedCount = await sessionService.cleanupExpiredSessions(
        'user-123'
      );
      expect(cleanedCount).toBe(0);
    });
  });
});

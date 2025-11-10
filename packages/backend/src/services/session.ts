// Session management service with Redis-backed storage
// Supports multi-device sessions, expiration handling, and session tracking

import { v4 as uuidv4 } from 'uuid';
import type { UserSession, SessionCreateData } from '@farm-commons/shared';
import redisClient from '../db/redis.js';
import pino from 'pino';

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: process.env.NODE_ENV === 'development' ? {
    target: 'pino-pretty',
    options: {
      colorize: true,
    },
  } : undefined,
});

// Redis key prefixes for organization
const SESSION_PREFIX = 'session:';
const USER_SESSIONS_PREFIX = 'user_sessions:';

// Default session TTL: 7 days in seconds
const DEFAULT_SESSION_TTL = 7 * 24 * 60 * 60;

/**
 * Session Service
 * Provides methods for managing user sessions with Redis
 */
export class SessionService {
  /**
   * Create a new session for a user
   * Supports multi-device sessions by allowing multiple sessions per user
   */
  async createSession(data: SessionCreateData): Promise<UserSession> {
    const sessionId = uuidv4();
    const now = new Date();
    const ttl = data.ttl || DEFAULT_SESSION_TTL;
    const expiresAt = new Date(now.getTime() + ttl * 1000);

    const session: UserSession = {
      session_id: sessionId,
      user_id: data.user_id,
      email: data.email,
      role: data.role,
      farm_id: data.farm_id,
      device_info: data.device_info,
      created_at: now,
      last_accessed_at: now,
      expires_at: expiresAt,
    };

    try {
      // Store session data in Redis
      const sessionKey = `${SESSION_PREFIX}${sessionId}`;
      await redisClient.setEx(
        sessionKey,
        ttl,
        JSON.stringify(session)
      );

      // Add session to user's session list (for multi-device support)
      const userSessionsKey = `${USER_SESSIONS_PREFIX}${data.user_id}`;
      await redisClient.sAdd(userSessionsKey, sessionId);

      // Set expiration on user sessions set (cleanup if user has no active sessions)
      await redisClient.expire(userSessionsKey, ttl);

      logger.info(
        { userId: data.user_id, sessionId },
        'Session created successfully'
      );

      return session;
    } catch (error) {
      logger.error(
        { error, userId: data.user_id },
        'Failed to create session'
      );
      throw new Error('Failed to create session');
    }
  }

  /**
   * Get a session by session ID
   * Returns null if session doesn't exist or has expired
   */
  async getSession(sessionId: string): Promise<UserSession | null> {
    try {
      const sessionKey = `${SESSION_PREFIX}${sessionId}`;
      const sessionData = await redisClient.get(sessionKey);

      if (!sessionData) {
        return null;
      }

      const session = JSON.parse(sessionData) as UserSession;

      // Convert date strings back to Date objects
      session.created_at = new Date(session.created_at);
      session.last_accessed_at = new Date(session.last_accessed_at);
      session.expires_at = new Date(session.expires_at);

      return session;
    } catch (error) {
      logger.error({ error, sessionId }, 'Failed to get session');
      return null;
    }
  }

  /**
   * Update session's last accessed time
   * This also extends the session's TTL
   */
  async touchSession(sessionId: string, ttl?: number): Promise<boolean> {
    try {
      const session = await this.getSession(sessionId);

      if (!session) {
        return false;
      }

      // Update last accessed time
      session.last_accessed_at = new Date();

      // Extend expiration time
      const sessionTtl = ttl || DEFAULT_SESSION_TTL;
      session.expires_at = new Date(Date.now() + sessionTtl * 1000);

      const sessionKey = `${SESSION_PREFIX}${sessionId}`;
      await redisClient.setEx(
        sessionKey,
        sessionTtl,
        JSON.stringify(session)
      );

      return true;
    } catch (error) {
      logger.error({ error, sessionId }, 'Failed to touch session');
      return false;
    }
  }

  /**
   * Delete a specific session
   */
  async deleteSession(sessionId: string): Promise<boolean> {
    try {
      const session = await this.getSession(sessionId);

      if (!session) {
        return false;
      }

      // Remove session from Redis
      const sessionKey = `${SESSION_PREFIX}${sessionId}`;
      await redisClient.del(sessionKey);

      // Remove session from user's session list
      const userSessionsKey = `${USER_SESSIONS_PREFIX}${session.user_id}`;
      await redisClient.sRem(userSessionsKey, sessionId);

      logger.info(
        { userId: session.user_id, sessionId },
        'Session deleted successfully'
      );

      return true;
    } catch (error) {
      logger.error({ error, sessionId }, 'Failed to delete session');
      return false;
    }
  }

  /**
   * Get all active sessions for a user
   * Supports multi-device session tracking
   */
  async getUserSessions(userId: string): Promise<UserSession[]> {
    try {
      const userSessionsKey = `${USER_SESSIONS_PREFIX}${userId}`;
      const sessionIds = await redisClient.sMembers(userSessionsKey);

      if (sessionIds.length === 0) {
        return [];
      }

      // Fetch all sessions
      const sessions: UserSession[] = [];
      const expiredSessionIds: string[] = [];

      for (const sessionId of sessionIds) {
        const session = await this.getSession(sessionId);

        if (session) {
          sessions.push(session);
        } else {
          // Session expired or deleted, mark for cleanup
          expiredSessionIds.push(sessionId);
        }
      }

      // Cleanup expired session IDs from user's session list
      if (expiredSessionIds.length > 0) {
        await redisClient.sRem(userSessionsKey, expiredSessionIds);
      }

      // Sort by last accessed time (most recent first)
      sessions.sort(
        (a, b) =>
          b.last_accessed_at.getTime() - a.last_accessed_at.getTime()
      );

      return sessions;
    } catch (error) {
      logger.error({ error, userId }, 'Failed to get user sessions');
      return [];
    }
  }

  /**
   * Delete all sessions for a user
   * Useful for logout from all devices
   */
  async deleteAllUserSessions(userId: string): Promise<number> {
    try {
      const sessions = await this.getUserSessions(userId);

      if (sessions.length === 0) {
        return 0;
      }

      let deletedCount = 0;

      for (const session of sessions) {
        const success = await this.deleteSession(session.session_id);
        if (success) {
          deletedCount++;
        }
      }

      logger.info(
        { userId, deletedCount },
        'All user sessions deleted'
      );

      return deletedCount;
    } catch (error) {
      logger.error({ error, userId }, 'Failed to delete all user sessions');
      return 0;
    }
  }

  /**
   * Delete a specific session for a user (with authorization check)
   * Ensures a user can only delete their own sessions
   */
  async deleteUserSession(
    userId: string,
    sessionId: string
  ): Promise<boolean> {
    try {
      const session = await this.getSession(sessionId);

      if (!session) {
        return false;
      }

      // Verify the session belongs to the user
      if (session.user_id !== userId) {
        logger.warn(
          { userId, sessionId, sessionUserId: session.user_id },
          'User attempted to delete another user\'s session'
        );
        return false;
      }

      return await this.deleteSession(sessionId);
    } catch (error) {
      logger.error(
        { error, userId, sessionId },
        'Failed to delete user session'
      );
      return false;
    }
  }

  /**
   * Check if a session exists and is valid
   */
  async isSessionValid(sessionId: string): Promise<boolean> {
    const session = await this.getSession(sessionId);
    return session !== null;
  }

  /**
   * Get session count for a user
   */
  async getUserSessionCount(userId: string): Promise<number> {
    try {
      const userSessionsKey = `${USER_SESSIONS_PREFIX}${userId}`;
      return await redisClient.sCard(userSessionsKey);
    } catch (error) {
      logger.error({ error, userId }, 'Failed to get user session count');
      return 0;
    }
  }

  /**
   * Clean up expired sessions for a user
   * This is automatically handled by Redis TTL, but can be called manually
   */
  async cleanupExpiredSessions(userId: string): Promise<number> {
    try {
      const sessions = await this.getUserSessions(userId);
      const now = new Date();
      let cleanedCount = 0;

      for (const session of sessions) {
        if (session.expires_at < now) {
          await this.deleteSession(session.session_id);
          cleanedCount++;
        }
      }

      if (cleanedCount > 0) {
        logger.info(
          { userId, cleanedCount },
          'Expired sessions cleaned up'
        );
      }

      return cleanedCount;
    } catch (error) {
      logger.error(
        { error, userId },
        'Failed to cleanup expired sessions'
      );
      return 0;
    }
  }
}

// Export singleton instance
export const sessionService = new SessionService();
export default sessionService;

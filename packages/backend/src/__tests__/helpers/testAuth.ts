// Authentication test helpers

import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import type { AuthUser } from '@farm-commons/shared';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this';

/**
 * Generate test JWT token
 */
export function generateTestToken(user: AuthUser): string {
  return jwt.sign(user, JWT_SECRET, { expiresIn: '1h' });
}

/**
 * Hash password for test user
 */
export async function hashTestPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

/**
 * Create test user payload
 */
export function createTestUser(overrides: Partial<AuthUser> = {}): AuthUser {
  return {
    id: '1',
    email: 'test@example.com',
    role: 'manager',
    farm_id: '1',
    ...overrides,
  };
}

/**
 * Get authorization header for test
 */
export function getAuthHeader(token: string): { authorization: string } {
  return {
    authorization: `Bearer ${token}`,
  };
}

/**
 * Create test tokens for different roles
 */
export function createTestTokens(farmId: string = '1') {
  const adminUser: AuthUser = {
    id: '1',
    email: 'admin@test.com',
    role: 'admin',
    farm_id: farmId,
  };

  const managerUser: AuthUser = {
    id: '2',
    email: 'manager@test.com',
    role: 'manager',
    farm_id: farmId,
  };

  const workerUser: AuthUser = {
    id: '3',
    email: 'worker@test.com',
    role: 'worker',
    farm_id: farmId,
  };

  return {
    admin: {
      user: adminUser,
      token: generateTestToken(adminUser),
    },
    manager: {
      user: managerUser,
      token: generateTestToken(managerUser),
    },
    worker: {
      user: workerUser,
      token: generateTestToken(workerUser),
    },
  };
}

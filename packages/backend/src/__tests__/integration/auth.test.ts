// Integration tests for authentication routes

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import bcrypt from 'bcrypt';
import db from '../../db/connection.js';
import authRouter from '../../routes/auth.js';
import redis from '../../lib/redis.js';

const app = express();
app.use(express.json());
app.use('/api/auth', authRouter);

describe('Authentication Routes', () => {
  let testFarmId: string;
  let testUserId: string;
  let testUserEmail: string;
  let testUserPassword: string;

  beforeAll(async () => {
    // Create test farm
    const [farm] = await db('farms')
      .insert({
        name: 'Test Farm',
        location: 'Test Location',
        size_acres: 100,
      })
      .returning('*');
    testFarmId = farm.id;
  });

  afterAll(async () => {
    // Cleanup
    await db('users').where({ farm_id: testFarmId }).delete();
    await db('farms').where({ id: testFarmId }).delete();
    await db.destroy();
    await redis.quit();
  });

  beforeEach(async () => {
    // Clean up users before each test
    await db('users').where({ farm_id: testFarmId }).delete();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        email: 'newuser@test.com',
        password: 'password123',
        role: 'manager',
        farm_id: testFarmId,
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data).toHaveProperty('access_token');
      expect(response.body.data.user.email).toBe(userData.email);
      expect(response.body.data.user.role).toBe(userData.role);
      expect(response.body.data).not.toHaveProperty('password_hash');
    });

    it('should reject registration with duplicate email', async () => {
      const userData = {
        email: 'duplicate@test.com',
        password: 'password123',
        role: 'manager',
        farm_id: testFarmId,
      };

      // First registration
      await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      // Duplicate registration
      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('already registered');
    });

    it('should reject registration with invalid data', async () => {
      const invalidData = {
        email: 'invalid-email',
        password: 'short',
        role: 'invalid_role',
        farm_id: 'not-a-uuid',
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Create test user
      testUserEmail = 'testuser@test.com';
      testUserPassword = 'password123';
      const passwordHash = await bcrypt.hash(testUserPassword, 10);

      const [user] = await db('users')
        .insert({
          email: testUserEmail,
          password_hash: passwordHash,
          role: 'manager',
          farm_id: testFarmId,
        })
        .returning('*');
      testUserId = user.id;
    });

    it('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUserEmail,
          password: testUserPassword,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('access_token');
      expect(response.body.data.user.email).toBe(testUserEmail);
    });

    it('should reject login with invalid email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@test.com',
          password: testUserPassword,
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Invalid credentials');
    });

    it('should reject login with invalid password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUserEmail,
          password: 'wrongpassword',
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Invalid credentials');
    });
  });

  describe('POST /api/auth/refresh', () => {
    let authToken: string;

    beforeEach(async () => {
      // Create test user and login
      testUserEmail = 'refreshuser@test.com';
      testUserPassword = 'password123';
      const passwordHash = await bcrypt.hash(testUserPassword, 10);

      await db('users')
        .insert({
          email: testUserEmail,
          password_hash: passwordHash,
          role: 'manager',
          farm_id: testFarmId,
        })
        .returning('*');

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUserEmail,
          password: testUserPassword,
        });

      authToken = loginResponse.body.data.access_token;
    });

    it('should refresh token with valid auth token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('access_token');
      expect(response.body.data.access_token).not.toBe(authToken);
    });

    it('should reject refresh without auth token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should reject refresh with blacklisted token', async () => {
      // Logout to blacklist the token
      await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Try to refresh with blacklisted token
      const response = await request(app)
        .post('/api/auth/refresh')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('revoked');
    });
  });

  describe('POST /api/auth/logout', () => {
    let authToken: string;

    beforeEach(async () => {
      // Create test user and login
      testUserEmail = 'logoutuser@test.com';
      testUserPassword = 'password123';
      const passwordHash = await bcrypt.hash(testUserPassword, 10);

      await db('users')
        .insert({
          email: testUserEmail,
          password_hash: passwordHash,
          role: 'manager',
          farm_id: testFarmId,
        })
        .returning('*');

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUserEmail,
          password: testUserPassword,
        });

      authToken = loginResponse.body.data.access_token;
    });

    it('should logout successfully', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Logged out');
    });

    it('should reject logout without auth token', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/forgot-password', () => {
    beforeEach(async () => {
      // Create test user
      testUserEmail = 'resetuser@test.com';
      testUserPassword = 'password123';
      const passwordHash = await bcrypt.hash(testUserPassword, 10);

      const [user] = await db('users')
        .insert({
          email: testUserEmail,
          password_hash: passwordHash,
          role: 'manager',
          farm_id: testFarmId,
        })
        .returning('*');
      testUserId = user.id;
    });

    it('should initiate password reset for existing user', async () => {
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: testUserEmail })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('reset link');

      // Verify reset token was created
      const resetTokens = await db('password_reset_tokens')
        .where({ user_id: testUserId })
        .orderBy('created_at', 'desc');

      expect(resetTokens.length).toBeGreaterThan(0);
      expect(resetTokens[0].used).toBe(false);
    });

    it('should return success even for non-existent email (security)', async () => {
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'nonexistent@test.com' })
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('POST /api/auth/reset-password', () => {
    let resetToken: string;

    beforeEach(async () => {
      // Create test user
      testUserEmail = 'resetpassworduser@test.com';
      testUserPassword = 'password123';
      const passwordHash = await bcrypt.hash(testUserPassword, 10);

      const [user] = await db('users')
        .insert({
          email: testUserEmail,
          password_hash: passwordHash,
          role: 'manager',
          farm_id: testFarmId,
        })
        .returning('*');
      testUserId = user.id;

      // Create reset token
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: testUserEmail });

      resetToken = response.body.reset_token || '';
    });

    it('should reset password with valid token', async () => {
      const newPassword = 'newpassword456';

      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: resetToken,
          new_password: newPassword,
        })
        .expect(200);

      expect(response.body.success).toBe(true);

      // Try logging in with new password
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUserEmail,
          password: newPassword,
        })
        .expect(200);

      expect(loginResponse.body.success).toBe(true);
    });

    it('should reject password reset with invalid token', async () => {
      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: 'invalid-token',
          new_password: 'newpassword456',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should reject password reset with short password', async () => {
      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: resetToken,
          new_password: 'short',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should reject reuse of reset token', async () => {
      const newPassword = 'newpassword456';

      // First reset
      await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: resetToken,
          new_password: newPassword,
        })
        .expect(200);

      // Try to reuse token
      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: resetToken,
          new_password: 'anotherpassword789',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });
});

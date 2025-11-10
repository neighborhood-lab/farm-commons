// Integration tests for certifications API

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import db from '../db/connection.js';
import app from '../index.js';

// Test data
let testFarmId: string;
let testWorkerId: string;
let testCertificationId: string;
let managerToken: string;
let workerToken: string;

// Helper function to create JWT tokens for testing
function createTestToken(userId: string, role: string, farmId: string): string {
  return jwt.sign(
    { user_id: userId, role, farm_id: farmId },
    process.env.JWT_SECRET || 'test-secret',
    { expiresIn: '1h' }
  );
}

describe('Certifications API', () => {
  beforeAll(async () => {
    // Run migrations
    await db.migrate.latest();

    // Create test farm
    const [farm] = await db('farms').insert({
      name: 'Test Farm',
      location: 'Test Location',
      size_acres: 100,
      organic_certified: true,
    }).returning('*');
    testFarmId = farm.id;

    // Create test users
    const [managerUser] = await db('users').insert({
      email: 'manager@test.com',
      password_hash: 'hashed_password',
      role: 'manager',
      farm_id: testFarmId,
    }).returning('*');

    const [workerUser] = await db('users').insert({
      email: 'worker@test.com',
      password_hash: 'hashed_password',
      role: 'worker',
      farm_id: testFarmId,
    }).returning('*');

    // Create test worker
    const [worker] = await db('workers').insert({
      farm_id: testFarmId,
      user_id: workerUser.id,
      first_name: 'Test',
      last_name: 'Worker',
      phone: '555-0100',
      hire_date: new Date('2024-01-01'),
      status: 'active',
    }).returning('*');
    testWorkerId = worker.id;

    // Create JWT tokens
    managerToken = createTestToken(managerUser.id, 'manager', testFarmId);
    workerToken = createTestToken(workerUser.id, 'worker', testFarmId);
  });

  afterAll(async () => {
    // Clean up test data
    await db('certifications').where({ worker_id: testWorkerId }).del();
    await db('workers').where({ id: testWorkerId }).del();
    await db('users').where({ farm_id: testFarmId }).del();
    await db('farms').where({ id: testFarmId }).del();

    // Close database connection
    await db.destroy();
  });

  beforeEach(async () => {
    // Clean up certifications before each test
    await db('certifications').where({ worker_id: testWorkerId }).del();
  });

  describe('POST /api/certifications', () => {
    it('should create a new certification as manager', async () => {
      const certificationData = {
        worker_id: testWorkerId,
        name: 'Pesticide Application License',
        issuing_organization: 'State Agriculture Department',
        issue_date: '2024-01-01',
        expiration_date: '2026-01-01',
        verified: false,
      };

      const response = await request(app)
        .post('/api/certifications')
        .set('Authorization', `Bearer ${managerToken}`)
        .send(certificationData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        worker_id: testWorkerId,
        name: certificationData.name,
        issuing_organization: certificationData.issuing_organization,
        verified: false,
      });
      expect(response.body.data.id).toBeDefined();

      testCertificationId = response.body.data.id;
    });

    it('should fail to create certification as worker', async () => {
      const certificationData = {
        worker_id: testWorkerId,
        name: 'Test Certification',
        issuing_organization: 'Test Org',
        issue_date: '2024-01-01',
      };

      await request(app)
        .post('/api/certifications')
        .set('Authorization', `Bearer ${workerToken}`)
        .send(certificationData)
        .expect(403);
    });

    it('should fail to create certification without authentication', async () => {
      const certificationData = {
        worker_id: testWorkerId,
        name: 'Test Certification',
        issuing_organization: 'Test Org',
        issue_date: '2024-01-01',
      };

      await request(app)
        .post('/api/certifications')
        .send(certificationData)
        .expect(401);
    });

    it('should fail to create certification for non-existent worker', async () => {
      const certificationData = {
        worker_id: '00000000-0000-0000-0000-000000000000',
        name: 'Test Certification',
        issuing_organization: 'Test Org',
        issue_date: '2024-01-01',
      };

      await request(app)
        .post('/api/certifications')
        .set('Authorization', `Bearer ${managerToken}`)
        .send(certificationData)
        .expect(404);
    });
  });

  describe('GET /api/certifications/worker/:workerId', () => {
    beforeEach(async () => {
      // Create test certifications
      await db('certifications').insert([
        {
          worker_id: testWorkerId,
          name: 'Certification A',
          issuing_organization: 'Org A',
          issue_date: new Date('2024-01-01'),
          expiration_date: new Date('2025-01-01'),
          verified: true,
        },
        {
          worker_id: testWorkerId,
          name: 'Certification B',
          issuing_organization: 'Org B',
          issue_date: new Date('2024-06-01'),
          expiration_date: new Date('2026-06-01'),
          verified: false,
        },
      ]);
    });

    it('should list all certifications for a worker', async () => {
      const response = await request(app)
        .get(`/api/certifications/worker/${testWorkerId}`)
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data[0].name).toBeDefined();
      expect(response.body.data[0].issuing_organization).toBeDefined();
    });

    it('should return empty array for worker with no certifications', async () => {
      await db('certifications').where({ worker_id: testWorkerId }).del();

      const response = await request(app)
        .get(`/api/certifications/worker/${testWorkerId}`)
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(0);
    });

    it('should fail for non-existent worker', async () => {
      await request(app)
        .get('/api/certifications/worker/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(404);
    });
  });

  describe('GET /api/certifications/expiring', () => {
    beforeEach(async () => {
      const today = new Date();
      const inTenDays = new Date(today);
      inTenDays.setDate(today.getDate() + 10);
      const inFortyDays = new Date(today);
      inFortyDays.setDate(today.getDate() + 40);
      const pastDate = new Date(today);
      pastDate.setDate(today.getDate() - 10);

      // Create test certifications with various expiration dates
      await db('certifications').insert([
        {
          worker_id: testWorkerId,
          name: 'Expiring Soon',
          issuing_organization: 'Org A',
          issue_date: new Date('2024-01-01'),
          expiration_date: inTenDays,
          verified: true,
        },
        {
          worker_id: testWorkerId,
          name: 'Not Expiring Soon',
          issuing_organization: 'Org B',
          issue_date: new Date('2024-01-01'),
          expiration_date: inFortyDays,
          verified: true,
        },
        {
          worker_id: testWorkerId,
          name: 'Already Expired',
          issuing_organization: 'Org C',
          issue_date: new Date('2023-01-01'),
          expiration_date: pastDate,
          verified: true,
        },
      ]);
    });

    it('should list certifications expiring within 30 days', async () => {
      const response = await request(app)
        .get('/api/certifications/expiring')
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].name).toBe('Expiring Soon');
      expect(response.body.data[0].first_name).toBe('Test');
      expect(response.body.data[0].last_name).toBe('Worker');
    });
  });

  describe('PUT /api/certifications/:id', () => {
    beforeEach(async () => {
      // Create a test certification
      const [cert] = await db('certifications').insert({
        worker_id: testWorkerId,
        name: 'Original Name',
        issuing_organization: 'Original Org',
        issue_date: new Date('2024-01-01'),
        expiration_date: new Date('2025-01-01'),
        verified: false,
      }).returning('*');
      testCertificationId = cert.id;
    });

    it('should update a certification as manager', async () => {
      const updateData = {
        name: 'Updated Name',
        verified: true,
      };

      const response = await request(app)
        .put(`/api/certifications/${testCertificationId}`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Updated Name');
      expect(response.body.data.verified).toBe(true);
      expect(response.body.data.issuing_organization).toBe('Original Org');
    });

    it('should fail to update certification as worker', async () => {
      const updateData = {
        name: 'Updated Name',
      };

      await request(app)
        .put(`/api/certifications/${testCertificationId}`)
        .set('Authorization', `Bearer ${workerToken}`)
        .send(updateData)
        .expect(403);
    });

    it('should fail to update non-existent certification', async () => {
      const updateData = {
        name: 'Updated Name',
      };

      await request(app)
        .put('/api/certifications/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${managerToken}`)
        .send(updateData)
        .expect(404);
    });
  });

  describe('DELETE /api/certifications/:id', () => {
    beforeEach(async () => {
      // Create a test certification
      const [cert] = await db('certifications').insert({
        worker_id: testWorkerId,
        name: 'To Be Deleted',
        issuing_organization: 'Test Org',
        issue_date: new Date('2024-01-01'),
        verified: false,
      }).returning('*');
      testCertificationId = cert.id;
    });

    it('should delete a certification as manager', async () => {
      const response = await request(app)
        .delete(`/api/certifications/${testCertificationId}`)
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Certification deleted successfully');

      // Verify it was deleted
      const cert = await db('certifications').where({ id: testCertificationId }).first();
      expect(cert).toBeUndefined();
    });

    it('should fail to delete certification as worker', async () => {
      await request(app)
        .delete(`/api/certifications/${testCertificationId}`)
        .set('Authorization', `Bearer ${workerToken}`)
        .expect(403);
    });

    it('should fail to delete non-existent certification', async () => {
      await request(app)
        .delete('/api/certifications/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(404);
    });
  });
});

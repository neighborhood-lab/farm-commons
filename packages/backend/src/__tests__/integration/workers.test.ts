// Integration tests for worker routes

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../index.js';
import {
  setupTestDb,
  cleanupTestDb,
  closeTestDb,
  seedTestData,
} from '../helpers/testDb.js';
import { createTestTokens, getAuthHeader } from '../helpers/testAuth.js';

describe('Worker Routes', () => {
  let testData: Awaited<ReturnType<typeof seedTestData>>;
  let tokens: ReturnType<typeof createTestTokens>;

  beforeAll(async () => {
    await setupTestDb();
  });

  afterAll(async () => {
    await closeTestDb();
  });

  beforeEach(async () => {
    await cleanupTestDb();
    testData = await seedTestData();
    tokens = createTestTokens(testData.farm.id);
  });

  describe('GET /api/workers', () => {
    it('should list workers with authentication', async () => {
      const response = await request(app)
        .get('/api/workers')
        .set(getAuthHeader(tokens.manager.token))
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          data: expect.any(Array),
          total: 2,
          page: 1,
          per_page: 10,
          total_pages: 1,
        },
      });

      expect(response.body.data.data).toHaveLength(2);
      expect(response.body.data.data[0]).toHaveProperty('first_name');
      expect(response.body.data.data[0]).toHaveProperty('last_name');
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/workers?page=1&per_page=1')
        .set(getAuthHeader(tokens.manager.token))
        .expect(200);

      expect(response.body.data).toMatchObject({
        total: 2,
        page: 1,
        per_page: 1,
        total_pages: 2,
      });

      expect(response.body.data.data).toHaveLength(1);
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .get('/api/workers')
        .expect(401);

      expect(response.body).toMatchObject({
        success: false,
        error: 'Access token required',
      });
    });

    it('should work for all authenticated roles', async () => {
      // Test admin
      await request(app)
        .get('/api/workers')
        .set(getAuthHeader(tokens.admin.token))
        .expect(200);

      // Test manager
      await request(app)
        .get('/api/workers')
        .set(getAuthHeader(tokens.manager.token))
        .expect(200);

      // Test worker
      await request(app)
        .get('/api/workers')
        .set(getAuthHeader(tokens.worker.token))
        .expect(200);
    });
  });

  describe('GET /api/workers/:id', () => {
    it('should get a single worker by id', async () => {
      const response = await request(app)
        .get(`/api/workers/${testData.workers.worker1.id}`)
        .set(getAuthHeader(tokens.manager.token))
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          id: testData.workers.worker1.id,
          first_name: 'John',
          last_name: 'Doe',
        },
      });
    });

    it('should return 404 for non-existent worker', async () => {
      const response = await request(app)
        .get('/api/workers/99999')
        .set(getAuthHeader(tokens.manager.token))
        .expect(404);

      expect(response.body).toMatchObject({
        success: false,
        error: 'Worker not found',
      });
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .get(`/api/workers/${testData.workers.worker1.id}`)
        .expect(401);

      expect(response.body).toMatchObject({
        success: false,
        error: 'Access token required',
      });
    });
  });

  describe('POST /api/workers', () => {
    it('should create a new worker as manager', async () => {
      const newWorker = {
        first_name: 'Alice',
        last_name: 'Johnson',
        email: 'alice@test.com',
        phone: '555-0103',
        role: 'Supervisor',
        status: 'active',
        hire_date: '2024-02-01',
      };

      const response = await request(app)
        .post('/api/workers')
        .set(getAuthHeader(tokens.manager.token))
        .send(newWorker)
        .expect(201);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          first_name: 'Alice',
          last_name: 'Johnson',
          email: 'alice@test.com',
          farm_id: testData.farm.id,
        },
      });
    });

    it('should create a new worker as admin', async () => {
      const newWorker = {
        first_name: 'Bob',
        last_name: 'Wilson',
        email: 'bob@test.com',
        phone: '555-0104',
        role: 'Field Worker',
        status: 'active',
        hire_date: '2024-02-15',
      };

      const response = await request(app)
        .post('/api/workers')
        .set(getAuthHeader(tokens.admin.token))
        .send(newWorker)
        .expect(201);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          first_name: 'Bob',
          last_name: 'Wilson',
        },
      });
    });

    it('should fail as worker role', async () => {
      const newWorker = {
        first_name: 'Test',
        last_name: 'User',
        email: 'test@test.com',
        phone: '555-0105',
        role: 'Field Worker',
        status: 'active',
        hire_date: '2024-02-01',
      };

      const response = await request(app)
        .post('/api/workers')
        .set(getAuthHeader(tokens.worker.token))
        .send(newWorker)
        .expect(403);

      expect(response.body).toMatchObject({
        success: false,
        error: 'Insufficient permissions',
      });
    });

    it('should fail with invalid data', async () => {
      const invalidWorker = {
        first_name: 'Test',
        // Missing required fields
      };

      const response = await request(app)
        .post('/api/workers')
        .set(getAuthHeader(tokens.manager.token))
        .send(invalidWorker)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/workers/:id', () => {
    it('should update a worker as manager', async () => {
      const updates = {
        first_name: 'Johnny',
        phone: '555-9999',
      };

      const response = await request(app)
        .put(`/api/workers/${testData.workers.worker1.id}`)
        .set(getAuthHeader(tokens.manager.token))
        .send(updates)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          id: testData.workers.worker1.id,
          first_name: 'Johnny',
          phone: '555-9999',
        },
      });
    });

    it('should update a worker as admin', async () => {
      const updates = {
        status: 'inactive',
      };

      const response = await request(app)
        .put(`/api/workers/${testData.workers.worker1.id}`)
        .set(getAuthHeader(tokens.admin.token))
        .send(updates)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          status: 'inactive',
        },
      });
    });

    it('should fail as worker role', async () => {
      const updates = {
        first_name: 'Test',
      };

      const response = await request(app)
        .put(`/api/workers/${testData.workers.worker1.id}`)
        .set(getAuthHeader(tokens.worker.token))
        .send(updates)
        .expect(403);

      expect(response.body).toMatchObject({
        success: false,
        error: 'Insufficient permissions',
      });
    });

    it('should return 404 for non-existent worker', async () => {
      const updates = {
        first_name: 'Test',
      };

      const response = await request(app)
        .put('/api/workers/99999')
        .set(getAuthHeader(tokens.manager.token))
        .send(updates)
        .expect(404);

      expect(response.body).toMatchObject({
        success: false,
        error: 'Worker not found',
      });
    });
  });

  describe('DELETE /api/workers/:id', () => {
    it('should delete a worker as admin', async () => {
      const response = await request(app)
        .delete(`/api/workers/${testData.workers.worker1.id}`)
        .set(getAuthHeader(tokens.admin.token))
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Worker deleted successfully',
      });

      // Verify worker is deleted
      await request(app)
        .get(`/api/workers/${testData.workers.worker1.id}`)
        .set(getAuthHeader(tokens.admin.token))
        .expect(404);
    });

    it('should fail as manager role', async () => {
      const response = await request(app)
        .delete(`/api/workers/${testData.workers.worker1.id}`)
        .set(getAuthHeader(tokens.manager.token))
        .expect(403);

      expect(response.body).toMatchObject({
        success: false,
        error: 'Insufficient permissions',
      });
    });

    it('should fail as worker role', async () => {
      const response = await request(app)
        .delete(`/api/workers/${testData.workers.worker1.id}`)
        .set(getAuthHeader(tokens.worker.token))
        .expect(403);

      expect(response.body).toMatchObject({
        success: false,
        error: 'Insufficient permissions',
      });
    });

    it('should return 404 for non-existent worker', async () => {
      const response = await request(app)
        .delete('/api/workers/99999')
        .set(getAuthHeader(tokens.admin.token))
        .expect(404);

      expect(response.body).toMatchObject({
        success: false,
        error: 'Worker not found',
      });
    });
  });
});

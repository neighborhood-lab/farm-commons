// Integration tests for schedule routes

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../index.js';
import {
  setupTestDb,
  cleanupTestDb,
  closeTestDb,
  seedTestData,
  getTestDb,
} from '../helpers/testDb.js';
import { createTestTokens, getAuthHeader } from '../helpers/testAuth.js';

describe('Schedule Routes', () => {
  let testData: Awaited<ReturnType<typeof seedTestData>>;
  let tokens: ReturnType<typeof createTestTokens>;
  let scheduleId: number;

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

    // Create a test schedule
    const db = getTestDb();
    const [schedule] = await db('schedules')
      .insert({
        farm_id: testData.farm.id,
        worker_id: testData.workers.worker1.id,
        scheduled_date: '2024-03-15',
        start_time: '08:00:00',
        end_time: '17:00:00',
        task: 'Planting tomatoes',
        status: 'scheduled',
      })
      .returning('*');
    scheduleId = schedule.id;
  });

  describe('GET /api/schedules', () => {
    it('should list all schedules with authentication', async () => {
      const response = await request(app)
        .get('/api/schedules')
        .set(getAuthHeader(tokens.manager.token))
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: expect.any(Array),
      });

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0]).toMatchObject({
        task: 'Planting tomatoes',
        worker_first_name: 'John',
        worker_last_name: 'Doe',
      });
    });

    it('should filter schedules by date range', async () => {
      const db = getTestDb();

      // Add another schedule outside the range
      await db('schedules').insert({
        farm_id: testData.farm.id,
        worker_id: testData.workers.worker2.id,
        scheduled_date: '2024-05-20',
        start_time: '09:00:00',
        end_time: '16:00:00',
        task: 'Harvesting',
        status: 'scheduled',
      });

      const response = await request(app)
        .get('/api/schedules?start_date=2024-03-01&end_date=2024-03-31')
        .set(getAuthHeader(tokens.manager.token))
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: expect.any(Array),
      });

      // Should only return schedules in March
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].scheduled_date).toContain('2024-03');
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .get('/api/schedules')
        .expect(401);

      expect(response.body).toMatchObject({
        success: false,
        error: 'Access token required',
      });
    });
  });

  describe('GET /api/schedules/worker/:workerId', () => {
    it('should get schedules for a specific worker', async () => {
      const response = await request(app)
        .get(`/api/schedules/worker/${testData.workers.worker1.id}`)
        .set(getAuthHeader(tokens.manager.token))
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: expect.any(Array),
      });

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0]).toMatchObject({
        worker_id: testData.workers.worker1.id,
        task: 'Planting tomatoes',
      });
    });

    it('should return empty array for worker with no schedules', async () => {
      const response = await request(app)
        .get(`/api/schedules/worker/${testData.workers.worker2.id}`)
        .set(getAuthHeader(tokens.manager.token))
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: [],
      });
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .get(`/api/schedules/worker/${testData.workers.worker1.id}`)
        .expect(401);

      expect(response.body).toMatchObject({
        success: false,
        error: 'Access token required',
      });
    });
  });

  describe('POST /api/schedules', () => {
    it('should create a new schedule as manager', async () => {
      const newSchedule = {
        worker_id: testData.workers.worker2.id,
        scheduled_date: '2024-03-20',
        start_time: '07:00:00',
        end_time: '15:00:00',
        task: 'Equipment maintenance',
        status: 'scheduled',
      };

      const response = await request(app)
        .post('/api/schedules')
        .set(getAuthHeader(tokens.manager.token))
        .send(newSchedule)
        .expect(201);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          worker_id: testData.workers.worker2.id,
          task: 'Equipment maintenance',
          farm_id: testData.farm.id,
        },
      });
    });

    it('should create a new schedule as admin', async () => {
      const newSchedule = {
        worker_id: testData.workers.worker1.id,
        scheduled_date: '2024-03-25',
        start_time: '06:00:00',
        end_time: '14:00:00',
        task: 'Irrigation setup',
        status: 'scheduled',
      };

      const response = await request(app)
        .post('/api/schedules')
        .set(getAuthHeader(tokens.admin.token))
        .send(newSchedule)
        .expect(201);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          task: 'Irrigation setup',
        },
      });
    });

    it('should fail as worker role', async () => {
      const newSchedule = {
        worker_id: testData.workers.worker1.id,
        scheduled_date: '2024-03-20',
        start_time: '08:00:00',
        end_time: '16:00:00',
        task: 'Test task',
        status: 'scheduled',
      };

      const response = await request(app)
        .post('/api/schedules')
        .set(getAuthHeader(tokens.worker.token))
        .send(newSchedule)
        .expect(403);

      expect(response.body).toMatchObject({
        success: false,
        error: 'Insufficient permissions',
      });
    });

    it('should fail with invalid data', async () => {
      const invalidSchedule = {
        worker_id: testData.workers.worker1.id,
        // Missing required fields
      };

      const response = await request(app)
        .post('/api/schedules')
        .set(getAuthHeader(tokens.manager.token))
        .send(invalidSchedule)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/schedules/:id', () => {
    it('should update a schedule as manager', async () => {
      const updates = {
        task: 'Updated task',
        status: 'completed',
      };

      const response = await request(app)
        .put(`/api/schedules/${scheduleId}`)
        .set(getAuthHeader(tokens.manager.token))
        .send(updates)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          id: scheduleId,
          task: 'Updated task',
          status: 'completed',
        },
      });
    });

    it('should update a schedule as admin', async () => {
      const updates = {
        start_time: '09:00:00',
        end_time: '18:00:00',
      };

      const response = await request(app)
        .put(`/api/schedules/${scheduleId}`)
        .set(getAuthHeader(tokens.admin.token))
        .send(updates)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          start_time: '09:00:00',
          end_time: '18:00:00',
        },
      });
    });

    it('should fail as worker role', async () => {
      const updates = {
        task: 'Test update',
      };

      const response = await request(app)
        .put(`/api/schedules/${scheduleId}`)
        .set(getAuthHeader(tokens.worker.token))
        .send(updates)
        .expect(403);

      expect(response.body).toMatchObject({
        success: false,
        error: 'Insufficient permissions',
      });
    });

    it('should return 404 for non-existent schedule', async () => {
      const updates = {
        task: 'Test',
      };

      const response = await request(app)
        .put('/api/schedules/99999')
        .set(getAuthHeader(tokens.manager.token))
        .send(updates)
        .expect(404);

      expect(response.body).toMatchObject({
        success: false,
        error: 'Schedule not found',
      });
    });
  });

  describe('DELETE /api/schedules/:id', () => {
    it('should delete a schedule as admin', async () => {
      const response = await request(app)
        .delete(`/api/schedules/${scheduleId}`)
        .set(getAuthHeader(tokens.admin.token))
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Schedule deleted successfully',
      });

      // Verify schedule is deleted
      const db = getTestDb();
      const deletedSchedule = await db('schedules')
        .where({ id: scheduleId })
        .first();
      expect(deletedSchedule).toBeUndefined();
    });

    it('should delete a schedule as manager', async () => {
      const response = await request(app)
        .delete(`/api/schedules/${scheduleId}`)
        .set(getAuthHeader(tokens.manager.token))
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Schedule deleted successfully',
      });
    });

    it('should fail as worker role', async () => {
      const response = await request(app)
        .delete(`/api/schedules/${scheduleId}`)
        .set(getAuthHeader(tokens.worker.token))
        .expect(403);

      expect(response.body).toMatchObject({
        success: false,
        error: 'Insufficient permissions',
      });
    });

    it('should return 404 for non-existent schedule', async () => {
      const response = await request(app)
        .delete('/api/schedules/99999')
        .set(getAuthHeader(tokens.manager.token))
        .expect(404);

      expect(response.body).toMatchObject({
        success: false,
        error: 'Schedule not found',
      });
    });
  });
});

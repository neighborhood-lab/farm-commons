// Integration tests for time entries routes

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

describe('Time Entry Routes', () => {
  let testData: Awaited<ReturnType<typeof seedTestData>>;
  let tokens: ReturnType<typeof createTestTokens>;
  let timeEntryId: number;

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

    // Create a completed time entry for testing
    const db = getTestDb();
    const [entry] = await db('time_entries')
      .insert({
        farm_id: testData.farm.id,
        worker_id: testData.workers.worker1.id,
        clock_in: '2024-03-15 08:00:00',
        clock_out: '2024-03-15 17:00:00',
        break_minutes: 30,
        total_hours: 8.5,
        task: 'Field work',
      })
      .returning('*');
    timeEntryId = entry.id;
  });

  describe('GET /api/time-entries', () => {
    it('should list all time entries with authentication', async () => {
      const response = await request(app)
        .get('/api/time-entries')
        .set(getAuthHeader(tokens.manager.token))
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: expect.any(Array),
      });

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0]).toMatchObject({
        task: 'Field work',
        worker_first_name: 'John',
        worker_last_name: 'Doe',
      });
    });

    it('should filter time entries by date range', async () => {
      const db = getTestDb();

      // Add another entry outside the range
      await db('time_entries').insert({
        farm_id: testData.farm.id,
        worker_id: testData.workers.worker2.id,
        clock_in: '2024-05-20 09:00:00',
        clock_out: '2024-05-20 16:00:00',
        break_minutes: 30,
        total_hours: 6.5,
        task: 'Harvesting',
      });

      const response = await request(app)
        .get('/api/time-entries?start_date=2024-03-01&end_date=2024-03-31')
        .set(getAuthHeader(tokens.manager.token))
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: expect.any(Array),
      });

      // Should only return entries in March
      expect(response.body.data).toHaveLength(1);
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .get('/api/time-entries')
        .expect(401);

      expect(response.body).toMatchObject({
        success: false,
        error: 'Access token required',
      });
    });
  });

  describe('GET /api/time-entries/worker/:workerId', () => {
    it('should get time entries for a specific worker', async () => {
      const response = await request(app)
        .get(`/api/time-entries/worker/${testData.workers.worker1.id}`)
        .set(getAuthHeader(tokens.manager.token))
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: expect.any(Array),
      });

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0]).toMatchObject({
        worker_id: testData.workers.worker1.id,
        task: 'Field work',
      });
    });

    it('should return empty array for worker with no entries', async () => {
      const response = await request(app)
        .get(`/api/time-entries/worker/${testData.workers.worker2.id}`)
        .set(getAuthHeader(tokens.manager.token))
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: [],
      });
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .get(`/api/time-entries/worker/${testData.workers.worker1.id}`)
        .expect(401);

      expect(response.body).toMatchObject({
        success: false,
        error: 'Access token required',
      });
    });
  });

  describe('POST /api/time-entries/clock-in', () => {
    it('should clock in a worker', async () => {
      const clockInData = {
        worker_id: testData.workers.worker2.id,
        task: 'Equipment maintenance',
      };

      const response = await request(app)
        .post('/api/time-entries/clock-in')
        .set(getAuthHeader(tokens.manager.token))
        .send(clockInData)
        .expect(201);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          worker_id: testData.workers.worker2.id,
          task: 'Equipment maintenance',
          farm_id: testData.farm.id,
          break_minutes: 0,
        },
      });

      expect(response.body.data.clock_in).toBeDefined();
      expect(response.body.data.clock_out).toBeNull();
    });

    it('should fail if worker already has open time entry', async () => {
      // Create an open time entry
      const db = getTestDb();
      await db('time_entries').insert({
        farm_id: testData.farm.id,
        worker_id: testData.workers.worker2.id,
        clock_in: new Date(),
        task: 'Existing task',
        break_minutes: 0,
      });

      const clockInData = {
        worker_id: testData.workers.worker2.id,
        task: 'New task',
      };

      const response = await request(app)
        .post('/api/time-entries/clock-in')
        .set(getAuthHeader(tokens.manager.token))
        .send(clockInData)
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: 'Worker already has an open time entry',
      });
    });

    it('should fail with invalid data', async () => {
      const invalidData = {
        // Missing worker_id
        task: 'Test task',
      };

      const response = await request(app)
        .post('/api/time-entries/clock-in')
        .set(getAuthHeader(tokens.manager.token))
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should work for all authenticated roles', async () => {
      // Admin can clock in
      await request(app)
        .post('/api/time-entries/clock-in')
        .set(getAuthHeader(tokens.admin.token))
        .send({
          worker_id: testData.workers.worker2.id,
          task: 'Test',
        })
        .expect(201);

      // Clean up
      const db = getTestDb();
      await db('time_entries')
        .where({ worker_id: testData.workers.worker2.id })
        .whereNull('clock_out')
        .delete();

      // Manager can clock in
      await request(app)
        .post('/api/time-entries/clock-in')
        .set(getAuthHeader(tokens.manager.token))
        .send({
          worker_id: testData.workers.worker2.id,
          task: 'Test',
        })
        .expect(201);

      // Clean up
      await db('time_entries')
        .where({ worker_id: testData.workers.worker2.id })
        .whereNull('clock_out')
        .delete();

      // Worker can clock in
      await request(app)
        .post('/api/time-entries/clock-in')
        .set(getAuthHeader(tokens.worker.token))
        .send({
          worker_id: testData.workers.worker2.id,
          task: 'Test',
        })
        .expect(201);
    });
  });

  describe('POST /api/time-entries/:id/clock-out', () => {
    it('should clock out a worker', async () => {
      // Create an open time entry
      const db = getTestDb();
      const [openEntry] = await db('time_entries')
        .insert({
          farm_id: testData.farm.id,
          worker_id: testData.workers.worker2.id,
          clock_in: new Date(Date.now() - 8 * 60 * 60 * 1000), // 8 hours ago
          task: 'Test task',
          break_minutes: 0,
        })
        .returning('*');

      const clockOutData = {
        break_minutes: 30,
        notes: 'Completed all tasks',
      };

      const response = await request(app)
        .post(`/api/time-entries/${openEntry.id}/clock-out`)
        .set(getAuthHeader(tokens.manager.token))
        .send(clockOutData)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          id: openEntry.id,
          break_minutes: 30,
          notes: 'Completed all tasks',
        },
      });

      expect(response.body.data.clock_out).toBeDefined();
      expect(response.body.data.total_hours).toBeGreaterThan(0);
    });

    it('should fail if entry not found', async () => {
      const clockOutData = {
        break_minutes: 30,
      };

      const response = await request(app)
        .post('/api/time-entries/99999/clock-out')
        .set(getAuthHeader(tokens.manager.token))
        .send(clockOutData)
        .expect(404);

      expect(response.body).toMatchObject({
        success: false,
        error: 'Time entry not found',
      });
    });

    it('should fail if already clocked out', async () => {
      const clockOutData = {
        break_minutes: 30,
      };

      const response = await request(app)
        .post(`/api/time-entries/${timeEntryId}/clock-out`)
        .set(getAuthHeader(tokens.manager.token))
        .send(clockOutData)
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: 'Time entry already clocked out',
      });
    });

    it('should work for all authenticated roles', async () => {
      const db = getTestDb();

      // Create open entry for admin
      const [entry1] = await db('time_entries')
        .insert({
          farm_id: testData.farm.id,
          worker_id: testData.workers.worker2.id,
          clock_in: new Date(),
          task: 'Test',
          break_minutes: 0,
        })
        .returning('*');

      await request(app)
        .post(`/api/time-entries/${entry1.id}/clock-out`)
        .set(getAuthHeader(tokens.admin.token))
        .send({ break_minutes: 0 })
        .expect(200);

      // Create open entry for manager
      const [entry2] = await db('time_entries')
        .insert({
          farm_id: testData.farm.id,
          worker_id: testData.workers.worker2.id,
          clock_in: new Date(),
          task: 'Test',
          break_minutes: 0,
        })
        .returning('*');

      await request(app)
        .post(`/api/time-entries/${entry2.id}/clock-out`)
        .set(getAuthHeader(tokens.manager.token))
        .send({ break_minutes: 0 })
        .expect(200);

      // Create open entry for worker
      const [entry3] = await db('time_entries')
        .insert({
          farm_id: testData.farm.id,
          worker_id: testData.workers.worker2.id,
          clock_in: new Date(),
          task: 'Test',
          break_minutes: 0,
        })
        .returning('*');

      await request(app)
        .post(`/api/time-entries/${entry3.id}/clock-out`)
        .set(getAuthHeader(tokens.worker.token))
        .send({ break_minutes: 0 })
        .expect(200);
    });
  });

  describe('POST /api/time-entries/:id/verify', () => {
    it('should verify a time entry as manager', async () => {
      const response = await request(app)
        .post(`/api/time-entries/${timeEntryId}/verify`)
        .set(getAuthHeader(tokens.manager.token))
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          id: timeEntryId,
        },
      });

      expect(response.body.data.verified_by).toBeDefined();
      expect(response.body.data.verified_at).toBeDefined();
    });

    it('should verify a time entry as admin', async () => {
      const response = await request(app)
        .post(`/api/time-entries/${timeEntryId}/verify`)
        .set(getAuthHeader(tokens.admin.token))
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          id: timeEntryId,
        },
      });
    });

    it('should fail as worker role', async () => {
      const response = await request(app)
        .post(`/api/time-entries/${timeEntryId}/verify`)
        .set(getAuthHeader(tokens.worker.token))
        .expect(403);

      expect(response.body).toMatchObject({
        success: false,
        error: 'Insufficient permissions',
      });
    });

    it('should return 404 for non-existent entry', async () => {
      const response = await request(app)
        .post('/api/time-entries/99999/verify')
        .set(getAuthHeader(tokens.manager.token))
        .expect(404);

      expect(response.body).toMatchObject({
        success: false,
        error: 'Time entry not found',
      });
    });
  });
});

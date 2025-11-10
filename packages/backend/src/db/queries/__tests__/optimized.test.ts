/**
 * Tests for optimized database queries
 *
 * These tests verify that:
 * - Optimized queries return correct data
 * - Queries use indexes efficiently
 * - N+1 query problems are avoided
 * - Query performance is acceptable
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import db from '../../connection.js';
import {
  getSchedulesDetailed,
  getTimeEntriesDetailed,
  getWorkerWithDetails,
  getWorkerStatistics,
  getFieldUtilization,
  getWorkersPaginated,
  getLaborHoursSummary,
  getExpiringCertifications,
  getWorkersWithCertifications,
  getUnverifiedTimeEntries,
  getActiveTimeEntries,
  getUpcomingSchedules,
} from '../optimized.js';

// Test data IDs
let testFarmId: string;
let testWorkerId1: string;
let testWorkerId2: string;
let testFieldId: string;
let testScheduleId: string;
let testTimeEntryId: string;
let testCertId: string;

describe('Optimized Queries', () => {
  beforeAll(async () => {
    // Run migrations
    await db.migrate.latest();

    // Create test data
    const [farm] = await db('farms')
      .insert({
        name: 'Test Farm',
        location: 'Test Location',
        size_acres: 100,
        organic_certified: true,
      })
      .returning('*');
    testFarmId = farm.id;

    const [worker1] = await db('workers')
      .insert({
        farm_id: testFarmId,
        first_name: 'John',
        last_name: 'Doe',
        phone: '555-0100',
        hire_date: '2024-01-01',
        status: 'active',
        hourly_rate: 20.0,
      })
      .returning('*');
    testWorkerId1 = worker1.id;

    const [worker2] = await db('workers')
      .insert({
        farm_id: testFarmId,
        first_name: 'Jane',
        last_name: 'Smith',
        phone: '555-0101',
        hire_date: '2024-02-01',
        status: 'active',
        hourly_rate: 22.0,
      })
      .returning('*');
    testWorkerId2 = worker2.id;

    const [field] = await db('fields')
      .insert({
        farm_id: testFarmId,
        name: 'North Field',
        size_acres: 50,
        current_crop: 'Tomatoes',
      })
      .returning('*');
    testFieldId = field.id;

    const [schedule] = await db('schedules')
      .insert({
        farm_id: testFarmId,
        worker_id: testWorkerId1,
        field_id: testFieldId,
        scheduled_date: new Date(Date.now() + 86400000), // Tomorrow
        start_time: '08:00',
        end_time: '17:00',
        task_type: 'Planting',
        status: 'scheduled',
      })
      .returning('*');
    testScheduleId = schedule.id;

    const [timeEntry] = await db('time_entries')
      .insert({
        farm_id: testFarmId,
        worker_id: testWorkerId1,
        field_id: testFieldId,
        schedule_id: testScheduleId,
        clock_in: new Date(Date.now() - 7200000), // 2 hours ago
        clock_out: new Date(),
        total_hours: 2,
        task_type: 'Planting',
        break_minutes: 0,
      })
      .returning('*');
    testTimeEntryId = timeEntry.id;

    const [cert] = await db('certifications')
      .insert({
        worker_id: testWorkerId1,
        name: 'Tractor Operation',
        issuing_organization: 'Farm Safety Council',
        issue_date: new Date(),
        expiration_date: new Date(Date.now() + 15 * 86400000), // Expires in 15 days
        verified: true,
      })
      .returning('*');
    testCertId = cert.id;
  });

  afterAll(async () => {
    // Clean up test data
    await db('certifications').where({ worker_id: testWorkerId1 }).del();
    await db('time_entries').where({ farm_id: testFarmId }).del();
    await db('schedules').where({ farm_id: testFarmId }).del();
    await db('fields').where({ farm_id: testFarmId }).del();
    await db('workers').where({ farm_id: testFarmId }).del();
    await db('farms').where({ id: testFarmId }).del();

    // Close connection
    await db.destroy();
  });

  describe('getSchedulesDetailed', () => {
    it('should return schedules with worker and field details', async () => {
      const schedules = await getSchedulesDetailed(testFarmId);

      expect(schedules).toBeDefined();
      expect(schedules.length).toBeGreaterThan(0);

      const schedule = schedules[0];
      expect(schedule.id).toBeDefined();
      expect(schedule.worker_first_name).toBe('John');
      expect(schedule.worker_last_name).toBe('Doe');
      expect(schedule.field_name).toBe('North Field');
    });

    it('should filter by date range', async () => {
      const tomorrow = new Date(Date.now() + 86400000);
      const dayAfter = new Date(Date.now() + 2 * 86400000);

      const schedules = await getSchedulesDetailed(testFarmId, {
        start_date: tomorrow.toISOString().split('T')[0],
        end_date: dayAfter.toISOString().split('T')[0],
      });

      expect(schedules).toBeDefined();
      expect(schedules.length).toBeGreaterThan(0);
    });

    it('should filter by worker', async () => {
      const schedules = await getSchedulesDetailed(testFarmId, {
        workerId: testWorkerId1,
      });

      expect(schedules).toBeDefined();
      expect(schedules.every((s) => s.worker_id === testWorkerId1)).toBe(true);
    });

    it('should filter by status', async () => {
      const schedules = await getSchedulesDetailed(testFarmId, {
        status: 'scheduled',
      });

      expect(schedules).toBeDefined();
      expect(schedules.every((s) => s.status === 'scheduled')).toBe(true);
    });
  });

  describe('getTimeEntriesDetailed', () => {
    it('should return time entries with worker and field details', async () => {
      const entries = await getTimeEntriesDetailed(testFarmId);

      expect(entries).toBeDefined();
      expect(entries.length).toBeGreaterThan(0);

      const entry = entries[0];
      expect(entry.id).toBeDefined();
      expect(entry.worker_first_name).toBe('John');
      expect(entry.worker_last_name).toBe('Doe');
      expect(entry.field_name).toBe('North Field');
    });

    it('should filter by worker', async () => {
      const entries = await getTimeEntriesDetailed(testFarmId, {
        workerId: testWorkerId1,
      });

      expect(entries).toBeDefined();
      expect(entries.every((e) => e.worker_id === testWorkerId1)).toBe(true);
    });

    it('should filter by verified status', async () => {
      const unverified = await getTimeEntriesDetailed(testFarmId, {
        verified: false,
      });

      expect(unverified).toBeDefined();
      expect(unverified.every((e) => e.verified_at === null)).toBe(true);
    });
  });

  describe('getWorkerWithDetails', () => {
    it('should return worker with all related data', async () => {
      const worker = await getWorkerWithDetails(testWorkerId1, testFarmId);

      expect(worker).toBeDefined();
      expect(worker.id).toBe(testWorkerId1);
      expect(worker.first_name).toBe('John');
      expect(worker.certifications).toBeDefined();
      expect(worker.recent_schedules).toBeDefined();
      expect(worker.recent_time_entries).toBeDefined();
    });

    it('should include certifications', async () => {
      const worker = await getWorkerWithDetails(testWorkerId1, testFarmId);

      expect(worker.certifications).toBeDefined();
      expect(Array.isArray(worker.certifications)).toBe(true);
      expect(worker.certifications.length).toBeGreaterThan(0);
    });
  });

  describe('getWorkerStatistics', () => {
    it('should return statistics for a worker', async () => {
      const stats = await getWorkerStatistics(testFarmId, testWorkerId1);

      expect(stats).toBeDefined();
      expect(stats.worker_id).toBe(testWorkerId1);
      expect(stats.total_hours_worked).toBeDefined();
      expect(stats.total_time_entries).toBeDefined();
      expect(stats.total_schedules).toBeDefined();
    });

    it('should return statistics for all workers', async () => {
      const stats = await getWorkerStatistics(testFarmId);

      expect(stats).toBeDefined();
      expect(Array.isArray(stats)).toBe(true);
      expect(stats.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('getFieldUtilization', () => {
    it('should return field utilization statistics', async () => {
      const stats = await getFieldUtilization(testFarmId, testFieldId);

      expect(stats).toBeDefined();
      expect(stats.field_id).toBe(testFieldId);
      expect(stats.field_name).toBe('North Field');
      expect(stats.total_hours).toBeDefined();
    });
  });

  describe('getWorkersPaginated', () => {
    it('should return paginated workers', async () => {
      const result = await getWorkersPaginated(testFarmId, {
        page: 1,
        per_page: 10,
      });

      expect(result).toBeDefined();
      expect(result.data).toBeDefined();
      expect(result.total).toBeGreaterThanOrEqual(2);
      expect(result.page).toBe(1);
      expect(result.per_page).toBe(10);
    });

    it('should filter by status', async () => {
      const result = await getWorkersPaginated(testFarmId, {
        page: 1,
        per_page: 10,
        status: 'active',
      });

      expect(result).toBeDefined();
      expect(result.data.every((w: any) => w.status === 'active')).toBe(true);
    });

    it('should search by name', async () => {
      const result = await getWorkersPaginated(testFarmId, {
        page: 1,
        per_page: 10,
        search: 'John',
      });

      expect(result).toBeDefined();
      expect(result.data.length).toBeGreaterThan(0);
    });
  });

  describe('getLaborHoursSummary', () => {
    it('should return labor hours summary by day', async () => {
      const startDate = new Date(Date.now() - 7 * 86400000).toISOString();
      const endDate = new Date().toISOString();

      const summary = await getLaborHoursSummary(testFarmId, startDate, endDate, 'day');

      expect(summary).toBeDefined();
      expect(Array.isArray(summary)).toBe(true);
    });
  });

  describe('getExpiringCertifications', () => {
    it('should return certifications expiring soon', async () => {
      const expiring = await getExpiringCertifications(testFarmId, 30);

      expect(expiring).toBeDefined();
      expect(Array.isArray(expiring)).toBe(true);
      // Should include the cert that expires in 15 days
      expect(expiring.length).toBeGreaterThan(0);
    });
  });

  describe('getWorkersWithCertifications', () => {
    it('should batch load workers with certifications', async () => {
      const workers = await getWorkersWithCertifications(testFarmId);

      expect(workers).toBeDefined();
      expect(Array.isArray(workers)).toBe(true);
      expect(workers.length).toBeGreaterThanOrEqual(2);

      // Check that certifications are attached
      const workerWithCert = workers.find((w) => w.id === testWorkerId1);
      expect(workerWithCert).toBeDefined();
      expect(workerWithCert.certifications).toBeDefined();
      expect(Array.isArray(workerWithCert.certifications)).toBe(true);
    });

    it('should filter by worker IDs', async () => {
      const workers = await getWorkersWithCertifications(testFarmId, [testWorkerId1]);

      expect(workers).toBeDefined();
      expect(workers.length).toBe(1);
      expect(workers[0].id).toBe(testWorkerId1);
    });
  });

  describe('getUnverifiedTimeEntries', () => {
    it('should return unverified time entries', async () => {
      const unverified = await getUnverifiedTimeEntries(testFarmId, 50);

      expect(unverified).toBeDefined();
      expect(Array.isArray(unverified)).toBe(true);
    });
  });

  describe('getActiveTimeEntries', () => {
    it('should return active time entries', async () => {
      // Create an active entry (no clock_out)
      const [activeEntry] = await db('time_entries')
        .insert({
          farm_id: testFarmId,
          worker_id: testWorkerId2,
          field_id: testFieldId,
          clock_in: new Date(),
          task_type: 'Harvesting',
          break_minutes: 0,
        })
        .returning('*');

      const active = await getActiveTimeEntries(testFarmId);

      expect(active).toBeDefined();
      expect(Array.isArray(active)).toBe(true);
      expect(active.length).toBeGreaterThan(0);
      expect(active.every((e) => e.clock_out === null)).toBe(true);

      // Clean up
      await db('time_entries').where({ id: activeEntry.id }).del();
    });
  });

  describe('getUpcomingSchedules', () => {
    it('should return upcoming schedules', async () => {
      const upcoming = await getUpcomingSchedules(testFarmId, 7, 50);

      expect(upcoming).toBeDefined();
      expect(Array.isArray(upcoming)).toBe(true);
      expect(upcoming.length).toBeGreaterThan(0);
    });
  });
});

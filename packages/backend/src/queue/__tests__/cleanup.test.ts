/**
 * Tests for cleanup jobs
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Job } from 'bullmq';
import { db } from '../../db/connection.js';
import {
  archiveOldTimeEntries,
  cleanupExpiredSessions,
  aggregateHistoricalStats,
} from '../jobs/cleanup.js';
import { subYears, subDays } from 'date-fns';

// Mock logger
vi.mock('pino', () => ({
  default: () => ({
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  }),
}));

// Mock Redis client
vi.mock('redis', () => ({
  createClient: vi.fn(() => ({
    connect: vi.fn(),
    quit: vi.fn(),
    keys: vi.fn(() => Promise.resolve([])),
    ttl: vi.fn(() => Promise.resolve(-1)),
    expire: vi.fn(),
  })),
}));

// Mock job for testing
const createMockJob = (name: string): Job => {
  return {
    id: 'test-job-id',
    name,
    data: {},
    updateProgress: vi.fn(),
    log: vi.fn(),
  } as unknown as Job;
};

describe('Cleanup Jobs', () => {
  describe('archiveOldTimeEntries', () => {
    beforeEach(async () => {
      // Clean up test tables
      await db.schema.dropTableIfExists('archived_time_entries');
    });

    afterEach(async () => {
      await db.schema.dropTableIfExists('archived_time_entries');
    });

    it('should create archived_time_entries table if it does not exist', async () => {
      const job = createMockJob('archive-old-entries');

      await archiveOldTimeEntries(job);

      const tableExists = await db.schema.hasTable('archived_time_entries');
      expect(tableExists).toBe(true);
    });

    it('should not fail when there are no entries to archive', async () => {
      const job = createMockJob('archive-old-entries');

      await expect(archiveOldTimeEntries(job)).resolves.not.toThrow();
      expect(job.updateProgress).toHaveBeenCalledWith(100);
    });

    it('should archive time entries older than 1 year', async () => {
      // Create a test farm and worker
      const [farm] = await db('farms')
        .insert({
          name: 'Test Farm',
          location: 'Test Location',
          size_acres: 100,
        })
        .returning('*');

      const [user] = await db('users')
        .insert({
          email: 'test@example.com',
          password_hash: 'hash',
          role: 'worker',
          farm_id: farm.id,
        })
        .returning('*');

      const [worker] = await db('workers')
        .insert({
          farm_id: farm.id,
          user_id: user.id,
          first_name: 'Test',
          last_name: 'Worker',
          phone: '1234567890',
          hire_date: new Date(),
        })
        .returning('*');

      // Create old time entry
      const oldDate = subYears(new Date(), 2);
      await db('time_entries').insert({
        farm_id: farm.id,
        worker_id: worker.id,
        clock_in: oldDate,
        clock_out: new Date(oldDate.getTime() + 8 * 60 * 60 * 1000),
        total_hours: 8,
        task_type: 'harvesting',
      });

      const job = createMockJob('archive-old-entries');

      await archiveOldTimeEntries(job);

      // Check that entry was archived
      const archivedEntries = await db('archived_time_entries').select('*');
      expect(archivedEntries.length).toBe(1);
      expect(archivedEntries[0].task_type).toBe('harvesting');

      // Check that entry was removed from main table
      const remainingEntries = await db('time_entries')
        .where('clock_in', '<', subYears(new Date(), 1))
        .select('*');
      expect(remainingEntries.length).toBe(0);

      // Clean up test data
      await db('archived_time_entries').delete();
      await db('time_entries').delete();
      await db('workers').where('id', worker.id).delete();
      await db('users').where('id', user.id).delete();
      await db('farms').where('id', farm.id).delete();
    });
  });

  describe('cleanupExpiredSessions', () => {
    it('should complete successfully even with no sessions', async () => {
      const job = createMockJob('cleanup-sessions');

      await expect(cleanupExpiredSessions(job)).resolves.not.toThrow();
      expect(job.updateProgress).toHaveBeenCalledWith(100);
    });
  });

  describe('aggregateHistoricalStats', () => {
    beforeEach(async () => {
      await db.schema.dropTableIfExists('aggregated_stats');
    });

    afterEach(async () => {
      await db.schema.dropTableIfExists('aggregated_stats');
    });

    it('should create aggregated_stats table if it does not exist', async () => {
      const job = createMockJob('aggregate-stats');

      await aggregateHistoricalStats(job);

      const tableExists = await db.schema.hasTable('aggregated_stats');
      expect(tableExists).toBe(true);
    });

    it('should aggregate labor hours by day', async () => {
      // Create test data
      const [farm] = await db('farms')
        .insert({
          name: 'Test Farm',
          location: 'Test Location',
          size_acres: 100,
        })
        .returning('*');

      const [user] = await db('users')
        .insert({
          email: 'test2@example.com',
          password_hash: 'hash',
          role: 'worker',
          farm_id: farm.id,
        })
        .returning('*');

      const [worker] = await db('workers')
        .insert({
          farm_id: farm.id,
          user_id: user.id,
          first_name: 'Test',
          last_name: 'Worker',
          phone: '1234567890',
          hire_date: new Date(),
        })
        .returning('*');

      // Create old time entries (older than 30 days)
      const oldDate = subDays(new Date(), 45);
      await db('time_entries').insert({
        farm_id: farm.id,
        worker_id: worker.id,
        clock_in: oldDate,
        clock_out: new Date(oldDate.getTime() + 8 * 60 * 60 * 1000),
        total_hours: 8,
        task_type: 'planting',
      });

      const job = createMockJob('aggregate-stats');

      await aggregateHistoricalStats(job);

      // Check that stats were created
      const stats = await db('aggregated_stats')
        .where({
          farm_id: farm.id,
          stat_type: 'daily_labor_hours',
        })
        .select('*');

      expect(stats.length).toBeGreaterThan(0);
      expect(stats[0].data).toHaveProperty('total_hours');
      expect(stats[0].data.total_hours).toBe(8);

      // Clean up test data
      await db('aggregated_stats').delete();
      await db('time_entries').delete();
      await db('workers').where('id', worker.id).delete();
      await db('users').where('id', user.id).delete();
      await db('farms').where('id', farm.id).delete();
    });
  });
});

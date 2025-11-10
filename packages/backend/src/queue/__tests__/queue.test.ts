// Queue Infrastructure Integration Tests
// NOTE: These tests require Redis to be running on localhost:6379

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import {
  initializeQueues,
  closeQueues,
  getQueue,
  addNotificationJob,
  addDataCleanupJob,
  addExportJob,
  addEmailJob,
  getQueueStats,
  getAllQueueStats,
  pauseQueue,
  resumeQueue,
  cleanQueue,
  QueueNames,
} from '../index.js';

// Skip these tests if Redis is not available
const shouldSkip = !process.env.REDIS_URL && process.env.CI !== 'true';

describe.skipIf(shouldSkip)('Queue Infrastructure (requires Redis)', () => {
  beforeAll(async () => {
    // Initialize all queues before tests
    await initializeQueues();
  });

  afterAll(async () => {
    // Clean up and close all queues after tests
    await closeQueues();
  });

  beforeEach(async () => {
    // Clean all queues before each test
    for (const name of Object.values(QueueNames)) {
      const queue = getQueue(name);
      await queue.drain();
      await queue.clean(0, 1000, 'completed');
      await queue.clean(0, 1000, 'failed');
    }
  });

  describe('Queue Initialization', () => {
    it('should initialize all queues', async () => {
      const notificationsQueue = getQueue(QueueNames.NOTIFICATIONS);
      const cleanupQueue = getQueue(QueueNames.DATA_CLEANUP);
      const exportsQueue = getQueue(QueueNames.EXPORTS);
      const emailsQueue = getQueue(QueueNames.EMAILS);

      expect(notificationsQueue).toBeDefined();
      expect(cleanupQueue).toBeDefined();
      expect(exportsQueue).toBeDefined();
      expect(emailsQueue).toBeDefined();
    });

    it('should return the same queue instance when called multiple times', () => {
      const queue1 = getQueue(QueueNames.NOTIFICATIONS);
      const queue2 = getQueue(QueueNames.NOTIFICATIONS);

      expect(queue1).toBe(queue2);
    });
  });

  describe('Notification Jobs', () => {
    it('should add a notification job to the queue', async () => {
      const jobData = {
        type: 'schedule_reminder' as const,
        recipientId: 1,
        recipientEmail: 'test@example.com',
        subject: 'Schedule Reminder',
        message: 'You have a task scheduled for tomorrow',
      };

      const job = await addNotificationJob(jobData);

      expect(job).toBeDefined();
      expect(job.id).toBeDefined();
      expect(job.data).toEqual(jobData);
    });

    it('should add notification job with delay', async () => {
      const jobData = {
        type: 'certification_expiry' as const,
        recipientId: 2,
        subject: 'Certification Expiring',
        message: 'Your certification expires in 30 days',
      };

      const delay = 5000; // 5 seconds
      const job = await addNotificationJob(jobData, { delay });

      expect(job).toBeDefined();
      expect(job.opts.delay).toBe(delay);
    });

    it('should add notification job with priority', async () => {
      const jobData = {
        type: 'time_entry_reminder' as const,
        recipientId: 3,
        subject: 'Time Entry Reminder',
        message: 'Please submit your time entries',
      };

      const priority = 1; // Higher priority
      const job = await addNotificationJob(jobData, { priority });

      expect(job).toBeDefined();
      expect(job.opts.priority).toBe(priority);
    });
  });

  describe('Data Cleanup Jobs', () => {
    it('should add a data cleanup job to the queue', async () => {
      const jobData = {
        type: 'archive_old_entries' as const,
        olderThanDays: 365,
        dryRun: true,
      };

      const job = await addDataCleanupJob(jobData);

      expect(job).toBeDefined();
      expect(job.data).toEqual(jobData);
    });

    it('should add cleanup job for session cleanup', async () => {
      const jobData = {
        type: 'cleanup_sessions' as const,
        olderThanDays: 7,
      };

      const job = await addDataCleanupJob(jobData);

      expect(job).toBeDefined();
      expect(job.data.type).toBe('cleanup_sessions');
    });
  });

  describe('Export Jobs', () => {
    it('should add an export job to the queue', async () => {
      const jobData = {
        type: 'time_entries' as const,
        farmId: 1,
        userId: 1,
        format: 'csv' as const,
        dateRange: {
          start: '2025-01-01',
          end: '2025-01-31',
        },
      };

      const job = await addExportJob(jobData);

      expect(job).toBeDefined();
      expect(job.data).toEqual(jobData);
    });

    it('should add export job with filters', async () => {
      const jobData = {
        type: 'workers' as const,
        farmId: 1,
        userId: 1,
        format: 'xlsx' as const,
        filters: {
          status: 'active',
          role: 'field_worker',
        },
      };

      const job = await addExportJob(jobData);

      expect(job).toBeDefined();
      expect(job.data.filters).toEqual({
        status: 'active',
        role: 'field_worker',
      });
    });
  });

  describe('Email Jobs', () => {
    it('should add an email job to the queue', async () => {
      const jobData = {
        to: 'worker@example.com',
        subject: 'Welcome to Farm Commons',
        template: 'welcome',
        data: {
          name: 'John Doe',
          farmName: 'Green Acres Farm',
        },
      };

      const job = await addEmailJob(jobData);

      expect(job).toBeDefined();
      expect(job.data).toEqual(jobData);
    });

    it('should add email job with attachments', async () => {
      const jobData = {
        to: 'manager@example.com',
        subject: 'Payroll Report',
        template: 'payroll_report',
        data: {
          period: '2025-01',
        },
        attachments: [
          {
            filename: 'payroll.pdf',
            path: '/tmp/payroll.pdf',
          },
        ],
      };

      const job = await addEmailJob(jobData);

      expect(job).toBeDefined();
      expect(job.data.attachments).toHaveLength(1);
    });
  });

  describe('Queue Statistics', () => {
    it('should get queue statistics', async () => {
      // Add some jobs
      await addNotificationJob({
        type: 'schedule_reminder',
        recipientId: 1,
        subject: 'Test',
        message: 'Test message',
      });

      const stats = await getQueueStats(QueueNames.NOTIFICATIONS);

      expect(stats).toBeDefined();
      expect(stats.name).toBe(QueueNames.NOTIFICATIONS);
      expect(stats.waiting).toBeGreaterThanOrEqual(0);
      expect(stats.active).toBeGreaterThanOrEqual(0);
      expect(stats.total).toBeGreaterThanOrEqual(0);
    });

    it('should get all queue statistics', async () => {
      const stats = await getAllQueueStats();

      expect(stats).toBeDefined();
      expect(Array.isArray(stats)).toBe(true);
      expect(stats.length).toBe(Object.values(QueueNames).length);
    });
  });

  describe('Queue Management', () => {
    it('should pause and resume a queue', async () => {
      await pauseQueue(QueueNames.NOTIFICATIONS);

      const queue = getQueue(QueueNames.NOTIFICATIONS);
      expect(await queue.isPaused()).toBe(true);

      await resumeQueue(QueueNames.NOTIFICATIONS);
      expect(await queue.isPaused()).toBe(false);
    });

    it('should clean old jobs from a queue', async () => {
      // Add and complete a job
      const job = await addNotificationJob({
        type: 'schedule_reminder',
        recipientId: 1,
        subject: 'Test',
        message: 'Test message',
      });

      // Manually complete the job for testing
      await job.moveToCompleted({ success: true }, job.token || '0', true);

      // Clean jobs older than 0ms (immediate cleanup)
      await cleanQueue(QueueNames.NOTIFICATIONS, 0, 'completed');

      const stats = await getQueueStats(QueueNames.NOTIFICATIONS);
      expect(stats.completed).toBe(0);
    });
  });

  describe('Job Retry Logic', () => {
    it('should have retry configuration', async () => {
      const job = await addNotificationJob({
        type: 'schedule_reminder',
        recipientId: 1,
        subject: 'Test',
        message: 'Test message',
      });

      expect(job.opts.attempts).toBe(3);
      expect(job.opts.backoff).toBeDefined();
      expect(job.opts.backoff).toEqual({
        type: 'exponential',
        delay: 2000,
      });
    });
  });

  describe('Job Removal Configuration', () => {
    it('should have job removal configuration', async () => {
      const job = await addNotificationJob({
        type: 'schedule_reminder',
        recipientId: 1,
        subject: 'Test',
        message: 'Test message',
      });

      expect(job.opts.removeOnComplete).toBeDefined();
      expect(job.opts.removeOnComplete).toEqual({
        age: 86400,
        count: 1000,
      });

      expect(job.opts.removeOnFail).toBeDefined();
      expect(job.opts.removeOnFail).toEqual({
        age: 604800,
      });
    });
  });
});

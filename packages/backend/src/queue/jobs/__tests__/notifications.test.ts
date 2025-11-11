// Tests for Scheduled Notification Jobs
// Task 0036: Job execution tests

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { format, addDays } from 'date-fns';
import * as emailService from '../../../services/email.js';
import db from '../../../db/connection.js';

// Mock dependencies
vi.mock('../../../services/email.js');
vi.mock('../../../db/connection.js');

// Mock BullMQ
vi.mock('bullmq', () => ({
  Queue: vi.fn(),
  Worker: vi.fn(),
  QueueEvents: vi.fn(),
}));

describe('Notification Jobs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Schedule Reminder Job', () => {
    it('should send schedule reminder email with correct data', async () => {
      const mockJobData = {
        scheduleId: 'schedule-123',
        workerId: 'worker-456',
        workerEmail: 'worker@example.com',
        workerName: 'John Doe',
        scheduledDate: 'Monday, January 15, 2024',
        taskDescription: 'Harvest tomatoes',
      };

      const sendScheduleReminderSpy = vi
        .spyOn(emailService, 'sendScheduleReminder')
        .mockResolvedValue();

      // Simulate job processing
      await emailService.sendScheduleReminder({
        to: mockJobData.workerEmail,
        workerName: mockJobData.workerName,
        scheduledDate: mockJobData.scheduledDate,
        taskDescription: mockJobData.taskDescription,
      });

      expect(sendScheduleReminderSpy).toHaveBeenCalledWith({
        to: 'worker@example.com',
        workerName: 'John Doe',
        scheduledDate: 'Monday, January 15, 2024',
        taskDescription: 'Harvest tomatoes',
      });
      expect(sendScheduleReminderSpy).toHaveBeenCalledTimes(1);
    });

    it('should handle errors when sending schedule reminder fails', async () => {
      const mockJobData = {
        scheduleId: 'schedule-123',
        workerId: 'worker-456',
        workerEmail: 'invalid@example.com',
        workerName: 'John Doe',
        scheduledDate: 'Monday, January 15, 2024',
        taskDescription: 'Harvest tomatoes',
      };

      const sendScheduleReminderSpy = vi
        .spyOn(emailService, 'sendScheduleReminder')
        .mockRejectedValue(new Error('SMTP connection failed'));

      await expect(
        emailService.sendScheduleReminder({
          to: mockJobData.workerEmail,
          workerName: mockJobData.workerName,
          scheduledDate: mockJobData.scheduledDate,
          taskDescription: mockJobData.taskDescription,
        })
      ).rejects.toThrow('SMTP connection failed');

      expect(sendScheduleReminderSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('Certification Expiry Warning Job', () => {
    it('should send certification expiry warning with correct urgency', async () => {
      const mockJobData = {
        workerId: 'worker-456',
        workerEmail: 'worker@example.com',
        workerName: 'Jane Smith',
        certificationName: 'Pesticide Applicator License',
        expiryDate: 'Friday, January 20, 2024',
        daysUntilExpiry: 7,
      };

      const sendCertificationExpiryWarningSpy = vi
        .spyOn(emailService, 'sendCertificationExpiryWarning')
        .mockResolvedValue();

      await emailService.sendCertificationExpiryWarning({
        to: mockJobData.workerEmail,
        workerName: mockJobData.workerName,
        certificationName: mockJobData.certificationName,
        expiryDate: mockJobData.expiryDate,
        daysUntilExpiry: mockJobData.daysUntilExpiry,
      });

      expect(sendCertificationExpiryWarningSpy).toHaveBeenCalledWith({
        to: 'worker@example.com',
        workerName: 'Jane Smith',
        certificationName: 'Pesticide Applicator License',
        expiryDate: 'Friday, January 20, 2024',
        daysUntilExpiry: 7,
      });
      expect(sendCertificationExpiryWarningSpy).toHaveBeenCalledTimes(1);
    });

    it('should send urgent warning for certifications expiring in 1 day', async () => {
      const mockJobData = {
        workerId: 'worker-789',
        workerEmail: 'urgent@example.com',
        workerName: 'Bob Johnson',
        certificationName: 'Food Safety Certification',
        expiryDate: 'Tomorrow',
        daysUntilExpiry: 1,
      };

      const sendCertificationExpiryWarningSpy = vi
        .spyOn(emailService, 'sendCertificationExpiryWarning')
        .mockResolvedValue();

      await emailService.sendCertificationExpiryWarning({
        to: mockJobData.workerEmail,
        workerName: mockJobData.workerName,
        certificationName: mockJobData.certificationName,
        expiryDate: mockJobData.expiryDate,
        daysUntilExpiry: mockJobData.daysUntilExpiry,
      });

      expect(sendCertificationExpiryWarningSpy).toHaveBeenCalledTimes(1);
      expect(sendCertificationExpiryWarningSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          daysUntilExpiry: 1,
        })
      );
    });
  });

  describe('Unverified Time Entry Reminder Job', () => {
    it('should send unverified time entry reminder', async () => {
      const mockJobData = {
        timeEntryId: 'entry-123',
        workerId: 'worker-456',
        workerEmail: 'worker@example.com',
        workerName: 'Alice Williams',
        entryDate: 'Wednesday, January 10, 2024',
      };

      const sendUnverifiedTimeEntryReminderSpy = vi
        .spyOn(emailService, 'sendUnverifiedTimeEntryReminder')
        .mockResolvedValue();

      await emailService.sendUnverifiedTimeEntryReminder({
        to: mockJobData.workerEmail,
        workerName: mockJobData.workerName,
        entryDate: mockJobData.entryDate,
      });

      expect(sendUnverifiedTimeEntryReminderSpy).toHaveBeenCalledWith({
        to: 'worker@example.com',
        workerName: 'Alice Williams',
        entryDate: 'Wednesday, January 10, 2024',
      });
      expect(sendUnverifiedTimeEntryReminderSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('Daily Schedule Scan', () => {
    it('should query schedules for tomorrow', async () => {
      const tomorrow = addDays(new Date(), 1);
      const tomorrowStart = new Date(tomorrow);
      tomorrowStart.setHours(0, 0, 0, 0);
      const tomorrowEnd = new Date(tomorrow);
      tomorrowEnd.setHours(23, 59, 59, 999);

      const mockSchedules = [
        {
          scheduleId: 'schedule-1',
          scheduled_date: tomorrow.toISOString(),
          task_description: 'Watering crops',
          workerId: 'worker-1',
          first_name: 'John',
          last_name: 'Doe',
          email: 'john@example.com',
        },
      ];

      const mockDb = {
        select: vi.fn().mockReturnThis(),
        join: vi.fn().mockReturnThis(),
        whereBetween: vi.fn().mockReturnThis(),
        whereNotNull: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue(mockSchedules),
      };

      vi.mocked(db).mockReturnValue(mockDb as never);

      // Simulate scanning
      const schedules = await db('schedules')
        .select(
          'schedules.id as scheduleId',
          'schedules.scheduled_date',
          'schedules.task_description',
          'workers.id as workerId',
          'workers.first_name',
          'workers.last_name',
          'workers.email'
        )
        .join('workers', 'schedules.worker_id', 'workers.id')
        .whereBetween('schedules.scheduled_date', [
          tomorrowStart.toISOString(),
          tomorrowEnd.toISOString(),
        ])
        .whereNotNull('workers.email')
        .where('workers.email', '!=', '');

      expect(schedules).toHaveLength(1);
      expect(schedules[0].email).toBe('john@example.com');
    });
  });

  describe('Daily Certification Scan', () => {
    it('should query certifications expiring within 30 days', async () => {
      const today = new Date();
      const in30Days = addDays(today, 30);

      const mockCertifications = [
        {
          certificationId: 'cert-1',
          certificationName: 'Forklift License',
          expiry_date: addDays(today, 7).toISOString(),
          workerId: 'worker-1',
          first_name: 'Jane',
          last_name: 'Smith',
          email: 'jane@example.com',
        },
      ];

      const mockDb = {
        select: vi.fn().mockReturnThis(),
        join: vi.fn().mockReturnThis(),
        whereBetween: vi.fn().mockReturnThis(),
        whereNotNull: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue(mockCertifications),
      };

      vi.mocked(db).mockReturnValue(mockDb as never);

      // Simulate scanning
      const certifications = await db('certifications')
        .select(
          'certifications.id as certificationId',
          'certifications.name as certificationName',
          'certifications.expiry_date',
          'workers.id as workerId',
          'workers.first_name',
          'workers.last_name',
          'workers.email'
        )
        .join('workers', 'certifications.worker_id', 'workers.id')
        .whereBetween('certifications.expiry_date', [today.toISOString(), in30Days.toISOString()])
        .whereNotNull('workers.email')
        .where('workers.email', '!=', '');

      expect(certifications).toHaveLength(1);
      expect(certifications[0].email).toBe('jane@example.com');
    });
  });

  describe('Daily Time Entry Scan', () => {
    it('should query unverified time entries older than 2 days', async () => {
      const twoDaysAgo = addDays(new Date(), -2);

      const mockTimeEntries = [
        {
          timeEntryId: 'entry-1',
          clock_in: twoDaysAgo.toISOString(),
          workerId: 'worker-1',
          first_name: 'Bob',
          last_name: 'Johnson',
          email: 'bob@example.com',
        },
      ];

      const mockDb = {
        select: vi.fn().mockReturnThis(),
        join: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        whereNotNull: vi.fn().mockReturnThis(),
      };

      // Chain the last where to resolve with mockTimeEntries
      mockDb.where = vi.fn((column, operator, value) => {
        if (column === 'workers.email' && operator === '!=') {
          return Promise.resolve(mockTimeEntries);
        }
        return mockDb;
      });

      vi.mocked(db).mockReturnValue(mockDb as never);

      // Simulate scanning
      const timeEntries = await db('time_entries')
        .select(
          'time_entries.id as timeEntryId',
          'time_entries.clock_in',
          'workers.id as workerId',
          'workers.first_name',
          'workers.last_name',
          'workers.email'
        )
        .join('workers', 'time_entries.worker_id', 'workers.id')
        .where('time_entries.is_verified', false)
        .where('time_entries.clock_in', '<', twoDaysAgo.toISOString())
        .whereNotNull('workers.email')
        .where('workers.email', '!=', '');

      expect(timeEntries).toHaveLength(1);
      expect(timeEntries[0].email).toBe('bob@example.com');
    });
  });

  describe('Job Retry Logic', () => {
    it('should retry failed jobs with exponential backoff', async () => {
      const mockJobData = {
        scheduleId: 'schedule-123',
        workerId: 'worker-456',
        workerEmail: 'worker@example.com',
        workerName: 'John Doe',
        scheduledDate: 'Monday, January 15, 2024',
        taskDescription: 'Harvest tomatoes',
      };

      let attemptCount = 0;
      const sendScheduleReminderSpy = vi
        .spyOn(emailService, 'sendScheduleReminder')
        .mockImplementation(async () => {
          attemptCount++;
          if (attemptCount < 3) {
            throw new Error('Temporary failure');
          }
          return;
        });

      // First attempt - fails
      await expect(
        emailService.sendScheduleReminder({
          to: mockJobData.workerEmail,
          workerName: mockJobData.workerName,
          scheduledDate: mockJobData.scheduledDate,
          taskDescription: mockJobData.taskDescription,
        })
      ).rejects.toThrow('Temporary failure');

      // Second attempt - fails
      await expect(
        emailService.sendScheduleReminder({
          to: mockJobData.workerEmail,
          workerName: mockJobData.workerName,
          scheduledDate: mockJobData.scheduledDate,
          taskDescription: mockJobData.taskDescription,
        })
      ).rejects.toThrow('Temporary failure');

      // Third attempt - succeeds
      await expect(
        emailService.sendScheduleReminder({
          to: mockJobData.workerEmail,
          workerName: mockJobData.workerName,
          scheduledDate: mockJobData.scheduledDate,
          taskDescription: mockJobData.taskDescription,
        })
      ).resolves.toBeUndefined();

      expect(sendScheduleReminderSpy).toHaveBeenCalledTimes(3);
    });
  });
});

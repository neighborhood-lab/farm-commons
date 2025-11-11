// Scheduled Notification Jobs
// Task 0036: Implement Scheduled Notification Jobs

import { Worker } from 'bullmq';
import { format, addDays, parseISO } from 'date-fns';
import db from '../../db/connection.js';
import {
  sendScheduleReminder,
  sendCertificationExpiryWarning,
  sendUnverifiedTimeEntryReminder,
} from '../../services/email.js';
import {
  getQueue,
  createWorker,
  QueueName,
  type ScheduleReminderJobData,
  type CertificationExpiryJobData,
  type UnverifiedTimeEntryJobData,
} from '../index.js';
import pino from 'pino';

const logger = pino({ name: 'notification-jobs' });

/**
 * Job names for notification jobs
 */
export enum NotificationJobName {
  SCHEDULE_REMINDER = 'schedule-reminder',
  CERTIFICATION_EXPIRY = 'certification-expiry',
  UNVERIFIED_TIME_ENTRY = 'unverified-time-entry',
  DAILY_SCHEDULE_SCAN = 'daily-schedule-scan',
  DAILY_CERTIFICATION_SCAN = 'daily-certification-scan',
  DAILY_TIME_ENTRY_SCAN = 'daily-time-entry-scan',
}

/**
 * Process individual schedule reminder job
 */
async function processScheduleReminder(job: {
  id: string | undefined;
  name: string;
  data: ScheduleReminderJobData;
}): Promise<void> {
  const { workerId, workerEmail, workerName, scheduledDate, taskDescription } = job.data;

  logger.info({ jobId: job.id, workerId, scheduledDate }, 'Processing schedule reminder');

  try {
    await sendScheduleReminder({
      to: workerEmail,
      workerName,
      scheduledDate,
      taskDescription,
    });

    logger.info({ jobId: job.id, workerId, workerEmail }, 'Schedule reminder sent successfully');
  } catch (error) {
    logger.error(
      { jobId: job.id, workerId, workerEmail, error },
      'Failed to send schedule reminder'
    );
    throw error;
  }
}

/**
 * Process individual certification expiry warning job
 */
async function processCertificationExpiryWarning(job: {
  id: string | undefined;
  name: string;
  data: CertificationExpiryJobData;
}): Promise<void> {
  const { workerId, workerEmail, workerName, certificationName, expiryDate, daysUntilExpiry } =
    job.data;

  logger.info(
    { jobId: job.id, workerId, certificationName, daysUntilExpiry },
    'Processing certification expiry warning'
  );

  try {
    await sendCertificationExpiryWarning({
      to: workerEmail,
      workerName,
      certificationName,
      expiryDate,
      daysUntilExpiry,
    });

    logger.info(
      { jobId: job.id, workerId, workerEmail, certificationName },
      'Certification expiry warning sent successfully'
    );
  } catch (error) {
    logger.error(
      { jobId: job.id, workerId, workerEmail, certificationName, error },
      'Failed to send certification expiry warning'
    );
    throw error;
  }
}

/**
 * Process individual unverified time entry reminder job
 */
async function processUnverifiedTimeEntryReminder(job: {
  id: string | undefined;
  name: string;
  data: UnverifiedTimeEntryJobData;
}): Promise<void> {
  const { timeEntryId, workerId, workerEmail, workerName, entryDate } = job.data;

  logger.info(
    { jobId: job.id, timeEntryId, workerId, entryDate },
    'Processing unverified time entry reminder'
  );

  try {
    await sendUnverifiedTimeEntryReminder({
      to: workerEmail,
      workerName,
      entryDate,
    });

    logger.info(
      { jobId: job.id, timeEntryId, workerId, workerEmail },
      'Unverified time entry reminder sent successfully'
    );
  } catch (error) {
    logger.error(
      { jobId: job.id, timeEntryId, workerId, workerEmail, error },
      'Failed to send unverified time entry reminder'
    );
    throw error;
  }
}

/**
 * Scan for tomorrow's schedules and queue reminder notifications
 */
async function scanAndQueueScheduleReminders(): Promise<void> {
  logger.info('Scanning for schedule reminders');

  try {
    // Get tomorrow's date range
    const tomorrow = addDays(new Date(), 1);
    const tomorrowStart = new Date(tomorrow);
    tomorrowStart.setHours(0, 0, 0, 0);
    const tomorrowEnd = new Date(tomorrow);
    tomorrowEnd.setHours(23, 59, 59, 999);

    // Query schedules for tomorrow
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

    logger.info(
      { count: schedules.length, date: format(tomorrow, 'yyyy-MM-dd') },
      'Found schedules for tomorrow'
    );

    // Queue individual reminder jobs
    const queue = getQueue(QueueName.NOTIFICATIONS);

    for (const schedule of schedules) {
      const jobData: ScheduleReminderJobData = {
        scheduleId: schedule.scheduleId,
        workerId: schedule.workerId,
        workerEmail: schedule.email,
        workerName: `${schedule.first_name} ${schedule.last_name}`,
        scheduledDate: format(parseISO(schedule.scheduled_date), 'EEEE, MMMM d, yyyy'),
        taskDescription: schedule.task_description,
      };

      await queue.add(NotificationJobName.SCHEDULE_REMINDER, jobData, {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
      });

      logger.debug(
        { scheduleId: schedule.scheduleId, workerId: schedule.workerId },
        'Schedule reminder queued'
      );
    }

    logger.info({ queued: schedules.length }, 'Schedule reminders queued successfully');
  } catch (error) {
    logger.error({ error }, 'Failed to scan and queue schedule reminders');
    throw error;
  }
}

/**
 * Scan for expiring certifications and queue warning notifications
 */
async function scanAndQueueCertificationWarnings(): Promise<void> {
  logger.info('Scanning for expiring certifications');

  try {
    const today = new Date();
    const in30Days = addDays(today, 30);

    // Query certifications expiring within 30 days
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

    logger.info({ count: certifications.length }, 'Found certifications expiring within 30 days');

    // Queue individual warning jobs
    const queue = getQueue(QueueName.NOTIFICATIONS);

    for (const cert of certifications) {
      const expiryDate = parseISO(cert.expiry_date);
      const daysUntilExpiry = Math.ceil(
        (expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );

      // Only send warnings at specific intervals: 30, 14, 7, 3, 1 days
      const shouldSend =
        daysUntilExpiry === 30 ||
        daysUntilExpiry === 14 ||
        daysUntilExpiry === 7 ||
        daysUntilExpiry === 3 ||
        daysUntilExpiry === 1;

      if (shouldSend) {
        const jobData: CertificationExpiryJobData = {
          workerId: cert.workerId,
          workerEmail: cert.email,
          workerName: `${cert.first_name} ${cert.last_name}`,
          certificationName: cert.certificationName,
          expiryDate: format(expiryDate, 'EEEE, MMMM d, yyyy'),
          daysUntilExpiry,
        };

        await queue.add(NotificationJobName.CERTIFICATION_EXPIRY, jobData, {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 5000,
          },
        });

        logger.debug(
          {
            certificationId: cert.certificationId,
            workerId: cert.workerId,
            daysUntilExpiry,
          },
          'Certification expiry warning queued'
        );
      }
    }

    logger.info('Certification warnings queued successfully');
  } catch (error) {
    logger.error({ error }, 'Failed to scan and queue certification warnings');
    throw error;
  }
}

/**
 * Scan for unverified time entries and queue reminder notifications
 */
async function scanAndQueueUnverifiedTimeEntryReminders(): Promise<void> {
  logger.info('Scanning for unverified time entries');

  try {
    // Query unverified time entries older than 2 days
    const twoDaysAgo = addDays(new Date(), -2);

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

    logger.info({ count: timeEntries.length }, 'Found unverified time entries older than 2 days');

    // Queue individual reminder jobs
    const queue = getQueue(QueueName.NOTIFICATIONS);

    for (const entry of timeEntries) {
      const jobData: UnverifiedTimeEntryJobData = {
        timeEntryId: entry.timeEntryId,
        workerId: entry.workerId,
        workerEmail: entry.email,
        workerName: `${entry.first_name} ${entry.last_name}`,
        entryDate: format(parseISO(entry.clock_in), 'EEEE, MMMM d, yyyy'),
      };

      await queue.add(NotificationJobName.UNVERIFIED_TIME_ENTRY, jobData, {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
      });

      logger.debug(
        { timeEntryId: entry.timeEntryId, workerId: entry.workerId },
        'Unverified time entry reminder queued'
      );
    }

    logger.info(
      { queued: timeEntries.length },
      'Unverified time entry reminders queued successfully'
    );
  } catch (error) {
    logger.error({ error }, 'Failed to scan and queue unverified time entry reminders');
    throw error;
  }
}

/**
 * Process notification jobs
 */
async function processNotificationJob(job: {
  id: string | undefined;
  name: string;
  data: ScheduleReminderJobData | CertificationExpiryJobData | UnverifiedTimeEntryJobData;
}): Promise<void> {
  switch (job.name) {
    case NotificationJobName.SCHEDULE_REMINDER: {
      await processScheduleReminder(
        job as { id: string | undefined; name: string; data: ScheduleReminderJobData }
      );
      break;
    }

    case NotificationJobName.CERTIFICATION_EXPIRY: {
      await processCertificationExpiryWarning(
        job as { id: string | undefined; name: string; data: CertificationExpiryJobData }
      );
      break;
    }

    case NotificationJobName.UNVERIFIED_TIME_ENTRY: {
      await processUnverifiedTimeEntryReminder(
        job as { id: string | undefined; name: string; data: UnverifiedTimeEntryJobData }
      );
      break;
    }

    case NotificationJobName.DAILY_SCHEDULE_SCAN: {
      await scanAndQueueScheduleReminders();
      break;
    }

    case NotificationJobName.DAILY_CERTIFICATION_SCAN: {
      await scanAndQueueCertificationWarnings();
      break;
    }

    case NotificationJobName.DAILY_TIME_ENTRY_SCAN: {
      await scanAndQueueUnverifiedTimeEntryReminders();
      break;
    }

    default: {
      logger.warn({ jobName: job.name }, 'Unknown notification job type');
    }
  }
}

/**
 * Create notification worker
 */
export function createNotificationWorker(): Worker {
  logger.info('Creating notification worker');

  const worker = createWorker(
    QueueName.NOTIFICATIONS,
    processNotificationJob,
    10 // Higher concurrency for email sending
  );

  logger.info('Notification worker created');

  return worker;
}

/**
 * Schedule daily notification jobs
 */
export async function scheduleDailyNotificationJobs(): Promise<void> {
  logger.info('Scheduling daily notification jobs');

  const queue = getQueue(QueueName.NOTIFICATIONS);

  // Schedule daily scan jobs
  // These jobs will run every day at specific times

  // Schedule reminders scan - runs at 6 PM every day
  await queue.add(
    NotificationJobName.DAILY_SCHEDULE_SCAN,
    {},
    {
      repeat: {
        pattern: '0 18 * * *', // 6 PM every day
      },
      jobId: 'daily-schedule-scan', // Unique ID to prevent duplicates
    }
  );

  logger.info('Daily schedule scan job scheduled (6 PM daily)');

  // Certification warnings scan - runs at 8 AM every day
  await queue.add(
    NotificationJobName.DAILY_CERTIFICATION_SCAN,
    {},
    {
      repeat: {
        pattern: '0 8 * * *', // 8 AM every day
      },
      jobId: 'daily-certification-scan', // Unique ID to prevent duplicates
    }
  );

  logger.info('Daily certification scan job scheduled (8 AM daily)');

  // Unverified time entry reminders - runs at 10 AM every day
  await queue.add(
    NotificationJobName.DAILY_TIME_ENTRY_SCAN,
    {},
    {
      repeat: {
        pattern: '0 10 * * *', // 10 AM every day
      },
      jobId: 'daily-time-entry-scan', // Unique ID to prevent duplicates
    }
  );

  logger.info('Daily time entry scan job scheduled (10 AM daily)');

  logger.info('All daily notification jobs scheduled successfully');
}

export default {
  createNotificationWorker,
  scheduleDailyNotificationJobs,
  NotificationJobName,
};

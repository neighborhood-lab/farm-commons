/**
 * Job Scheduler
 *
 * Schedules recurring background jobs
 * Run this once at application startup or deployment
 */

import 'dotenv/config';
import { initializeQueues, scheduleRecurringJob, closeQueues } from './index.js';
import pino from 'pino';

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: process.env.NODE_ENV === 'development' ? {
    target: 'pino-pretty',
    options: {
      colorize: true,
    },
  } : undefined,
});

/**
 * Schedule all recurring jobs
 */
async function scheduleAllJobs() {
  try {
    logger.info('Initializing queues...');
    await initializeQueues();

    logger.info('Scheduling recurring jobs...');

    // Archive old time entries - Run daily at 2 AM
    await scheduleRecurringJob(
      'cleanup',
      'archive-old-entries',
      {},
      '0 2 * * *'
    );

    // Cleanup expired sessions - Run every 6 hours
    await scheduleRecurringJob(
      'cleanup',
      'cleanup-sessions',
      {},
      '0 */6 * * *'
    );

    // Aggregate historical statistics - Run daily at 3 AM
    await scheduleRecurringJob(
      'cleanup',
      'aggregate-stats',
      {},
      '0 3 * * *'
    );

    logger.info('✅ All recurring jobs scheduled successfully');

    await closeQueues();
    process.exit(0);
  } catch (error) {
    logger.error({ error }, '❌ Failed to schedule jobs');
    process.exit(1);
  }
}

// Run if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  scheduleAllJobs();
}

export { scheduleAllJobs };

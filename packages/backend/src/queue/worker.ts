// Job Queue Worker
// This module handles the actual processing of background jobs

import { Worker, Job } from 'bullmq';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
import pino from 'pino';
import { redisConnection, QueueNames, QueueName } from './config.js';
import type {
  NotificationJobData,
  DataCleanupJobData,
  ExportJobData,
  EmailJobData,
  JobResult,
  TypedJob,
} from './types.js';

// Get current file path for ES module
const __filename = fileURLToPath(import.meta.url);
const _unused__dirname = dirname(__filename);

// Logger
const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  name: 'queue-worker',
});

/**
 * Worker instances
 */
const workers = new Map<QueueName, Worker>();

/**
 * Process notification jobs
 */
async function processNotificationJob(job: TypedJob<NotificationJobData>): Promise<JobResult> {
  logger.info({ jobId: job.id, data: job.data }, 'Processing notification job');

  try {
    const { type, recipientId, subject, message: _message } = job.data;

    // Update progress
    await job.updateProgress(25);

    // TODO: Implement actual notification sending logic
    // This is a placeholder that will be implemented in task 0036
    logger.info({ type, recipientId, subject }, 'Notification job processed (placeholder)');

    await job.updateProgress(100);

    return {
      success: true,
      message: `Notification sent to recipient ${recipientId}`,
      data: { type, recipientId },
    };
  } catch (error) {
    logger.error({ jobId: job.id, error }, 'Notification job failed');
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Process data cleanup jobs
 */
async function processDataCleanupJob(job: TypedJob<DataCleanupJobData>): Promise<JobResult> {
  logger.info({ jobId: job.id, data: job.data }, 'Processing data cleanup job');

  try {
    const { type, olderThanDays = 365, dryRun = false } = job.data;

    await job.updateProgress(25);

    // TODO: Implement actual cleanup logic
    // This is a placeholder that will be implemented in task 0037
    logger.info({ type, olderThanDays, dryRun }, 'Data cleanup job processed (placeholder)');

    await job.updateProgress(100);

    return {
      success: true,
      message: `Data cleanup completed for type: ${type}`,
      data: { type, olderThanDays, dryRun, recordsProcessed: 0 },
    };
  } catch (error) {
    logger.error({ jobId: job.id, error }, 'Data cleanup job failed');
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Process export jobs
 */
async function processExportJob(job: TypedJob<ExportJobData>): Promise<JobResult> {
  logger.info({ jobId: job.id, data: job.data }, 'Processing export job');

  try {
    const { type, farmId, userId, format } = job.data;

    await job.updateProgress(25);

    // TODO: Implement actual export logic
    // This is a placeholder that will be implemented in task 0032
    logger.info({ type, farmId, userId, format }, 'Export job processed (placeholder)');

    await job.updateProgress(100);

    return {
      success: true,
      message: `Export completed for ${type}`,
      data: { type, format, farmId, userId, fileUrl: '/exports/placeholder.csv' },
    };
  } catch (error) {
    logger.error({ jobId: job.id, error }, 'Export job failed');
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Process email jobs
 */
async function processEmailJob(job: TypedJob<EmailJobData>): Promise<JobResult> {
  logger.info({ jobId: job.id, data: job.data }, 'Processing email job');

  try {
    const { to, subject, template } = job.data;

    await job.updateProgress(25);

    // TODO: Implement actual email sending logic
    // This is a placeholder that will be implemented in task 0006
    logger.info({ to, subject, template }, 'Email job processed (placeholder)');

    await job.updateProgress(100);

    return {
      success: true,
      message: `Email sent to ${to}`,
      data: { to, subject, template },
    };
  } catch (error) {
    logger.error({ jobId: job.id, error }, 'Email job failed');
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Create and configure a worker for a specific queue
 */
function createWorker(name: QueueName): Worker {
  let processor: (job: Job) => Promise<JobResult>;

  // Assign the appropriate processor based on queue name
  switch (name) {
    case QueueNames.NOTIFICATIONS: {
      processor = processNotificationJob as (job: Job) => Promise<JobResult>;
      break;
    }
    case QueueNames.DATA_CLEANUP: {
      processor = processDataCleanupJob as (job: Job) => Promise<JobResult>;
      break;
    }
    case QueueNames.EXPORTS: {
      processor = processExportJob as (job: Job) => Promise<JobResult>;
      break;
    }
    case QueueNames.EMAILS: {
      processor = processEmailJob as (job: Job) => Promise<JobResult>;
      break;
    }
    default: {
      throw new Error(`Unknown queue: ${name}`);
    }
  }

  const worker = new Worker(name, processor, {
    connection: redisConnection,
    concurrency: Number.parseInt(process.env.WORKER_CONCURRENCY || '5'),
    limiter: {
      max: 10, // Maximum number of jobs processed
      duration: 1000, // per 1 second
    },
  });

  // Worker event listeners
  worker.on('completed', (job, result) => {
    logger.info({ queue: name, jobId: job.id, result }, 'Worker completed job');
  });

  worker.on('failed', (job, error) => {
    logger.error({ queue: name, jobId: job?.id, error: error.message }, 'Worker failed job');
  });

  worker.on('error', (error) => {
    logger.error({ queue: name, error: error.message }, 'Worker error');
  });

  worker.on('stalled', (jobId) => {
    logger.warn({ queue: name, jobId }, 'Job stalled');
  });

  workers.set(name, worker);
  logger.info({ queue: name }, 'Worker started');

  return worker;
}

/**
 * Start all workers
 */
export async function startWorkers(): Promise<void> {
  logger.info('Starting job queue workers...');

  // Create workers for all queues
  for (const name of Object.values(QueueNames)) {
    createWorker(name);
  }

  logger.info({ workerCount: workers.size }, 'All workers started');
}

/**
 * Stop all workers
 */
export async function stopWorkers(): Promise<void> {
  logger.info('Stopping job queue workers...');

  for (const [name, worker] of workers.entries()) {
    await worker.close();
    logger.debug({ queue: name }, 'Worker stopped');
  }

  workers.clear();
  logger.info('All workers stopped');
}

/**
 * Get worker for a specific queue
 */
export function getWorker(name: QueueName): Worker | undefined {
  return workers.get(name);
}

/**
 * Graceful shutdown handler
 */
export async function gracefulShutdown(): Promise<void> {
  logger.info('Initiating graceful shutdown of workers...');

  try {
    await stopWorkers();
    logger.info('Graceful shutdown completed');
  } catch (error) {
    logger.error({ error }, 'Error during graceful shutdown');
    throw error;
  }
}

// Check if this file is being run directly (ES module version)
const isMainModule =
  process.argv[1] === __filename ||
  process.argv[1]?.endsWith('queue/worker.ts') ||
  process.argv[1]?.endsWith('queue/worker.js');

// Handle process termination
if (isMainModule) {
  // If this file is run directly, start the workers
  startWorkers().catch((error) => {
    logger.error({ error }, 'Failed to start workers');
    process.exit(1);
  });

  // Graceful shutdown handlers
  process.on('SIGTERM', async () => {
    logger.info('SIGTERM signal received');
    await gracefulShutdown();
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    logger.info('SIGINT signal received');
    await gracefulShutdown();
    process.exit(0);
  });
}

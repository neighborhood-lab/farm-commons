// Job Queue Infrastructure
// This module provides the main queue setup and management functions

import { Queue, QueueEvents } from 'bullmq';
import pino from 'pino';
import { redisConnection, defaultJobOptions, QueueNames, QueueName } from './config.js';
import type {
  NotificationJobData,
  DataCleanupJobData,
  ExportJobData,
  EmailJobData,
} from './types.js';

// Logger
const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  name: 'queue',
});

/**
 * Queue instances
 */
const queues = new Map<QueueName, Queue>();

/**
 * Queue events instances for monitoring
 */
const queueEvents = new Map<QueueName, QueueEvents>();

/**
 * Initialize a queue with the given name
 */
function createQueue(name: QueueName): Queue {
  const queue = new Queue(name, {
    connection: redisConnection,
    defaultJobOptions,
  });

  // Create queue events for monitoring
  const events = new QueueEvents(name, {
    connection: redisConnection,
  });

  // Setup event listeners
  events.on('completed', ({ jobId }) => {
    logger.info({ queue: name, jobId }, 'Job completed');
  });

  events.on('failed', ({ jobId, failedReason }) => {
    logger.error({ queue: name, jobId, failedReason }, 'Job failed');
  });

  events.on('progress', ({ jobId, data }) => {
    logger.debug({ queue: name, jobId, progress: data }, 'Job progress');
  });

  events.on('retries-exhausted', ({ jobId }) => {
    logger.error({ queue: name, jobId }, 'Job retries exhausted');
  });

  queues.set(name, queue);
  queueEvents.set(name, events);

  logger.info({ queue: name }, 'Queue initialized');

  return queue;
}

/**
 * Get or create a queue by name
 */
export function getQueue(name: QueueName): Queue {
  let queue = queues.get(name);
  if (!queue) {
    queue = createQueue(name);
  }
  return queue;
}

/**
 * Initialize all queues
 */
export async function initializeQueues(): Promise<void> {
  logger.info('Initializing job queues...');

  // Create all queues
  Object.values(QueueNames).forEach((name) => {
    createQueue(name);
  });

  logger.info({ queueCount: queues.size }, 'All queues initialized');
}

/**
 * Close all queues and cleanup
 */
export async function closeQueues(): Promise<void> {
  logger.info('Closing job queues...');

  // Close all queue events
  for (const [name, events] of queueEvents.entries()) {
    await events.close();
    logger.debug({ queue: name }, 'Queue events closed');
  }

  // Close all queues
  for (const [name, queue] of queues.entries()) {
    await queue.close();
    logger.debug({ queue: name }, 'Queue closed');
  }

  queues.clear();
  queueEvents.clear();

  logger.info('All queues closed');
}

/**
 * Helper functions to add jobs to specific queues
 */

/**
 * Add a notification job
 */
export async function addNotificationJob(
  data: NotificationJobData,
  options?: {
    delay?: number;
    priority?: number;
  }
) {
  const queue = getQueue(QueueNames.NOTIFICATIONS);
  return queue.add('notification', data, options);
}

/**
 * Add a data cleanup job
 */
export async function addDataCleanupJob(
  data: DataCleanupJobData,
  options?: {
    delay?: number;
    priority?: number;
  }
) {
  const queue = getQueue(QueueNames.DATA_CLEANUP);
  return queue.add('cleanup', data, options);
}

/**
 * Add an export job
 */
export async function addExportJob(
  data: ExportJobData,
  options?: {
    delay?: number;
    priority?: number;
  }
) {
  const queue = getQueue(QueueNames.EXPORTS);
  return queue.add('export', data, options);
}

/**
 * Add an email job
 */
export async function addEmailJob(
  data: EmailJobData,
  options?: {
    delay?: number;
    priority?: number;
  }
) {
  const queue = getQueue(QueueNames.EMAILS);
  return queue.add('email', data, options);
}

/**
 * Get queue statistics
 */
export async function getQueueStats(name: QueueName) {
  const queue = getQueue(name);
  const [waiting, active, completed, failed, delayed] = await Promise.all([
    queue.getWaitingCount(),
    queue.getActiveCount(),
    queue.getCompletedCount(),
    queue.getFailedCount(),
    queue.getDelayedCount(),
  ]);

  return {
    name,
    waiting,
    active,
    completed,
    failed,
    delayed,
    total: waiting + active + completed + failed + delayed,
  };
}

/**
 * Get all queue statistics
 */
export async function getAllQueueStats() {
  const stats = await Promise.all(
    Object.values(QueueNames).map((name) => getQueueStats(name))
  );
  return stats;
}

/**
 * Pause a queue
 */
export async function pauseQueue(name: QueueName): Promise<void> {
  const queue = getQueue(name);
  await queue.pause();
  logger.info({ queue: name }, 'Queue paused');
}

/**
 * Resume a queue
 */
export async function resumeQueue(name: QueueName): Promise<void> {
  const queue = getQueue(name);
  await queue.resume();
  logger.info({ queue: name }, 'Queue resumed');
}

/**
 * Clean old jobs from a queue
 */
export async function cleanQueue(
  name: QueueName,
  grace: number = 86400000, // 24 hours in ms
  status: 'completed' | 'failed' = 'completed'
): Promise<void> {
  const queue = getQueue(name);
  const jobs = await queue.clean(grace, 1000, status);
  logger.info({ queue: name, count: jobs.length, status }, 'Queue cleaned');
}

// Export types and constants
export { QueueNames, type QueueName };
export type {
  NotificationJobData,
  DataCleanupJobData,
  ExportJobData,
  EmailJobData,
} from './types.js';

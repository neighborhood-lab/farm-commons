// Queue Configuration and Redis Connection

import { ConnectionOptions, DefaultJobOptions } from 'bullmq';

/**
 * Redis connection configuration for BullMQ
 */
export const redisConnection: ConnectionOptions = {
  host: process.env.REDIS_HOST || 'localhost',
  port: Number.Number.parseInt(process.env.REDIS_PORT || '6379'),
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
};

// Parse REDIS_URL if provided (overwrites host/port)
if (process.env.REDIS_URL) {
  const url = new URL(process.env.REDIS_URL);
  redisConnection.host = url.hostname;
  redisConnection.port = Number.Number.parseInt(url.port || '6379');
  if (url.password) {
    redisConnection.password = url.password;
  }
  if (url.username) {
    redisConnection.username = url.username;
  }
}

/**
 * Default job options for all queues
 */
export const defaultJobOptions: DefaultJobOptions = {
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 2000, // 2 seconds initial delay
  },
  removeOnComplete: {
    age: 86400, // Keep completed jobs for 24 hours
    count: 1000, // Keep max 1000 completed jobs
  },
  removeOnFail: {
    age: 604800, // Keep failed jobs for 7 days
  },
};

/**
 * Queue names used in the application
 */
export const QueueNames = {
  NOTIFICATIONS: 'notifications',
  DATA_CLEANUP: 'data-cleanup',
  EXPORTS: 'exports',
  EMAILS: 'emails',
} as const;

export type QueueName = (typeof QueueNames)[keyof typeof QueueNames];

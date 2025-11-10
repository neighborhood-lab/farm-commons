# Job Queue Infrastructure

This module provides background job processing infrastructure for the Farm Commons backend using BullMQ and Redis.

## Overview

The job queue system allows you to process tasks asynchronously in the background, improving application performance and user experience. Jobs can be scheduled, retried on failure, and monitored.

## Architecture

### Components

- **config.ts** - Redis connection and queue configuration
- **types.ts** - TypeScript type definitions for all job types
- **index.ts** - Queue management and job creation functions
- **worker.ts** - Worker processes that execute jobs

### Queue Types

1. **Notifications Queue** - Sends notifications to workers (email, SMS, push)
2. **Data Cleanup Queue** - Periodic data maintenance tasks
3. **Exports Queue** - Generate data exports (CSV, Excel, PDF)
4. **Emails Queue** - Send transactional emails

## Usage

### Starting the Queue System

#### In the main application:

```typescript
import { initializeQueues } from './queue/index.js';

// Initialize queues on app startup
await initializeQueues();
```

#### Running workers:

```bash
# Run workers in a separate process
npm run worker

# Or use the worker file directly
node dist/queue/worker.js
```

### Adding Jobs

#### Notification Job

```typescript
import { addNotificationJob } from './queue/index.js';

await addNotificationJob({
  type: 'schedule_reminder',
  recipientId: 123,
  recipientEmail: 'worker@example.com',
  subject: 'Schedule Reminder',
  message: 'You have a task scheduled for tomorrow at 8 AM',
});
```

#### Data Cleanup Job

```typescript
import { addDataCleanupJob } from './queue/index.js';

await addDataCleanupJob({
  type: 'archive_old_entries',
  olderThanDays: 365,
  dryRun: false,
});
```

#### Export Job

```typescript
import { addExportJob } from './queue/index.js';

await addExportJob({
  type: 'time_entries',
  farmId: 1,
  userId: 42,
  format: 'csv',
  dateRange: {
    start: '2025-01-01',
    end: '2025-01-31',
  },
});
```

#### Email Job

```typescript
import { addEmailJob } from './queue/index.js';

await addEmailJob({
  to: 'user@example.com',
  subject: 'Welcome to Farm Commons',
  template: 'welcome',
  data: {
    name: 'John Doe',
    farmName: 'Green Acres',
  },
});
```

### Job Options

You can customize job behavior with options:

```typescript
await addNotificationJob(
  {
    type: 'certification_expiry',
    recipientId: 123,
    subject: 'Certification Expiring Soon',
    message: 'Your certification expires in 30 days',
  },
  {
    delay: 3600000, // Delay by 1 hour (in ms)
    priority: 1, // Higher priority (lower number = higher priority)
  }
);
```

### Monitoring Queues

#### Get Queue Statistics

```typescript
import { getQueueStats, getAllQueueStats } from './queue/index.js';

// Get stats for a specific queue
const stats = await getQueueStats('notifications');
console.log(stats);
// {
//   name: 'notifications',
//   waiting: 5,
//   active: 2,
//   completed: 100,
//   failed: 3,
//   delayed: 0,
//   total: 110
// }

// Get stats for all queues
const allStats = await getAllQueueStats();
```

#### Queue Management

```typescript
import { pauseQueue, resumeQueue, cleanQueue } from './queue/index.js';

// Pause a queue (stops processing new jobs)
await pauseQueue('notifications');

// Resume a queue
await resumeQueue('notifications');

// Clean old completed jobs (older than 24 hours)
await cleanQueue('notifications', 86400000, 'completed');
```

## Configuration

### Environment Variables

```bash
# Redis connection
REDIS_URL=redis://localhost:6379
REDIS_HOST=localhost
REDIS_PORT=6379

# Worker configuration
WORKER_CONCURRENCY=5  # Number of jobs processed concurrently
LOG_LEVEL=info
```

### Default Job Settings

All jobs have the following default configuration:

- **Attempts**: 3 (retry up to 3 times on failure)
- **Backoff**: Exponential with 2 second initial delay
- **Completed Job Retention**: 24 hours (max 1000 jobs)
- **Failed Job Retention**: 7 days

These can be customized in `config.ts`.

## Retry Logic

Jobs automatically retry on failure with exponential backoff:

- **1st retry**: 2 seconds delay
- **2nd retry**: 4 seconds delay (2^1 * 2000ms)
- **3rd retry**: 8 seconds delay (2^2 * 2000ms)

After 3 failed attempts, the job is marked as failed and moved to the failed jobs set.

## Error Handling

All job processors include error handling:

- Errors are logged with job context
- Failed jobs are retained for 7 days for debugging
- Job progress is tracked for long-running tasks
- Stalled job detection prevents stuck jobs

## Testing

Run the queue tests:

```bash
npm test -- queue
```

## Future Enhancements

The following tasks will build upon this infrastructure:

- **Task 0036**: Implement scheduled notification jobs (daily reminders, expiry warnings)
- **Task 0037**: Implement data cleanup jobs (archiving, session cleanup, stats aggregation)
- **Task 0006**: Implement email service (required for email job processing)
- **Task 0032**: Implement export service (required for export job processing)

## Troubleshooting

### Jobs Not Processing

1. Check that Redis is running: `redis-cli ping`
2. Verify worker process is running
3. Check worker logs for errors
4. Verify queue is not paused: `getQueueStats(queueName)`

### High Memory Usage

1. Clean old completed jobs regularly
2. Adjust `removeOnComplete` settings in config
3. Monitor job data size

### Jobs Failing Repeatedly

1. Check worker logs for specific error messages
2. Verify all required services are available
3. Check job data validity
4. Review retry configuration

## References

- [BullMQ Documentation](https://docs.bullmq.io/)
- [Redis Documentation](https://redis.io/docs/)

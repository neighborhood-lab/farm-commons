/**
 * Data Cleanup Jobs
 *
 * Periodic maintenance tasks for data cleanup and optimization:
 * - Archive old time entries (1 year+)
 * - Clean up expired sessions
 * - Aggregate historical statistics
 */

import { Job } from 'bullmq';
import { db } from '../../db/connection.js';
import { createClient } from 'redis';
import pino from 'pino';
import { subYears, subDays } from 'date-fns';

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
});

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

/**
 * Archive old time entries (older than 1 year)
 * Moves them to an archived table for long-term storage
 */
export async function archiveOldTimeEntries(job: Job): Promise<void> {
  const startTime = Date.now();
  logger.info('Starting archive of old time entries');

  try {
    const oneYearAgo = subYears(new Date(), 1);

    // Create archived_time_entries table if it doesn't exist
    const archiveTableExists = await db.schema.hasTable('archived_time_entries');

    if (!archiveTableExists) {
      await db.schema.createTable('archived_time_entries', (table) => {
        table.uuid('id').primary();
        table.uuid('farm_id').notNullable();
        table.uuid('worker_id').notNullable();
        table.uuid('schedule_id').nullable();
        table.timestamp('clock_in').notNullable();
        table.timestamp('clock_out').nullable();
        table.integer('break_minutes').defaultTo(0);
        table.decimal('total_hours', 10, 2).nullable();
        table.string('task_type', 100).notNullable();
        table.uuid('field_id').nullable();
        table.text('notes').nullable();
        table.uuid('verified_by').nullable();
        table.timestamp('verified_at').nullable();
        table.timestamps(true, true);
        table.timestamp('archived_at').defaultTo(db.fn.now());

        table.index('farm_id');
        table.index('worker_id');
        table.index('clock_in');
        table.index('archived_at');
      });

      logger.info('Created archived_time_entries table');
    }

    // Find old time entries to archive
    const oldEntries = await db('time_entries')
      .where('clock_in', '<', oneYearAgo)
      .select('*');

    if (oldEntries.length === 0) {
      logger.info('No time entries to archive');
      await job.updateProgress(100);
      return;
    }

    // Move entries to archive table
    await db.transaction(async (trx) => {
      // Insert into archive
      await trx('archived_time_entries').insert(
        oldEntries.map((entry) => ({
          ...entry,
          archived_at: new Date(),
        }))
      );

      // Delete from main table
      await trx('time_entries')
        .where('clock_in', '<', oneYearAgo)
        .delete();
    });

    const duration = Date.now() - startTime;
    logger.info(
      {
        count: oldEntries.length,
        duration,
        cutoffDate: oneYearAgo,
      },
      'Successfully archived old time entries'
    );

    await job.updateProgress(100);

    return {
      archivedCount: oldEntries.length,
      cutoffDate: oneYearAgo.toISOString(),
      duration,
    } as any;
  } catch (error) {
    logger.error({ error }, 'Failed to archive old time entries');
    throw error;
  }
}

/**
 * Clean up expired Redis sessions
 * Removes session keys that have expired or are no longer valid
 */
export async function cleanupExpiredSessions(job: Job): Promise<void> {
  const startTime = Date.now();
  logger.info('Starting cleanup of expired sessions');

  const redisClient = createClient({ url: redisUrl });

  try {
    await redisClient.connect();

    // Get all session keys (assuming they're prefixed with 'session:')
    const sessionKeys = await redisClient.keys('session:*');

    if (sessionKeys.length === 0) {
      logger.info('No session keys found');
      await job.updateProgress(100);
      return;
    }

    let expiredCount = 0;
    let errorCount = 0;

    // Check TTL for each session and remove expired ones
    for (let i = 0; i < sessionKeys.length; i++) {
      const key = sessionKeys[i];

      try {
        const ttl = await redisClient.ttl(key);

        // TTL of -2 means key doesn't exist, -1 means no expiration
        if (ttl === -2) {
          expiredCount++;
        } else if (ttl === -1) {
          // Set expiration for sessions without TTL (7 days)
          await redisClient.expire(key, 7 * 24 * 60 * 60);
        }
      } catch (error) {
        errorCount++;
        logger.warn({ key, error }, 'Error checking session key');
      }

      // Update progress
      if (i % 100 === 0) {
        await job.updateProgress((i / sessionKeys.length) * 100);
      }
    }

    const duration = Date.now() - startTime;
    logger.info(
      {
        totalChecked: sessionKeys.length,
        expiredCount,
        errorCount,
        duration,
      },
      'Completed session cleanup'
    );

    await job.updateProgress(100);

    return {
      totalChecked: sessionKeys.length,
      expiredCount,
      errorCount,
      duration,
    } as any;
  } catch (error) {
    logger.error({ error }, 'Failed to cleanup expired sessions');
    throw error;
  } finally {
    await redisClient.quit();
  }
}

/**
 * Aggregate historical statistics
 * Creates summary statistics for older data to improve query performance
 */
export async function aggregateHistoricalStats(job: Job): Promise<void> {
  const startTime = Date.now();
  logger.info('Starting aggregation of historical statistics');

  try {
    const thirtyDaysAgo = subDays(new Date(), 30);

    // Create aggregated_stats table if it doesn't exist
    const statsTableExists = await db.schema.hasTable('aggregated_stats');

    if (!statsTableExists) {
      await db.schema.createTable('aggregated_stats', (table) => {
        table.uuid('id').primary().defaultTo(db.raw('gen_random_uuid()'));
        table.uuid('farm_id').notNullable();
        table.date('date').notNullable();
        table.string('stat_type', 50).notNullable(); // 'labor_hours', 'worker_count', etc.
        table.jsonb('data').notNullable();
        table.timestamp('created_at').defaultTo(db.fn.now());

        table.unique(['farm_id', 'date', 'stat_type']);
        table.index('farm_id');
        table.index('date');
        table.index('stat_type');
      });

      logger.info('Created aggregated_stats table');
    }

    await job.updateProgress(25);

    // Aggregate daily labor hours by farm
    const laborHoursByDay = await db('time_entries')
      .select(
        'farm_id',
        db.raw('DATE(clock_in) as date'),
        db.raw('SUM(total_hours) as total_hours'),
        db.raw('COUNT(DISTINCT worker_id) as worker_count'),
        db.raw('COUNT(*) as entry_count')
      )
      .where('clock_in', '<', thirtyDaysAgo)
      .whereNotNull('total_hours')
      .groupBy('farm_id', db.raw('DATE(clock_in)'))
      .havingRaw('DATE(clock_in) < ?', [thirtyDaysAgo]);

    await job.updateProgress(50);

    // Insert or update aggregated stats
    if (laborHoursByDay.length > 0) {
      await db.transaction(async (trx) => {
        for (const stat of laborHoursByDay) {
          await trx('aggregated_stats')
            .insert({
              farm_id: stat.farm_id,
              date: stat.date,
              stat_type: 'daily_labor_hours',
              data: {
                total_hours: parseFloat(stat.total_hours),
                worker_count: stat.worker_count,
                entry_count: stat.entry_count,
              },
            })
            .onConflict(['farm_id', 'date', 'stat_type'])
            .merge();
        }
      });
    }

    await job.updateProgress(75);

    // Aggregate field utilization stats
    const fieldUtilization = await db('schedules')
      .select(
        'farm_id',
        db.raw('DATE(scheduled_date) as date'),
        'field_id',
        db.raw('COUNT(*) as schedule_count'),
        db.raw('COUNT(DISTINCT worker_id) as worker_count')
      )
      .where('scheduled_date', '<', thirtyDaysAgo)
      .whereNotNull('field_id')
      .groupBy('farm_id', db.raw('DATE(scheduled_date)'), 'field_id');

    if (fieldUtilization.length > 0) {
      await db.transaction(async (trx) => {
        for (const stat of fieldUtilization) {
          await trx('aggregated_stats')
            .insert({
              farm_id: stat.farm_id,
              date: stat.date,
              stat_type: 'field_utilization',
              data: {
                field_id: stat.field_id,
                schedule_count: stat.schedule_count,
                worker_count: stat.worker_count,
              },
            })
            .onConflict(['farm_id', 'date', 'stat_type'])
            .merge();
        }
      });
    }

    const duration = Date.now() - startTime;
    logger.info(
      {
        laborStatsCount: laborHoursByDay.length,
        fieldStatsCount: fieldUtilization.length,
        duration,
      },
      'Successfully aggregated historical statistics'
    );

    await job.updateProgress(100);

    return {
      laborStatsCount: laborHoursByDay.length,
      fieldStatsCount: fieldUtilization.length,
      duration,
    } as any;
  } catch (error) {
    logger.error({ error }, 'Failed to aggregate historical statistics');
    throw error;
  }
}

/**
 * Job handlers mapping
 */
export const cleanupJobHandlers = {
  'archive-old-entries': archiveOldTimeEntries,
  'cleanup-sessions': cleanupExpiredSessions,
  'aggregate-stats': aggregateHistoricalStats,
};

export type CleanupJobName = keyof typeof cleanupJobHandlers;

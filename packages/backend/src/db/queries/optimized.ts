/**
 * Optimized Database Queries
 *
 * This module contains optimized query functions that:
 * - Avoid N+1 query problems
 * - Use database views for complex joins
 * - Leverage indexes for better performance
 * - Batch related data efficiently
 */

import db from '../connection.js';

/**
 * Pagination options
 */
interface PaginationOptions {
  page?: number;
  per_page?: number;
}

/**
 * Date range filter
 */
interface DateRangeFilter {
  start_date?: string;
  end_date?: string;
}

/**
 * Get schedules with full details using optimized view
 * Avoids multiple JOIN operations in application code
 */
export async function getSchedulesDetailed(
  farmId: string,
  filters?: DateRangeFilter & { workerId?: string; status?: string }
) {
  let query = db('schedules_detailed').where({ farm_id: farmId });

  if (filters?.start_date && filters?.end_date) {
    query = query.whereBetween('scheduled_date', [filters.start_date, filters.end_date]);
  }

  if (filters?.workerId) {
    query = query.where({ worker_id: filters.workerId });
  }

  if (filters?.status) {
    query = query.where({ status: filters.status });
  }

  return query.orderBy('scheduled_date', 'asc');
}

/**
 * Get time entries with full details using optimized view
 * Avoids multiple JOIN operations and N+1 queries
 */
export async function getTimeEntriesDetailed(
  farmId: string,
  filters?: DateRangeFilter & { workerId?: string; verified?: boolean }
) {
  let query = db('time_entries_detailed').where({ farm_id: farmId });

  if (filters?.start_date && filters?.end_date) {
    query = query.whereBetween('clock_in', [filters.start_date, filters.end_date]);
  }

  if (filters?.workerId) {
    query = query.where({ worker_id: filters.workerId });
  }

  if (filters?.verified === true) {
    query = query.whereNotNull('verified_at');
  } else if (filters?.verified === false) {
    query = query.whereNull('verified_at');
  }

  return query.orderBy('clock_in', 'desc');
}

/**
 * Get worker with all related data in a single optimized query
 * Efficiently loads certifications, recent schedules, and stats
 */
export async function getWorkerWithDetails(workerId: string, farmId: string) {
  // Use a single query with CTEs for better performance
  const result = await db.raw(
    `
    WITH worker_data AS (
      SELECT * FROM workers WHERE id = ? AND farm_id = ?
    ),
    worker_certs AS (
      SELECT
        c.*,
        CASE
          WHEN c.expiration_date < CURRENT_DATE THEN 'expired'
          WHEN c.expiration_date < CURRENT_DATE + INTERVAL '30 days' THEN 'expiring_soon'
          ELSE 'valid'
        END AS cert_status
      FROM certifications c
      WHERE c.worker_id = ?
      ORDER BY c.expiration_date ASC NULLS LAST
    ),
    recent_schedules AS (
      SELECT *
      FROM schedules_detailed
      WHERE worker_id = ? AND farm_id = ?
      ORDER BY scheduled_date DESC
      LIMIT 10
    ),
    recent_entries AS (
      SELECT *
      FROM time_entries_detailed
      WHERE worker_id = ? AND farm_id = ?
      ORDER BY clock_in DESC
      LIMIT 10
    )
    SELECT
      (SELECT row_to_json(worker_data) FROM worker_data) AS worker,
      (SELECT json_agg(worker_certs) FROM worker_certs) AS certifications,
      (SELECT json_agg(recent_schedules) FROM recent_schedules) AS recent_schedules,
      (SELECT json_agg(recent_entries) FROM recent_entries) AS recent_time_entries
    `,
    [workerId, farmId, workerId, workerId, farmId, workerId, farmId]
  );

  const row = result.rows[0];
  return {
    ...row.worker,
    certifications: row.certifications || [],
    recent_schedules: row.recent_schedules || [],
    recent_time_entries: row.recent_time_entries || [],
  };
}

/**
 * Get worker statistics using optimized view
 */
export async function getWorkerStatistics(farmId: string, workerId?: string) {
  let query = db('worker_statistics').where({ farm_id: farmId });

  if (workerId) {
    query = query.where({ worker_id: workerId });
  }

  return workerId ? query.first() : query;
}

/**
 * Get field utilization statistics
 */
export async function getFieldUtilization(farmId: string, fieldId?: string) {
  let query = db('field_utilization').where({ farm_id: farmId });

  if (fieldId) {
    query = query.where({ field_id: fieldId });
  }

  return fieldId ? query.first() : query;
}

/**
 * Get workers with pagination and optional filters
 * Optimized with proper indexing
 */
export async function getWorkersPaginated(
  farmId: string,
  options: PaginationOptions & { status?: string; search?: string }
) {
  const page = options.page || 1;
  const per_page = options.per_page || 20;
  const offset = (page - 1) * per_page;

  let query = db('workers').where({ farm_id: farmId });

  if (options.status) {
    query = query.where({ status: options.status });
  }

  if (options.search) {
    const searchTerm = `%${options.search}%`;
    query = query.where(function () {
      this.where('first_name', 'ilike', searchTerm)
        .orWhere('last_name', 'ilike', searchTerm)
        .orWhere('email', 'ilike', searchTerm);
    });
  }

  // Execute count and data queries in parallel
  const [workers, [{ count }]] = await Promise.all([
    query
      .clone()
      .orderBy('last_name', 'asc')
      .orderBy('first_name', 'asc')
      .limit(per_page)
      .offset(offset),
    query.clone().count('* as count'),
  ]);

  return {
    data: workers,
    total: Number.parseInt(count as string),
    page,
    per_page,
    total_pages: Math.ceil(Number.parseInt(count as string) / per_page),
  };
}

/**
 * Get labor hours summary by date range
 * Optimized for reporting and analytics
 */
export async function getLaborHoursSummary(
  farmId: string,
  startDate: string,
  endDate: string,
  groupBy: 'day' | 'week' | 'month' = 'day'
) {
  const dateFormat = {
    day: 'YYYY-MM-DD',
    week: 'YYYY-"W"IW',
    month: 'YYYY-MM',
  }[groupBy];

  const result = await db.raw(
    `
    SELECT
      TO_CHAR(clock_in, ?) AS period,
      COUNT(DISTINCT worker_id) AS unique_workers,
      COUNT(*) AS total_entries,
      COALESCE(SUM(total_hours), 0) AS total_hours,
      COALESCE(AVG(total_hours), 0) AS avg_hours_per_entry
    FROM time_entries
    WHERE farm_id = ?
      AND clock_in >= ?::timestamp
      AND clock_in < ?::timestamp
      AND total_hours IS NOT NULL
    GROUP BY period
    ORDER BY period ASC
    `,
    [dateFormat, farmId, startDate, endDate]
  );

  return result.rows;
}

/**
 * Get certifications expiring soon
 * Optimized with proper indexing
 */
export async function getExpiringCertifications(farmId: string, daysAhead: number = 30) {
  return db('certifications')
    .join('workers', 'certifications.worker_id', 'workers.id')
    .where('workers.farm_id', farmId)
    .whereNotNull('certifications.expiration_date')
    .whereBetween('certifications.expiration_date', [
      db.raw('CURRENT_DATE'),
      db.raw(`CURRENT_DATE + INTERVAL '${daysAhead} days'`),
    ])
    .select(
      'certifications.*',
      'workers.first_name',
      'workers.last_name',
      'workers.email',
      'workers.phone',
      db.raw('certifications.expiration_date - CURRENT_DATE AS days_until_expiry')
    )
    .orderBy('certifications.expiration_date', 'asc');
}

/**
 * Batch load workers with their certifications
 * Avoids N+1 queries when loading multiple workers
 */
export async function getWorkersWithCertifications(farmId: string, workerIds?: string[]) {
  // Get workers
  let workersQuery = db('workers').where({ farm_id: farmId });
  if (workerIds && workerIds.length > 0) {
    workersQuery = workersQuery.whereIn('id', workerIds);
  }
  const workers = await workersQuery;

  if (workers.length === 0) {
    return [];
  }

  // Get all certifications in one query
  const certifications = await db('certifications')
    .whereIn(
      'worker_id',
      workers.map((w) => w.id)
    )
    .orderBy('expiration_date', 'asc');

  // Group certifications by worker_id
  const certsByWorker = certifications.reduce(
    (acc, cert) => {
      if (!acc[cert.worker_id]) {
        acc[cert.worker_id] = [];
      }
      acc[cert.worker_id].push(cert);
      return acc;
    },
    {} as Record<string, typeof certifications>
  );

  // Combine data
  return workers.map((worker) => ({
    ...worker,
    certifications: certsByWorker[worker.id] || [],
  }));
}

/**
 * Get unverified time entries
 * Optimized query for managers to review
 */
export async function getUnverifiedTimeEntries(farmId: string, limit: number = 50) {
  return db('time_entries_detailed')
    .where({ farm_id: farmId })
    .whereNull('verified_at')
    .whereNotNull('clock_out')
    .orderBy('clock_out', 'desc')
    .limit(limit);
}

/**
 * Get active time entries (not clocked out)
 * Useful for dashboard display
 */
export async function getActiveTimeEntries(farmId: string) {
  return db('time_entries_detailed')
    .where({ farm_id: farmId })
    .whereNull('clock_out')
    .orderBy('clock_in', 'asc');
}

/**
 * Get upcoming schedules
 * Optimized for dashboard widgets
 */
export async function getUpcomingSchedules(
  farmId: string,
  daysAhead: number = 7,
  limit: number = 50
) {
  return db('schedules_detailed')
    .where({ farm_id: farmId })
    .whereBetween('scheduled_date', [
      db.raw('CURRENT_DATE'),
      db.raw(`CURRENT_DATE + INTERVAL '${daysAhead} days'`),
    ])
    .whereIn('status', ['scheduled', 'in_progress'])
    .orderBy('scheduled_date', 'asc')
    .orderBy('start_time', 'asc')
    .limit(limit);
}

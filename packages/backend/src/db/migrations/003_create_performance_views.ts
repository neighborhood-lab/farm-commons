import type { Knex } from 'knex';

/**
 * Migration: Create Performance Views
 *
 * This migration creates database views for complex queries:
 * - Schedules with full worker and field details
 * - Time entries with full worker and field details
 * - Worker statistics summary
 */
export async function up(knex: Knex): Promise<void> {
  // View: schedules_detailed
  // Pre-joins schedules with workers and fields for better performance
  await knex.raw(`
    CREATE VIEW schedules_detailed AS
    SELECT
      s.id,
      s.farm_id,
      s.worker_id,
      s.field_id,
      s.scheduled_date,
      s.start_time,
      s.end_time,
      s.task_type,
      s.task_description,
      s.status,
      s.notes,
      s.created_at,
      s.updated_at,
      w.first_name AS worker_first_name,
      w.last_name AS worker_last_name,
      w.phone AS worker_phone,
      w.preferred_language AS worker_language,
      f.name AS field_name,
      f.size_acres AS field_size,
      f.current_crop AS field_crop
    FROM schedules s
    LEFT JOIN workers w ON s.worker_id = w.id
    LEFT JOIN fields f ON s.field_id = f.id
  `);

  // View: time_entries_detailed
  // Pre-joins time entries with workers and fields for better performance
  await knex.raw(`
    CREATE VIEW time_entries_detailed AS
    SELECT
      te.id,
      te.farm_id,
      te.worker_id,
      te.schedule_id,
      te.clock_in,
      te.clock_out,
      te.break_minutes,
      te.total_hours,
      te.task_type,
      te.field_id,
      te.notes,
      te.verified_by,
      te.verified_at,
      te.created_at,
      te.updated_at,
      w.first_name AS worker_first_name,
      w.last_name AS worker_last_name,
      w.hourly_rate AS worker_hourly_rate,
      w.piece_rate AS worker_piece_rate,
      f.name AS field_name,
      v.email AS verifier_email
    FROM time_entries te
    LEFT JOIN workers w ON te.worker_id = w.id
    LEFT JOIN fields f ON te.field_id = f.id
    LEFT JOIN users v ON te.verified_by = v.id
  `);

  // View: worker_statistics
  // Aggregates worker statistics for dashboard and reporting
  await knex.raw(`
    CREATE VIEW worker_statistics AS
    SELECT
      w.id AS worker_id,
      w.farm_id,
      w.first_name,
      w.last_name,
      w.status,
      COUNT(DISTINCT te.id) AS total_time_entries,
      COALESCE(SUM(te.total_hours), 0) AS total_hours_worked,
      COUNT(DISTINCT s.id) AS total_schedules,
      COUNT(DISTINCT CASE WHEN s.status = 'completed' THEN s.id END) AS completed_schedules,
      MAX(te.clock_in) AS last_clock_in,
      COUNT(DISTINCT c.id) AS total_certifications,
      COUNT(DISTINCT CASE
        WHEN c.expiration_date IS NOT NULL
        AND c.expiration_date < CURRENT_DATE + INTERVAL '30 days'
        THEN c.id
      END) AS expiring_certifications
    FROM workers w
    LEFT JOIN time_entries te ON w.id = te.worker_id
    LEFT JOIN schedules s ON w.id = s.worker_id
    LEFT JOIN certifications c ON w.id = c.worker_id
    GROUP BY w.id, w.farm_id, w.first_name, w.last_name, w.status
  `);

  // View: field_utilization
  // Tracks field usage statistics
  await knex.raw(`
    CREATE VIEW field_utilization AS
    SELECT
      f.id AS field_id,
      f.farm_id,
      f.name AS field_name,
      f.size_acres,
      f.current_crop,
      COUNT(DISTINCT s.id) AS total_schedules,
      COUNT(DISTINCT te.id) AS total_time_entries,
      COALESCE(SUM(te.total_hours), 0) AS total_hours,
      MAX(s.scheduled_date) AS last_scheduled_date,
      MAX(te.clock_in) AS last_activity
    FROM fields f
    LEFT JOIN schedules s ON f.id = s.field_id
    LEFT JOIN time_entries te ON f.id = te.field_id
    GROUP BY f.id, f.farm_id, f.name, f.size_acres, f.current_crop
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw('DROP VIEW IF EXISTS field_utilization');
  await knex.raw('DROP VIEW IF EXISTS worker_statistics');
  await knex.raw('DROP VIEW IF EXISTS time_entries_detailed');
  await knex.raw('DROP VIEW IF EXISTS schedules_detailed');
}

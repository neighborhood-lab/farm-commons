import type { Knex } from 'knex';

/**
 * Migration: Add Performance Indexes
 *
 * This migration adds additional indexes to improve query performance:
 * - Missing foreign key indexes
 * - Composite indexes for common query patterns
 * - Indexes for filtering and sorting columns
 */
export async function up(knex: Knex): Promise<void> {
  // Add missing foreign key indexes
  await knex.schema.alterTable('time_entries', (table) => {
    table.index('field_id');
    table.index('schedule_id');
    table.index('verified_by');
  });

  await knex.schema.alterTable('schedules', (table) => {
    table.index('field_id');
  });

  // Add composite indexes for common query patterns
  // These support multi-column WHERE clauses and improve JOIN performance

  // Time entries: Common queries filter by farm + worker + date range
  await knex.schema.alterTable('time_entries', (table) => {
    table.index(['farm_id', 'worker_id', 'clock_in'], 'time_entries_farm_worker_date_idx');
    table.index(['farm_id', 'clock_in'], 'time_entries_farm_date_idx');
  });

  // Schedules: Common queries filter by farm + date or farm + worker + date
  await knex.schema.alterTable('schedules', (table) => {
    table.index(['farm_id', 'scheduled_date', 'status'], 'schedules_farm_date_status_idx');
    table.index(['farm_id', 'worker_id', 'scheduled_date'], 'schedules_farm_worker_date_idx');
  });

  // Workers: Improve filtering by status and searching
  await knex.schema.alterTable('workers', (table) => {
    table.index(['farm_id', 'status'], 'workers_farm_status_idx');
    table.index(['last_name', 'first_name'], 'workers_name_idx');
  });

  // Certifications: Support expiration queries
  await knex.schema.alterTable('certifications', (table) => {
    table.index(['worker_id', 'expiration_date'], 'certifications_worker_expiry_idx');
  });

  // Fields: Support searching by crop
  await knex.schema.alterTable('fields', (table) => {
    table.index(['farm_id', 'current_crop'], 'fields_farm_crop_idx');
  });
}

export async function down(knex: Knex): Promise<void> {
  // Remove composite indexes
  await knex.schema.alterTable('fields', (table) => {
    table.dropIndex(['farm_id', 'current_crop'], 'fields_farm_crop_idx');
  });

  await knex.schema.alterTable('certifications', (table) => {
    table.dropIndex(['worker_id', 'expiration_date'], 'certifications_worker_expiry_idx');
  });

  await knex.schema.alterTable('workers', (table) => {
    table.dropIndex(['last_name', 'first_name'], 'workers_name_idx');
    table.dropIndex(['farm_id', 'status'], 'workers_farm_status_idx');
  });

  await knex.schema.alterTable('schedules', (table) => {
    table.dropIndex(['farm_id', 'worker_id', 'scheduled_date'], 'schedules_farm_worker_date_idx');
    table.dropIndex(['farm_id', 'scheduled_date', 'status'], 'schedules_farm_date_status_idx');
  });

  await knex.schema.alterTable('time_entries', (table) => {
    table.dropIndex(['farm_id', 'clock_in'], 'time_entries_farm_date_idx');
    table.dropIndex(['farm_id', 'worker_id', 'clock_in'], 'time_entries_farm_worker_date_idx');
  });

  // Remove foreign key indexes
  await knex.schema.alterTable('schedules', (table) => {
    table.dropIndex('field_id');
  });

  await knex.schema.alterTable('time_entries', (table) => {
    table.dropIndex('verified_by');
    table.dropIndex('schedule_id');
    table.dropIndex('field_id');
  });
}

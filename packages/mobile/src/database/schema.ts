import { appSchema, tableSchema } from '@nozbe/watermelondb';

/**
 * WatermelonDB Schema for Farm Commons Mobile App
 *
 * This schema defines the local database structure for offline-first functionality.
 * It mirrors the API types from @farm-commons/shared for seamless data synchronization.
 */

export const schema = appSchema({
  version: 1,
  tables: [
    // Users table
    tableSchema({
      name: 'users',
      columns: [
        { name: 'email', type: 'string', isIndexed: true },
        { name: 'role', type: 'string', isIndexed: true },
        { name: 'farm_id', type: 'string', isIndexed: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
        { name: 'synced_at', type: 'number', isOptional: true },
      ],
    }),

    // Farms table
    tableSchema({
      name: 'farms',
      columns: [
        { name: 'name', type: 'string' },
        { name: 'location', type: 'string' },
        { name: 'size_acres', type: 'number' },
        { name: 'organic_certified', type: 'boolean' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
        { name: 'synced_at', type: 'number', isOptional: true },
      ],
    }),

    // Workers table
    tableSchema({
      name: 'workers',
      columns: [
        { name: 'farm_id', type: 'string', isIndexed: true },
        { name: 'user_id', type: 'string', isOptional: true, isIndexed: true },
        { name: 'first_name', type: 'string', isIndexed: true },
        { name: 'last_name', type: 'string', isIndexed: true },
        { name: 'email', type: 'string', isOptional: true },
        { name: 'phone', type: 'string' },
        { name: 'preferred_language', type: 'string' },
        { name: 'emergency_contact_name', type: 'string', isOptional: true },
        { name: 'emergency_contact_phone', type: 'string', isOptional: true },
        { name: 'hire_date', type: 'number' },
        { name: 'status', type: 'string', isIndexed: true },
        { name: 'hourly_rate', type: 'number', isOptional: true },
        { name: 'piece_rate', type: 'number', isOptional: true },
        { name: 'certifications', type: 'string' }, // JSON array
        { name: 'skills', type: 'string' }, // JSON array
        { name: 'notes', type: 'string', isOptional: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
        { name: 'synced_at', type: 'number', isOptional: true },
      ],
    }),

    // Fields table
    tableSchema({
      name: 'fields',
      columns: [
        { name: 'farm_id', type: 'string', isIndexed: true },
        { name: 'name', type: 'string', isIndexed: true },
        { name: 'size_acres', type: 'number' },
        { name: 'location_gps', type: 'string', isOptional: true }, // JSON object { lat, lng }
        { name: 'current_crop', type: 'string', isOptional: true },
        { name: 'soil_type', type: 'string', isOptional: true },
        { name: 'notes', type: 'string', isOptional: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
        { name: 'synced_at', type: 'number', isOptional: true },
      ],
    }),

    // Schedules table
    tableSchema({
      name: 'schedules',
      columns: [
        { name: 'farm_id', type: 'string', isIndexed: true },
        { name: 'worker_id', type: 'string', isIndexed: true },
        { name: 'field_id', type: 'string', isOptional: true, isIndexed: true },
        { name: 'scheduled_date', type: 'number', isIndexed: true },
        { name: 'start_time', type: 'string' },
        { name: 'end_time', type: 'string' },
        { name: 'task_type', type: 'string', isIndexed: true },
        { name: 'task_description', type: 'string', isOptional: true },
        { name: 'status', type: 'string', isIndexed: true },
        { name: 'notes', type: 'string', isOptional: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
        { name: 'synced_at', type: 'number', isOptional: true },
      ],
    }),

    // Time Entries table
    tableSchema({
      name: 'time_entries',
      columns: [
        { name: 'farm_id', type: 'string', isIndexed: true },
        { name: 'worker_id', type: 'string', isIndexed: true },
        { name: 'schedule_id', type: 'string', isOptional: true, isIndexed: true },
        { name: 'clock_in', type: 'number', isIndexed: true },
        { name: 'clock_out', type: 'number', isOptional: true },
        { name: 'break_minutes', type: 'number' },
        { name: 'total_hours', type: 'number', isOptional: true },
        { name: 'task_type', type: 'string', isIndexed: true },
        { name: 'field_id', type: 'string', isOptional: true, isIndexed: true },
        { name: 'notes', type: 'string', isOptional: true },
        { name: 'verified_by', type: 'string', isOptional: true },
        { name: 'verified_at', type: 'number', isOptional: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
        { name: 'synced_at', type: 'number', isOptional: true },
      ],
    }),

    // Certifications table
    tableSchema({
      name: 'certifications',
      columns: [
        { name: 'worker_id', type: 'string', isIndexed: true },
        { name: 'name', type: 'string' },
        { name: 'issuing_organization', type: 'string' },
        { name: 'issue_date', type: 'number' },
        { name: 'expiration_date', type: 'number', isOptional: true, isIndexed: true },
        { name: 'document_url', type: 'string', isOptional: true },
        { name: 'verified', type: 'boolean' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
        { name: 'synced_at', type: 'number', isOptional: true },
      ],
    }),

    // Sync Queue table - tracks pending changes for offline sync
    tableSchema({
      name: 'sync_queue',
      columns: [
        { name: 'table_name', type: 'string', isIndexed: true },
        { name: 'record_id', type: 'string', isIndexed: true },
        { name: 'operation', type: 'string' }, // 'create', 'update', 'delete'
        { name: 'data', type: 'string' }, // JSON serialized data
        { name: 'retry_count', type: 'number' },
        { name: 'last_error', type: 'string', isOptional: true },
        { name: 'created_at', type: 'number', isIndexed: true },
        { name: 'synced', type: 'boolean', isIndexed: true },
        { name: 'synced_at', type: 'number', isOptional: true },
      ],
    }),
  ],
});

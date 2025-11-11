import {
  schemaMigrations,
  createTable,
  addColumns,
} from '@nozbe/watermelondb/Schema/migrations';

/**
 * Database Migrations
 *
 * This file tracks schema changes over time.
 * Each migration represents a version update to the database schema.
 *
 * Migration Guidelines:
 * - Never modify existing migrations
 * - Always increment the version number
 * - Test migrations thoroughly before deploying
 * - Provide clear migration descriptions
 */

export default schemaMigrations({
  migrations: [
    // Migration 1: Initial schema (version 1)
    // This is handled by the initial schema definition
    // No explicit migration needed for version 1

    // Future migrations will be added here
    // Example:
    // {
    //   toVersion: 2,
    //   steps: [
    //     addColumns({
    //       table: 'workers',
    //       columns: [
    //         { name: 'new_field', type: 'string', isOptional: true },
    //       ],
    //     }),
    //   ],
    // },
  ],
});

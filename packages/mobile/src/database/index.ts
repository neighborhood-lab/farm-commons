import { Database } from '@nozbe/watermelondb';
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';

import { schema } from './schema';
import migrations from './migrations';
import User from './models/User';
import Farm from './models/Farm';
import Worker from './models/Worker';
import Field from './models/Field';
import Schedule from './models/Schedule';
import TimeEntry from './models/TimeEntry';
import Certification from './models/Certification';
import SyncQueue from './models/SyncQueue';

/**
 * Database Configuration and Initialization
 *
 * This module initializes and configures the WatermelonDB database
 * for offline-first data management.
 */

// Create the SQLite adapter
const adapter = new SQLiteAdapter({
  schema,
  migrations,
  jsi: true, // Use JSI for better performance (requires react-native-quick-sqlite)
  onSetUpError: (error) => {
    console.error('Database setup error:', error);
  },
});

// Initialize the database
export const database = new Database({
  adapter,
  modelClasses: [User, Farm, Worker, Field, Schedule, TimeEntry, Certification, SyncQueue],
});

/**
 * Reset the entire database (useful for testing and development)
 * WARNING: This will delete all local data!
 */
export async function resetDatabase(): Promise<void> {
  await database.write(async () => {
    await database.unsafeResetDatabase();
  });
}

/**
 * Get database statistics for debugging
 */
export async function getDatabaseStats() {
  const collections = [
    'users',
    'farms',
    'workers',
    'fields',
    'schedules',
    'time_entries',
    'certifications',
    'sync_queue',
  ];

  const stats: Record<string, number> = {};

  for (const tableName of collections) {
    const collection = database.get(tableName);
    const count = await collection.query().fetchCount();
    stats[tableName] = count;
  }

  return stats;
}

/**
 * Export commonly used collections for easy access
 */
export const collections = {
  users: database.get<User>('users'),
  farms: database.get<Farm>('farms'),
  workers: database.get<Worker>('workers'),
  fields: database.get<Field>('fields'),
  schedules: database.get<Schedule>('schedules'),
  timeEntries: database.get<TimeEntry>('time_entries'),
  certifications: database.get<Certification>('certifications'),
  syncQueue: database.get<SyncQueue>('sync_queue'),
};

// Re-export React provider components from index.tsx
export { DatabaseProvider, useDatabase } from './provider';

export default database;

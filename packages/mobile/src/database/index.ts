import { Database } from '@nozbe/watermelondb';
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';

import { schema } from './schema';
import migrations from './migrations';
import * as models from './models';

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
  modelClasses: [
    models.User,
    models.Farm,
    models.Worker,
    models.Field,
    models.Schedule,
    models.TimeEntry,
    models.Certification,
    models.SyncQueue,
  ],
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
  users: database.get<models.User>('users'),
  farms: database.get<models.Farm>('farms'),
  workers: database.get<models.Worker>('workers'),
  fields: database.get<models.Field>('fields'),
  schedules: database.get<models.Schedule>('schedules'),
  timeEntries: database.get<models.TimeEntry>('time_entries'),
  certifications: database.get<models.Certification>('certifications'),
  syncQueue: database.get<models.SyncQueue>('sync_queue'),
};

export default database;

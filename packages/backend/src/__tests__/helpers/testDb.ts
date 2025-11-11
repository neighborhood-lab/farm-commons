// Test database helpers

import knex, { Knex } from 'knex';
import config from '../../../knexfile.cjs';

let testDb: Knex | null = null;

/**
 * Get test database instance
 */
export function getTestDb(): Knex {
  if (!testDb) {
    // Use development config but with a test database name
    const testConfig = {
      ...config.development,
      connection: process.env.TEST_DATABASE_URL || {
        host: process.env.POSTGRES_HOST || 'localhost',
        port: Number.parseInt(process.env.POSTGRES_PORT || '5432'),
        database: process.env.TEST_POSTGRES_DB || 'farm_commons_test',
        user: process.env.POSTGRES_USER || 'postgres',
        password: process.env.POSTGRES_PASSWORD || 'password',
      },
    };

    testDb = knex(testConfig);
  }

  return testDb;
}

/**
 * Setup test database - run migrations
 */
export async function setupTestDb(): Promise<void> {
  const db = getTestDb();

  // Roll back any existing migrations
  await db.migrate.rollback(undefined, true);

  // Run all migrations
  await db.migrate.latest();
}

/**
 * Cleanup test database - clear all tables
 */
export async function cleanupTestDb(): Promise<void> {
  const db = getTestDb();

  // Delete all data from tables in reverse order to respect foreign keys
  await db('time_entries').del();
  await db('schedules').del();
  await db('workers').del();
  await db('users').del();
  await db('farms').del();
}

/**
 * Close test database connection
 */
export async function closeTestDb(): Promise<void> {
  if (testDb) {
    await testDb.destroy();
    testDb = null;
  }
}

/**
 * Seed test data
 */
export async function seedTestData() {
  const db = getTestDb();

  // Create test farm
  const [farm] = await db('farms')
    .insert({
      name: 'Test Farm',
      address: '123 Test St',
      city: 'Test City',
      state: 'CA',
      zip_code: '12345',
      phone: '555-0100',
    })
    .returning('*');

  // Create test users with different roles
  const [adminUser] = await db('users')
    .insert({
      email: 'admin@test.com',
      password_hash: '$2b$10$test.hash.admin', // bcrypt hash for 'password'
      role: 'admin',
      farm_id: farm.id,
    })
    .returning('*');

  const [managerUser] = await db('users')
    .insert({
      email: 'manager@test.com',
      password_hash: '$2b$10$test.hash.manager',
      role: 'manager',
      farm_id: farm.id,
    })
    .returning('*');

  const [workerUser] = await db('users')
    .insert({
      email: 'worker@test.com',
      password_hash: '$2b$10$test.hash.worker',
      role: 'worker',
      farm_id: farm.id,
    })
    .returning('*');

  // Create test workers
  const [worker1] = await db('workers')
    .insert({
      farm_id: farm.id,
      first_name: 'John',
      last_name: 'Doe',
      email: 'john.doe@test.com',
      phone: '555-0101',
      role: 'Field Worker',
      status: 'active',
      hire_date: '2024-01-01',
    })
    .returning('*');

  const [worker2] = await db('workers')
    .insert({
      farm_id: farm.id,
      first_name: 'Jane',
      last_name: 'Smith',
      email: 'jane.smith@test.com',
      phone: '555-0102',
      role: 'Equipment Operator',
      status: 'active',
      hire_date: '2024-01-15',
    })
    .returning('*');

  return {
    farm,
    users: {
      admin: adminUser,
      manager: managerUser,
      worker: workerUser,
    },
    workers: {
      worker1,
      worker2,
    },
  };
}

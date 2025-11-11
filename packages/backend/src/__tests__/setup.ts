// Test setup file for Vitest
import { beforeAll, afterAll, beforeEach } from 'vitest';
import db from '../db/connection.js';

// Setup database connection before all tests
beforeAll(async () => {
  // Ensure database connection is established
  try {
    await db.raw('SELECT 1');
  } catch {
    console.error('Database connection failed:', error);
  }
});

// Clean up database before each test
beforeEach(async () => {
  // Rollback any transactions and clean up test data
  // In a real test environment, you'd use a test database
  // and clean up tables here
});

// Close database connection after all tests
afterAll(async () => {
  await db.destroy();
});

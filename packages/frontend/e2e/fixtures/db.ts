/**
 * Database seeding utilities for E2E tests
 *
 * These utilities help setup test data before running tests.
 * They communicate with the backend API to create test data.
 */

import type { Page } from '@playwright/test';

const API_URL = process.env.PLAYWRIGHT_API_URL || 'http://localhost:3001';

export interface TestFarm {
  id: string;
  name: string;
  address: string;
}

export interface TestUser {
  id: string;
  email: string;
  password: string;
  role: 'admin' | 'manager' | 'worker';
  farm_id: string;
}

export interface TestWorker {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  role: string;
  hourly_rate: number;
  farm_id: string;
}

export interface TestSchedule {
  id: string;
  worker_id: string;
  field_id: string;
  scheduled_date: string;
  start_time: string;
  end_time: string;
  task_type: string;
}

/**
 * Seed the database with test data
 * This should be called in beforeEach or beforeAll hooks
 */
export async function seedTestDatabase(page: Page): Promise<void> {
  // In a real implementation, this would call a test-specific endpoint
  // that seeds the database with test data
  await page.request.post(`${API_URL}/api/test/seed`, {
    failOnStatusCode: false,
  });
}

/**
 * Clean up test data after tests
 * This should be called in afterEach or afterAll hooks
 */
export async function cleanupTestDatabase(page: Page): Promise<void> {
  // In a real implementation, this would call a test-specific endpoint
  // that cleans up test data
  await page.request.post(`${API_URL}/api/test/cleanup`, {
    failOnStatusCode: false,
  });
}

/**
 * Create a test user via API
 */
export async function createTestUser(
  page: Page,
  userData: Partial<TestUser>
): Promise<TestUser> {
  const defaultUser = {
    email: `test-${Date.now()}@example.com`,
    password: 'test123',
    role: 'worker' as const,
    farm_id: '1',
  };

  const user = { ...defaultUser, ...userData };

  const response = await page.request.post(`${API_URL}/api/auth/register`, {
    data: user,
  });

  if (!response.ok()) {
    throw new Error(`Failed to create test user: ${response.statusText()}`);
  }

  const result = await response.json();
  return { ...user, id: result.data.user.id };
}

/**
 * Create a test worker via API
 */
export async function createTestWorker(
  page: Page,
  token: string,
  workerData: Partial<TestWorker>
): Promise<TestWorker> {
  const defaultWorker = {
    first_name: 'Test',
    last_name: 'Worker',
    email: `worker-${Date.now()}@example.com`,
    phone: '555-0100',
    role: 'field_worker',
    hourly_rate: 18.5,
  };

  const worker = { ...defaultWorker, ...workerData };

  const response = await page.request.post(`${API_URL}/api/workers`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    data: worker,
  });

  if (!response.ok()) {
    throw new Error(`Failed to create test worker: ${response.statusText()}`);
  }

  const result = await response.json();
  return result.data as TestWorker;
}

/**
 * Create a test schedule via API
 */
export async function createTestSchedule(
  page: Page,
  token: string,
  scheduleData: Partial<TestSchedule>
): Promise<TestSchedule> {
  const response = await page.request.post(`${API_URL}/api/schedules`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    data: scheduleData,
  });

  if (!response.ok()) {
    throw new Error(`Failed to create test schedule: ${response.statusText()}`);
  }

  const result = await response.json();
  return result.data as TestSchedule;
}

/**
 * Delete a test user via API
 */
export async function deleteTestUser(
  page: Page,
  token: string,
  userId: string
): Promise<void> {
  await page.request.delete(`${API_URL}/api/users/${userId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    failOnStatusCode: false,
  });
}

/**
 * Delete a test worker via API
 */
export async function deleteTestWorker(
  page: Page,
  token: string,
  workerId: string
): Promise<void> {
  await page.request.delete(`${API_URL}/api/workers/${workerId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    failOnStatusCode: false,
  });
}

/**
 * Setup test data for a typical test scenario
 * Returns commonly needed test data
 */
export async function setupTestScenario(page: Page): Promise<{
  adminToken: string;
  managerToken: string;
  workerToken: string;
}> {
  // Create test users for each role
  const adminUser = await createTestUser(page, {
    email: `admin-${Date.now()}@example.com`,
    role: 'admin',
  });

  const managerUser = await createTestUser(page, {
    email: `manager-${Date.now()}@example.com`,
    role: 'manager',
  });

  const workerUser = await createTestUser(page, {
    email: `worker-${Date.now()}@example.com`,
    role: 'worker',
  });

  // Login to get tokens
  const adminLogin = await page.request.post(`${API_URL}/api/auth/login`, {
    data: {
      email: adminUser.email,
      password: adminUser.password,
    },
  });

  const managerLogin = await page.request.post(`${API_URL}/api/auth/login`, {
    data: {
      email: managerUser.email,
      password: managerUser.password,
    },
  });

  const workerLogin = await page.request.post(`${API_URL}/api/auth/login`, {
    data: {
      email: workerUser.email,
      password: workerUser.password,
    },
  });

  const adminData = await adminLogin.json();
  const managerData = await managerLogin.json();
  const workerData = await workerLogin.json();

  return {
    adminToken: adminData.data.access_token,
    managerToken: managerData.data.access_token,
    workerToken: workerData.data.access_token,
  };
}

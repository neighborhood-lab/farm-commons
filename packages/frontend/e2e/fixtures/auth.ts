import { test as base, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

/**
 * User credentials for different roles
 */
export const testUsers = {
  admin: {
    email: 'admin@example.com',
    password: 'admin123',
    role: 'admin' as const,
  },
  manager: {
    email: 'manager@example.com',
    password: 'manager123',
    role: 'manager' as const,
  },
  worker: {
    email: 'worker@example.com',
    password: 'worker123',
    role: 'worker' as const,
  },
};

export type UserRole = 'admin' | 'manager' | 'worker';

interface AuthenticatedUser {
  id: string;
  email: string;
  role: UserRole;
  farm_id: string;
  access_token: string;
}

/**
 * Extended test fixtures with authentication helpers
 */
export const test = base.extend<{
  authenticatedPage: Page;
  adminPage: Page;
  managerPage: Page;
  workerPage: Page;
}>({
  /**
   * Generic authenticated page fixture
   * Use this when you need to login with custom credentials
   */
  authenticatedPage: async ({ page }, use) => {
    await use(page);
  },

  /**
   * Pre-authenticated admin page
   */
  adminPage: async ({ page }, use) => {
    await loginAs(page, testUsers.admin.email, testUsers.admin.password);
    await use(page);
  },

  /**
   * Pre-authenticated manager page
   */
  managerPage: async ({ page }, use) => {
    await loginAs(page, testUsers.manager.email, testUsers.manager.password);
    await use(page);
  },

  /**
   * Pre-authenticated worker page
   */
  workerPage: async ({ page }, use) => {
    await loginAs(page, testUsers.worker.email, testUsers.worker.password);
    await use(page);
  },
});

/**
 * Helper function to login programmatically
 */
export async function loginAs(
  page: Page,
  email: string,
  password: string
): Promise<AuthenticatedUser> {
  // Navigate to login page
  await page.goto('/login');

  // Fill in login form
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);

  // Submit form
  await page.click('button[type="submit"]');

  // Wait for navigation or success indicator
  await page.waitForURL(/\/(dashboard|$)/, { timeout: 5000 });

  // Extract user data from localStorage or state
  const userData = await page.evaluate(() => {
    const stored = localStorage.getItem('user') || sessionStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });

  return userData as AuthenticatedUser;
}

/**
 * Helper function to login via API (faster for setup)
 */
export async function loginViaAPI(
  page: Page,
  email: string,
  password: string
): Promise<AuthenticatedUser> {
  const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:5173';
  const apiURL = process.env.PLAYWRIGHT_API_URL || 'http://localhost:3001';

  // Login via API
  const response = await page.request.post(`${apiURL}/api/auth/login`, {
    data: {
      email,
      password,
    },
  });

  expect(response.ok()).toBeTruthy();

  const result = await response.json();
  const userData = result.data;

  // Set authentication state in browser storage
  await page.goto(baseURL);
  await page.evaluate((data) => {
    localStorage.setItem('access_token', data.access_token);
    localStorage.setItem('user', JSON.stringify(data.user));
  }, userData);

  return userData.user as AuthenticatedUser;
}

/**
 * Helper function to logout
 */
export async function logout(page: Page): Promise<void> {
  await page.evaluate(() => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    sessionStorage.clear();
  });
  await page.goto('/login');
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(page: Page): Promise<boolean> {
  return await page.evaluate(() => {
    return !!localStorage.getItem('access_token');
  });
}

/**
 * Get current user from storage
 */
export async function getCurrentUser(page: Page): Promise<AuthenticatedUser | null> {
  return await page.evaluate(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });
}

// Export expect for convenience
export { expect };

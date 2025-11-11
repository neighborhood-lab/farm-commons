/**
 * Authentication E2E Tests
 *
 * Tests for login, registration, and authentication flows
 */

import { test, expect, testUsers, loginAs, loginViaAPI, logout } from './fixtures/auth';

test.describe('Authentication', () => {
  test.describe('Login Flow', () => {
    test('should display login page', async ({ page }) => {
      await page.goto('/login');

      // Check for login form elements
      await expect(page.locator('input[name="email"]')).toBeVisible();
      await expect(page.locator('input[name="password"]')).toBeVisible();
      await expect(page.locator('button[type="submit"]')).toBeVisible();
    });

    test('should show validation errors for empty fields', async ({ page }) => {
      await page.goto('/login');

      // Try to submit empty form
      await page.click('button[type="submit"]');

      // Check for validation errors
      await expect(page.locator('text=/email is required/i')).toBeVisible({
        timeout: 2000,
      });
    });

    test('should show error for invalid credentials', async ({ page }) => {
      await page.goto('/login');

      // Fill in invalid credentials
      await page.fill('input[name="email"]', 'invalid@example.com');
      await page.fill('input[name="password"]', 'wrongpassword');

      // Submit form
      await page.click('button[type="submit"]');

      // Check for error message
      await expect(
        page.locator('text=/invalid credentials/i')
      ).toBeVisible({
        timeout: 5000,
      });
    });

    test.skip('should successfully login with valid credentials', async ({ page }) => {
      // Skip if test users are not seeded
      // This test requires the database to be seeded with test users

      await page.goto('/login');

      // Fill in valid credentials
      await page.fill('input[name="email"]', testUsers.admin.email);
      await page.fill('input[name="password"]', testUsers.admin.password);

      // Submit form
      await page.click('button[type="submit"]');

      // Wait for redirect to dashboard
      await page.waitForURL(/\/(dashboard|$)/, { timeout: 5000 });

      // Check for successful login indicators
      await expect(page.locator('text=/welcome/i')).toBeVisible({
        timeout: 2000,
      });
    });

    test('should handle email field validation', async ({ page }) => {
      await page.goto('/login');

      // Fill in invalid email format
      await page.fill('input[name="email"]', 'not-an-email');
      await page.fill('input[name="password"]', 'password123');

      // Try to submit
      await page.click('button[type="submit"]');

      // Check for email validation error
      const emailInput = page.locator('input[name="email"]');
      const validationMessage = await emailInput.evaluate(
        (el: HTMLInputElement) => el.validationMessage
      );

      expect(validationMessage).toBeTruthy();
    });

    test('should handle password field visibility toggle', async ({ page }) => {
      await page.goto('/login');

      const passwordInput = page.locator('input[name="password"]');
      const toggleButton = page.locator('[data-testid="toggle-password-visibility"]');

      // Check if toggle button exists (optional feature)
      const hasToggle = await toggleButton.count();

      if (hasToggle > 0) {
        // Initially password field should be type="password"
        await expect(passwordInput).toHaveAttribute('type', 'password');

        // Click toggle
        await toggleButton.click();

        // Now should be type="text"
        await expect(passwordInput).toHaveAttribute('type', 'text');

        // Click toggle again
        await toggleButton.click();

        // Back to password
        await expect(passwordInput).toHaveAttribute('type', 'password');
      }
    });
  });

  test.describe('Logout Flow', () => {
    test.skip('should successfully logout', async ({ page }) => {
      // Skip if test users are not seeded
      // Login first
      await loginViaAPI(page, testUsers.manager.email, testUsers.manager.password);
      await page.goto('/dashboard');

      // Find and click logout button
      await page.click('[data-testid="logout-button"]');

      // Should redirect to login
      await page.waitForURL(/\/login/, { timeout: 5000 });

      // Check that auth state is cleared
      const hasToken = await page.evaluate(() => {
        return !!localStorage.getItem('access_token');
      });

      expect(hasToken).toBe(false);
    });
  });

  test.describe('Protected Routes', () => {
    test('should redirect to login when accessing protected route without auth', async ({
      page,
    }) => {
      // Try to access dashboard without authentication
      await page.goto('/dashboard');

      // Should redirect to login
      await page.waitForURL(/\/login/, { timeout: 5000 });
    });

    test.skip('should allow access to protected routes when authenticated', async ({
      page,
    }) => {
      // Skip if test users are not seeded
      // Login first
      await loginViaAPI(page, testUsers.worker.email, testUsers.worker.password);

      // Try to access dashboard
      await page.goto('/dashboard');

      // Should stay on dashboard
      await expect(page).toHaveURL(/\/(dashboard|$)/);
    });
  });

  test.describe('Session Persistence', () => {
    test.skip('should maintain session after page reload', async ({ page }) => {
      // Skip if test users are not seeded
      // Login first
      await loginViaAPI(page, testUsers.admin.email, testUsers.admin.password);
      await page.goto('/dashboard');

      // Reload page
      await page.reload();

      // Should still be on dashboard
      await expect(page).toHaveURL(/\/(dashboard|$)/);
    });

    test.skip('should handle expired session', async ({ page }) => {
      // Skip - requires specific session expiry setup
      // This would test the behavior when a token expires

      // Login first
      await loginViaAPI(page, testUsers.admin.email, testUsers.admin.password);
      await page.goto('/dashboard');

      // Manually expire the token
      await page.evaluate(() => {
        localStorage.setItem('access_token', 'expired-token');
      });

      // Try to make an authenticated request
      await page.reload();

      // Should redirect to login
      await page.waitForURL(/\/login/, { timeout: 5000 });
    });
  });

  test.describe('Registration Flow', () => {
    test('should display registration page', async ({ page }) => {
      await page.goto('/register');

      // Check for registration form elements
      await expect(page.locator('input[name="email"]')).toBeVisible();
      await expect(page.locator('input[name="password"]')).toBeVisible();
      await expect(page.locator('button[type="submit"]')).toBeVisible();
    });

    test.skip('should successfully register a new user', async ({ page }) => {
      // Skip - requires test-specific email
      await page.goto('/register');

      const testEmail = `test-${Date.now()}@example.com`;

      await page.fill('input[name="email"]', testEmail);
      await page.fill('input[name="password"]', 'securePassword123');
      await page.fill('input[name="confirmPassword"]', 'securePassword123');

      await page.click('button[type="submit"]');

      // Should redirect to dashboard after successful registration
      await page.waitForURL(/\/(dashboard|$)/, { timeout: 5000 });
    });

    test('should show error when passwords do not match', async ({ page }) => {
      await page.goto('/register');

      await page.fill('input[name="email"]', 'test@example.com');
      await page.fill('input[name="password"]', 'password123');
      await page.fill('input[name="confirmPassword"]', 'different123');

      await page.click('button[type="submit"]');

      // Check for password mismatch error
      await expect(
        page.locator('text=/passwords.*match/i')
      ).toBeVisible({
        timeout: 2000,
      });
    });
  });
});

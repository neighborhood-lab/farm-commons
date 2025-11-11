# E2E Testing with Playwright

This directory contains end-to-end (E2E) tests for the Farm Commons frontend application using Playwright.

## Structure

```
e2e/
├── fixtures/
│   ├── auth.ts          # Authentication test fixtures and helpers
│   └── db.ts            # Database seeding utilities
├── support/
│   └── visual.ts        # Visual regression testing utilities
├── auth.spec.ts         # Authentication flow tests
└── README.md            # This file
```

## Getting Started

### Prerequisites

- Node.js >= 22.0.0
- pnpm
- Backend server running on port 3001
- Frontend dev server (automatically started by Playwright)

### Installation

Playwright is already installed as part of the project dependencies. To install browsers:

```bash
pnpm exec playwright install
```

### Running Tests

```bash
# Run all E2E tests
pnpm run test:e2e

# Run tests in UI mode (interactive)
pnpm run test:e2e:ui

# Run tests in headed mode (see browser)
pnpm run test:e2e:headed

# Run specific test file
pnpm exec playwright test e2e/auth.spec.ts

# Run tests in debug mode
pnpm exec playwright test --debug
```

### Environment Variables

Configure test environment variables:

```bash
# Base URL for the frontend
PLAYWRIGHT_BASE_URL=http://localhost:5173

# API URL for backend
PLAYWRIGHT_API_URL=http://localhost:3001
```

## Writing Tests

### Basic Test Structure

```typescript
import { test, expect } from '@playwright/test';

test('should display welcome message', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('h1')).toContainText('Welcome');
});
```

### Using Authentication Fixtures

The `auth.ts` fixture provides helpers for authenticated tests:

```typescript
import { test, expect } from './fixtures/auth';

// Use pre-authenticated pages
test('admin can access settings', async ({ adminPage }) => {
  await adminPage.goto('/settings');
  await expect(adminPage.locator('h1')).toContainText('Settings');
});

// Or login programmatically
test('manager can view schedules', async ({ page }) => {
  const user = await loginViaAPI(page, 'manager@example.com', 'password');
  await page.goto('/schedules');
  await expect(page.locator('h1')).toContainText('Schedules');
});
```

### Database Seeding

Use the `db.ts` utilities to set up test data:

```typescript
import { test, expect } from '@playwright/test';
import { createTestWorker } from './fixtures/db';

test('can create a worker', async ({ page }) => {
  // Setup test data
  const worker = await createTestWorker(page, adminToken, {
    first_name: 'John',
    last_name: 'Doe',
  });

  // Test the functionality
  await page.goto(`/workers/${worker.id}`);
  await expect(page.locator('h1')).toContainText('John Doe');
});
```

### Visual Regression Testing

Use the `visual.ts` utilities for screenshot comparison:

```typescript
import { test, expect } from '@playwright/test';
import { takePageScreenshot, takeComponentScreenshot } from './support/visual';

test('dashboard should match screenshot', async ({ page }) => {
  await page.goto('/dashboard');
  await takePageScreenshot(page, 'dashboard');
});

test('worker card should match screenshot', async ({ page }) => {
  await page.goto('/workers');
  const workerCard = page.locator('[data-testid="worker-card"]').first();
  await takeComponentScreenshot(workerCard, 'worker-card');
});
```

## Best Practices

### 1. Use Data Test IDs

Add `data-testid` attributes to elements for reliable selection:

```tsx
<button data-testid="submit-button">Submit</button>
```

```typescript
await page.click('[data-testid="submit-button"]');
```

### 2. Wait for Network Idle

For pages with API calls, wait for network idle:

```typescript
await page.goto('/dashboard', { waitUntil: 'networkidle' });
```

### 3. Use Soft Assertions for Multiple Checks

```typescript
await expect.soft(page.locator('.header')).toBeVisible();
await expect.soft(page.locator('.footer')).toBeVisible();
```

### 4. Clean Up Test Data

Always clean up test data after tests:

```typescript
test.afterEach(async ({ page }) => {
  await cleanupTestDatabase(page);
});
```

### 5. Skip Tests That Need Setup

Use `.skip()` for tests that require specific setup:

```typescript
test.skip('should perform complex operation', async ({ page }) => {
  // This test requires specific database state
});
```

## Debugging Tests

### Debug Mode

Run tests in debug mode to step through:

```bash
pnpm exec playwright test --debug
```

### Playwright Inspector

The Playwright Inspector allows you to:
- Step through tests
- Explore locators
- Record new tests
- See console logs

### View Test Reports

After running tests, view the HTML report:

```bash
pnpm exec playwright show-report
```

### Screenshots and Videos

Failed tests automatically capture:
- Screenshots (in `test-results/`)
- Videos (in `test-results/`)
- Traces (in `test-results/`)

## CI/CD Integration

Tests are configured to run in CI with:
- Retry on failure (2 retries)
- Single worker (to avoid concurrency issues)
- JUnit XML output for CI integration

The configuration is in `playwright.config.ts`.

## Common Issues

### Issue: Tests fail with "Target page, context or browser has been closed"

**Solution:** Make sure you're not closing the page prematurely. Use `page.close()` only when necessary.

### Issue: Flaky tests due to animations

**Solution:** Use the visual testing utilities which disable animations:

```typescript
import { prepareForScreenshot } from './support/visual';

await prepareForScreenshot(page);
```

### Issue: Tests timeout waiting for elements

**Solution:** Increase timeout or check if the element exists:

```typescript
await expect(page.locator('.element')).toBeVisible({ timeout: 10000 });
```

### Issue: Test data conflicts

**Solution:** Use unique identifiers for test data:

```typescript
const testEmail = `test-${Date.now()}@example.com`;
```

## Resources

- [Playwright Documentation](https://playwright.dev/)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [Debugging Guide](https://playwright.dev/docs/debug)
- [CI/CD Guide](https://playwright.dev/docs/ci)

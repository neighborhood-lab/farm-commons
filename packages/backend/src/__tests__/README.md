# Backend Integration Tests

This directory contains integration tests for the Farm Commons backend API.

## Overview

The integration tests test the complete API functionality, including:
- Database interactions
- Authentication and authorization
- Request validation
- Error handling
- HTTP responses

## Directory Structure

```
__tests__/
├── helpers/
│   ├── testAuth.ts    # Authentication helpers for tests
│   └── testDb.ts      # Database setup and seeding helpers
└── integration/
    ├── auth.test.ts        # Authentication route tests
    ├── workers.test.ts     # Worker management route tests
    ├── schedules.test.ts   # Schedule route tests
    └── timeEntries.test.ts # Time entry route tests
```

## Prerequisites

Before running the tests, you need:

1. **PostgreSQL database** - The tests require a separate test database
2. **Environment variables** - Configure test database connection

### Database Setup

Create a test database:

```bash
createdb farm_commons_test
```

Or set a custom test database using environment variables:

```bash
export TEST_POSTGRES_DB=farm_commons_test
export POSTGRES_HOST=localhost
export POSTGRES_PORT=5432
export POSTGRES_USER=postgres
export POSTGRES_PASSWORD=password
```

## Running Tests

### Run all integration tests

```bash
npm run test:integration
```

### Watch mode (re-run on changes)

```bash
npm run test:integration:watch
```

### Run all tests (including unit tests)

```bash
npm test
```

### Run with coverage

```bash
npm run test:coverage
```

## Test Helpers

### Database Helpers (`testDb.ts`)

- `setupTestDb()` - Run database migrations before tests
- `cleanupTestDb()` - Clear all data from tables between tests
- `closeTestDb()` - Close database connection after tests
- `seedTestData()` - Create test data (farm, users, workers)
- `getTestDb()` - Get test database instance

### Authentication Helpers (`testAuth.ts`)

- `generateTestToken(user)` - Generate JWT token for testing
- `hashTestPassword(password)` - Hash password for test users
- `createTestUser(overrides)` - Create test user payload
- `getAuthHeader(token)` - Get authorization header for requests
- `createTestTokens(farmId)` - Create tokens for admin, manager, and worker roles

## Test Structure

Each integration test file follows this pattern:

```typescript
describe('Route Name', () => {
  beforeAll(async () => {
    // Setup database migrations
    await setupTestDb();
  });

  afterAll(async () => {
    // Close database connection
    await closeTestDb();
  });

  beforeEach(async () => {
    // Clean and seed test data before each test
    await cleanupTestDb();
    testData = await seedTestData();
    tokens = createTestTokens(testData.farm.id);
  });

  describe('GET /api/endpoint', () => {
    it('should test success case', async () => {
      // Test implementation
    });

    it('should test error case', async () => {
      // Test implementation
    });
  });
});
```

## Writing New Tests

When adding new integration tests:

1. Create a new test file in `integration/` directory
2. Import test helpers from `helpers/`
3. Follow the existing test structure
4. Test both success and error cases
5. Test authorization for different roles
6. Clean up test data in `beforeEach`

### Example Test

```typescript
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../index.js';
import { setupTestDb, cleanupTestDb, closeTestDb, seedTestData } from '../helpers/testDb.js';
import { createTestTokens, getAuthHeader } from '../helpers/testAuth.js';

describe('New Route Tests', () => {
  let testData;
  let tokens;

  beforeAll(async () => {
    await setupTestDb();
  });

  afterAll(async () => {
    await closeTestDb();
  });

  beforeEach(async () => {
    await cleanupTestDb();
    testData = await seedTestData();
    tokens = createTestTokens(testData.farm.id);
  });

  it('should test endpoint', async () => {
    const response = await request(app)
      .get('/api/new-endpoint')
      .set(getAuthHeader(tokens.manager.token))
      .expect(200);

    expect(response.body).toMatchObject({
      success: true,
      data: expect.any(Array),
    });
  });
});
```

## Test Database

The tests use a separate test database configured in `knexfile.js`:

- Database name: `farm_commons_test` (configurable via `TEST_POSTGRES_DB`)
- Migrations are run before all tests
- Data is cleared between each test to ensure isolation
- Database connection is closed after all tests

## Continuous Integration

The integration tests are designed to run in CI/CD pipelines:

1. Create test database
2. Run migrations
3. Execute tests
4. Generate coverage reports

Make sure your CI environment has:
- PostgreSQL service running
- Test database created
- Environment variables configured

## Troubleshooting

### Database connection errors

- Verify PostgreSQL is running
- Check database credentials
- Ensure test database exists

### Migration errors

- Run migrations manually: `NODE_ENV=test npm run db:migrate:latest`
- Check migration files for errors

### Test timeouts

- Integration tests have 30-second timeout
- Increase timeout in `vitest.config.ts` if needed

### Port conflicts

- Default server port is 3001
- Tests use the Express app directly (no server needed)
- Supertest handles HTTP requests internally

## Best Practices

1. **Isolation** - Each test should be independent
2. **Cleanup** - Always clean database between tests
3. **Seeding** - Use `seedTestData()` for consistent test data
4. **Assertions** - Test both success and error cases
5. **Authorization** - Test different user roles
6. **Descriptive** - Use clear test descriptions
7. **Coverage** - Aim for high test coverage

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Supertest Documentation](https://github.com/ladjs/supertest)
- [Knex.js Documentation](https://knexjs.org/)

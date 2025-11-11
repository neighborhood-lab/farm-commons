# Farm Commons SDK

TypeScript/JavaScript SDK for integrating with the Farm Commons API. This SDK provides a type-safe, easy-to-use interface for managing farm operations, workers, schedules, and time tracking.

## Installation

```bash
npm install @farm-commons/sdk
```

## Quick Start

```typescript
import { FarmCommonsSDK } from '@farm-commons/sdk';

// Initialize the SDK
const sdk = new FarmCommonsSDK({
  baseUrl: 'https://api.farmcommons.com',
});

// Login
const { user, access_token } = await sdk.auth.login({
  email: 'manager@example.com',
  password: 'securepassword123',
});

console.log(`Logged in as ${user.email}`);

// The SDK automatically sets the access token after login
// Now you can make authenticated requests

// List workers
const { data: workers } = await sdk.workers.list({ page: 1, per_page: 20 });
console.log(`Found ${workers.length} workers`);
```

## Configuration

### SDKConfig Options

```typescript
interface SDKConfig {
  baseUrl: string;           // API base URL (required)
  apiKey?: string;           // API key for authentication (alternative to token)
  accessToken?: string;      // Access token for authentication
  timeout?: number;          // Request timeout in milliseconds (default: 30000)
  onTokenRefresh?: (token: string) => void; // Callback when token is refreshed
}
```

### Example with Token Persistence

```typescript
const sdk = new FarmCommonsSDK({
  baseUrl: 'https://api.farmcommons.com',
  accessToken: localStorage.getItem('farm_token') || undefined,
  onTokenRefresh: (token) => {
    // Save token when it's refreshed
    localStorage.setItem('farm_token', token);
  },
});
```

## API Reference

### Authentication

```typescript
// Login
const result = await sdk.auth.login({
  email: 'user@example.com',
  password: 'password123',
});

// Register new user
const result = await sdk.auth.register({
  email: 'newuser@example.com',
  password: 'password123',
  role: 'manager',
  farm_id: 'farm-uuid',
});

// Get current user profile
const user = await sdk.auth.me();

// Logout (clears local token)
sdk.auth.logout();
```

### Workers

```typescript
// List workers with pagination
const { data, total, page, per_page } = await sdk.workers.list({
  page: 1,
  per_page: 20,
});

// Get a single worker
const worker = await sdk.workers.get('worker-uuid');

// Create a new worker
const newWorker = await sdk.workers.create({
  first_name: 'John',
  last_name: 'Doe',
  email: 'john@example.com',
  phone: '+1-555-0123',
  preferred_language: 'en',
  hire_date: new Date(),
  status: 'active',
  hourly_rate: 18.50,
  skills: ['harvesting', 'tractor operation'],
  certifications: ['Pesticide Applicator'],
});

// Update a worker
const updatedWorker = await sdk.workers.update('worker-uuid', {
  hourly_rate: 19.50,
  skills: ['harvesting', 'tractor operation', 'irrigation'],
});

// Delete a worker
await sdk.workers.delete('worker-uuid');
```

### Schedules

```typescript
// List all schedules
const schedules = await sdk.schedules.list();

// List schedules with date range filter
const schedules = await sdk.schedules.list({
  start_date: '2025-01-01',
  end_date: '2025-01-31',
});

// Get schedules for a specific worker
const workerSchedules = await sdk.schedules.getByWorker('worker-uuid');

// Create a new schedule
const schedule = await sdk.schedules.create({
  worker_id: 'worker-uuid',
  field_id: 'field-uuid',
  scheduled_date: '2025-11-15',
  start_time: '08:00',
  end_time: '16:00',
  task_type: 'Harvesting',
  task_description: 'Harvest tomatoes in Field A',
});

// Update a schedule
const updated = await sdk.schedules.update('schedule-uuid', {
  status: 'completed',
  notes: 'Completed ahead of schedule',
});

// Delete a schedule
await sdk.schedules.delete('schedule-uuid');
```

### Time Entries

```typescript
// List all time entries
const entries = await sdk.timeEntries.list();

// List time entries with date range
const entries = await sdk.timeEntries.list({
  start_date: '2025-11-01',
  end_date: '2025-11-10',
});

// Get time entries for a specific worker
const workerEntries = await sdk.timeEntries.getByWorker('worker-uuid');

// Clock in a worker
const entry = await sdk.timeEntries.clockIn({
  worker_id: 'worker-uuid',
  task_type: 'Planting',
  field_id: 'field-uuid',
  schedule_id: 'schedule-uuid',
  notes: 'Starting planting shift',
});

// Clock out a worker
const completed = await sdk.timeEntries.clockOut('entry-uuid', {
  break_minutes: 30,
  notes: 'Completed planting section B',
});

// Verify a time entry (manager/admin only)
const verified = await sdk.timeEntries.verify('entry-uuid');
```

## Advanced Usage

### Error Handling

```typescript
import { FarmCommonsSDK, SDKError } from '@farm-commons/sdk';

try {
  const worker = await sdk.workers.get('invalid-uuid');
} catch (error) {
  if (error instanceof Error) {
    const sdkError = error as SDKError;
    console.error('Error:', sdkError.message);
    console.error('Status Code:', sdkError.statusCode);
    console.error('Response:', sdkError.response);
  }
}
```

### Manual Token Management

```typescript
// Set token manually (useful when loading from storage)
sdk.setAccessToken('your-jwt-token');

// Get current token
const token = sdk.getAccessToken();

// Clear token
sdk.setAccessToken('');
```

### Custom Timeout

```typescript
const sdk = new FarmCommonsSDK({
  baseUrl: 'https://api.farmcommons.com',
  timeout: 60000, // 60 seconds
});
```

## Type Safety

The SDK is fully typed with TypeScript, providing excellent autocomplete and type checking:

```typescript
import type { Worker, CreateWorkerData, Schedule } from '@farm-commons/sdk';

const workerData: CreateWorkerData = {
  first_name: 'Jane',
  last_name: 'Smith',
  phone: '+1-555-0124',
  hire_date: new Date(),
  // TypeScript will catch any missing or invalid fields
};

const worker: Worker = await sdk.workers.create(workerData);
```

## Examples

### Complete Worker Management Flow

```typescript
import { FarmCommonsSDK } from '@farm-commons/sdk';

async function manageWorkers() {
  const sdk = new FarmCommonsSDK({
    baseUrl: process.env.FARM_COMMONS_API_URL!,
  });

  // Login
  await sdk.auth.login({
    email: process.env.EMAIL!,
    password: process.env.PASSWORD!,
  });

  // Create a new worker
  const worker = await sdk.workers.create({
    first_name: 'Maria',
    last_name: 'Garcia',
    phone: '+1-555-0199',
    preferred_language: 'es',
    hire_date: new Date(),
    hourly_rate: 17.00,
    skills: ['harvesting', 'pruning'],
  });

  console.log(`Created worker: ${worker.id}`);

  // Schedule the worker
  const schedule = await sdk.schedules.create({
    worker_id: worker.id,
    scheduled_date: new Date(),
    start_time: '07:00',
    end_time: '15:00',
    task_type: 'Harvesting',
  });

  console.log(`Created schedule: ${schedule.id}`);

  // Clock in the worker
  const timeEntry = await sdk.timeEntries.clockIn({
    worker_id: worker.id,
    task_type: 'Harvesting',
    schedule_id: schedule.id,
  });

  console.log(`Worker clocked in: ${timeEntry.id}`);

  // Later... clock out
  await sdk.timeEntries.clockOut(timeEntry.id, {
    break_minutes: 30,
  });

  console.log('Worker clocked out');
}
```

### Batch Operations

```typescript
async function listAllWorkers() {
  const sdk = new FarmCommonsSDK({
    baseUrl: process.env.FARM_COMMONS_API_URL!,
    accessToken: process.env.ACCESS_TOKEN,
  });

  let page = 1;
  const allWorkers = [];

  while (true) {
    const response = await sdk.workers.list({ page, per_page: 50 });
    allWorkers.push(...response.data);

    if (page >= response.total_pages) {
      break;
    }
    page++;
  }

  console.log(`Total workers: ${allWorkers.length}`);
  return allWorkers;
}
```

## Contributing

See the main repository [CONTRIBUTING.md](../../CONTRIBUTING.md) for guidelines.

## License

MIT

## Support

For issues and questions:
- GitHub Issues: https://github.com/farm-commons/farm-commons/issues
- Documentation: https://docs.farmcommons.com

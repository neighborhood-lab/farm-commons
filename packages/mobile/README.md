# Farm Commons Mobile API Client

Mobile API client for the Farm Commons application with offline support, request queuing, and automatic retry logic.

## Features

- **Type-Safe API Calls**: Full TypeScript support with shared types
- **Authentication**: JWT token management with automatic refresh
- **Offline Support**: Request queuing for offline mode
- **Automatic Retry**: Exponential backoff for failed requests
- **Sync Conflict Resolution**: Built-in conflict resolution strategies
- **Network Detection**: Automatic online/offline status detection

## Installation

This package is part of the Farm Commons monorepo and uses shared types:

```bash
npm install @farm-commons/mobile
```

## Quick Start

```typescript
import { FarmCommonsApiClient, InMemoryStorageAdapter } from '@farm-commons/mobile';

// Create storage adapter
const storage = new InMemoryStorageAdapter();

// Initialize API client
const api = new FarmCommonsApiClient(
  {
    baseUrl: 'https://api.farmcommons.com',
    timeout: 30000,
    maxRetries: 3,
    retryDelay: 1000,
  },
  storage
);

// Login
const tokens = await api.login({
  email: 'user@example.com',
  password: 'password123',
});

// Fetch data
const workers = await api.getWorkers();
const schedules = await api.getSchedules({ workerId: '123' });

// Create new data
const newWorker = await api.createWorker({
  first_name: 'John',
  last_name: 'Doe',
  phone: '555-1234',
  preferred_language: 'en',
});

// Clock in/out
const timeEntry = await api.clockIn({
  worker_id: '123',
  task_type: 'Harvesting',
  field_id: 'field-1',
});

await api.clockOut(timeEntry.id, 30); // 30 minutes break
```

## Storage Adapters

### InMemoryStorageAdapter

For testing or temporary storage:

```typescript
import { InMemoryStorageAdapter } from '@farm-commons/mobile';

const storage = new InMemoryStorageAdapter();
```

### AsyncStorageAdapter

For React Native with AsyncStorage:

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AsyncStorageAdapter } from '@farm-commons/mobile';

const storage = new AsyncStorageAdapter(AsyncStorage);
```

### SecureStoreAdapter

For sensitive data in Expo apps:

```typescript
import * as SecureStore from 'expo-secure-store';
import { SecureStoreAdapter } from '@farm-commons/mobile';

const storage = new SecureStoreAdapter(SecureStore);
```

## Offline Mode

The client automatically detects network status and queues requests when offline:

```typescript
// When offline, requests are queued
try {
  await api.createWorker(newWorker);
} catch (error) {
  console.log(error.message); // "Offline: Request queued (xyz-123)"
}

// Check queued requests
const queued = api.getQueuedRequests();
console.log(`${queued.length} requests pending`);

// When back online, process queue
await api.processQueue();
```

### Request Priority

Specify priority for queued requests:

```typescript
// High priority (processed first)
await api.clockIn(data); // Default: high

// Medium priority
await api.createSchedule(schedule, 'medium');

// Low priority
await api.updateWorker(id, updates, 'low');
```

## Retry Logic

Failed requests are automatically retried with exponential backoff:

```typescript
const api = new FarmCommonsApiClient(
  {
    baseUrl: 'https://api.farmcommons.com',
    maxRetries: 3,      // Retry up to 3 times
    retryDelay: 1000,   // Initial delay: 1 second
                        // Delays: 1s, 2s, 4s (exponential)
  },
  storage
);
```

## Sync Conflict Resolution

Handle sync conflicts with built-in strategies:

```typescript
import { SyncConflictError } from '@farm-commons/mobile';

try {
  await api.updateWorker(id, updates);
} catch (error) {
  if (error instanceof SyncConflictError) {
    const conflict = error.conflict;

    // Strategy 1: Use server version
    const resolved = await api.resolveConflict(conflict, 'server');

    // Strategy 2: Use local version
    const resolved = await api.resolveConflict(conflict, 'local');

    // Strategy 3: Merge both versions
    const resolved = await api.resolveConflict(conflict, 'merge');

    // Strategy 4: Manual resolution
    const resolved = await api.resolveConflict(conflict, 'manual');
  }
}
```

## API Methods

### Authentication

```typescript
// Login
const tokens = await api.login({ email, password });

// Logout
await api.logout();

// Check auth status
const isLoggedIn = api.isAuthenticated();

// Refresh token (automatic on 401)
const newTokens = await api.refreshToken();
```

### Workers

```typescript
const workers = await api.getWorkers();
const worker = await api.getWorker(id);
const created = await api.createWorker(data);
const updated = await api.updateWorker(id, data);
await api.deleteWorker(id);
```

### Fields

```typescript
const fields = await api.getFields();
const field = await api.getField(id);
const created = await api.createField(data);
const updated = await api.updateField(id, data);
await api.deleteField(id);
```

### Schedules

```typescript
const schedules = await api.getSchedules({ workerId: '123', date: '2025-11-10' });
const schedule = await api.getSchedule(id);
const created = await api.createSchedule(data);
const updated = await api.updateSchedule(id, data);
await api.deleteSchedule(id);
```

### Time Entries

```typescript
const entries = await api.getTimeEntries({ workerId: '123' });
const entry = await api.getTimeEntry(id);
const clockedIn = await api.clockIn({ worker_id, task_type });
const clockedOut = await api.clockOut(entryId, breakMinutes);
const updated = await api.updateTimeEntry(id, data);
await api.deleteTimeEntry(id);
```

### Certifications

```typescript
const certs = await api.getCertifications(workerId);
const created = await api.createCertification(data);
const updated = await api.updateCertification(id, data);
await api.deleteCertification(id);
```

## Network Status

```typescript
// Check if online
if (api.isOnline) {
  console.log('Connected to network');
}

// Get queued requests count
const queueSize = api.getQueuedRequests().length;
```

## Testing

Run tests with Vitest:

```bash
npm test
```

The test suite includes:
- Authentication flow tests
- Offline mode and request queuing
- Retry logic with exponential backoff
- Sync conflict resolution
- All API resource methods

## Configuration

```typescript
interface ApiConfig {
  baseUrl: string;        // API base URL (required)
  timeout?: number;       // Request timeout in ms (default: 30000)
  maxRetries?: number;    // Max retry attempts (default: 3)
  retryDelay?: number;    // Initial retry delay in ms (default: 1000)
}
```

## Error Handling

```typescript
import { SyncConflictError } from '@farm-commons/mobile';

try {
  await api.createWorker(data);
} catch (error) {
  if (error instanceof SyncConflictError) {
    // Handle sync conflict
    console.log('Conflict:', error.conflict);
  } else if (error.message.includes('Offline')) {
    // Handle offline error
    console.log('Request queued for later');
  } else {
    // Handle other errors
    console.error('API error:', error);
  }
}
```

## Best Practices

1. **Use SecureStore for tokens**: Store auth tokens securely in production
2. **Handle offline gracefully**: Show user feedback when requests are queued
3. **Process queue on startup**: Check for queued requests when app starts
4. **Implement conflict UI**: Let users choose resolution strategy for conflicts
5. **Monitor queue size**: Alert users if queue is getting too large
6. **Set appropriate priorities**: Use high priority for time-critical operations

## License

MIT

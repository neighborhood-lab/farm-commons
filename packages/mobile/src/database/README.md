# Farm Commons Mobile Database

Offline-first database implementation using WatermelonDB for the Farm Commons mobile application.

## Overview

This database layer provides local storage for offline-first functionality, allowing the mobile app to work seamlessly without an internet connection. All changes are tracked in a sync queue and synchronized with the server when connectivity is restored.

## Architecture

### Schema (`schema.ts`)

Defines the database structure using WatermelonDB's table schema. The schema mirrors the API types from `@farm-commons/shared` for seamless data synchronization.

**Tables:**
- `users` - User accounts
- `farms` - Farm/organization data
- `workers` - Farm workers
- `fields` - Field/plot information
- `schedules` - Work schedules
- `time_entries` - Time clock records
- `certifications` - Worker certifications
- `sync_queue` - Offline sync tracking

### Models (`models/`)

WatermelonDB model classes for each entity:

- **User** - User account model
- **Farm** - Farm organization model
- **Worker** - Worker model with JSON field parsing
- **Field** - Field model with GPS support
- **Schedule** - Work schedule model
- **TimeEntry** - Time tracking model with computed properties
- **Certification** - Certification model with expiry logic
- **SyncQueue** - Sync queue tracking model

### Sync Service (`sync.ts`)

Manages offline-to-online synchronization:

```typescript
import { queueSync, processSyncQueue, getPendingSyncItems } from './database/sync';

// Queue a change for sync
await queueSync('workers', workerId, 'update', workerData);

// Process the sync queue when online
const synced = await processSyncQueue(async (item) => {
  // Custom sync logic
  await syncToServer(item);
});

// Get pending items
const pending = await getPendingSyncItems();
```

## Usage

### Initialize Database

```typescript
import { database, collections } from './database';

// Database is automatically initialized on import
```

### Create Records

```typescript
import { database, collections } from './database';

await database.write(async () => {
  const worker = await collections.workers.create((worker) => {
    worker.farmId = farmId;
    worker.firstName = 'John';
    worker.lastName = 'Doe';
    worker.phone = '555-0100';
    worker.preferredLanguage = 'en';
    worker.hireDate = new Date();
    worker.status = 'active';
    worker._certificationsJson = JSON.stringify([]);
    worker._skillsJson = JSON.stringify(['Planting', 'Harvesting']);
  });
});
```

### Query Records

```typescript
import { Q } from '@nozbe/watermelondb';
import { collections } from './database';

// Get all active workers
const activeWorkers = await collections.workers
  .query(Q.where('status', 'active'))
  .fetch();

// Get workers by farm
const farmWorkers = await collections.workers
  .query(Q.where('farm_id', farmId))
  .fetch();

// Get schedules for today
const today = new Date();
today.setHours(0, 0, 0, 0);
const todaySchedules = await collections.schedules
  .query(
    Q.where('scheduled_date', Q.gte(today.getTime())),
    Q.sortBy('start_time', Q.asc)
  )
  .fetch();
```

### Update Records

```typescript
import { database } from './database';

await database.write(async () => {
  await worker.update((w) => {
    w.phone = '555-0101';
    w.updatedAt = new Date();
  });
});
```

### Observe Changes

```typescript
// Observe a collection
const subscription = collections.workers
  .query(Q.where('farm_id', farmId))
  .observe()
  .subscribe((workers) => {
    console.log('Workers updated:', workers.length);
  });

// Clean up
subscription.unsubscribe();
```

### Relations

```typescript
// Get worker's time entries
const worker = await collections.workers.find(workerId);
const timeEntries = await worker.timeEntries.fetch();

// Get schedule's worker
const schedule = await collections.schedules.find(scheduleId);
const worker = await schedule.worker.fetch();
```

## Offline Sync

### How It Works

1. **Offline Changes**: All create/update/delete operations are queued in `sync_queue`
2. **Network Detection**: App monitors network connectivity
3. **Auto Sync**: When online, `processSyncQueue()` is called automatically
4. **Retry Logic**: Failed syncs use exponential backoff (max 5 retries)
5. **Conflict Resolution**: Server timestamp wins in conflicts

### Queue Management

```typescript
import { getSyncStats, cleanupOldSyncItems } from './database/sync';

// Get sync statistics
const stats = await getSyncStats();
console.log('Pending:', stats.pending);
console.log('Failed:', stats.failed);
console.log('Completed:', stats.completed);

// Clean up old completed sync items (7+ days)
const cleaned = await cleanupOldSyncItems();
```

## Migrations

Database schema changes are managed through migrations in `migrations.ts`.

**Important Rules:**
- Never modify existing migrations
- Always increment version number
- Test migrations thoroughly
- Provide clear descriptions

Example migration:
```typescript
{
  toVersion: 2,
  steps: [
    addColumns({
      table: 'workers',
      columns: [
        { name: 'badge_number', type: 'string', isOptional: true },
      ],
    }),
  ],
}
```

## Testing

Run database tests:
```bash
cd packages/mobile
npm test src/__tests__/database
```

Test coverage includes:
- Schema validation
- Model logic (JSON parsing, computed properties)
- Sync queue logic
- Integration scenarios

## Performance Tips

1. **Use Indexes**: Frequently queried fields are indexed
2. **Batch Operations**: Use `database.batch()` for multiple operations
3. **Query Optimization**: Use specific queries instead of fetching all records
4. **Observe Wisely**: Unsubscribe from observations when components unmount
5. **Lazy Loading**: Use `lazy` decorator for optional relations

## Debugging

```typescript
import { getDatabaseStats, resetDatabase } from './database';

// Get table counts
const stats = await getDatabaseStats();
console.log(stats);

// Reset database (development only!)
await resetDatabase();
```

## Resources

- [WatermelonDB Documentation](https://nozbe.github.io/WatermelonDB/)
- [React Native Integration](https://nozbe.github.io/WatermelonDB/Installation.html)
- [Performance Best Practices](https://nozbe.github.io/WatermelonDB/Advanced/Performance.html)

import { Q } from '@nozbe/watermelondb';
import { database, collections } from './index';
import SyncQueue, { SyncOperation } from './models/SyncQueue';

/**
 * Sync Service
 *
 * Manages offline-to-online data synchronization using a queue-based approach.
 * When offline, changes are queued and synced when connection is restored.
 */

/**
 * Queue a change for synchronization
 */
export async function queueSync(
  tableName: string,
  recordId: string,
  operation: SyncOperation,
  data: any
): Promise<SyncQueue> {
  return await database.write(async () => {
    return await collections.syncQueue.create((queue) => {
      queue.tableName = tableName;
      queue.recordId = recordId;
      queue.operation = operation;
      queue._dataJson = JSON.stringify(data);
      queue.retryCount = 0;
      queue.synced = false;
    });
  });
}

/**
 * Get all pending sync items
 */
export async function getPendingSyncItems(): Promise<SyncQueue[]> {
  return await collections.syncQueue
    .query(Q.where('synced', false), Q.sortBy('created_at', Q.asc))
    .fetch();
}

/**
 * Mark a sync item as completed
 */
export async function markSyncCompleted(syncItem: SyncQueue): Promise<void> {
  await database.write(async () => {
    await syncItem.update((record) => {
      record.synced = true;
      record.syncedAt = new Date();
    });
  });
}

/**
 * Mark a sync item as failed and increment retry count
 */
export async function markSyncFailed(
  syncItem: SyncQueue,
  error: string
): Promise<void> {
  await database.write(async () => {
    await syncItem.update((record) => {
      record.retryCount = record.retryCount + 1;
      record.lastError = error;
    });
  });
}

/**
 * Get sync queue statistics
 */
export async function getSyncStats() {
  const pending = await collections.syncQueue
    .query(Q.where('synced', false))
    .fetchCount();

  const failed = await collections.syncQueue
    .query(Q.where('synced', false), Q.where('retry_count', Q.gte(5)))
    .fetchCount();

  const completed = await collections.syncQueue
    .query(Q.where('synced', true))
    .fetchCount();

  return {
    pending,
    failed,
    completed,
    total: pending + completed,
  };
}

/**
 * Clear all completed sync items older than 7 days
 */
export async function cleanupOldSyncItems(): Promise<number> {
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

  const oldItems = await collections.syncQueue
    .query(
      Q.where('synced', true),
      Q.where('synced_at', Q.lte(sevenDaysAgo))
    )
    .fetch();

  await database.write(async () => {
    await Promise.all(oldItems.map((item) => item.markAsDeleted()));
  });

  return oldItems.length;
}

/**
 * Process the sync queue
 * This should be called when the app goes online or periodically
 *
 * @param syncHandler - Function that handles syncing a single item to the server
 * @returns Number of items successfully synced
 */
export async function processSyncQueue(
  syncHandler: (item: SyncQueue) => Promise<void>
): Promise<number> {
  const pendingItems = await getPendingSyncItems();
  let successCount = 0;

  for (const item of pendingItems) {
    // Skip items that have exceeded retry limit
    if (!item.shouldRetry) {
      continue;
    }

    try {
      // Call the provided sync handler
      await syncHandler(item);

      // Mark as completed
      await markSyncCompleted(item);
      successCount++;
    } catch (error) {
      // Mark as failed and increment retry count
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      await markSyncFailed(item, errorMessage);

      // If this is a permanent error (e.g., 404, 403), we might want to handle differently
      // For now, we'll just log and continue
      console.warn(
        `Failed to sync ${item.tableName}:${item.recordId}`,
        errorMessage
      );
    }
  }

  return successCount;
}

/**
 * Helper to update a model's sync timestamp
 */
export async function updateSyncTimestamp(
  collection: any,
  recordId: string
): Promise<void> {
  const record = await collection.find(recordId);
  await database.write(async () => {
    await record.update((r: any) => {
      r.syncedAt = new Date();
    });
  });
}

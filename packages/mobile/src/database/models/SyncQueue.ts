import { Model } from '@nozbe/watermelondb';
import { field, date, readonly } from '@nozbe/watermelondb/decorators';

export type SyncOperation = 'create' | 'update' | 'delete';

/**
 * SyncQueue Model
 * Tracks pending changes for offline-to-online synchronization
 */
export default class SyncQueue extends Model {
  static table = 'sync_queue';

  @field('table_name') tableName!: string;
  @field('record_id') recordId!: string;
  @field('operation') operation!: SyncOperation;
  @field('data') _dataJson!: string;
  @field('retry_count') retryCount!: number;
  @field('last_error') lastError?: string;
  @field('synced') synced!: boolean;

  @readonly @date('created_at') createdAt!: Date;
  @date('synced_at') syncedAt?: Date;

  // Parse the JSON data
  get data(): any {
    try {
      return JSON.parse(this._dataJson);
    } catch {
      return null;
    }
  }

  // Helper to check if should retry
  get shouldRetry(): boolean {
    // Max 5 retry attempts
    return !this.synced && this.retryCount < 5;
  }

  // Calculate backoff delay in milliseconds
  get backoffDelay(): number {
    // Exponential backoff: 1s, 2s, 4s, 8s, 16s
    return Math.min(1000 * Math.pow(2, this.retryCount), 16000);
  }
}

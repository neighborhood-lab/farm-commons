import { Model } from '@nozbe/watermelondb';
import { field, date, readonly } from '@nozbe/watermelondb/decorators';

export class Worker extends Model {
  static table = 'workers';

  @field('remote_id') remoteId!: string;
  @field('first_name') firstName!: string;
  @field('last_name') lastName!: string;
  @field('email') email?: string;
  @field('phone') phone?: string;
  @field('role') role!: string;
  @field('farm_id') farmId!: string;
  @date('synced_at') syncedAt?: Date;
  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
}

export class Schedule extends Model {
  static table = 'schedules';

  @field('remote_id') remoteId!: string;
  @field('worker_id') workerId!: string;
  @field('field_id') fieldId!: string;
  @field('farm_id') farmId!: string;
  @field('task_type') taskType!: string;
  @date('start_time') startTime!: Date;
  @date('end_time') endTime!: Date;
  @field('status') status!: string;
  @field('notes') notes?: string;
  @date('synced_at') syncedAt?: Date;
  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
}

export class TimeEntry extends Model {
  static table = 'time_entries';

  @field('remote_id') remoteId!: string;
  @field('worker_id') workerId!: string;
  @field('schedule_id') scheduleId?: string;
  @field('farm_id') farmId!: string;
  @date('clock_in') clockIn!: Date;
  @date('clock_out') clockOut?: Date;
  @field('break_duration_minutes') breakDurationMinutes?: number;
  @field('notes') notes?: string;
  @date('synced_at') syncedAt?: Date;
  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
}

export class Field extends Model {
  static table = 'fields';

  @field('remote_id') remoteId!: string;
  @field('farm_id') farmId!: string;
  @field('name') name!: string;
  @field('size_acres') sizeAcres?: number;
  @field('gps_coordinates') gpsCoordinates?: string;
  @field('current_crop') currentCrop?: string;
  @date('synced_at') syncedAt?: Date;
  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
}

export class SyncQueueItem extends Model {
  static table = 'sync_queue';

  @field('table_name') tableName!: string;
  @field('record_id') recordId!: string;
  @field('action') action!: 'create' | 'update' | 'delete';
  @field('payload') payload!: string; // JSON string
  @field('retry_count') retryCount!: number;
  @field('last_error') lastError?: string;
  @readonly @date('created_at') createdAt!: Date;
}

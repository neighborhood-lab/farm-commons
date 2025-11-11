import { Model, Relation } from '@nozbe/watermelondb';
import { field, date, readonly, relation, immutableRelation } from '@nozbe/watermelondb/decorators';
import type { ScheduleStatus } from '@farm-commons/shared';
import Worker from './Worker';
import Field from './Field';

/**
 * Schedule Model
 * Represents a scheduled work assignment
 */
export default class Schedule extends Model {
  static table = 'schedules';
  static associations = {
    workers: { type: 'belongs_to' as const, key: 'worker_id' },
    fields: { type: 'belongs_to' as const, key: 'field_id' },
  };

  @field('farm_id') farmId!: string;
  @field('worker_id') workerId!: string;
  @field('field_id') fieldId?: string;
  @date('scheduled_date') scheduledDate!: Date;
  @field('start_time') startTime!: string;
  @field('end_time') endTime!: string;
  @field('task_type') taskType!: string;
  @field('task_description') taskDescription?: string;
  @field('status') status!: ScheduleStatus;
  @field('notes') notes?: string;

  @readonly @date('created_at') createdAt!: Date;
  @date('updated_at') updatedAt!: Date;
  @date('synced_at') syncedAt?: Date;

  // Relations
  @immutableRelation('workers', 'worker_id') worker!: Relation<Worker>;
  @relation('fields', 'field_id') field?: Relation<Field>;
}

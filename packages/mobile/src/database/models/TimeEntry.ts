import { Model, Relation } from '@nozbe/watermelondb';
import { field, date, readonly, relation, immutableRelation } from '@nozbe/watermelondb/decorators';
import Worker from './Worker';
import Field from './Field';
import Schedule from './Schedule';

/**
 * TimeEntry Model
 * Represents a worker's time clock in/out record
 */
export default class TimeEntry extends Model {
  static table = 'time_entries';
  static associations = {
    workers: { type: 'belongs_to' as const, key: 'worker_id' },
    fields: { type: 'belongs_to' as const, key: 'field_id' },
    schedules: { type: 'belongs_to' as const, key: 'schedule_id' },
  };

  @field('farm_id') farmId!: string;
  @field('worker_id') workerId!: string;
  @field('schedule_id') scheduleId?: string;
  @date('clock_in') clockIn!: Date;
  @date('clock_out') clockOut?: Date;
  @field('break_minutes') breakMinutes!: number;
  @field('total_hours') totalHours?: number;
  @field('task_type') taskType!: string;
  @field('field_id') fieldId?: string;
  @field('notes') notes?: string;
  @field('verified_by') verifiedBy?: string;
  @date('verified_at') verifiedAt?: Date;

  @readonly @date('created_at') createdAt!: Date;
  @date('updated_at') updatedAt!: Date;
  @date('synced_at') syncedAt?: Date;

  // Relations
  @immutableRelation('workers', 'worker_id') worker!: Relation<Worker>;
  @relation('fields', 'field_id') field?: Relation<Field>;
  @relation('schedules', 'schedule_id') schedule?: Relation<Schedule>;

  // Helper computed property
  get isActive(): boolean {
    return !this.clockOut;
  }

  // Calculate elapsed time in hours
  get elapsedHours(): number {
    if (!this.clockOut) {
      const now = new Date();
      const elapsed = (now.getTime() - this.clockIn.getTime()) / (1000 * 60 * 60);
      return Math.max(0, elapsed - this.breakMinutes / 60);
    }
    return this.totalHours || 0;
  }
}

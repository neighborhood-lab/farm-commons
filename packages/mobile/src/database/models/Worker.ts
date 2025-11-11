import { Model, Query } from '@nozbe/watermelondb';
import { field, date, readonly, children, lazy } from '@nozbe/watermelondb/decorators';
import type { WorkerStatus } from '@farm-commons/shared';

/**
 * Worker Model
 * Represents a farm worker
 */
export default class Worker extends Model {
  static table = 'workers';
  static associations = {
    schedules: { type: 'has_many' as const, foreignKey: 'worker_id' },
    time_entries: { type: 'has_many' as const, foreignKey: 'worker_id' },
    certifications: { type: 'has_many' as const, foreignKey: 'worker_id' },
  };

  @field('farm_id') farmId!: string;
  @field('user_id') userId?: string;
  @field('first_name') firstName!: string;
  @field('last_name') lastName!: string;
  @field('email') email?: string;
  @field('phone') phone!: string;
  @field('preferred_language') preferredLanguage!: string;
  @field('emergency_contact_name') emergencyContactName?: string;
  @field('emergency_contact_phone') emergencyContactPhone?: string;
  @date('hire_date') hireDate!: Date;
  @field('status') status!: WorkerStatus;
  @field('hourly_rate') hourlyRate?: number;
  @field('piece_rate') pieceRate?: number;
  @field('notes') notes?: string;

  // JSON fields stored as strings
  @field('certifications') _certificationsJson!: string;
  @field('skills') _skillsJson!: string;

  // Computed getters for JSON fields
  get certifications(): string[] {
    try {
      return JSON.parse(this._certificationsJson || '[]');
    } catch {
      return [];
    }
  }

  get skills(): string[] {
    try {
      return JSON.parse(this._skillsJson || '[]');
    } catch {
      return [];
    }
  }

  @readonly @date('created_at') createdAt!: Date;
  @date('updated_at') updatedAt!: Date;
  @date('synced_at') syncedAt?: Date;

  // Relations
  @children('schedules') schedules!: Query<any>;
  @children('time_entries') timeEntries!: Query<any>;
  @children('certifications') certificationRecords!: Query<any>;

  // Helper computed property
  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }
}

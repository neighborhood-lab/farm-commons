import { Model, Query } from '@nozbe/watermelondb';
import { field, date, readonly, children } from '@nozbe/watermelondb/decorators';

/**
 * Field Model
 * Represents a farm field/plot
 */
export default class Field extends Model {
  static table = 'fields';
  static associations = {
    schedules: { type: 'has_many' as const, foreignKey: 'field_id' },
    time_entries: { type: 'has_many' as const, foreignKey: 'field_id' },
  };

  @field('farm_id') farmId!: string;
  @field('name') name!: string;
  @field('size_acres') sizeAcres!: number;
  @field('current_crop') currentCrop?: string;
  @field('soil_type') soilType?: string;
  @field('notes') notes?: string;

  // GPS location stored as JSON string
  @field('location_gps') _locationGpsJson?: string;

  get locationGps(): { lat: number; lng: number } | null {
    if (!this._locationGpsJson) return null;
    try {
      return JSON.parse(this._locationGpsJson);
    } catch {
      return null;
    }
  }

  @readonly @date('created_at') createdAt!: Date;
  @date('updated_at') updatedAt!: Date;
  @date('synced_at') syncedAt?: Date;

  // Relations
  @children('schedules') schedules!: Query<any>;
  @children('time_entries') timeEntries!: Query<any>;
}

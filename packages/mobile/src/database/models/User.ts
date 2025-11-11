import { Model } from '@nozbe/watermelondb';
import { field, date, readonly } from '@nozbe/watermelondb/decorators';
import type { UserRole } from '@farm-commons/shared';

/**
 * User Model
 * Represents a user account in the system
 */
export default class User extends Model {
  static table = 'users';

  @field('email') email!: string;
  @field('role') role!: UserRole;
  @field('farm_id') farmId!: string;

  @readonly @date('created_at') createdAt!: Date;
  @date('updated_at') updatedAt!: Date;
  @date('synced_at') syncedAt?: Date;
}

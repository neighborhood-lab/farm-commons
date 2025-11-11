import { Model } from '@nozbe/watermelondb';
import { field, date, readonly } from '@nozbe/watermelondb/decorators';

/**
 * Farm Model
 * Represents a farm/organization
 */
export default class Farm extends Model {
  static table = 'farms';

  @field('name') name!: string;
  @field('location') location!: string;
  @field('size_acres') sizeAcres!: number;
  @field('organic_certified') organicCertified!: boolean;

  @readonly @date('created_at') createdAt!: Date;
  @date('updated_at') updatedAt!: Date;
  @date('synced_at') syncedAt?: Date;
}

import { Model, Relation } from '@nozbe/watermelondb';
import { field, date, readonly, immutableRelation } from '@nozbe/watermelondb/decorators';
import Worker from './Worker';

/**
 * Certification Model
 * Represents a worker's certification/credential
 */
export default class Certification extends Model {
  static table = 'certifications';
  static associations = {
    workers: { type: 'belongs_to' as const, key: 'worker_id' },
  };

  @field('worker_id') workerId!: string;
  @field('name') name!: string;
  @field('issuing_organization') issuingOrganization!: string;
  @date('issue_date') issueDate!: Date;
  @date('expiration_date') expirationDate?: Date;
  @field('document_url') documentUrl?: string;
  @field('verified') verified!: boolean;

  @readonly @date('created_at') createdAt!: Date;
  @date('updated_at') updatedAt!: Date;
  @date('synced_at') syncedAt?: Date;

  // Relations
  @immutableRelation('workers', 'worker_id') worker!: Relation<Worker>;

  // Helper computed properties
  get isExpired(): boolean {
    if (!this.expirationDate) return false;
    return this.expirationDate < new Date();
  }

  get isExpiringSoon(): boolean {
    if (!this.expirationDate) return false;
    const daysUntilExpiry = Math.floor(
      (this.expirationDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    return daysUntilExpiry >= 0 && daysUntilExpiry <= 30;
  }

  get daysUntilExpiry(): number {
    if (!this.expirationDate) return Infinity;
    return Math.floor(
      (this.expirationDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
  }
}

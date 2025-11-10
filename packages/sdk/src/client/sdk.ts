// Main Farm Commons SDK
import { FarmCommonsClient } from './base.js';
import { AuthResource } from '../resources/auth.js';
import { WorkersResource } from '../resources/workers.js';
import { SchedulesResource } from '../resources/schedules.js';
import { TimeEntriesResource } from '../resources/timeEntries.js';
import type { SDKConfig } from '../types/index.js';

/**
 * Farm Commons SDK
 * TypeScript client for interacting with the Farm Commons API
 *
 * @example
 * ```typescript
 * import { FarmCommonsSDK } from '@farm-commons/sdk';
 *
 * const sdk = new FarmCommonsSDK({
 *   baseUrl: 'https://api.farmcommons.com',
 * });
 *
 * // Login
 * await sdk.auth.login({
 *   email: 'user@example.com',
 *   password: 'password123'
 * });
 *
 * // List workers
 * const workers = await sdk.workers.list();
 * ```
 */
export class FarmCommonsSDK {
  private client: FarmCommonsClient;

  // Resource accessors
  public readonly auth: AuthResource;
  public readonly workers: WorkersResource;
  public readonly schedules: SchedulesResource;
  public readonly timeEntries: TimeEntriesResource;

  constructor(config: SDKConfig) {
    this.client = new FarmCommonsClient(config);

    // Initialize resources
    this.auth = new AuthResource(this.client);
    this.workers = new WorkersResource(this.client);
    this.schedules = new SchedulesResource(this.client);
    this.timeEntries = new TimeEntriesResource(this.client);
  }

  /**
   * Set the access token for authenticated requests
   */
  setAccessToken(token: string): void {
    this.client.setAccessToken(token);
  }

  /**
   * Get the current access token
   */
  getAccessToken(): string | null {
    return this.client.getAccessToken();
  }
}

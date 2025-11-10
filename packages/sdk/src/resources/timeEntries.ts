// Time Entries resource
import type { FarmCommonsClient } from '../client/base.js';
import type { TimeEntry, DateRangeParams } from '../types/index.js';

export interface ClockInData {
  worker_id: string;
  task_type: string;
  field_id?: string | null;
  schedule_id?: string | null;
  notes?: string | null;
}

export interface ClockOutData {
  break_minutes?: number;
  notes?: string | null;
}

export interface TimeEntryWithDetails extends TimeEntry {
  worker_first_name?: string;
  worker_last_name?: string;
  field_name?: string;
}

export class TimeEntriesResource {
  constructor(private client: FarmCommonsClient) {}

  /**
   * List all time entries (optionally filtered by date range)
   */
  async list(params?: DateRangeParams): Promise<TimeEntryWithDetails[]> {
    const response = await this.client.get<TimeEntryWithDetails[]>(
      '/api/time-entries',
      params as Record<string, string | number | boolean>
    );

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.error || 'Failed to list time entries');
  }

  /**
   * Get time entries for a specific worker
   */
  async getByWorker(workerId: string): Promise<TimeEntryWithDetails[]> {
    const response = await this.client.get<TimeEntryWithDetails[]>(
      `/api/time-entries/worker/${workerId}`
    );

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.error || 'Failed to get worker time entries');
  }

  /**
   * Clock in a worker
   */
  async clockIn(data: ClockInData): Promise<TimeEntry> {
    const response = await this.client.post<TimeEntry>(
      '/api/time-entries/clock-in',
      data
    );

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.error || 'Failed to clock in');
  }

  /**
   * Clock out a worker
   */
  async clockOut(timeEntryId: string, data?: ClockOutData): Promise<TimeEntry> {
    const response = await this.client.post<TimeEntry>(
      `/api/time-entries/${timeEntryId}/clock-out`,
      data
    );

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.error || 'Failed to clock out');
  }

  /**
   * Verify a time entry (requires manager/admin role)
   */
  async verify(timeEntryId: string): Promise<TimeEntry> {
    const response = await this.client.post<TimeEntry>(
      `/api/time-entries/${timeEntryId}/verify`
    );

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.error || 'Failed to verify time entry');
  }
}

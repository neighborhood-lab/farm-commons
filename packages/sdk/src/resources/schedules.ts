// Schedules resource
import type { FarmCommonsClient } from '../client/base.js';
import type { Schedule, DateRangeParams } from '../types/index.js';

export interface CreateScheduleData {
  worker_id: string;
  field_id?: string | null;
  scheduled_date: string | Date;
  start_time: string;
  end_time: string;
  task_type: string;
  task_description?: string | null;
  notes?: string | null;
}

export interface UpdateScheduleData extends Partial<CreateScheduleData> {
  status?: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
}

export interface ScheduleWithDetails extends Schedule {
  worker_first_name?: string;
  worker_last_name?: string;
  field_name?: string;
}

export class SchedulesResource {
  constructor(private client: FarmCommonsClient) {}

  /**
   * List all schedules (optionally filtered by date range)
   */
  async list(params?: DateRangeParams): Promise<ScheduleWithDetails[]> {
    const response = await this.client.get<ScheduleWithDetails[]>(
      '/api/schedules',
      params as Record<string, string | number | boolean>
    );

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.error || 'Failed to list schedules');
  }

  /**
   * Get schedules for a specific worker
   */
  async getByWorker(workerId: string): Promise<ScheduleWithDetails[]> {
    const response = await this.client.get<ScheduleWithDetails[]>(
      `/api/schedules/worker/${workerId}`
    );

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.error || 'Failed to get worker schedules');
  }

  /**
   * Create a new schedule
   */
  async create(data: CreateScheduleData): Promise<Schedule> {
    const response = await this.client.post<Schedule>(
      '/api/schedules',
      data
    );

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.error || 'Failed to create schedule');
  }

  /**
   * Update an existing schedule
   */
  async update(scheduleId: string, data: UpdateScheduleData): Promise<Schedule> {
    const response = await this.client.put<Schedule>(
      `/api/schedules/${scheduleId}`,
      data
    );

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.error || 'Failed to update schedule');
  }

  /**
   * Delete a schedule
   */
  async delete(scheduleId: string): Promise<void> {
    const response = await this.client.delete<void>(
      `/api/schedules/${scheduleId}`
    );

    if (!response.success) {
      throw new Error(response.error || 'Failed to delete schedule');
    }
  }
}

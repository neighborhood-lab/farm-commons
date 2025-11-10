// Workers resource
import type { FarmCommonsClient } from '../client/base.js';
import type { Worker, PaginatedResponse, PaginationParams } from '../types/index.js';

export interface CreateWorkerData {
  first_name: string;
  last_name: string;
  email?: string | null;
  phone: string;
  preferred_language?: string;
  emergency_contact_name?: string | null;
  emergency_contact_phone?: string | null;
  hire_date: string | Date;
  status?: 'active' | 'inactive' | 'seasonal';
  hourly_rate?: number | null;
  piece_rate?: number | null;
  certifications?: string[];
  skills?: string[];
  notes?: string | null;
}

export type UpdateWorkerData = Partial<CreateWorkerData>;

export class WorkersResource {
  constructor(private client: FarmCommonsClient) {}

  /**
   * List all workers for the farm (paginated)
   */
  async list(params?: PaginationParams): Promise<PaginatedResponse<Worker>> {
    const response = await this.client.get<PaginatedResponse<Worker>>(
      '/api/workers',
      params as Record<string, string | number | boolean>
    );

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.error || 'Failed to list workers');
  }

  /**
   * Get a single worker by ID
   */
  async get(workerId: string): Promise<Worker> {
    const response = await this.client.get<Worker>(
      `/api/workers/${workerId}`
    );

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.error || 'Failed to get worker');
  }

  /**
   * Create a new worker
   */
  async create(data: CreateWorkerData): Promise<Worker> {
    const response = await this.client.post<Worker>(
      '/api/workers',
      data
    );

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.error || 'Failed to create worker');
  }

  /**
   * Update an existing worker
   */
  async update(workerId: string, data: UpdateWorkerData): Promise<Worker> {
    const response = await this.client.put<Worker>(
      `/api/workers/${workerId}`,
      data
    );

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.error || 'Failed to update worker');
  }

  /**
   * Delete a worker
   */
  async delete(workerId: string): Promise<void> {
    const response = await this.client.delete<void>(
      `/api/workers/${workerId}`
    );

    if (!response.success) {
      throw new Error(response.error || 'Failed to delete worker');
    }
  }
}

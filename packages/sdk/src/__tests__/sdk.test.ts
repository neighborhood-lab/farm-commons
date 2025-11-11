/**
 * Integration tests for Farm Commons SDK
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FarmCommonsSDK } from '../client/sdk.js';
import type { Worker, Schedule, TimeEntry } from '../types/index.js';

// Mock fetch for testing
global.fetch = vi.fn();

function createMockResponse<T>(data: T, status = 200) {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve({ success: true, data }),
  } as Response);
}

function createMockErrorResponse(error: string, status = 400) {
  return Promise.resolve({
    ok: false,
    status,
    json: () => Promise.resolve({ success: false, error }),
  } as Response);
}

describe('FarmCommonsSDK', () => {
  let sdk: FarmCommonsSDK;

  beforeEach(() => {
    vi.clearAllMocks();
    sdk = new FarmCommonsSDK({
      baseUrl: 'http://localhost:3000',
    });
  });

  describe('Authentication', () => {
    it('should login successfully', async () => {
      const mockResponse = {
        user: {
          id: 'user-123',
          email: 'test@example.com',
          role: 'manager' as const,
          farm_id: 'farm-123',
        },
        access_token: 'test-token',
        expires_in: 604800,
      };

      (global.fetch as any).mockReturnValue(createMockResponse(mockResponse));

      const result = await sdk.auth.login({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(result).toEqual(mockResponse);
      expect(sdk.getAccessToken()).toBe('test-token');
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/auth/login',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            email: 'test@example.com',
            password: 'password123',
          }),
        })
      );
    });

    it('should handle login failure', async () => {
      (global.fetch as any).mockReturnValue(
        createMockErrorResponse('Invalid credentials', 401)
      );

      await expect(
        sdk.auth.login({
          email: 'test@example.com',
          password: 'wrong',
        })
      ).rejects.toThrow();
    });

    it('should register successfully', async () => {
      const mockResponse = {
        user: {
          id: 'user-123',
          email: 'new@example.com',
          role: 'manager' as const,
          farm_id: 'farm-123',
        },
        access_token: 'test-token',
        expires_in: 604800,
      };

      (global.fetch as any).mockReturnValue(createMockResponse(mockResponse));

      const result = await sdk.auth.register({
        email: 'new@example.com',
        password: 'password123',
        role: 'manager',
        farm_id: 'farm-123',
      });

      expect(result).toEqual(mockResponse);
      expect(sdk.getAccessToken()).toBe('test-token');
    });

    it('should logout', () => {
      sdk.setAccessToken('test-token');
      expect(sdk.getAccessToken()).toBe('test-token');

      sdk.auth.logout();
      expect(sdk.getAccessToken()).toBe('');
    });
  });

  describe('Workers', () => {
    beforeEach(() => {
      sdk.setAccessToken('test-token');
    });

    it('should list workers with pagination', async () => {
      const mockResponse = {
        data: [
          { id: 'w1', first_name: 'John', last_name: 'Doe' },
          { id: 'w2', first_name: 'Jane', last_name: 'Smith' },
        ] as Worker[],
        total: 50,
        page: 1,
        per_page: 20,
        total_pages: 3,
      };

      (global.fetch as any).mockReturnValue(createMockResponse(mockResponse));

      const result = await sdk.workers.list({ page: 1, per_page: 20 });

      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/workers?page=1&per_page=20',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            Authorization: 'Bearer test-token',
          }),
        })
      );
    });

    it('should get a single worker', async () => {
      const mockWorker: Worker = {
        id: 'worker-123',
        farm_id: 'farm-123',
        user_id: null,
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        phone: '+1-555-0123',
        preferred_language: 'en',
        emergency_contact_name: null,
        emergency_contact_phone: null,
        hire_date: new Date('2025-01-01'),
        status: 'active',
        hourly_rate: 18.5,
        piece_rate: null,
        certifications: [],
        skills: ['harvesting'],
        notes: null,
        created_at: new Date(),
        updated_at: new Date(),
      };

      (global.fetch as any).mockReturnValue(createMockResponse(mockWorker));

      const result = await sdk.workers.get('worker-123');

      expect(result).toEqual(mockWorker);
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/workers/worker-123',
        expect.any(Object)
      );
    });

    it('should create a worker', async () => {
      const newWorkerData = {
        first_name: 'John',
        last_name: 'Doe',
        phone: '+1-555-0123',
        hire_date: new Date('2025-01-01'),
      };

      const mockWorker: Worker = {
        id: 'worker-123',
        farm_id: 'farm-123',
        user_id: null,
        ...newWorkerData,
        email: null,
        preferred_language: 'en',
        emergency_contact_name: null,
        emergency_contact_phone: null,
        status: 'active',
        hourly_rate: null,
        piece_rate: null,
        certifications: [],
        skills: [],
        notes: null,
        created_at: new Date(),
        updated_at: new Date(),
      };

      (global.fetch as any).mockReturnValue(createMockResponse(mockWorker, 201));

      const result = await sdk.workers.create(newWorkerData);

      expect(result).toEqual(mockWorker);
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/workers',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(newWorkerData),
        })
      );
    });

    it('should update a worker', async () => {
      const updateData = { hourly_rate: 19.5 };
      const mockWorker = { id: 'worker-123', ...updateData } as Worker;

      (global.fetch as any).mockReturnValue(createMockResponse(mockWorker));

      const result = await sdk.workers.update('worker-123', updateData);

      expect(result).toEqual(mockWorker);
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/workers/worker-123',
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify(updateData),
        })
      );
    });

    it('should delete a worker', async () => {
      (global.fetch as any).mockReturnValue(
        createMockResponse({ message: 'Deleted' })
      );

      await sdk.workers.delete('worker-123');

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/workers/worker-123',
        expect.objectContaining({
          method: 'DELETE',
        })
      );
    });
  });

  describe('Schedules', () => {
    beforeEach(() => {
      sdk.setAccessToken('test-token');
    });

    it('should list schedules', async () => {
      const mockSchedules: Schedule[] = [
        {
          id: 's1',
          farm_id: 'farm-123',
          worker_id: 'w1',
          field_id: 'f1',
          scheduled_date: new Date(),
          start_time: '08:00',
          end_time: '16:00',
          task_type: 'Harvesting',
          task_description: null,
          status: 'scheduled',
          notes: null,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      (global.fetch as any).mockReturnValue(createMockResponse(mockSchedules));

      const result = await sdk.schedules.list();

      expect(result).toEqual(mockSchedules);
    });

    it('should list schedules with date range', async () => {
      const mockSchedules: Schedule[] = [];

      (global.fetch as any).mockReturnValue(createMockResponse(mockSchedules));

      await sdk.schedules.list({
        start_date: '2025-01-01',
        end_date: '2025-01-31',
      });

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/schedules?start_date=2025-01-01&end_date=2025-01-31',
        expect.any(Object)
      );
    });

    it('should get schedules by worker', async () => {
      const mockSchedules: Schedule[] = [];

      (global.fetch as any).mockReturnValue(createMockResponse(mockSchedules));

      const result = await sdk.schedules.getByWorker('worker-123');

      expect(result).toEqual(mockSchedules);
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/schedules/worker/worker-123',
        expect.any(Object)
      );
    });

    it('should create a schedule', async () => {
      const scheduleData = {
        worker_id: 'worker-123',
        scheduled_date: new Date('2025-11-15'),
        start_time: '08:00',
        end_time: '16:00',
        task_type: 'Harvesting',
      };

      const mockSchedule: Schedule = {
        id: 'schedule-123',
        farm_id: 'farm-123',
        field_id: null,
        task_description: null,
        status: 'scheduled',
        notes: null,
        created_at: new Date(),
        updated_at: new Date(),
        ...scheduleData,
      };

      (global.fetch as any).mockReturnValue(createMockResponse(mockSchedule, 201));

      const result = await sdk.schedules.create(scheduleData);

      expect(result).toEqual(mockSchedule);
    });
  });

  describe('Time Entries', () => {
    beforeEach(() => {
      sdk.setAccessToken('test-token');
    });

    it('should clock in a worker', async () => {
      const clockInData = {
        worker_id: 'worker-123',
        task_type: 'Harvesting',
        field_id: 'field-123',
      };

      const mockEntry: TimeEntry = {
        id: 'entry-123',
        farm_id: 'farm-123',
        worker_id: 'worker-123',
        schedule_id: null,
        clock_in: new Date(),
        clock_out: null,
        break_minutes: 0,
        total_hours: null,
        task_type: 'Harvesting',
        field_id: 'field-123',
        notes: null,
        verified_by: null,
        verified_at: null,
        created_at: new Date(),
        updated_at: new Date(),
      };

      (global.fetch as any).mockReturnValue(createMockResponse(mockEntry, 201));

      const result = await sdk.timeEntries.clockIn(clockInData);

      expect(result).toEqual(mockEntry);
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/time-entries/clock-in',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(clockInData),
        })
      );
    });

    it('should clock out a worker', async () => {
      const clockOutData = {
        break_minutes: 30,
        notes: 'Completed harvesting',
      };

      const mockEntry: TimeEntry = {
        id: 'entry-123',
        farm_id: 'farm-123',
        worker_id: 'worker-123',
        schedule_id: null,
        clock_in: new Date(),
        clock_out: new Date(),
        break_minutes: 30,
        total_hours: 7.5,
        task_type: 'Harvesting',
        field_id: null,
        notes: 'Completed harvesting',
        verified_by: null,
        verified_at: null,
        created_at: new Date(),
        updated_at: new Date(),
      };

      (global.fetch as any).mockReturnValue(createMockResponse(mockEntry));

      const result = await sdk.timeEntries.clockOut('entry-123', clockOutData);

      expect(result).toEqual(mockEntry);
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/time-entries/entry-123/clock-out',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(clockOutData),
        })
      );
    });

    it('should verify a time entry', async () => {
      const mockEntry: TimeEntry = {
        id: 'entry-123',
        farm_id: 'farm-123',
        worker_id: 'worker-123',
        schedule_id: null,
        clock_in: new Date(),
        clock_out: new Date(),
        break_minutes: 30,
        total_hours: 7.5,
        task_type: 'Harvesting',
        field_id: null,
        notes: null,
        verified_by: 'manager-123',
        verified_at: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
      };

      (global.fetch as any).mockReturnValue(createMockResponse(mockEntry));

      const result = await sdk.timeEntries.verify('entry-123');

      expect(result).toEqual(mockEntry);
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/time-entries/entry-123/verify',
        expect.objectContaining({
          method: 'POST',
        })
      );
    });

    it('should list time entries by worker', async () => {
      const mockEntries: TimeEntry[] = [];

      (global.fetch as any).mockReturnValue(createMockResponse(mockEntries));

      const result = await sdk.timeEntries.getByWorker('worker-123');

      expect(result).toEqual(mockEntries);
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/time-entries/worker/worker-123',
        expect.any(Object)
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle 404 errors', async () => {
      sdk.setAccessToken('test-token');

      (global.fetch as any).mockReturnValue(
        createMockErrorResponse('Worker not found', 404)
      );

      await expect(sdk.workers.get('invalid-id')).rejects.toThrow();
    });

    it('should handle network timeouts', async () => {
      const timeoutSDK = new FarmCommonsSDK({
        baseUrl: 'http://localhost:3000',
        timeout: 100,
      });

      (global.fetch as any).mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => resolve(createMockResponse({})), 200);
          })
      );

      await expect(
        timeoutSDK.auth.login({
          email: 'test@example.com',
          password: 'password',
        })
      ).rejects.toThrow();
    });
  });

  describe('Token Management', () => {
    it('should set and get access token', () => {
      expect(sdk.getAccessToken()).toBeNull();

      sdk.setAccessToken('test-token');
      expect(sdk.getAccessToken()).toBe('test-token');
    });

    it('should call onTokenRefresh callback', () => {
      const callback = vi.fn();
      const sdkWithCallback = new FarmCommonsSDK({
        baseUrl: 'http://localhost:3000',
        onTokenRefresh: callback,
      });

      sdkWithCallback.setAccessToken('new-token');

      expect(callback).toHaveBeenCalledWith('new-token');
    });

    it('should include Authorization header when token is set', async () => {
      sdk.setAccessToken('test-token');

      (global.fetch as any).mockReturnValue(
        createMockResponse({ data: [], total: 0, page: 1, per_page: 20, total_pages: 0 })
      );

      await sdk.workers.list();

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer test-token',
          }),
        })
      );
    });
  });
});

/**
 * Mobile API Client Tests
 *
 * Tests for offline support, retry logic, and sync conflict resolution
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { FarmCommonsApiClient, SyncConflictError } from '../lib/api';
import { InMemoryStorageAdapter } from '../lib/storage';
import type { AuthTokens, Worker } from '@farm-commons/shared';

// Mock fetch globally
global.fetch = vi.fn();

// Mock window for network status
global.window = {
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
} as any;

global.navigator = {
  onLine: true,
} as any;

describe('FarmCommonsApiClient', () => {
  let client: FarmCommonsApiClient;
  let storage: InMemoryStorageAdapter;

  beforeEach(() => {
    vi.clearAllMocks();
    storage = new InMemoryStorageAdapter();
    client = new FarmCommonsApiClient(
      {
        baseUrl: 'http://localhost:3000',
        timeout: 5000,
        maxRetries: 3,
        retryDelay: 100,
      },
      storage
    );

    // Reset navigator.onLine
    (global.navigator as any).onLine = true;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ========================================================================
  // Authentication Tests
  // ========================================================================

  describe('Authentication', () => {
    it('should login successfully and store tokens', async () => {
      const mockTokens: AuthTokens = {
        access_token: 'test-token',
        refresh_token: 'refresh-token',
        expires_in: 3600,
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ success: true, data: mockTokens }),
      });

      const tokens = await client.login({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(tokens).toEqual(mockTokens);
      expect(client.isAuthenticated()).toBe(true);

      // Verify tokens are stored
      const storedTokens = await storage.getItem('auth_tokens');
      expect(JSON.parse(storedTokens!)).toEqual(mockTokens);
    });

    it('should logout and clear tokens', async () => {
      // First login
      const mockTokens: AuthTokens = {
        access_token: 'test-token',
        refresh_token: 'refresh-token',
        expires_in: 3600,
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ success: true, data: mockTokens }),
      });

      await client.login({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(client.isAuthenticated()).toBe(true);

      // Then logout
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ success: true }),
      });

      await client.logout();

      expect(client.isAuthenticated()).toBe(false);

      // Verify tokens are cleared
      const storedTokens = await storage.getItem('auth_tokens');
      expect(storedTokens).toBeNull();
    });

    it('should refresh token on 401 response', async () => {
      // Setup initial tokens
      const mockTokens: AuthTokens = {
        access_token: 'old-token',
        refresh_token: 'refresh-token',
        expires_in: 3600,
      };

      await storage.setItem('auth_tokens', JSON.stringify(mockTokens));

      // Reload client to pick up tokens
      client = new FarmCommonsApiClient(
        { baseUrl: 'http://localhost:3000' },
        storage
      );

      // Wait for tokens to load
      await new Promise(resolve => setTimeout(resolve, 10));

      const newTokens: AuthTokens = {
        access_token: 'new-token',
        refresh_token: 'new-refresh-token',
        expires_in: 3600,
      };

      // First call returns 401
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: 'Unauthorized' }),
      });

      // Refresh token call succeeds
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ success: true, data: newTokens }),
      });

      // Retry original request succeeds
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ success: true, data: [] }),
      });

      const workers = await client.getWorkers();

      expect(workers).toEqual([]);
      expect(global.fetch).toHaveBeenCalledTimes(3);
    });
  });

  // ========================================================================
  // Offline Mode & Request Queue Tests
  // ========================================================================

  describe('Offline Mode & Request Queue', () => {
    it('should queue requests when offline', async () => {
      // Simulate offline
      (global.navigator as any).onLine = false;

      try {
        await client.createWorker({
          first_name: 'John',
          last_name: 'Doe',
          phone: '555-1234',
        } as any);

        // Should not reach here
        expect(true).toBe(false);
      } catch (error: any) {
        expect(error.message).toContain('Offline: Request queued');
      }

      const queuedRequests = client.getQueuedRequests();
      expect(queuedRequests.length).toBe(1);
      expect(queuedRequests[0].method).toBe('POST');
      expect(queuedRequests[0].url).toBe('/api/workers');
    });

    it('should process queued requests when back online', async () => {
      // Simulate offline and queue a request
      (global.navigator as any).onLine = false;

      try {
        await client.createWorker({
          first_name: 'John',
          last_name: 'Doe',
        } as any);
      } catch (error) {
        // Expected
      }

      expect(client.getQueuedRequests().length).toBe(1);

      // Simulate coming back online
      (global.navigator as any).onLine = true;

      // Mock successful processing
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ success: true, data: { id: '1' } }),
      });

      await client.processQueue();

      expect(client.getQueuedRequests().length).toBe(0);
    });

    it('should respect request priority in queue', async () => {
      (global.navigator as any).onLine = false;

      // Add requests with different priorities
      try {
        await client.createSchedule({} as any, 'low');
      } catch (error) {}

      try {
        await client.clockIn({} as any);
      } catch (error) {}

      try {
        await client.createWorker({} as any);
      } catch (error) {}

      const queue = client.getQueuedRequests();
      expect(queue.length).toBe(3);

      // High priority (clockIn) should be first
      expect(queue[0].priority).toBe('high');
    });
  });

  // ========================================================================
  // Retry Logic Tests
  // ========================================================================

  describe('Retry Logic', () => {
    it('should retry failed requests with exponential backoff', async () => {
      let attemptCount = 0;

      (global.fetch as any).mockImplementation(() => {
        attemptCount++;
        if (attemptCount < 3) {
          return Promise.reject(new Error('Network error'));
        }
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ success: true, data: [] }),
        });
      });

      const workers = await client.getWorkers();

      expect(workers).toEqual([]);
      expect(attemptCount).toBe(3);
    });

    it('should fail after max retries', async () => {
      (global.fetch as any).mockRejectedValue(new Error('Network error'));

      await expect(client.getWorkers()).rejects.toThrow('Network error');

      // Should have tried maxRetries + 1 times (initial + 3 retries = 4)
      expect(global.fetch).toHaveBeenCalledTimes(4);
    });

    it('should retry on timeout', async () => {
      let attemptCount = 0;

      (global.fetch as any).mockImplementation(() => {
        attemptCount++;
        if (attemptCount < 2) {
          const error = new Error('Timeout');
          error.name = 'AbortError';
          return Promise.reject(error);
        }
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ success: true, data: [] }),
        });
      });

      const workers = await client.getWorkers();

      expect(workers).toEqual([]);
      expect(attemptCount).toBe(2);
    });
  });

  // ========================================================================
  // Sync Conflict Resolution Tests
  // ========================================================================

  describe('Sync Conflict Resolution', () => {
    it('should handle sync conflicts with server strategy', async () => {
      const localVersion: Worker = {
        id: '1',
        first_name: 'John',
        last_name: 'Doe Local',
      } as any;

      const serverVersion: Worker = {
        id: '1',
        first_name: 'John',
        last_name: 'Doe Server',
      } as any;

      const conflict = {
        localVersion,
        serverVersion,
        timestamp: Date.now(),
      };

      const resolved = await client.resolveConflict(conflict, 'server');

      expect(resolved).toEqual(serverVersion);
    });

    it('should handle sync conflicts with local strategy', async () => {
      const localVersion: Worker = {
        id: '1',
        first_name: 'John',
        last_name: 'Doe Local',
      } as any;

      const serverVersion: Worker = {
        id: '1',
        first_name: 'John',
        last_name: 'Doe Server',
      } as any;

      const conflict = {
        localVersion,
        serverVersion,
        timestamp: Date.now(),
      };

      const resolved = await client.resolveConflict(conflict, 'local');

      expect(resolved).toEqual(localVersion);
    });

    it('should handle sync conflicts with merge strategy', async () => {
      const localVersion = {
        id: '1',
        first_name: 'John',
        last_name: 'Doe Local',
        phone: '555-1234',
      } as any;

      const serverVersion = {
        id: '1',
        first_name: 'John',
        last_name: 'Doe Server',
        email: 'john@example.com',
      } as any;

      const conflict = {
        localVersion,
        serverVersion,
        timestamp: Date.now(),
      };

      const resolved = await client.resolveConflict(conflict, 'merge');

      // Merge should contain both properties
      expect(resolved.last_name).toBe('Doe Server'); // Server takes precedence
      expect(resolved.email).toBe('john@example.com');
    });

    it('should throw error for manual strategy', async () => {
      const conflict = {
        localVersion: {} as any,
        serverVersion: {} as any,
        timestamp: Date.now(),
      };

      await expect(
        client.resolveConflict(conflict, 'manual')
      ).rejects.toThrow('Manual conflict resolution required');
    });

    it('should detect and throw SyncConflictError on 409 response', async () => {
      const conflictData = {
        localVersion: { id: '1', name: 'Local' },
        serverVersion: { id: '1', name: 'Server' },
        timestamp: Date.now(),
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 409,
        json: async () => conflictData,
      });

      await expect(client.createWorker({} as any)).rejects.toThrow(
        SyncConflictError
      );
    });
  });

  // ========================================================================
  // API Resource Tests
  // ========================================================================

  describe('API Resources', () => {
    beforeEach(async () => {
      // Login before each test
      const mockTokens: AuthTokens = {
        access_token: 'test-token',
        expires_in: 3600,
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ success: true, data: mockTokens }),
      });

      await client.login({
        email: 'test@example.com',
        password: 'password',
      });

      vi.clearAllMocks();
    });

    it('should fetch workers', async () => {
      const mockWorkers: Worker[] = [
        { id: '1', first_name: 'John', last_name: 'Doe' } as any,
      ];

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ success: true, data: mockWorkers }),
      });

      const workers = await client.getWorkers();

      expect(workers).toEqual(mockWorkers);
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/workers',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            Authorization: 'Bearer test-token',
          }),
        })
      );
    });

    it('should create worker', async () => {
      const newWorker = {
        first_name: 'Jane',
        last_name: 'Smith',
      } as any;

      const createdWorker = {
        id: '2',
        ...newWorker,
      } as any;

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ success: true, data: createdWorker }),
      });

      const result = await client.createWorker(newWorker);

      expect(result).toEqual(createdWorker);
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/workers',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(newWorker),
        })
      );
    });

    it('should clock in worker', async () => {
      const clockInData = {
        worker_id: '1',
        task_type: 'Harvesting',
      } as any;

      const timeEntry = {
        id: 'te-1',
        ...clockInData,
        clock_in: new Date(),
      } as any;

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ success: true, data: timeEntry }),
      });

      const result = await client.clockIn(clockInData);

      expect(result).toEqual(timeEntry);
    });

    it('should fetch schedules with query params', async () => {
      const mockSchedules = [
        { id: 's1', worker_id: 'w1' } as any,
      ];

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ success: true, data: mockSchedules }),
      });

      const result = await client.getSchedules({
        workerId: 'w1',
        date: '2025-11-10',
      });

      expect(result).toEqual(mockSchedules);
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/schedules?workerId=w1&date=2025-11-10',
        expect.any(Object)
      );
    });
  });

  // ========================================================================
  // Network Status Tests
  // ========================================================================

  describe('Network Status', () => {
    it('should detect online status', () => {
      (global.navigator as any).onLine = true;
      expect(client.isOnline).toBe(true);
    });

    it('should detect offline status', () => {
      (global.navigator as any).onLine = false;

      // Create new client to pick up offline status
      const offlineClient = new FarmCommonsApiClient(
        { baseUrl: 'http://localhost:3000' },
        storage
      );

      expect(offlineClient.isOnline).toBe(false);
    });
  });
});

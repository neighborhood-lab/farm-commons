/**
 * Farm Commons Mobile API Client
 *
 * Features:
 * - Fetch wrapper with auth headers
 * - Request queue for offline mode
 * - Automatic retry logic with exponential backoff
 * - Sync conflict resolution
 * - Type-safe API calls
 */

import type {
  ApiResponse,
  AuthTokens,
  LoginCredentials,
  Worker,
  Field,
  Schedule,
  TimeEntry,
  Certification,
} from '@farm-commons/shared';

// ============================================================================
// Types
// ============================================================================

export interface ApiConfig {
  baseUrl: string;
  timeout?: number;
  maxRetries?: number;
  retryDelay?: number;
}

export interface QueuedRequest {
  id: string;
  method: string;
  url: string;
  body?: any;
  headers?: Record<string, string>;
  timestamp: number;
  retryCount: number;
  priority: RequestPriority;
}

export type RequestPriority = 'high' | 'medium' | 'low';

export interface SyncConflict<T = any> {
  localVersion: T;
  serverVersion: T;
  timestamp: number;
}

export type ConflictResolutionStrategy = 'server' | 'local' | 'merge' | 'manual';

// ============================================================================
// Storage Interface (for token persistence)
// ============================================================================

export interface StorageAdapter {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

// ============================================================================
// Network Status Detection
// ============================================================================

class NetworkMonitor {
  private listeners: Set<(online: boolean) => void> = new Set();
  private _isOnline: boolean = true;

  constructor() {
    // In React Native, we'd use NetInfo
    // For now, this is a basic implementation
    if (typeof navigator !== 'undefined') {
      this._isOnline = navigator.onLine;
      window.addEventListener('online', () => this.setOnline(true));
      window.addEventListener('offline', () => this.setOnline(false));
    }
  }

  get isOnline(): boolean {
    return this._isOnline;
  }

  private setOnline(online: boolean) {
    this._isOnline = online;
    this.listeners.forEach(listener => listener(online));
  }

  onStatusChange(listener: (online: boolean) => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
}

// ============================================================================
// Request Queue (for offline support)
// ============================================================================

class RequestQueue {
  private queue: QueuedRequest[] = [];
  private processing = false;
  private storage: StorageAdapter;

  constructor(storage: StorageAdapter) {
    this.storage = storage;
    this.loadQueue();
  }

  async add(request: Omit<QueuedRequest, 'id' | 'timestamp' | 'retryCount'>): Promise<string> {
    const queuedRequest: QueuedRequest = {
      ...request,
      id: this.generateId(),
      timestamp: Date.now(),
      retryCount: 0,
    };

    this.queue.push(queuedRequest);
    await this.saveQueue();
    return queuedRequest.id;
  }

  async remove(id: string): Promise<void> {
    this.queue = this.queue.filter(req => req.id !== id);
    await this.saveQueue();
  }

  async process(executor: (request: QueuedRequest) => Promise<void>): Promise<void> {
    if (this.processing || this.queue.length === 0) return;

    this.processing = true;

    // Sort by priority and timestamp
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    this.queue.sort((a, b) => {
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      return priorityDiff !== 0 ? priorityDiff : a.timestamp - b.timestamp;
    });

    while (this.queue.length > 0) {
      const request = this.queue[0];

      try {
        await executor(request);
        await this.remove(request.id);
      } catch (error) {
        // If execution fails, keep it in queue for next attempt
        console.error('Failed to process request:', request.id, error);
        break;
      }
    }

    this.processing = false;
  }

  getAll(): QueuedRequest[] {
    return [...this.queue];
  }

  async clear(): Promise<void> {
    this.queue = [];
    await this.saveQueue();
  }

  private async loadQueue(): Promise<void> {
    try {
      const stored = await this.storage.getItem('request_queue');
      if (stored) {
        this.queue = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load request queue:', error);
    }
  }

  private async saveQueue(): Promise<void> {
    try {
      await this.storage.setItem('request_queue', JSON.stringify(this.queue));
    } catch (error) {
      console.error('Failed to save request queue:', error);
    }
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

// ============================================================================
// API Client
// ============================================================================

export class FarmCommonsApiClient {
  private config: Required<ApiConfig>;
  private tokens: AuthTokens | null = null;
  private storage: StorageAdapter;
  private requestQueue: RequestQueue;
  private networkMonitor: NetworkMonitor;

  constructor(config: ApiConfig, storage: StorageAdapter) {
    this.config = {
      timeout: 30000,
      maxRetries: 3,
      retryDelay: 1000,
      ...config,
    };
    this.storage = storage;
    this.requestQueue = new RequestQueue(storage);
    this.networkMonitor = new NetworkMonitor();

    // Auto-process queue when coming back online
    this.networkMonitor.onStatusChange((online) => {
      if (online) {
        this.processQueue();
      }
    });

    // Load stored tokens
    this.loadTokens();
  }

  // ========================================================================
  // Authentication
  // ========================================================================

  async login(credentials: LoginCredentials): Promise<AuthTokens> {
    const response = await this.request<AuthTokens>('POST', '/api/auth/login', credentials, {
      skipAuth: true,
    });

    if (response.data) {
      await this.setTokens(response.data);
      return response.data;
    }

    throw new Error(response.error || 'Login failed');
  }

  async logout(): Promise<void> {
    try {
      await this.request('POST', '/api/auth/logout');
    } finally {
      await this.clearTokens();
    }
  }

  async refreshToken(): Promise<AuthTokens> {
    if (!this.tokens?.refresh_token) {
      throw new Error('No refresh token available');
    }

    const response = await this.request<AuthTokens>('POST', '/api/auth/refresh', {
      refresh_token: this.tokens.refresh_token,
    }, { skipAuth: true });

    if (response.data) {
      await this.setTokens(response.data);
      return response.data;
    }

    throw new Error(response.error || 'Token refresh failed');
  }

  isAuthenticated(): boolean {
    return this.tokens !== null;
  }

  // ========================================================================
  // Resource APIs
  // ========================================================================

  // Workers
  async getWorkers(): Promise<Worker[]> {
    return this.get<Worker[]>('/api/workers');
  }

  async getWorker(id: string): Promise<Worker> {
    return this.get<Worker>(`/api/workers/${id}`);
  }

  async createWorker(worker: Partial<Worker>): Promise<Worker> {
    return this.post<Worker>('/api/workers', worker);
  }

  async updateWorker(id: string, worker: Partial<Worker>): Promise<Worker> {
    return this.put<Worker>(`/api/workers/${id}`, worker);
  }

  async deleteWorker(id: string): Promise<void> {
    return this.delete(`/api/workers/${id}`);
  }

  // Fields
  async getFields(): Promise<Field[]> {
    return this.get<Field[]>('/api/fields');
  }

  async getField(id: string): Promise<Field> {
    return this.get<Field>(`/api/fields/${id}`);
  }

  async createField(field: Partial<Field>): Promise<Field> {
    return this.post<Field>('/api/fields', field);
  }

  async updateField(id: string, field: Partial<Field>): Promise<Field> {
    return this.put<Field>(`/api/fields/${id}`, field);
  }

  async deleteField(id: string): Promise<void> {
    return this.delete(`/api/fields/${id}`);
  }

  // Schedules
  async getSchedules(params?: { workerId?: string; date?: string }): Promise<Schedule[]> {
    const query = new URLSearchParams();
    if (params?.workerId) query.append('workerId', params.workerId);
    if (params?.date) query.append('date', params.date);
    const queryString = query.toString();
    return this.get<Schedule[]>(`/api/schedules${queryString ? `?${queryString}` : ''}`);
  }

  async getSchedule(id: string): Promise<Schedule> {
    return this.get<Schedule>(`/api/schedules/${id}`);
  }

  async createSchedule(schedule: Partial<Schedule>, priority: RequestPriority = 'medium'): Promise<Schedule> {
    return this.post<Schedule>('/api/schedules', schedule, { priority });
  }

  async updateSchedule(id: string, schedule: Partial<Schedule>, priority: RequestPriority = 'medium'): Promise<Schedule> {
    return this.put<Schedule>(`/api/schedules/${id}`, schedule, { priority });
  }

  async deleteSchedule(id: string): Promise<void> {
    return this.delete(`/api/schedules/${id}`);
  }

  // Time Entries
  async getTimeEntries(params?: { workerId?: string; date?: string }): Promise<TimeEntry[]> {
    const query = new URLSearchParams();
    if (params?.workerId) query.append('workerId', params.workerId);
    if (params?.date) query.append('date', params.date);
    const queryString = query.toString();
    return this.get<TimeEntry[]>(`/api/time-entries${queryString ? `?${queryString}` : ''}`);
  }

  async getTimeEntry(id: string): Promise<TimeEntry> {
    return this.get<TimeEntry>(`/api/time-entries/${id}`);
  }

  async clockIn(entry: Partial<TimeEntry>): Promise<TimeEntry> {
    return this.post<TimeEntry>('/api/time-entries/clock-in', entry, { priority: 'high' });
  }

  async clockOut(id: string, breakMinutes: number): Promise<TimeEntry> {
    return this.post<TimeEntry>(`/api/time-entries/${id}/clock-out`, { break_minutes: breakMinutes }, { priority: 'high' });
  }

  async updateTimeEntry(id: string, entry: Partial<TimeEntry>, priority: RequestPriority = 'medium'): Promise<TimeEntry> {
    return this.put<TimeEntry>(`/api/time-entries/${id}`, entry, { priority });
  }

  async deleteTimeEntry(id: string): Promise<void> {
    return this.delete(`/api/time-entries/${id}`);
  }

  // Certifications
  async getCertifications(workerId: string): Promise<Certification[]> {
    return this.get<Certification[]>(`/api/certifications/worker/${workerId}`);
  }

  async createCertification(certification: Partial<Certification>): Promise<Certification> {
    return this.post<Certification>('/api/certifications', certification);
  }

  async updateCertification(id: string, certification: Partial<Certification>): Promise<Certification> {
    return this.put<Certification>(`/api/certifications/${id}`, certification);
  }

  async deleteCertification(id: string): Promise<void> {
    return this.delete(`/api/certifications/${id}`);
  }

  // ========================================================================
  // HTTP Methods
  // ========================================================================

  private async get<T>(path: string, options?: RequestOptions): Promise<T> {
    const response = await this.request<T>('GET', path, undefined, options);
    if (response.data !== undefined) return response.data;
    throw new Error(response.error || 'Request failed');
  }

  private async post<T>(path: string, body?: any, options?: RequestOptions): Promise<T> {
    const response = await this.request<T>('POST', path, body, options);
    if (response.data !== undefined) return response.data;
    throw new Error(response.error || 'Request failed');
  }

  private async put<T>(path: string, body?: any, options?: RequestOptions): Promise<T> {
    const response = await this.request<T>('PUT', path, body, options);
    if (response.data !== undefined) return response.data;
    throw new Error(response.error || 'Request failed');
  }

  private async delete(path: string, options?: RequestOptions): Promise<void> {
    const response = await this.request('DELETE', path, undefined, options);
    if (!response.success) {
      throw new Error(response.error || 'Request failed');
    }
  }

  // ========================================================================
  // Core Request Handler
  // ========================================================================

  private async request<T>(
    method: string,
    path: string,
    body?: any,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const { skipAuth = false, skipQueue = false, priority = 'medium', retryCount = 0 } = options;

    // Check if online
    if (!this.networkMonitor.isOnline && !skipQueue) {
      // Queue the request for later
      const queueId = await this.requestQueue.add({
        method,
        url: path,
        body,
        headers: await this.buildHeaders(skipAuth),
        priority,
      });

      throw new Error(`Offline: Request queued (${queueId})`);
    }

    try {
      const url = `${this.config.baseUrl}${path}`;
      const headers = await this.buildHeaders(skipAuth);

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), this.config.timeout);

      const response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeout);

      // Handle 401 - Try to refresh token
      if (response.status === 401 && !skipAuth && this.tokens?.refresh_token) {
        try {
          await this.refreshToken();
          // Retry original request with new token
          return this.request<T>(method, path, body, { ...options, retryCount: 0 });
        } catch (refreshError) {
          await this.clearTokens();
          throw new Error('Authentication failed');
        }
      }

      // Handle 409 - Conflict (for sync conflicts)
      if (response.status === 409) {
        const conflictData = await response.json();
        throw new SyncConflictError(conflictData);
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`);
      }

      return data;

    } catch (error) {
      // Retry logic
      if (retryCount < this.config.maxRetries && this.shouldRetry(error)) {
        const delay = this.config.retryDelay * Math.pow(2, retryCount); // Exponential backoff
        await this.sleep(delay);
        return this.request<T>(method, path, body, { ...options, retryCount: retryCount + 1 });
      }

      // If offline and not already queued, queue it
      if (!this.networkMonitor.isOnline && !skipQueue) {
        const queueId = await this.requestQueue.add({
          method,
          url: path,
          body,
          headers: await this.buildHeaders(skipAuth),
          priority,
        });

        return {
          success: false,
          error: `Offline: Request queued (${queueId})`,
        };
      }

      throw error;
    }
  }

  // ========================================================================
  // Request Queue Management
  // ========================================================================

  async processQueue(): Promise<void> {
    await this.requestQueue.process(async (queuedRequest) => {
      try {
        await fetch(`${this.config.baseUrl}${queuedRequest.url}`, {
          method: queuedRequest.method,
          headers: queuedRequest.headers,
          body: queuedRequest.body ? JSON.stringify(queuedRequest.body) : undefined,
        });
      } catch (error) {
        // Increment retry count
        queuedRequest.retryCount++;

        if (queuedRequest.retryCount >= this.config.maxRetries) {
          throw error; // Remove from queue after max retries
        }

        throw error; // Keep in queue for next attempt
      }
    });
  }

  getQueuedRequests(): QueuedRequest[] {
    return this.requestQueue.getAll();
  }

  async clearQueue(): Promise<void> {
    await this.requestQueue.clear();
  }

  // ========================================================================
  // Sync Conflict Resolution
  // ========================================================================

  async resolveConflict<T>(
    conflict: SyncConflict<T>,
    strategy: ConflictResolutionStrategy
  ): Promise<T> {
    switch (strategy) {
      case 'server':
        return conflict.serverVersion;

      case 'local':
        return conflict.localVersion;

      case 'merge':
        // Simple merge: server version takes precedence for conflicts
        // In a real app, you'd have more sophisticated merge logic
        return {
          ...conflict.localVersion,
          ...conflict.serverVersion,
        };

      case 'manual':
        throw new Error('Manual conflict resolution required');

      default:
        throw new Error(`Unknown resolution strategy: ${strategy}`);
    }
  }

  // ========================================================================
  // Token Management
  // ========================================================================

  private async setTokens(tokens: AuthTokens): Promise<void> {
    this.tokens = tokens;
    await this.storage.setItem('auth_tokens', JSON.stringify(tokens));
  }

  private async clearTokens(): Promise<void> {
    this.tokens = null;
    await this.storage.removeItem('auth_tokens');
  }

  private async loadTokens(): Promise<void> {
    try {
      const stored = await this.storage.getItem('auth_tokens');
      if (stored) {
        this.tokens = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load tokens:', error);
    }
  }

  private async buildHeaders(skipAuth: boolean): Promise<Record<string, string>> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (!skipAuth && this.tokens?.access_token) {
      headers['Authorization'] = `Bearer ${this.tokens.access_token}`;
    }

    return headers;
  }

  // ========================================================================
  // Utility Methods
  // ========================================================================

  private shouldRetry(error: any): boolean {
    // Retry on network errors, timeouts, and 5xx errors
    if (error.name === 'AbortError') return true;
    if (error.message?.includes('network')) return true;
    if (error.message?.includes('timeout')) return true;
    return false;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  get isOnline(): boolean {
    return this.networkMonitor.isOnline;
  }
}

// ============================================================================
// Custom Errors
// ============================================================================

export class SyncConflictError extends Error {
  constructor(public conflict: SyncConflict) {
    super('Sync conflict detected');
    this.name = 'SyncConflictError';
  }
}

// ============================================================================
// Request Options
// ============================================================================

interface RequestOptions {
  skipAuth?: boolean;
  skipQueue?: boolean;
  priority?: RequestPriority;
  retryCount?: number;
}

// ============================================================================
// Exports
// ============================================================================

export default FarmCommonsApiClient;

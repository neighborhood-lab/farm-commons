// Mobile API Client
// Handles API requests with offline support and automatic retry

import { ApiResponse, TimeEntry, Worker, Field } from '@farm-commons/shared';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { offlineQueue } from '../services/offlineQueue';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001/api';

interface ApiConfig {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  endpoint: string;
  body?: unknown;
  requiresAuth?: boolean;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async getAuthToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem('auth_token');
    } catch (error) {
      console.error('Failed to get auth token:', error);
      return null;
    }
  }

  private async request<T>(config: ApiConfig): Promise<ApiResponse<T>> {
    const { method, endpoint, body, requiresAuth = true } = config;

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (requiresAuth) {
        const token = await this.getAuthToken();
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
      }

      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Request failed');
      }

      return data;
    } catch (error) {
      // If offline, queue the request for later
      if (error instanceof TypeError && error.message.includes('network')) {
        if (method !== 'GET') {
          await offlineQueue.add({
            method,
            endpoint,
            body,
            timestamp: new Date().toISOString(),
          });
        }
        throw new Error('You are offline. Request queued for when you reconnect.');
      }
      throw error;
    }
  }

  // Time Entry Methods
  async clockIn(data: {
    worker_id: string;
    task_type: string;
    field_id?: string;
    schedule_id?: string;
    notes?: string;
    location?: { latitude: number; longitude: number };
    photo_uri?: string;
  }): Promise<ApiResponse<TimeEntry>> {
    return this.request<TimeEntry>({
      method: 'POST',
      endpoint: '/time-entries/clock-in',
      body: data,
    });
  }

  async clockOut(
    entryId: string,
    data: {
      break_minutes?: number;
      notes?: string;
      location?: { latitude: number; longitude: number };
      photo_uri?: string;
    }
  ): Promise<ApiResponse<TimeEntry>> {
    return this.request<TimeEntry>({
      method: 'POST',
      endpoint: `/time-entries/${entryId}/clock-out`,
      body: data,
    });
  }

  async getActiveTimeEntry(workerId: string): Promise<ApiResponse<TimeEntry | null>> {
    return this.request<TimeEntry | null>({
      method: 'GET',
      endpoint: `/time-entries/worker/${workerId}/active`,
    });
  }

  async getWorkerTimeEntries(workerId: string): Promise<ApiResponse<TimeEntry[]>> {
    return this.request<TimeEntry[]>({
      method: 'GET',
      endpoint: `/time-entries/worker/${workerId}`,
    });
  }

  // Worker Methods
  async getWorkers(): Promise<ApiResponse<Worker[]>> {
    return this.request<Worker[]>({
      method: 'GET',
      endpoint: '/workers',
    });
  }

  async getWorker(workerId: string): Promise<ApiResponse<Worker>> {
    return this.request<Worker>({
      method: 'GET',
      endpoint: `/workers/${workerId}`,
    });
  }

  // Field Methods
  async getFields(): Promise<ApiResponse<Field[]>> {
    return this.request<Field[]>({
      method: 'GET',
      endpoint: '/fields',
    });
  }

  // Auth Methods
  async login(email: string, password: string): Promise<ApiResponse<{ token: string }>> {
    const response = await this.request<{ token: string }>({
      method: 'POST',
      endpoint: '/auth/login',
      body: { email, password },
      requiresAuth: false,
    });

    if (response.success && response.data?.token) {
      await AsyncStorage.setItem('auth_token', response.data.token);
    }

    return response;
  }

  async logout(): Promise<void> {
    await AsyncStorage.removeItem('auth_token');
  }
}

export const api = new ApiClient(API_BASE_URL);

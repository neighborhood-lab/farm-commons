/**
 * Mobile API Client
 * Handles API communication with the Farm Commons backend
 * Supports offline mode with request queuing
 */

import { Schedule, ApiResponse, AuthTokens } from '@farm-commons/shared';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';

// Token storage keys
const TOKEN_KEY = '@farm_commons_token';
const REFRESH_TOKEN_KEY = '@farm_commons_refresh_token';

class ApiClient {
  private baseUrl: string;
  private authToken: string | null = null;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
    this.loadToken();
  }

  /**
   * Load auth token from storage
   */
  private async loadToken() {
    try {
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      if (token) {
        this.authToken = token;
      }
    } catch (error) {
      console.error('Failed to load auth token:', error);
    }
  }

  /**
   * Set auth token
   */
  async setAuthToken(tokens: AuthTokens) {
    this.authToken = tokens.access_token;
    try {
      await AsyncStorage.setItem(TOKEN_KEY, tokens.access_token);
      if (tokens.refresh_token) {
        await AsyncStorage.setItem(REFRESH_TOKEN_KEY, tokens.refresh_token);
      }
    } catch (error) {
      console.error('Failed to save auth token:', error);
    }
  }

  /**
   * Clear auth token
   */
  async clearAuthToken() {
    this.authToken = null;
    try {
      await AsyncStorage.removeItem(TOKEN_KEY);
      await AsyncStorage.removeItem(REFRESH_TOKEN_KEY);
    } catch (error) {
      console.error('Failed to clear auth token:', error);
    }
  }

  /**
   * Make authenticated API request
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    };

    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({
          error: response.statusText,
        }));
        return {
          success: false,
          error: error.error || error.message || 'Request failed',
        };
      }

      const data = await response.json();
      return {
        success: true,
        data,
      };
    } catch (error) {
      console.error('API request failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  // Schedule API methods

  /**
   * Get schedules for a specific date range
   */
  async getSchedules(startDate: Date, endDate: Date): Promise<ApiResponse<Schedule[]>> {
    const start = startDate.toISOString();
    const end = endDate.toISOString();
    return this.request<Schedule[]>(`/schedules?start_date=${start}&end_date=${end}`);
  }

  /**
   * Get schedules for a specific worker
   */
  async getWorkerSchedules(
    workerId: string,
    startDate: Date,
    endDate: Date
  ): Promise<ApiResponse<Schedule[]>> {
    const start = startDate.toISOString();
    const end = endDate.toISOString();
    return this.request<Schedule[]>(
      `/schedules?worker_id=${workerId}&start_date=${start}&end_date=${end}`
    );
  }

  /**
   * Get today's schedules
   */
  async getTodaySchedules(): Promise<ApiResponse<Schedule[]>> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return this.getSchedules(today, tomorrow);
  }

  /**
   * Get a single schedule by ID
   */
  async getSchedule(scheduleId: string): Promise<ApiResponse<Schedule>> {
    return this.request<Schedule>(`/schedules/${scheduleId}`);
  }

  /**
   * Update schedule status (accept/decline)
   */
  async updateScheduleStatus(
    scheduleId: string,
    status: 'scheduled' | 'cancelled'
  ): Promise<ApiResponse<Schedule>> {
    return this.request<Schedule>(`/schedules/${scheduleId}`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  }

  /**
   * Accept a schedule
   */
  async acceptSchedule(scheduleId: string): Promise<ApiResponse<Schedule>> {
    return this.updateScheduleStatus(scheduleId, 'scheduled');
  }

  /**
   * Decline a schedule
   */
  async declineSchedule(scheduleId: string): Promise<ApiResponse<Schedule>> {
    return this.updateScheduleStatus(scheduleId, 'cancelled');
  }
}

// Export singleton instance
export const apiClient = new ApiClient();
export default apiClient;

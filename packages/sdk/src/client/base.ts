// Base HTTP client for Farm Commons API
import type { SDKConfig, RequestOptions, SDKError, ApiResponse } from '../types/index.js';

export class FarmCommonsClient {
  private config: SDKConfig;
  private accessToken: string | null = null;

  constructor(config: SDKConfig) {
    this.config = {
      timeout: 30000,
      ...config,
    };

    if (config.accessToken) {
      this.accessToken = config.accessToken;
    }
  }

  /**
   * Set the access token for authenticated requests
   */
  setAccessToken(token: string): void {
    this.accessToken = token;
    if (this.config.onTokenRefresh) {
      this.config.onTokenRefresh(token);
    }
  }

  /**
   * Get the current access token
   */
  getAccessToken(): string | null {
    return this.accessToken;
  }

  /**
   * Make an HTTP request to the API
   */
  async request<T>(
    path: string,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const { method = 'GET', headers = {}, body, params } = options;

    // Build URL with query parameters
    const url = new URL(path, this.config.baseUrl);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, String(value));
      });
    }

    // Build headers
    const requestHeaders: HeadersInit = {
      'Content-Type': 'application/json',
      ...headers,
    };

    // Add authentication
    if (this.accessToken) {
      requestHeaders['Authorization'] = `Bearer ${this.accessToken}`;
    } else if (this.config.apiKey) {
      requestHeaders['X-API-Key'] = this.config.apiKey;
    }

    // Make request
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        this.config.timeout
      );

      const response = await fetch(url.toString(), {
        method,
        headers: requestHeaders,
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Parse response
      const data = await response.json();

      if (!response.ok) {
        const error: SDKError = new Error(
          data.error || data.message || `HTTP ${response.status}`
        );
        error.statusCode = response.status;
        error.response = data;
        throw error;
      }

      return data as ApiResponse<T>;
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          const timeoutError: SDKError = new Error('Request timeout');
          timeoutError.statusCode = 408;
          throw timeoutError;
        }
        throw error;
      }
      throw new Error('Unknown error occurred');
    }
  }

  /**
   * Make a GET request
   */
  async get<T>(path: string, params?: Record<string, string | number | boolean>): Promise<ApiResponse<T>> {
    return this.request<T>(path, { method: 'GET', params });
  }

  /**
   * Make a POST request
   */
  async post<T>(path: string, body?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(path, { method: 'POST', body });
  }

  /**
   * Make a PUT request
   */
  async put<T>(path: string, body?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(path, { method: 'PUT', body });
  }

  /**
   * Make a DELETE request
   */
  async delete<T>(path: string): Promise<ApiResponse<T>> {
    return this.request<T>(path, { method: 'DELETE' });
  }
}

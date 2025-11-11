// SDK-specific types
export * from '@farm-commons/shared';

export interface SDKConfig {
  baseUrl: string;
  apiKey?: string;
  accessToken?: string;
  timeout?: number;
  onTokenRefresh?: (token: string) => void;
}

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: unknown;
  params?: Record<string, string | number | boolean>;
}

export interface SDKError extends Error {
  statusCode?: number;
  response?: unknown;
}

export interface PaginationParams {
  page?: number;
  per_page?: number;
}

export interface DateRangeParams {
  start_date?: string | Date;
  end_date?: string | Date;
}

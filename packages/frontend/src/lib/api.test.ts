import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { api, apiRequest, ApiError } from './api';
import { useAuthStore } from './store';

// Mock fetch
global.fetch = vi.fn();

describe('ApiError', () => {
  it('creates an error with message and status code', () => {
    const error = new ApiError('Test error', 400);

    expect(error.message).toBe('Test error');
    expect(error.statusCode).toBe(400);
    expect(error.name).toBe('ApiError');
  });

  it('includes response data when provided', () => {
    const response = { field: 'email', message: 'Invalid' };
    const error = new ApiError('Validation error', 422, response);

    expect(error.response).toEqual(response);
  });
});

describe('apiRequest', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('makes GET request to correct endpoint', async () => {
    const mockData = { id: 1, name: 'Test' };
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: mockData }),
    } as Response);

    await apiRequest('/test');

    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:3001/api/test',
      expect.objectContaining({ headers: expect.any(Object) })
    );
  });

  it('includes authorization header when token is present', async () => {
    useAuthStore.setState({
      user: { id: 1, email: 'test@example.com', role: 'manager', farm_id: 1 },
      token: 'test-token-123',
      isAuthenticated: true,
    });

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: {} }),
    } as Response);

    await apiRequest('/test');

    expect(fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer test-token-123',
        }),
      })
    );
  });

  it('does not include authorization header when token is absent', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: {} }),
    } as Response);

    await apiRequest('/test');

    const headers = (fetch as any).mock.calls[0][1].headers;
    expect(headers.Authorization).toBeUndefined();
  });

  it('includes Content-Type header', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: {} }),
    } as Response);

    await apiRequest('/test');

    expect(fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
        }),
      })
    );
  });

  it('returns data from successful response', async () => {
    const mockData = { id: 1, name: 'Test' };
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: mockData }),
    } as Response);

    const result = await apiRequest('/test');

    expect(result).toEqual(mockData);
  });

  it('throws ApiError on failed response with error message', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({ error: 'Bad Request' }),
    } as Response);

    await expect(apiRequest('/test')).rejects.toThrow(ApiError);
    await expect(apiRequest('/test')).rejects.toThrow('Bad Request');
  });

  it('throws ApiError with default message when error field is missing', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({}),
    } as Response);

    await expect(apiRequest('/test')).rejects.toThrow('An error occurred');
  });

  it('includes status code in ApiError', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: async () => ({ error: 'Not Found' }),
    } as Response);

    try {
      await apiRequest('/test');
      expect.fail('Should have thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(ApiError);
      expect((error as ApiError).statusCode).toBe(404);
    }
  });

  it('merges custom options with defaults', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: {} }),
    } as Response);

    await apiRequest('/test', {
      method: 'POST',
      headers: { 'X-Custom': 'value' },
    });

    expect(fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          'X-Custom': 'value',
        }),
      })
    );
  });
});

describe('api helpers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('api.get makes GET request', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: { id: 1 } }),
    } as Response);

    await api.get('/test');

    expect(fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ method: 'GET' })
    );
  });

  it('api.post makes POST request with body', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: { id: 1 } }),
    } as Response);

    const body = { name: 'Test' };
    await api.post('/test', body);

    expect(fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(body),
      })
    );
  });

  it('api.put makes PUT request with body', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: { id: 1 } }),
    } as Response);

    const body = { name: 'Updated' };
    await api.put('/test', body);

    expect(fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify(body),
      })
    );
  });

  it('api.delete makes DELETE request', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: {} }),
    } as Response);

    await api.delete('/test');

    expect(fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ method: 'DELETE' })
    );
  });

  it('api methods return typed data', async () => {
    interface TestData {
      id: number;
      name: string;
    }

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: { id: 1, name: 'Test' } }),
    } as Response);

    const result = await api.get<TestData>('/test');

    expect(result.id).toBe(1);
    expect(result.name).toBe('Test');
  });
});

/**
 * useSchedules Hook Tests
 */

import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import {
  useTodaySchedules,
  useWeekSchedules,
  useAcceptSchedule,
  useDeclineSchedule,
} from '../hooks/useSchedules';
import apiClient from '../lib/api';
import { Schedule } from '@farm-commons/shared';

// Mock the API client
jest.mock('../lib/api', () => ({
  __esModule: true,
  default: {
    getTodaySchedules: jest.fn(),
    getSchedules: jest.fn(),
    acceptSchedule: jest.fn(),
    declineSchedule: jest.fn(),
  },
}));

const mockSchedule: Schedule = {
  id: '1',
  farm_id: 'farm-1',
  worker_id: 'worker-1',
  field_id: 'field-1',
  scheduled_date: new Date('2024-01-15'),
  start_time: '09:00',
  end_time: '17:00',
  task_type: 'Planting',
  task_description: 'Plant tomatoes',
  status: 'scheduled',
  notes: null,
  created_at: new Date(),
  updated_at: new Date(),
};

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

const createWrapper = () => {
  const testQueryClient = createTestQueryClient();
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={testQueryClient}>{children}</QueryClientProvider>
  );
};

describe('useSchedules hooks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('useTodaySchedules', () => {
    it('should fetch today\'s schedules successfully', async () => {
      (apiClient.getTodaySchedules as jest.Mock).mockResolvedValue({
        success: true,
        data: [mockSchedule],
      });

      const { result } = renderHook(() => useTodaySchedules(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual([mockSchedule]);
      expect(apiClient.getTodaySchedules).toHaveBeenCalledTimes(1);
    });

    it('should handle error when fetching fails', async () => {
      (apiClient.getTodaySchedules as jest.Mock).mockResolvedValue({
        success: false,
        error: 'Network error',
      });

      const { result } = renderHook(() => useTodaySchedules(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toBeTruthy();
    });
  });

  describe('useWeekSchedules', () => {
    it('should fetch week schedules successfully', async () => {
      (apiClient.getSchedules as jest.Mock).mockResolvedValue({
        success: true,
        data: [mockSchedule],
      });

      const { result } = renderHook(() => useWeekSchedules(0), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual([mockSchedule]);
      expect(apiClient.getSchedules).toHaveBeenCalledTimes(1);
    });
  });

  describe('useAcceptSchedule', () => {
    it('should accept schedule successfully', async () => {
      (apiClient.acceptSchedule as jest.Mock).mockResolvedValue({
        success: true,
        data: { ...mockSchedule, status: 'scheduled' },
      });

      const { result } = renderHook(() => useAcceptSchedule(), {
        wrapper: createWrapper(),
      });

      await result.current.mutateAsync('1');

      expect(apiClient.acceptSchedule).toHaveBeenCalledWith('1');
    });

    it('should handle error when accepting fails', async () => {
      (apiClient.acceptSchedule as jest.Mock).mockResolvedValue({
        success: false,
        error: 'Failed to accept',
      });

      const { result } = renderHook(() => useAcceptSchedule(), {
        wrapper: createWrapper(),
      });

      await expect(result.current.mutateAsync('1')).rejects.toThrow();
    });
  });

  describe('useDeclineSchedule', () => {
    it('should decline schedule successfully', async () => {
      (apiClient.declineSchedule as jest.Mock).mockResolvedValue({
        success: true,
        data: { ...mockSchedule, status: 'cancelled' },
      });

      const { result } = renderHook(() => useDeclineSchedule(), {
        wrapper: createWrapper(),
      });

      await result.current.mutateAsync('1');

      expect(apiClient.declineSchedule).toHaveBeenCalledWith('1');
    });
  });
});

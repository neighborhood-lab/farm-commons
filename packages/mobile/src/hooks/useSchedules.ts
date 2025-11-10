/**
 * Schedule React Query hooks
 * Custom hooks for fetching and managing schedules
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Schedule } from '@farm-commons/shared';
import apiClient from '../lib/api';
import { startOfWeek, endOfWeek, addWeeks } from 'date-fns';

/**
 * Hook to fetch today's schedules
 */
export function useTodaySchedules() {
  return useQuery({
    queryKey: ['schedules', 'today'],
    queryFn: async () => {
      const response = await apiClient.getTodaySchedules();
      if (!response.success) {
        throw new Error(response.error);
      }
      return response.data || [];
    },
    refetchInterval: 60000, // Refetch every minute
  });
}

/**
 * Hook to fetch schedules for a specific week
 */
export function useWeekSchedules(weekOffset: number = 0) {
  const startDate = startOfWeek(addWeeks(new Date(), weekOffset), { weekStartsOn: 0 });
  const endDate = endOfWeek(addWeeks(new Date(), weekOffset), { weekStartsOn: 0 });

  return useQuery({
    queryKey: ['schedules', 'week', weekOffset],
    queryFn: async () => {
      const response = await apiClient.getSchedules(startDate, endDate);
      if (!response.success) {
        throw new Error(response.error);
      }
      return response.data || [];
    },
    staleTime: 30000, // Consider data fresh for 30 seconds
  });
}

/**
 * Hook to accept a schedule
 */
export function useAcceptSchedule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (scheduleId: string) => {
      const response = await apiClient.acceptSchedule(scheduleId);
      if (!response.success) {
        throw new Error(response.error);
      }
      return response.data;
    },
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
    },
  });
}

/**
 * Hook to decline a schedule
 */
export function useDeclineSchedule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (scheduleId: string) => {
      const response = await apiClient.declineSchedule(scheduleId);
      if (!response.success) {
        throw new Error(response.error);
      }
      return response.data;
    },
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
    },
  });
}

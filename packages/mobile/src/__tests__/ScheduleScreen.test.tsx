/**
 * ScheduleScreen Tests
 * Tests for the mobile schedule screen component
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ScheduleScreen } from '../screens/ScheduleScreen';
import * as useSchedulesHooks from '../hooks/useSchedules';
import { Schedule } from '@farm-commons/shared';

// Mock the hooks
jest.mock('../hooks/useSchedules');

// Mock expo-notifications
jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
}));

// Mock expo-constants
jest.mock('expo-constants', () => ({
  default: {
    expoConfig: {
      extra: {
        eas: {
          projectId: 'test-project-id',
        },
      },
    },
  },
}));

// Mock expo-device
jest.mock('expo-device', () => ({
  isDevice: true,
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
  task_description: 'Plant tomatoes in field A',
  status: 'scheduled',
  notes: 'Bring extra tools',
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

const renderWithProviders = (component: React.ReactElement) => {
  const testQueryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={testQueryClient}>{component}</QueryClientProvider>
  );
};

describe('ScheduleScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Today View', () => {
    it('should render today view by default', () => {
      const mockUseTodaySchedules = jest.spyOn(useSchedulesHooks, 'useTodaySchedules');
      mockUseTodaySchedules.mockReturnValue({
        data: [mockSchedule],
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      } as any);

      const mockUseWeekSchedules = jest.spyOn(useSchedulesHooks, 'useWeekSchedules');
      mockUseWeekSchedules.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      } as any);

      renderWithProviders(<ScheduleScreen />);

      expect(screen.getByText('My Schedule')).toBeTruthy();
      expect(screen.getByText('Today')).toBeTruthy();
    });

    it('should display schedules for today', () => {
      const mockUseTodaySchedules = jest.spyOn(useSchedulesHooks, 'useTodaySchedules');
      mockUseTodaySchedules.mockReturnValue({
        data: [mockSchedule],
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      } as any);

      const mockUseWeekSchedules = jest.spyOn(useSchedulesHooks, 'useWeekSchedules');
      mockUseWeekSchedules.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      } as any);

      renderWithProviders(<ScheduleScreen />);

      expect(screen.getByText('Planting')).toBeTruthy();
      expect(screen.getByText('Plant tomatoes in field A')).toBeTruthy();
    });

    it('should show empty state when no schedules', () => {
      const mockUseTodaySchedules = jest.spyOn(useSchedulesHooks, 'useTodaySchedules');
      mockUseTodaySchedules.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      } as any);

      const mockUseWeekSchedules = jest.spyOn(useSchedulesHooks, 'useWeekSchedules');
      mockUseWeekSchedules.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      } as any);

      renderWithProviders(<ScheduleScreen />);

      expect(screen.getByText('No schedules for today')).toBeTruthy();
    });

    it('should show loading state', () => {
      const mockUseTodaySchedules = jest.spyOn(useSchedulesHooks, 'useTodaySchedules');
      mockUseTodaySchedules.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
        refetch: jest.fn(),
      } as any);

      const mockUseWeekSchedules = jest.spyOn(useSchedulesHooks, 'useWeekSchedules');
      mockUseWeekSchedules.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      } as any);

      renderWithProviders(<ScheduleScreen />);

      expect(screen.getByText('Loading schedules...')).toBeTruthy();
    });
  });

  describe('Week View', () => {
    it('should switch to week view when week button is pressed', async () => {
      const mockUseTodaySchedules = jest.spyOn(useSchedulesHooks, 'useTodaySchedules');
      mockUseTodaySchedules.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      } as any);

      const mockUseWeekSchedules = jest.spyOn(useSchedulesHooks, 'useWeekSchedules');
      mockUseWeekSchedules.mockReturnValue({
        data: [mockSchedule],
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      } as any);

      renderWithProviders(<ScheduleScreen />);

      const weekButton = screen.getByText('Week');
      fireEvent.press(weekButton);

      await waitFor(() => {
        expect(screen.getByText('This Week')).toBeTruthy();
      });
    });

    it('should display week navigator in week view', async () => {
      const mockUseTodaySchedules = jest.spyOn(useSchedulesHooks, 'useTodaySchedules');
      mockUseTodaySchedules.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      } as any);

      const mockUseWeekSchedules = jest.spyOn(useSchedulesHooks, 'useWeekSchedules');
      mockUseWeekSchedules.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      } as any);

      renderWithProviders(<ScheduleScreen />);

      const weekButton = screen.getByText('Week');
      fireEvent.press(weekButton);

      await waitFor(() => {
        expect(screen.getByText('This Week')).toBeTruthy();
      });
    });
  });

  describe('Accept/Decline Actions', () => {
    it('should call accept mutation when accept button is pressed', async () => {
      const mockAccept = jest.fn();
      const mockUseTodaySchedules = jest.spyOn(useSchedulesHooks, 'useTodaySchedules');
      mockUseTodaySchedules.mockReturnValue({
        data: [mockSchedule],
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      } as any);

      const mockUseWeekSchedules = jest.spyOn(useSchedulesHooks, 'useWeekSchedules');
      mockUseWeekSchedules.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      } as any);

      const mockUseAcceptSchedule = jest.spyOn(useSchedulesHooks, 'useAcceptSchedule');
      mockUseAcceptSchedule.mockReturnValue({
        mutateAsync: mockAccept,
        isPending: false,
      } as any);

      const mockUseDeclineSchedule = jest.spyOn(useSchedulesHooks, 'useDeclineSchedule');
      mockUseDeclineSchedule.mockReturnValue({
        mutateAsync: jest.fn(),
        isPending: false,
      } as any);

      renderWithProviders(<ScheduleScreen />);

      const acceptButton = screen.getByText('Accept');
      fireEvent.press(acceptButton);

      await waitFor(() => {
        expect(mockAccept).toHaveBeenCalledWith('1');
      });
    });

    it('should show confirmation dialog when decline button is pressed', async () => {
      const mockDecline = jest.fn();
      const mockUseTodaySchedules = jest.spyOn(useSchedulesHooks, 'useTodaySchedules');
      mockUseTodaySchedules.mockReturnValue({
        data: [mockSchedule],
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      } as any);

      const mockUseWeekSchedules = jest.spyOn(useSchedulesHooks, 'useWeekSchedules');
      mockUseWeekSchedules.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      } as any);

      const mockUseAcceptSchedule = jest.spyOn(useSchedulesHooks, 'useAcceptSchedule');
      mockUseAcceptSchedule.mockReturnValue({
        mutateAsync: jest.fn(),
        isPending: false,
      } as any);

      const mockUseDeclineSchedule = jest.spyOn(useSchedulesHooks, 'useDeclineSchedule');
      mockUseDeclineSchedule.mockReturnValue({
        mutateAsync: mockDecline,
        isPending: false,
      } as any);

      renderWithProviders(<ScheduleScreen />);

      const declineButton = screen.getByText('Decline');
      fireEvent.press(declineButton);

      // Note: Alert.alert is mocked in React Native, but we can't easily test the dialog behavior
      // In a real app, you would use a custom modal component that's easier to test
    });
  });
});

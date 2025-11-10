// ClockInScreen Tests

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import ClockInScreen from '../screens/ClockInScreen';
import { api } from '../lib/api';
import { offlineQueue } from '../services/offlineQueue';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';

// Mock dependencies
jest.mock('../lib/api');
jest.mock('../services/offlineQueue');
jest.mock('expo-location');
jest.mock('expo-image-picker');

// Mock Alert
jest.spyOn(Alert, 'alert');

describe('ClockInScreen', () => {
  const mockWorkerId = 'worker-123';
  const mockTimeEntry = {
    id: 'entry-123',
    farm_id: 'farm-123',
    worker_id: mockWorkerId,
    clock_in: new Date().toISOString(),
    clock_out: null,
    task_type: 'Harvesting',
    field_id: null,
    break_minutes: 0,
    total_hours: null,
    notes: null,
    verified_by: null,
    verified_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock permissions
    (Location.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValue({
      status: 'granted',
    });
    (ImagePicker.requestCameraPermissionsAsync as jest.Mock).mockResolvedValue({
      status: 'granted',
    });

    // Mock offline queue
    (offlineQueue.init as jest.Mock).mockResolvedValue(undefined);
    (offlineQueue.getPendingCount as jest.Mock).mockReturnValue(0);

    // Mock API calls
    (api.getWorkers as jest.Mock).mockResolvedValue({
      success: true,
      data: [
        {
          id: mockWorkerId,
          first_name: 'John',
          last_name: 'Doe',
          farm_id: 'farm-123',
          user_id: null,
          email: null,
          phone: '555-0100',
          preferred_language: 'en',
          emergency_contact_name: null,
          emergency_contact_phone: null,
          hire_date: new Date(),
          status: 'active',
          hourly_rate: 15,
          piece_rate: null,
          certifications: [],
          skills: [],
          notes: null,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ],
    });

    (api.getFields as jest.Mock).mockResolvedValue({
      success: true,
      data: [],
    });

    (api.getActiveTimeEntry as jest.Mock).mockResolvedValue({
      success: true,
      data: null,
    });
  });

  describe('Initialization', () => {
    it('should render the screen', async () => {
      const { getByText } = render(<ClockInScreen workerId={mockWorkerId} />);

      await waitFor(() => {
        expect(getByText('Clock In')).toBeTruthy();
      });
    });

    it('should request location and camera permissions', async () => {
      render(<ClockInScreen workerId={mockWorkerId} />);

      await waitFor(() => {
        expect(Location.requestForegroundPermissionsAsync).toHaveBeenCalled();
        expect(ImagePicker.requestCameraPermissionsAsync).toHaveBeenCalled();
      });
    });

    it('should initialize offline queue', async () => {
      render(<ClockInScreen workerId={mockWorkerId} />);

      await waitFor(() => {
        expect(offlineQueue.init).toHaveBeenCalled();
      });
    });

    it('should load workers and fields', async () => {
      render(<ClockInScreen workerId={mockWorkerId} />);

      await waitFor(() => {
        expect(api.getWorkers).toHaveBeenCalled();
        expect(api.getFields).toHaveBeenCalled();
      });
    });

    it('should check for active time entry when worker is selected', async () => {
      render(<ClockInScreen workerId={mockWorkerId} />);

      await waitFor(() => {
        expect(api.getActiveTimeEntry).toHaveBeenCalledWith(mockWorkerId);
      });
    });
  });

  describe('Clock In', () => {
    it('should show error if task type is missing', async () => {
      const { getByText } = render(<ClockInScreen workerId={mockWorkerId} />);

      await waitFor(() => {
        const clockInButton = getByText('CLOCK IN');
        fireEvent.press(clockInButton);
      });

      expect(Alert.alert).toHaveBeenCalledWith(
        'Missing Information',
        'Please select worker and enter task type'
      );
    });

    it('should successfully clock in', async () => {
      (api.clockIn as jest.Mock).mockResolvedValue({
        success: true,
        data: mockTimeEntry,
      });

      (Location.getCurrentPositionAsync as jest.Mock).mockResolvedValue({
        coords: {
          latitude: 37.7749,
          longitude: -122.4194,
          accuracy: 10,
        },
        timestamp: Date.now(),
      });

      const onClockInSuccess = jest.fn();
      const { getByText, getByPlaceholderText } = render(
        <ClockInScreen workerId={mockWorkerId} onClockInSuccess={onClockInSuccess} />
      );

      await waitFor(() => {
        expect(getByText('Clock In')).toBeTruthy();
      });

      // Enter task type
      const taskInput = getByPlaceholderText('e.g., Harvesting, Planting, Weeding');
      fireEvent.changeText(taskInput, 'Harvesting');

      // Press clock in button
      const clockInButton = getByText('CLOCK IN');
      fireEvent.press(clockInButton);

      await waitFor(() => {
        expect(api.clockIn).toHaveBeenCalledWith(
          expect.objectContaining({
            worker_id: mockWorkerId,
            task_type: 'Harvesting',
            location: expect.objectContaining({
              latitude: 37.7749,
              longitude: -122.4194,
            }),
          })
        );
        expect(Alert.alert).toHaveBeenCalledWith('Success', 'Clocked in successfully!');
        expect(onClockInSuccess).toHaveBeenCalledWith(mockTimeEntry);
      });
    });

    it('should handle clock in failure', async () => {
      (api.clockIn as jest.Mock).mockRejectedValue(
        new Error('Worker already has an open time entry')
      );

      const { getByText, getByPlaceholderText } = render(
        <ClockInScreen workerId={mockWorkerId} />
      );

      await waitFor(() => {
        expect(getByText('Clock In')).toBeTruthy();
      });

      // Enter task type
      const taskInput = getByPlaceholderText('e.g., Harvesting, Planting, Weeding');
      fireEvent.changeText(taskInput, 'Harvesting');

      // Press clock in button
      const clockInButton = getByText('CLOCK IN');
      fireEvent.press(clockInButton);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Clock In Failed',
          'Worker already has an open time entry'
        );
      });
    });
  });

  describe('Clock Out', () => {
    beforeEach(() => {
      (api.getActiveTimeEntry as jest.Mock).mockResolvedValue({
        success: true,
        data: mockTimeEntry,
      });
    });

    it('should display active time entry', async () => {
      const { getByText } = render(<ClockInScreen workerId={mockWorkerId} />);

      await waitFor(() => {
        expect(getByText('Currently Clocked In')).toBeTruthy();
        expect(getByText(/Task:/)).toBeTruthy();
      });
    });

    it('should successfully clock out', async () => {
      const completedEntry = { ...mockTimeEntry, clock_out: new Date().toISOString() };
      (api.clockOut as jest.Mock).mockResolvedValue({
        success: true,
        data: completedEntry,
      });

      (Location.getCurrentPositionAsync as jest.Mock).mockResolvedValue({
        coords: {
          latitude: 37.7749,
          longitude: -122.4194,
          accuracy: 10,
        },
        timestamp: Date.now(),
      });

      const onClockOutSuccess = jest.fn();
      const { getByText } = render(
        <ClockInScreen workerId={mockWorkerId} onClockOutSuccess={onClockOutSuccess} />
      );

      await waitFor(() => {
        expect(getByText('Currently Clocked In')).toBeTruthy();
      });

      // Press clock out button
      const clockOutButton = getByText('CLOCK OUT');
      fireEvent.press(clockOutButton);

      await waitFor(() => {
        expect(api.clockOut).toHaveBeenCalledWith(
          mockTimeEntry.id,
          expect.objectContaining({
            break_minutes: 0,
            location: expect.objectContaining({
              latitude: 37.7749,
              longitude: -122.4194,
            }),
          })
        );
        expect(Alert.alert).toHaveBeenCalledWith('Success', 'Clocked out successfully!');
        expect(onClockOutSuccess).toHaveBeenCalledWith(completedEntry);
      });
    });

    it('should handle clock out failure', async () => {
      (api.clockOut as jest.Mock).mockRejectedValue(new Error('Network error'));

      const { getByText } = render(<ClockInScreen workerId={mockWorkerId} />);

      await waitFor(() => {
        expect(getByText('Currently Clocked In')).toBeTruthy();
      });

      // Press clock out button
      const clockOutButton = getByText('CLOCK OUT');
      fireEvent.press(clockOutButton);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith('Clock Out Failed', 'Network error');
      });
    });

    it('should include break minutes in clock out', async () => {
      const completedEntry = { ...mockTimeEntry, clock_out: new Date().toISOString() };
      (api.clockOut as jest.Mock).mockResolvedValue({
        success: true,
        data: completedEntry,
      });

      const { getByText, getByDisplayValue } = render(
        <ClockInScreen workerId={mockWorkerId} />
      );

      await waitFor(() => {
        expect(getByText('Currently Clocked In')).toBeTruthy();
      });

      // Change break minutes
      const breakInput = getByDisplayValue('0');
      fireEvent.changeText(breakInput, '30');

      // Press clock out button
      const clockOutButton = getByText('CLOCK OUT');
      fireEvent.press(clockOutButton);

      await waitFor(() => {
        expect(api.clockOut).toHaveBeenCalledWith(
          mockTimeEntry.id,
          expect.objectContaining({
            break_minutes: 30,
          })
        );
      });
    });
  });

  describe('Location Capture', () => {
    it('should capture location on clock in', async () => {
      (api.clockIn as jest.Mock).mockResolvedValue({
        success: true,
        data: mockTimeEntry,
      });

      (Location.getCurrentPositionAsync as jest.Mock).mockResolvedValue({
        coords: {
          latitude: 37.7749,
          longitude: -122.4194,
          accuracy: 10,
        },
        timestamp: Date.now(),
      });

      const { getByText, getByPlaceholderText } = render(
        <ClockInScreen workerId={mockWorkerId} />
      );

      await waitFor(() => {
        expect(getByText('Clock In')).toBeTruthy();
      });

      const taskInput = getByPlaceholderText('e.g., Harvesting, Planting, Weeding');
      fireEvent.changeText(taskInput, 'Harvesting');

      const clockInButton = getByText('CLOCK IN');
      fireEvent.press(clockInButton);

      await waitFor(() => {
        expect(Location.getCurrentPositionAsync).toHaveBeenCalled();
      });
    });

    it('should handle location permission denied', async () => {
      (Location.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'denied',
      });

      render(<ClockInScreen workerId={mockWorkerId} />);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Location Permission',
          'Location access is recommended for accurate time tracking.'
        );
      });
    });
  });

  describe('Offline Support', () => {
    it('should display pending offline requests count', async () => {
      (offlineQueue.getPendingCount as jest.Mock).mockReturnValue(3);

      const { getByText } = render(<ClockInScreen workerId={mockWorkerId} />);

      await waitFor(() => {
        expect(getByText(/3 pending requests will sync when online/)).toBeTruthy();
      });
    });

    it('should show alert when app starts with pending requests', async () => {
      (offlineQueue.getPendingCount as jest.Mock).mockReturnValue(5);

      render(<ClockInScreen workerId={mockWorkerId} />);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Offline Requests',
          'You have 5 pending requests that will be synced when online.'
        );
      });
    });
  });
});

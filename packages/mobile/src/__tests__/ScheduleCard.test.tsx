/**
 * ScheduleCard Component Tests
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { PaperProvider } from 'react-native-paper';
import { ScheduleCard } from '../components/ScheduleCard';
import { Schedule } from '@farm-commons/shared';

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
  notes: 'Bring tools',
  created_at: new Date(),
  updated_at: new Date(),
};

const renderWithTheme = (component: React.ReactElement) => {
  return render(<PaperProvider>{component}</PaperProvider>);
};

describe('ScheduleCard', () => {
  it('should render schedule information', () => {
    renderWithTheme(<ScheduleCard schedule={mockSchedule} />);

    expect(screen.getByText('Planting')).toBeTruthy();
    expect(screen.getByText('Plant tomatoes')).toBeTruthy();
    expect(screen.getByText(/Bring tools/)).toBeTruthy();
  });

  it('should display status chip', () => {
    renderWithTheme(<ScheduleCard schedule={mockSchedule} />);

    expect(screen.getByText('scheduled')).toBeTruthy();
  });

  it('should show action buttons when showActions is true', () => {
    renderWithTheme(<ScheduleCard schedule={mockSchedule} showActions={true} />);

    expect(screen.getByText('Accept')).toBeTruthy();
    expect(screen.getByText('Decline')).toBeTruthy();
  });

  it('should hide action buttons when showActions is false', () => {
    renderWithTheme(<ScheduleCard schedule={mockSchedule} showActions={false} />);

    expect(screen.queryByText('Accept')).toBeNull();
    expect(screen.queryByText('Decline')).toBeNull();
  });

  it('should call onAccept when accept button is pressed', () => {
    const onAccept = jest.fn();
    renderWithTheme(<ScheduleCard schedule={mockSchedule} onAccept={onAccept} />);

    const acceptButton = screen.getByText('Accept');
    fireEvent.press(acceptButton);

    expect(onAccept).toHaveBeenCalledWith('1');
  });

  it('should call onDecline when decline button is pressed', () => {
    const onDecline = jest.fn();
    renderWithTheme(<ScheduleCard schedule={mockSchedule} onDecline={onDecline} />);

    const declineButton = screen.getByText('Decline');
    fireEvent.press(declineButton);

    expect(onDecline).toHaveBeenCalledWith('1');
  });

  it('should not show action buttons for non-scheduled status', () => {
    const completedSchedule = { ...mockSchedule, status: 'completed' as const };
    renderWithTheme(<ScheduleCard schedule={completedSchedule} />);

    expect(screen.queryByText('Accept')).toBeNull();
    expect(screen.queryByText('Decline')).toBeNull();
  });
});

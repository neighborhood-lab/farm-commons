import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import BreakTimer, { type Break, type BreakType } from './BreakTimer';

// Mock timers
beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe('BreakTimer', () => {
  const mockProps = {
    timeEntryId: 'test-entry-123',
    workerId: 'worker-456',
  };

  describe('Initial Render', () => {
    it('should render the component with empty state', () => {
      render(<BreakTimer {...mockProps} />);

      expect(screen.getByText('Break Time Tracking')).toBeInTheDocument();
      expect(screen.getByText('No breaks recorded yet')).toBeInTheDocument();
      expect(screen.getByText('Total break time: 00:00')).toBeInTheDocument();
    });

    it('should render all break type buttons', () => {
      render(<BreakTimer {...mockProps} />);

      expect(screen.getByText('Lunch Break')).toBeInTheDocument();
      expect(screen.getByText('Rest Break')).toBeInTheDocument();
      expect(screen.getByText('Restroom')).toBeInTheDocument();
    });

    it('should display existing breaks when provided', () => {
      const existingBreaks: Break[] = [
        {
          id: 'break-1',
          type: 'lunch',
          start: new Date('2024-01-01T12:00:00'),
          end: new Date('2024-01-01T12:30:00'),
          durationMinutes: 30,
        },
      ];

      render(<BreakTimer {...mockProps} existingBreaks={existingBreaks} />);

      expect(screen.getByText('Lunch Break')).toBeInTheDocument();
      expect(screen.getByText('30 min')).toBeInTheDocument();
      expect(screen.getByText('Total break time: 00:30')).toBeInTheDocument();
    });
  });

  describe('Starting a Break', () => {
    it('should start a lunch break when lunch button is clicked', () => {
      render(<BreakTimer {...mockProps} />);

      const lunchButton = screen.getByRole('button', { name: /Lunch Break/i });
      fireEvent.click(lunchButton);

      expect(screen.getByText(/Active/i)).toBeInTheDocument();
      expect(screen.getByText(/Started at/i)).toBeInTheDocument();
      expect(screen.getByText('00:00')).toBeInTheDocument();
    });

    it('should start a rest break when rest button is clicked', () => {
      render(<BreakTimer {...mockProps} />);

      const restButton = screen.getByRole('button', { name: /Rest Break/i });
      fireEvent.click(restButton);

      expect(screen.getByText(/Active/i)).toBeInTheDocument();
      expect(screen.getByText('00:00')).toBeInTheDocument();
    });

    it('should hide break type buttons when a break is active', () => {
      render(<BreakTimer {...mockProps} />);

      const lunchButton = screen.getByRole('button', { name: /Lunch Break/i });
      fireEvent.click(lunchButton);

      expect(screen.queryByText('Start a break:')).not.toBeInTheDocument();
    });
  });

  describe('Timer Functionality', () => {
    it('should increment timer every second', async () => {
      render(<BreakTimer {...mockProps} />);

      const lunchButton = screen.getByRole('button', { name: /Lunch Break/i });
      fireEvent.click(lunchButton);

      // Initial state
      expect(screen.getByText('00:00')).toBeInTheDocument();

      // Advance timer by 1 second
      vi.advanceTimersByTime(1000);
      await waitFor(() => {
        expect(screen.getByText('00:01')).toBeInTheDocument();
      });

      // Advance timer by 59 more seconds (total 60 seconds = 1 minute)
      vi.advanceTimersByTime(59000);
      await waitFor(() => {
        expect(screen.getByText('01:00')).toBeInTheDocument();
      });

      // Advance timer by 30 more seconds
      vi.advanceTimersByTime(30000);
      await waitFor(() => {
        expect(screen.getByText('01:30')).toBeInTheDocument();
      });
    });

    it('should format timer correctly for double-digit minutes', async () => {
      render(<BreakTimer {...mockProps} />);

      const lunchButton = screen.getByRole('button', { name: /Lunch Break/i });
      fireEvent.click(lunchButton);

      // Advance timer by 10 minutes
      vi.advanceTimersByTime(600000);
      await waitFor(() => {
        expect(screen.getByText('10:00')).toBeInTheDocument();
      });
    });
  });

  describe('Stopping a Break', () => {
    it('should stop break and add to history when End Break is clicked', async () => {
      const onBreakComplete = vi.fn();
      render(<BreakTimer {...mockProps} onBreakComplete={onBreakComplete} />);

      const lunchButton = screen.getByRole('button', { name: /Lunch Break/i });
      fireEvent.click(lunchButton);

      // Advance timer by 30 minutes
      vi.advanceTimersByTime(1800000);
      await waitFor(() => {
        expect(screen.getByText('30:00')).toBeInTheDocument();
      });

      const endButton = screen.getByRole('button', { name: /End Break/i });
      fireEvent.click(endButton);

      // Should call callback
      expect(onBreakComplete).toHaveBeenCalledTimes(1);
      expect(onBreakComplete).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'lunch',
          durationMinutes: 30,
        })
      );

      // Should show in history
      await waitFor(() => {
        expect(screen.getByText('Break History')).toBeInTheDocument();
        expect(screen.getByText('30 min')).toBeInTheDocument();
      });

      // Should update total break time
      expect(screen.getByText('Total break time: 00:30')).toBeInTheDocument();

      // Should show break buttons again
      expect(screen.getByText('Start a break:')).toBeInTheDocument();
    });

    it('should reset timer to 00:00 after stopping', async () => {
      render(<BreakTimer {...mockProps} />);

      const lunchButton = screen.getByRole('button', { name: /Lunch Break/i });
      fireEvent.click(lunchButton);

      // Advance timer
      vi.advanceTimersByTime(60000);
      await waitFor(() => {
        expect(screen.getByText('01:00')).toBeInTheDocument();
      });

      const endButton = screen.getByRole('button', { name: /End Break/i });
      fireEvent.click(endButton);

      // Start new break
      const restButton = screen.getByRole('button', { name: /Rest Break/i });
      fireEvent.click(restButton);

      // Timer should start from 00:00
      expect(screen.getByText('00:00')).toBeInTheDocument();
    });
  });

  describe('Break History', () => {
    it('should display multiple breaks in history', async () => {
      render(<BreakTimer {...mockProps} />);

      // Take first break
      const lunchButton = screen.getByRole('button', { name: /Lunch Break/i });
      fireEvent.click(lunchButton);
      vi.advanceTimersByTime(1800000); // 30 minutes
      await waitFor(() => screen.getByText('30:00'));
      fireEvent.click(screen.getByRole('button', { name: /End Break/i }));

      // Take second break
      await waitFor(() => screen.getByRole('button', { name: /Rest Break/i }));
      const restButton = screen.getByRole('button', { name: /Rest Break/i });
      fireEvent.click(restButton);
      vi.advanceTimersByTime(600000); // 10 minutes
      await waitFor(() => screen.getByText('10:00'));
      fireEvent.click(screen.getByRole('button', { name: /End Break/i }));

      // Should show both breaks
      await waitFor(() => {
        const breakHistorySection = screen.getByText('Break History').parentElement;
        expect(breakHistorySection).toBeInTheDocument();
        const minuteLabels = screen.getAllByText(/min$/);
        expect(minuteLabels).toHaveLength(2);
      });

      // Total should be 40 minutes
      expect(screen.getByText('Total break time: 00:40')).toBeInTheDocument();
    });

    it('should display correct break type icons and labels in history', async () => {
      const existingBreaks: Break[] = [
        {
          id: 'break-1',
          type: 'lunch',
          start: new Date('2024-01-01T12:00:00'),
          end: new Date('2024-01-01T12:30:00'),
          durationMinutes: 30,
        },
        {
          id: 'break-2',
          type: 'rest',
          start: new Date('2024-01-01T15:00:00'),
          end: new Date('2024-01-01T15:10:00'),
          durationMinutes: 10,
        },
      ];

      render(<BreakTimer {...mockProps} existingBreaks={existingBreaks} />);

      expect(screen.getByText('Break History')).toBeInTheDocument();
      const lunchBreaks = screen.getAllByText('Lunch Break');
      const restBreaks = screen.getAllByText('Rest Break');
      expect(lunchBreaks.length).toBeGreaterThan(0);
      expect(restBreaks.length).toBeGreaterThan(0);
    });
  });

  describe('Compliance Warnings', () => {
    it('should show lunch break warning when minimum not met', () => {
      render(
        <BreakTimer
          {...mockProps}
          minLunchBreakMinutes={30}
          workHoursForLunchRequirement={6}
        />
      );

      expect(screen.getByText('Break Requirements')).toBeInTheDocument();
      expect(screen.getByText(/Lunch break required/i)).toBeInTheDocument();
      expect(screen.getByText(/Minimum 30 minutes/i)).toBeInTheDocument();
    });

    it('should show rest break warning when minimum not met', () => {
      render(<BreakTimer {...mockProps} minRestBreakMinutes={10} />);

      expect(screen.getByText('Break Requirements')).toBeInTheDocument();
      expect(screen.getByText(/Rest break recommended/i)).toBeInTheDocument();
    });

    it('should hide warnings when break is active', () => {
      render(
        <BreakTimer
          {...mockProps}
          minLunchBreakMinutes={30}
          workHoursForLunchRequirement={6}
        />
      );

      expect(screen.getByText('Break Requirements')).toBeInTheDocument();

      const lunchButton = screen.getByRole('button', { name: /Lunch Break/i });
      fireEvent.click(lunchButton);

      expect(screen.queryByText('Break Requirements')).not.toBeInTheDocument();
    });

    it('should not show lunch warning when requirement is met', () => {
      const existingBreaks: Break[] = [
        {
          id: 'break-1',
          type: 'lunch',
          start: new Date('2024-01-01T12:00:00'),
          end: new Date('2024-01-01T12:30:00'),
          durationMinutes: 30,
        },
      ];

      render(
        <BreakTimer
          {...mockProps}
          existingBreaks={existingBreaks}
          minLunchBreakMinutes={30}
          workHoursForLunchRequirement={6}
        />
      );

      expect(screen.queryByText('Break Requirements')).not.toBeInTheDocument();
    });

    it('should show compliance info with minutes taken', () => {
      const existingBreaks: Break[] = [
        {
          id: 'break-1',
          type: 'lunch',
          start: new Date('2024-01-01T12:00:00'),
          end: new Date('2024-01-01T12:15:00'),
          durationMinutes: 15,
        },
      ];

      render(
        <BreakTimer
          {...mockProps}
          existingBreaks={existingBreaks}
          minLunchBreakMinutes={30}
          workHoursForLunchRequirement={6}
        />
      );

      expect(screen.getByText(/15 minutes taken/i)).toBeInTheDocument();
    });
  });

  describe('Total Break Time Calculation', () => {
    it('should calculate total break time correctly', () => {
      const existingBreaks: Break[] = [
        {
          id: 'break-1',
          type: 'lunch',
          start: new Date(),
          end: new Date(),
          durationMinutes: 30,
        },
        {
          id: 'break-2',
          type: 'rest',
          start: new Date(),
          end: new Date(),
          durationMinutes: 15,
        },
        {
          id: 'break-3',
          type: 'restroom',
          start: new Date(),
          end: new Date(),
          durationMinutes: 5,
        },
      ];

      render(<BreakTimer {...mockProps} existingBreaks={existingBreaks} />);

      // Total should be 50 minutes = 0:50
      expect(screen.getByText('Total break time: 00:50')).toBeInTheDocument();
    });

    it('should format hours correctly when over 60 minutes', () => {
      const existingBreaks: Break[] = [
        {
          id: 'break-1',
          type: 'lunch',
          start: new Date(),
          end: new Date(),
          durationMinutes: 90,
        },
      ];

      render(<BreakTimer {...mockProps} existingBreaks={existingBreaks} />);

      // 90 minutes = 1:30
      expect(screen.getByText('Total break time: 01:30')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle rapid start/stop clicks', async () => {
      render(<BreakTimer {...mockProps} />);

      const lunchButton = screen.getByRole('button', { name: /Lunch Break/i });
      fireEvent.click(lunchButton);

      vi.advanceTimersByTime(1000);

      const endButton = screen.getByRole('button', { name: /End Break/i });
      fireEvent.click(endButton);
      fireEvent.click(endButton); // Second click should do nothing

      await waitFor(() => {
        expect(screen.getByText('Break History')).toBeInTheDocument();
      });

      // Should only have one break in history
      const minuteLabels = screen.getAllByText(/min$/);
      expect(minuteLabels).toHaveLength(1);
    });

    it('should handle zero work hours requirement', () => {
      render(
        <BreakTimer
          {...mockProps}
          minLunchBreakMinutes={30}
          workHoursForLunchRequirement={0}
        />
      );

      // Should not show lunch requirement warning
      expect(screen.queryByText(/Lunch break required/i)).not.toBeInTheDocument();
    });
  });
});

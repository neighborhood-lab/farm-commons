import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import NotificationSettingsPage from './NotificationSettingsPage';

describe('NotificationSettingsPage', () => {
  beforeEach(() => {
    // Reset any mocks before each test
    vi.clearAllMocks();
  });

  it('renders the notification settings page with title', () => {
    render(<NotificationSettingsPage />);

    expect(screen.getByText('Notification Settings')).toBeInTheDocument();
    expect(
      screen.getByText('Manage how and when you receive notifications about farm activities')
    ).toBeInTheDocument();
  });

  describe('Email Notifications', () => {
    it('renders all email notification toggles', () => {
      render(<NotificationSettingsPage />);

      expect(screen.getByText('Email Notifications')).toBeInTheDocument();
      expect(screen.getByText('Schedule Changes')).toBeInTheDocument();
      expect(screen.getByText('Certification Expiring')).toBeInTheDocument();
      expect(screen.getByText('Time Entry Reminders')).toBeInTheDocument();
      expect(screen.getByText('Weekly Digest')).toBeInTheDocument();
    });

    it('toggles email notification preferences', () => {
      render(<NotificationSettingsPage />);

      const scheduleChangesToggle = screen.getAllByRole('button', { pressed: true })[0];

      // Click to toggle off
      fireEvent.click(scheduleChangesToggle);

      // The state should update (toggle button should now be off)
      expect(scheduleChangesToggle).toHaveAttribute('aria-pressed', 'false');
    });

    it('has correct initial state for email notifications', () => {
      render(<NotificationSettingsPage />);

      const toggleButtons = screen.getAllByRole('button');

      // Based on initial state in component:
      // Schedule Changes: true
      // Certification Expiring: true
      // Time Entry Reminders: false
      // Weekly Digest: true
      // Schedule Changes (SMS): true
      // Emergency Alerts: true
      // Clock In Reminders: false
      // Quiet Hours: false

      // Filter only the toggle switches (not the save/test buttons)
      const toggleSwitches = toggleButtons.filter((button) =>
        button.className.includes('inline-flex h-6 w-11')
      );

      // First 4 are email toggles
      expect(toggleSwitches[0]).toHaveAttribute('aria-pressed', 'true'); // Schedule Changes
      expect(toggleSwitches[1]).toHaveAttribute('aria-pressed', 'true'); // Certification Expiring
      expect(toggleSwitches[2]).toHaveAttribute('aria-pressed', 'false'); // Time Entry Reminders
      expect(toggleSwitches[3]).toHaveAttribute('aria-pressed', 'true'); // Weekly Digest
    });
  });

  describe('SMS Notifications', () => {
    it('renders all SMS notification toggles', () => {
      render(<NotificationSettingsPage />);

      expect(screen.getByText('SMS Notifications')).toBeInTheDocument();
      expect(screen.getByText('Text alerts for last-minute schedule changes')).toBeInTheDocument();
      expect(screen.getByText('Emergency Alerts')).toBeInTheDocument();
      expect(screen.getByText('Clock-In Reminders')).toBeInTheDocument();
    });

    it('toggles SMS notification preferences', () => {
      render(<NotificationSettingsPage />);

      const toggleButtons = screen.getAllByRole('button');
      const toggleSwitches = toggleButtons.filter((button) =>
        button.className.includes('inline-flex h-6 w-11')
      );

      // Find Emergency Alerts toggle (5th toggle)
      const emergencyAlertsToggle = toggleSwitches[5];

      // Should be initially true
      expect(emergencyAlertsToggle).toHaveAttribute('aria-pressed', 'true');

      // Click to toggle off
      fireEvent.click(emergencyAlertsToggle);

      // Should now be false
      expect(emergencyAlertsToggle).toHaveAttribute('aria-pressed', 'false');
    });
  });

  describe('Timing Preferences', () => {
    it('renders timing preferences section', () => {
      render(<NotificationSettingsPage />);

      expect(screen.getByText('Notification Timing')).toBeInTheDocument();
      expect(screen.getByText('Enable Quiet Hours')).toBeInTheDocument();
    });

    it('shows quiet hours time inputs when enabled', () => {
      render(<NotificationSettingsPage />);

      // Quiet hours should be initially disabled
      expect(screen.queryByLabelText('Start Time')).not.toBeInTheDocument();

      const toggleButtons = screen.getAllByRole('button');
      const toggleSwitches = toggleButtons.filter((button) =>
        button.className.includes('inline-flex h-6 w-11')
      );

      // Last toggle is for quiet hours
      const quietHoursToggle = toggleSwitches[toggleSwitches.length - 1];

      // Enable quiet hours
      fireEvent.click(quietHoursToggle);

      // Time inputs should now be visible
      expect(screen.getByLabelText('Start Time')).toBeInTheDocument();
      expect(screen.getByLabelText('End Time')).toBeInTheDocument();
    });

    it('updates quiet hours time values', () => {
      render(<NotificationSettingsPage />);

      const toggleButtons = screen.getAllByRole('button');
      const toggleSwitches = toggleButtons.filter((button) =>
        button.className.includes('inline-flex h-6 w-11')
      );

      // Enable quiet hours
      const quietHoursToggle = toggleSwitches[toggleSwitches.length - 1];
      fireEvent.click(quietHoursToggle);

      const startTimeInput = screen.getByLabelText('Start Time') as HTMLInputElement;
      const endTimeInput = screen.getByLabelText('End Time') as HTMLInputElement;

      // Initial values
      expect(startTimeInput.value).toBe('22:00');
      expect(endTimeInput.value).toBe('07:00');

      // Update start time
      fireEvent.change(startTimeInput, { target: { value: '23:00' } });
      expect(startTimeInput.value).toBe('23:00');

      // Update end time
      fireEvent.change(endTimeInput, { target: { value: '06:00' } });
      expect(endTimeInput.value).toBe('06:00');
    });
  });

  describe('Save Functionality', () => {
    it('saves preferences when save button is clicked', async () => {
      render(<NotificationSettingsPage />);

      const saveButton = screen.getByText('Save Preferences');

      fireEvent.click(saveButton);

      // Button should show "Saving..." while processing
      await waitFor(() => {
        expect(screen.getByText('Saving...')).toBeInTheDocument();
      });

      // After save completes, success message should appear
      await waitFor(
        () => {
          expect(screen.getByText('Preferences saved successfully!')).toBeInTheDocument();
        },
        { timeout: 2000 }
      );
    });

    it('disables save button while saving', async () => {
      render(<NotificationSettingsPage />);

      const saveButton = screen.getByText('Save Preferences') as HTMLButtonElement;

      expect(saveButton.disabled).toBe(false);

      fireEvent.click(saveButton);

      // Should be disabled while saving
      await waitFor(() => {
        expect(saveButton.disabled).toBe(true);
      });
    });
  });

  describe('Test Notification', () => {
    it('sends test notification when button is clicked', async () => {
      render(<NotificationSettingsPage />);

      const testButton = screen.getByText('Send Test Notification');

      fireEvent.click(testButton);

      // Success message should appear
      await waitFor(
        () => {
          expect(screen.getByText('Test notification sent!')).toBeInTheDocument();
        },
        { timeout: 1000 }
      );
    });
  });

  describe('Help Text', () => {
    it('displays help information', () => {
      render(<NotificationSettingsPage />);

      expect(screen.getByText(/Notification preferences are saved per user/)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has accessible toggle buttons with aria-pressed attribute', () => {
      render(<NotificationSettingsPage />);

      const toggleButtons = screen.getAllByRole('button');
      const toggleSwitches = toggleButtons.filter((button) =>
        button.className.includes('inline-flex h-6 w-11')
      );

      // All toggle switches should have aria-pressed attribute
      toggleSwitches.forEach((toggle) => {
        expect(toggle).toHaveAttribute('aria-pressed');
      });
    });

    it('has proper form labels for time inputs', () => {
      render(<NotificationSettingsPage />);

      const toggleButtons = screen.getAllByRole('button');
      const toggleSwitches = toggleButtons.filter((button) =>
        button.className.includes('inline-flex h-6 w-11')
      );

      // Enable quiet hours to show time inputs
      const quietHoursToggle = toggleSwitches[toggleSwitches.length - 1];
      fireEvent.click(quietHoursToggle);

      // Check that inputs have associated labels
      const startTimeInput = screen.getByLabelText('Start Time');
      const endTimeInput = screen.getByLabelText('End Time');

      expect(startTimeInput).toBeInTheDocument();
      expect(endTimeInput).toBeInTheDocument();
    });
  });
});

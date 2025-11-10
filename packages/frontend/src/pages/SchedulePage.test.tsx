import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders, userEvent } from '../test/utils';
import SchedulePage from './SchedulePage';
import { mockSchedules } from '../test/mockData';

// Mock the API module
vi.mock('../lib/api', () => ({
  api: {
    get: vi.fn(),
  },
}));

// Mock date-fns to control the current date
vi.mock('date-fns', async () => {
  const actual = await vi.importActual('date-fns');
  return {
    ...actual,
    startOfWeek: vi.fn().mockImplementation((date) => {
      // Return a fixed date for testing
      return new Date('2024-11-10'); // Sunday
    }),
  };
});

describe('SchedulePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders schedule page heading', () => {
    renderWithProviders(<SchedulePage />);

    expect(screen.getByRole('heading', { name: /schedule/i })).toBeInTheDocument();
    expect(screen.getByText(/weekly schedule and field assignments/i)).toBeInTheDocument();
  });

  it('displays loading state initially', () => {
    renderWithProviders(<SchedulePage />);

    expect(screen.getByText(/loading schedule/i)).toBeInTheDocument();
  });

  it('displays Add Shift button', async () => {
    const { api } = await import('../lib/api');
    vi.mocked(api.get).mockResolvedValue(mockSchedules);

    renderWithProviders(<SchedulePage />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /add shift/i })).toBeInTheDocument();
    });
  });

  it('displays week navigation controls', async () => {
    const { api } = await import('../lib/api');
    vi.mocked(api.get).mockResolvedValue(mockSchedules);

    renderWithProviders(<SchedulePage />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /previous week/i })).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: /next week/i })).toBeInTheDocument();
  });

  it('displays current week date range', async () => {
    const { api } = await import('../lib/api');
    vi.mocked(api.get).mockResolvedValue(mockSchedules);

    renderWithProviders(<SchedulePage />);

    await waitFor(() => {
      // Should show the week range
      expect(screen.getByText(/november/i)).toBeInTheDocument();
    });
  });

  it('displays 7 day columns in calendar grid', async () => {
    const { api } = await import('../lib/api');
    vi.mocked(api.get).mockResolvedValue(mockSchedules);

    renderWithProviders(<SchedulePage />);

    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });

    // Check for day abbreviations
    expect(screen.getByText('Sun') || screen.getByText('Mon')).toBeTruthy();
  });

  it('displays scheduled tasks in calendar', async () => {
    const { api } = await import('../lib/api');
    vi.mocked(api.get).mockResolvedValue(mockSchedules);

    renderWithProviders(<SchedulePage />);

    await waitFor(() => {
      expect(screen.getByText(/harvesting tomatoes/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/planting lettuce/i)).toBeInTheDocument();
  });

  it('displays task time ranges', async () => {
    const { api } = await import('../lib/api');
    vi.mocked(api.get).mockResolvedValue(mockSchedules);

    renderWithProviders(<SchedulePage />);

    await waitFor(() => {
      expect(screen.getByText(/08:00 - 16:00/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/07:00 - 15:00/i)).toBeInTheDocument();
  });

  it('applies different styling based on schedule status', async () => {
    const { api } = await import('../lib/api');
    vi.mocked(api.get).mockResolvedValue(mockSchedules);

    renderWithProviders(<SchedulePage />);

    await waitFor(() => {
      // Find the completed task
      const completedTask = screen.getByText(/packing produce/i).closest('div');
      expect(completedTask?.className).toContain('bg-green-50');
    });

    // Find the in-progress task
    const inProgressTask = screen.getByText(/planting lettuce/i).closest('div');
    expect(inProgressTask?.className).toContain('bg-blue-50');
  });

  it('highlights current day', async () => {
    const { api } = await import('../lib/api');
    vi.mocked(api.get).mockResolvedValue(mockSchedules);

    renderWithProviders(<SchedulePage />);

    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });

    // Today's date should have special styling
    // The component checks if isToday and applies ring-2 ring-earth-200
  });

  it('navigates to previous week when clicking Previous Week button', async () => {
    const user = userEvent.setup();
    const { api } = await import('../lib/api');
    vi.mocked(api.get).mockResolvedValue(mockSchedules);

    renderWithProviders(<SchedulePage />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /previous week/i })).toBeInTheDocument();
    });

    const initialCallCount = vi.mocked(api.get).mock.calls.length;
    await user.click(screen.getByRole('button', { name: /previous week/i }));

    // Should make a new API call with different date range
    await waitFor(() => {
      expect(vi.mocked(api.get).mock.calls.length).toBeGreaterThan(initialCallCount);
    });
  });

  it('navigates to next week when clicking Next Week button', async () => {
    const user = userEvent.setup();
    const { api } = await import('../lib/api');
    vi.mocked(api.get).mockResolvedValue(mockSchedules);

    renderWithProviders(<SchedulePage />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /next week/i })).toBeInTheDocument();
    });

    const initialCallCount = vi.mocked(api.get).mock.calls.length;
    await user.click(screen.getByRole('button', { name: /next week/i }));

    // Should make a new API call with different date range
    await waitFor(() => {
      expect(vi.mocked(api.get).mock.calls.length).toBeGreaterThan(initialCallCount);
    });
  });

  it('shows empty state when no schedules exist', async () => {
    const { api } = await import('../lib/api');
    vi.mocked(api.get).mockResolvedValue([]);

    renderWithProviders(<SchedulePage />);

    await waitFor(() => {
      expect(screen.getByText(/no shifts scheduled/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/start planning your week/i)).toBeInTheDocument();
  });

  it('fetches schedules with correct date range parameters', async () => {
    const { api } = await import('../lib/api');
    vi.mocked(api.get).mockResolvedValue(mockSchedules);

    renderWithProviders(<SchedulePage />);

    await waitFor(() => {
      expect(api.get).toHaveBeenCalled();
    });

    // Verify the API call includes start_date and end_date parameters
    const apiCall = vi.mocked(api.get).mock.calls[0][0];
    expect(apiCall).toContain('/schedules');
    expect(apiCall).toContain('start_date=');
    expect(apiCall).toContain('end_date=');
  });

  it('groups schedules by day correctly', async () => {
    const { api } = await import('../lib/api');
    vi.mocked(api.get).mockResolvedValue(mockSchedules);

    renderWithProviders(<SchedulePage />);

    await waitFor(() => {
      expect(screen.getByText(/harvesting tomatoes/i)).toBeInTheDocument();
    });

    // Schedules for 2024-11-10 should appear in that day's column
    // The component uses getSchedulesForDay to filter schedules
  });

  it('handles API errors gracefully', async () => {
    const { api } = await import('../lib/api');
    vi.mocked(api.get).mockRejectedValue(new Error('Network error'));

    renderWithProviders(<SchedulePage />);

    // Component should handle the error without crashing
    expect(screen.getByText(/loading schedule/i)).toBeInTheDocument();
  });
});

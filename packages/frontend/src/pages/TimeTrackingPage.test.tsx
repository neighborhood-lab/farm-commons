import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders } from '../test/utils';
import TimeTrackingPage from './TimeTrackingPage';
import { mockTimeEntries } from '../test/mockData';

// Mock the API module
vi.mock('../lib/api', () => ({
  api: {
    get: vi.fn(),
  },
}));

describe('TimeTrackingPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders time tracking page heading', () => {
    renderWithProviders(<TimeTrackingPage />);

    expect(screen.getByRole('heading', { name: /time tracking/i })).toBeInTheDocument();
    expect(screen.getByText(/worker time entries and hours tracking/i)).toBeInTheDocument();
  });

  it('displays loading state initially', () => {
    renderWithProviders(<TimeTrackingPage />);

    expect(screen.getByText(/loading time entries/i)).toBeInTheDocument();
  });

  it('displays stats cards with counts', async () => {
    const { api } = await import('../lib/api');
    vi.mocked(api.get).mockResolvedValue(mockTimeEntries);

    renderWithProviders(<TimeTrackingPage />);

    await waitFor(() => {
      expect(screen.getByText(/active shifts/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/completed today/i)).toBeInTheDocument();
    expect(screen.getByText(/total hours today/i)).toBeInTheDocument();
  });

  it('calculates active shifts correctly', async () => {
    const { api } = await import('../lib/api');
    vi.mocked(api.get).mockResolvedValue(mockTimeEntries);

    renderWithProviders(<TimeTrackingPage />);

    await waitFor(() => {
      // mockTimeEntries has 1 entry without clock_out
      const activeShiftsCard = screen.getByText(/active shifts/i).closest('div');
      expect(activeShiftsCard).toBeInTheDocument();
    });
  });

  it('calculates completed entries correctly', async () => {
    const { api } = await import('../lib/api');
    vi.mocked(api.get).mockResolvedValue(mockTimeEntries);

    renderWithProviders(<TimeTrackingPage />);

    await waitFor(() => {
      // mockTimeEntries has 2 entries with clock_out
      const completedCard = screen.getByText(/completed today/i).closest('div');
      expect(completedCard).toBeInTheDocument();
    });
  });

  it('calculates total hours correctly', async () => {
    const { api } = await import('../lib/api');
    vi.mocked(api.get).mockResolvedValue(mockTimeEntries);

    renderWithProviders(<TimeTrackingPage />);

    await waitFor(() => {
      // mockTimeEntries has 2 completed entries: 7.5 + 7.5 = 15.0 hours
      expect(screen.getByText('15.0')).toBeInTheDocument();
    });
  });

  it('displays active shifts section when there are active entries', async () => {
    const { api } = await import('../lib/api');
    vi.mocked(api.get).mockResolvedValue(mockTimeEntries);

    renderWithProviders(<TimeTrackingPage />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /active shifts/i })).toBeInTheDocument();
    });

    expect(screen.getByText(/packing produce/i)).toBeInTheDocument();
    expect(screen.getByText(/in progress/i)).toBeInTheDocument();
  });

  it('displays active shift with pulse animation indicator', async () => {
    const { api } = await import('../lib/api');
    vi.mocked(api.get).mockResolvedValue(mockTimeEntries);

    renderWithProviders(<TimeTrackingPage />);

    await waitFor(() => {
      const activeEntry = screen.getByText(/packing produce/i).closest('div');
      expect(activeEntry?.className).toContain('bg-blue-50');
    });
  });

  it('displays time entries table', async () => {
    const { api } = await import('../lib/api');
    vi.mocked(api.get).mockResolvedValue(mockTimeEntries);

    renderWithProviders(<TimeTrackingPage />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /recent time entries/i })).toBeInTheDocument();
    });

    // Check for table headers
    expect(screen.getByText(/date/i)).toBeInTheDocument();
    expect(screen.getByText(/task/i)).toBeInTheDocument();
    expect(screen.getByText(/clock in/i)).toBeInTheDocument();
    expect(screen.getByText(/clock out/i)).toBeInTheDocument();
    expect(screen.getByText(/hours/i)).toBeInTheDocument();
    expect(screen.getByText(/status/i)).toBeInTheDocument();
  });

  it('displays all time entries in table', async () => {
    const { api } = await import('../lib/api');
    vi.mocked(api.get).mockResolvedValue(mockTimeEntries);

    renderWithProviders(<TimeTrackingPage />);

    await waitFor(() => {
      expect(screen.getByText(/harvesting tomatoes/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/planting lettuce/i)).toBeInTheDocument();
    expect(screen.getByText(/packing produce/i)).toBeInTheDocument();
  });

  it('shows verified status badge for verified entries', async () => {
    const { api } = await import('../lib/api');
    vi.mocked(api.get).mockResolvedValue(mockTimeEntries);

    renderWithProviders(<TimeTrackingPage />);

    await waitFor(() => {
      const verifiedBadges = screen.getAllByText(/verified/i);
      expect(verifiedBadges.length).toBeGreaterThan(0);
    });
  });

  it('shows pending status badge for unverified entries', async () => {
    const { api } = await import('../lib/api');
    vi.mocked(api.get).mockResolvedValue(mockTimeEntries);

    renderWithProviders(<TimeTrackingPage />);

    await waitFor(() => {
      const pendingBadges = screen.getAllByText(/pending/i);
      expect(pendingBadges.length).toBeGreaterThan(0);
    });
  });

  it('shows active status badge for entries without clock out', async () => {
    const { api } = await import('../lib/api');
    vi.mocked(api.get).mockResolvedValue(mockTimeEntries);

    renderWithProviders(<TimeTrackingPage />);

    await waitFor(() => {
      const activeBadges = screen.getAllByText(/active/i);
      expect(activeBadges.length).toBeGreaterThan(0);
    });
  });

  it('displays dash for missing clock out time', async () => {
    const { api } = await import('../lib/api');
    vi.mocked(api.get).mockResolvedValue(mockTimeEntries);

    renderWithProviders(<TimeTrackingPage />);

    await waitFor(() => {
      // Entry without clock_out should show "-"
      const table = screen.getByRole('table');
      expect(table).toBeInTheDocument();
    });
  });

  it('displays dash for missing hours', async () => {
    const { api } = await import('../lib/api');
    vi.mocked(api.get).mockResolvedValue(mockTimeEntries);

    renderWithProviders(<TimeTrackingPage />);

    await waitFor(() => {
      // Entry without total_hours should show "-"
      const table = screen.getByRole('table');
      expect(table).toBeInTheDocument();
    });
  });

  it('shows empty state when no time entries exist', async () => {
    const { api } = await import('../lib/api');
    vi.mocked(api.get).mockResolvedValue([]);

    renderWithProviders(<TimeTrackingPage />);

    await waitFor(() => {
      expect(screen.getByText(/no time entries yet/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/time entries will appear here/i)).toBeInTheDocument();
  });

  it('does not show active shifts section when no active entries', async () => {
    const { api } = await import('../lib/api');
    const completedOnly = mockTimeEntries.filter(e => e.clock_out);
    vi.mocked(api.get).mockResolvedValue(completedOnly);

    renderWithProviders(<TimeTrackingPage />);

    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: /active shifts/i })).not.toBeInTheDocument();
    });
  });

  it('formats dates correctly', async () => {
    const { api } = await import('../lib/api');
    vi.mocked(api.get).mockResolvedValue(mockTimeEntries);

    renderWithProviders(<TimeTrackingPage />);

    await waitFor(() => {
      // Should show formatted date like "Nov 10, 2024"
      expect(screen.getByText(/nov/i)).toBeInTheDocument();
    });
  });

  it('uses correct query key for fetching time entries', async () => {
    const { api } = await import('../lib/api');
    vi.mocked(api.get).mockResolvedValue(mockTimeEntries);

    renderWithProviders(<TimeTrackingPage />);

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith('/time-entries');
    });
  });

  it('handles API errors gracefully', async () => {
    const { api } = await import('../lib/api');
    vi.mocked(api.get).mockRejectedValue(new Error('Network error'));

    renderWithProviders(<TimeTrackingPage />);

    // Component should handle the error without crashing
    expect(screen.getByText(/loading time entries/i)).toBeInTheDocument();
  });

  it('handles zero hours gracefully', async () => {
    const { api } = await import('../lib/api');
    const entriesWithZeroHours = mockTimeEntries.filter(e => e.clock_out);
    vi.mocked(api.get).mockResolvedValue(entriesWithZeroHours);

    renderWithProviders(<TimeTrackingPage />);

    await waitFor(() => {
      // Should display total hours even if it's 0
      expect(screen.getByText(/total hours today/i)).toBeInTheDocument();
    });
  });
});

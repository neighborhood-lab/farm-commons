import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders } from '../test/utils';
import DashboardPage from './DashboardPage';
import { mockFarmStats } from '../test/mockData';

// Mock the API module
vi.mock('../lib/api', () => ({
  api: {
    get: vi.fn(),
  },
}));

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders dashboard heading and description', () => {
    renderWithProviders(<DashboardPage />);

    expect(screen.getByRole('heading', { name: /dashboard/i })).toBeInTheDocument();
    expect(screen.getByText(/overview of your farm operations/i)).toBeInTheDocument();
  });

  it('displays loading state initially', () => {
    renderWithProviders(<DashboardPage />);

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('displays all stat cards with correct data', async () => {
    const { api } = await import('../lib/api');
    vi.mocked(api.get).mockResolvedValue(mockFarmStats);

    renderWithProviders(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('Active Workers')).toBeInTheDocument();
      expect(screen.getByText(`${mockFarmStats.active_workers}`)).toBeInTheDocument();
      expect(screen.getByText(`/${mockFarmStats.total_workers}`)).toBeInTheDocument();
    });

    expect(screen.getByText('Shifts Today')).toBeInTheDocument();
    expect(screen.getByText(`${mockFarmStats.scheduled_shifts_today}`)).toBeInTheDocument();

    expect(screen.getByText('Hours This Week')).toBeInTheDocument();
    expect(screen.getByText(`${mockFarmStats.total_hours_this_week}`)).toBeInTheDocument();

    expect(screen.getByText('Fields')).toBeInTheDocument();
    expect(screen.getByText(`${mockFarmStats.total_fields}`)).toBeInTheDocument();
  });

  it('displays placeholder data when API is loading', async () => {
    renderWithProviders(<DashboardPage />);

    // The component should eventually show some data (placeholder or real)
    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });
  });

  it('displays welcome message and MVP features', async () => {
    const { api } = await import('../lib/api');
    vi.mocked(api.get).mockResolvedValue(mockFarmStats);

    renderWithProviders(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText(/welcome to farm commons mvp/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/worker management/i)).toBeInTheDocument();
    expect(screen.getByText(/scheduling/i)).toBeInTheDocument();
    expect(screen.getByText(/time tracking/i)).toBeInTheDocument();
  });

  it('displays community messaging', async () => {
    const { api } = await import('../lib/api');
    vi.mocked(api.get).mockResolvedValue(mockFarmStats);

    renderWithProviders(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText(/built for farmworkers and small-scale farmers/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/community owned/i)).toBeInTheDocument();
    expect(screen.getByText(/agpl-3.0 licensed/i)).toBeInTheDocument();
  });

  it('renders all stat card icons', async () => {
    const { api } = await import('../lib/api');
    vi.mocked(api.get).mockResolvedValue(mockFarmStats);

    renderWithProviders(<DashboardPage />);

    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });

    // All 4 stat cards should be rendered
    const statCards = screen.getAllByRole('generic').filter(
      (el) => el.className.includes('bg-white') && el.className.includes('rounded-lg')
    );
    // We expect at least the stat cards to be present
    expect(statCards.length).toBeGreaterThanOrEqual(4);
  });

  it('handles zero values in stats gracefully', async () => {
    const { api } = await import('../lib/api');
    const emptyStats = {
      total_workers: 0,
      active_workers: 0,
      total_fields: 0,
      total_hours_this_week: 0,
      scheduled_shifts_today: 0,
    };
    vi.mocked(api.get).mockResolvedValue(emptyStats);

    renderWithProviders(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('Active Workers')).toBeInTheDocument();
    });

    // Should display 0 values
    const zeros = screen.getAllByText('0');
    expect(zeros.length).toBeGreaterThan(0);
  });

  it('uses correct query key for fetching stats', async () => {
    const { api } = await import('../lib/api');
    vi.mocked(api.get).mockResolvedValue(mockFarmStats);

    renderWithProviders(<DashboardPage />);

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith('/stats/farm');
    });
  });
});

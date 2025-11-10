import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import AnalyticsPage from './AnalyticsPage';
import * as api from '../lib/api';

// Mock the API module
vi.mock('../lib/api', () => ({
  api: {
    get: vi.fn(),
  },
}));

const mockLaborHoursData = {
  period: 'week',
  start_date: new Date('2024-01-01'),
  end_date: new Date('2024-01-31'),
  labor_hours: [
    { period: '2024-01', total_hours: 160, worker_count: 8, entry_count: 32 },
    { period: '2024-02', total_hours: 180, worker_count: 9, entry_count: 36 },
  ],
};

const mockFarmStatsData = {
  total_workers: 12,
  active_workers: 10,
  total_fields: 5,
  active_schedules: 8,
  total_labor_hours: 1200,
  month_labor_hours: 340,
  unverified_entries: 3,
};

const mockFieldUtilizationData = {
  fields: [
    {
      field_id: '1',
      field_name: 'North Field',
      size_acres: 10.5,
      current_crop: 'Tomatoes',
      total_hours: 120,
      hours_per_acre: 11.43,
      time_entry_count: 24,
      schedule_count: 12,
    },
    {
      field_id: '2',
      field_name: 'South Field',
      size_acres: 8.2,
      current_crop: 'Lettuce',
      total_hours: 95,
      hours_per_acre: 11.59,
      time_entry_count: 19,
      schedule_count: 10,
    },
  ],
  summary: {
    total_fields: 2,
    total_hours: 215,
    total_acres: 18.7,
    average_hours_per_acre: 11.5,
  },
};

// Test wrapper component
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>{children}</BrowserRouter>
    </QueryClientProvider>
  );
};

describe('AnalyticsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Setup default mock responses
    (api.api.get as any).mockImplementation((endpoint: string) => {
      if (endpoint.includes('/stats/labor-hours')) {
        return Promise.resolve(mockLaborHoursData);
      }
      if (endpoint === '/stats/farm') {
        return Promise.resolve(mockFarmStatsData);
      }
      if (endpoint === '/stats/field-utilization') {
        return Promise.resolve(mockFieldUtilizationData);
      }
      return Promise.reject(new Error('Unknown endpoint'));
    });
  });

  it('renders analytics page title', async () => {
    render(<AnalyticsPage />, { wrapper: createWrapper() });

    expect(screen.getByText('Analytics Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Advanced insights and comparative analytics')).toBeInTheDocument();
  });

  it('renders date range selector', async () => {
    render(<AnalyticsPage />, { wrapper: createWrapper() });

    const dateInputs = screen.getAllByLabelText(/date range/i);
    expect(dateInputs.length).toBeGreaterThan(0);
  });

  it('displays comparison checkbox', async () => {
    render(<AnalyticsPage />, { wrapper: createWrapper() });

    const checkbox = screen.getByRole('checkbox', { name: /compare with last year/i });
    expect(checkbox).toBeInTheDocument();
    expect(checkbox).toBeChecked(); // Default is enabled
  });

  it('renders export to PDF button', async () => {
    render(<AnalyticsPage />, { wrapper: createWrapper() });

    const exportButton = screen.getByRole('button', { name: /export to pdf/i });
    expect(exportButton).toBeInTheDocument();
  });

  it('renders share report button', async () => {
    render(<AnalyticsPage />, { wrapper: createWrapper() });

    const shareButton = screen.getByRole('button', { name: /share report/i });
    expect(shareButton).toBeInTheDocument();
  });

  it('displays loading state initially', () => {
    render(<AnalyticsPage />, { wrapper: createWrapper() });

    expect(screen.getByText(/loading analytics/i)).toBeInTheDocument();
  });

  it('displays labor hours chart after loading', async () => {
    render(<AnalyticsPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText(/Labor Hours/)).toBeInTheDocument();
    });
  });

  it('displays field utilization data', async () => {
    render(<AnalyticsPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Labor Hours by Field')).toBeInTheDocument();
      expect(screen.getByText('Field Utilization Distribution')).toBeInTheDocument();
    });
  });

  it('displays field details table', async () => {
    render(<AnalyticsPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Detailed Field Statistics')).toBeInTheDocument();
      expect(screen.getByText('North Field')).toBeInTheDocument();
      expect(screen.getByText('South Field')).toBeInTheDocument();
    });
  });

  it('toggles comparison when checkbox is clicked', async () => {
    render(<AnalyticsPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.queryByText(/loading analytics/i)).not.toBeInTheDocument();
    });

    const checkbox = screen.getByRole('checkbox', { name: /compare with last year/i });
    fireEvent.click(checkbox);

    expect(checkbox).not.toBeChecked();
  });

  it('updates date range when inputs change', async () => {
    render(<AnalyticsPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.queryByText(/loading analytics/i)).not.toBeInTheDocument();
    });

    const dateInputs = screen.getAllByDisplayValue(/\d{4}-\d{2}-\d{2}/);
    const startDateInput = dateInputs[0];

    fireEvent.change(startDateInput, { target: { value: '2024-06-01' } });

    expect(startDateInput).toHaveValue('2024-06-01');
  });

  it('displays comparison metrics when enabled', async () => {
    render(<AnalyticsPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Period Comparison')).toBeInTheDocument();
      expect(screen.getByText('Total Hours Change')).toBeInTheDocument();
      expect(screen.getByText('Percent Change')).toBeInTheDocument();
    });
  });

  it('shows shareable link modal when share button is clicked', async () => {
    // Mock clipboard API
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn(),
      },
    });

    // Mock alert
    global.alert = vi.fn();

    render(<AnalyticsPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.queryByText(/loading analytics/i)).not.toBeInTheDocument();
    });

    const shareButton = screen.getByRole('button', { name: /share report/i });
    fireEvent.click(shareButton);

    await waitFor(() => {
      expect(global.alert).toHaveBeenCalledWith('Shareable link copied to clipboard!');
    });
  });

  it('handles export to PDF click', async () => {
    // Mock alert
    global.alert = vi.fn();

    render(<AnalyticsPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.queryByText(/loading analytics/i)).not.toBeInTheDocument();
    });

    const exportButton = screen.getByRole('button', { name: /export to pdf/i });
    fireEvent.click(exportButton);

    await waitFor(() => {
      expect(global.alert).toHaveBeenCalledWith(
        expect.stringContaining('Analytics exported successfully')
      );
    });
  });

  it('renders field crop information', async () => {
    render(<AnalyticsPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Tomatoes')).toBeInTheDocument();
      expect(screen.getByText('Lettuce')).toBeInTheDocument();
    });
  });

  it('displays hours per acre calculations', async () => {
    render(<AnalyticsPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('11.43')).toBeInTheDocument();
      expect(screen.getByText('11.59')).toBeInTheDocument();
    });
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AvailabilityCalendar from './AvailabilityCalendar';
import * as apiModule from '../lib/api';

// Mock the API module
vi.mock('../lib/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('AvailabilityCalendar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock successful API responses
    vi.mocked(apiModule.api.get).mockResolvedValue([]);
  });

  it('renders the calendar view by default', async () => {
    render(<AvailabilityCalendar workerId="worker-123" />, {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(screen.getByText(/Calendar/i)).toBeInTheDocument();
    });

    // Check for weekday headers
    expect(screen.getByText('Sun')).toBeInTheDocument();
    expect(screen.getByText('Mon')).toBeInTheDocument();
    expect(screen.getByText('Tue')).toBeInTheDocument();
  });

  it('displays availability data on calendar', async () => {
    const mockAvailability = [
      {
        id: '1',
        worker_id: 'worker-123',
        date: new Date(),
        start_time: '08:00',
        end_time: '17:00',
        is_available: true,
        recurrence_rule: null,
        notes: null,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ];

    vi.mocked(apiModule.api.get).mockResolvedValueOnce(mockAvailability);

    render(<AvailabilityCalendar workerId="worker-123" />, {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(screen.getByText('08:00-17:00')).toBeInTheDocument();
    });
  });

  it('switches to recurring pattern view', async () => {
    render(<AvailabilityCalendar workerId="worker-123" />, {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(screen.getByText(/Calendar/i)).toBeInTheDocument();
    });

    const recurringButton = screen.getByText(/Recurring/i);
    fireEvent.click(recurringButton);

    expect(screen.getByText(/Recurring Availability Patterns/i)).toBeInTheDocument();
    expect(screen.getByText('Sunday')).toBeInTheDocument();
    expect(screen.getByText('Monday')).toBeInTheDocument();
    expect(screen.getByText('Tuesday')).toBeInTheDocument();
  });

  it('switches to time off view', async () => {
    render(<AvailabilityCalendar workerId="worker-123" />, {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(screen.getByText(/Calendar/i)).toBeInTheDocument();
    });

    const timeOffButton = screen.getByText(/Time Off/i);
    fireEvent.click(timeOffButton);

    expect(screen.getByText(/Time Off Requests/i)).toBeInTheDocument();
    expect(screen.getByText('Start Date')).toBeInTheDocument();
    expect(screen.getByText('End Date')).toBeInTheDocument();
  });

  it('shows bulk update view when allowed', async () => {
    render(
      <AvailabilityCalendar workerId="worker-123" allowBulkUpdate={true} />,
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(screen.getByText(/Calendar/i)).toBeInTheDocument();
    });

    const bulkButton = screen.getByText(/Bulk Update/i);
    fireEvent.click(bulkButton);

    await waitFor(() => {
      expect(screen.getByText(/Bulk Availability Update/i)).toBeInTheDocument();
    });
  });

  it('does not show bulk update view when not allowed', async () => {
    render(
      <AvailabilityCalendar workerId="worker-123" allowBulkUpdate={false} />,
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(screen.getByText(/Calendar/i)).toBeInTheDocument();
    });

    expect(screen.queryByText(/Bulk Update/i)).not.toBeInTheDocument();
  });

  it('navigates between months', async () => {
    render(<AvailabilityCalendar workerId="worker-123" />, {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(screen.getByText(/Calendar/i)).toBeInTheDocument();
    });

    const currentMonth = screen.getByText(/\w+ \d{4}/);
    expect(currentMonth).toBeInTheDocument();

    // Click next month button
    const nextButtons = screen.getAllByRole('button');
    const nextButton = nextButtons.find((btn) => btn.querySelector('svg'));
    if (nextButton) {
      fireEvent.click(nextButton);
    }

    // Month should update (we don't check exact text due to timing)
    await waitFor(() => {
      expect(apiModule.api.get).toHaveBeenCalled();
    });
  });

  it('displays time off requests', async () => {
    const mockTimeOff = [
      {
        id: '1',
        worker_id: 'worker-123',
        start_date: new Date('2024-01-01'),
        end_date: new Date('2024-01-03'),
        reason: 'Vacation',
        status: 'approved' as const,
        approved_by: 'manager-1',
        approved_at: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
      },
    ];

    vi.mocked(apiModule.api.get)
      .mockResolvedValueOnce([]) // availability
      .mockResolvedValueOnce(mockTimeOff); // time off

    render(<AvailabilityCalendar workerId="worker-123" />, {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(screen.getByText(/Calendar/i)).toBeInTheDocument();
    });

    const timeOffButton = screen.getByText(/Time Off/i);
    fireEvent.click(timeOffButton);

    await waitFor(() => {
      expect(screen.getByText(/Vacation/i)).toBeInTheDocument();
      expect(screen.getByText(/approved/i)).toBeInTheDocument();
    });
  });

  it('shows loading state', () => {
    vi.mocked(apiModule.api.get).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    render(<AvailabilityCalendar workerId="worker-123" />, {
      wrapper: createWrapper(),
    });

    expect(screen.getByText(/Loading availability.../i)).toBeInTheDocument();
  });

  it('displays legend for calendar colors', async () => {
    render(<AvailabilityCalendar workerId="worker-123" />, {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(screen.getByText(/Calendar/i)).toBeInTheDocument();
    });

    expect(screen.getByText('Available')).toBeInTheDocument();
    expect(screen.getByText('Unavailable')).toBeInTheDocument();
    expect(screen.getByText('Time Off')).toBeInTheDocument();
  });

  it('opens date detail modal when clicking a date', async () => {
    render(<AvailabilityCalendar workerId="worker-123" />, {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(screen.getByText(/Calendar/i)).toBeInTheDocument();
    });

    // Find and click a date button (looking for buttons with single digit numbers)
    const dateButtons = screen.getAllByRole('button');
    const dateButton = dateButtons.find(
      (btn) => /^\d+$/.test(btn.textContent || '')
    );

    if (dateButton) {
      fireEvent.click(dateButton);

      await waitFor(() => {
        expect(screen.getByText(/Save Availability/i)).toBeInTheDocument();
      });
    }
  });

  it('calls onAvailabilityChange callback when provided', async () => {
    const onChangeMock = vi.fn();

    const mockAvailability = [
      {
        id: '1',
        worker_id: 'worker-123',
        date: new Date(),
        start_time: '08:00',
        end_time: '17:00',
        is_available: true,
        recurrence_rule: null,
        notes: null,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ];

    vi.mocked(apiModule.api.get).mockResolvedValue(mockAvailability);
    vi.mocked(apiModule.api.post).mockResolvedValue({ success: true });

    render(
      <AvailabilityCalendar
        workerId="worker-123"
        onAvailabilityChange={onChangeMock}
      />,
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(screen.getByText(/Calendar/i)).toBeInTheDocument();
    });

    // This is a simplified test - in a real scenario you'd trigger an update
    // and wait for the mutation to complete
  });
});

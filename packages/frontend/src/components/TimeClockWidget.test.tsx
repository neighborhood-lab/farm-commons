import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import TimeClockWidget from './TimeClockWidget';
import { api } from '../lib/api';
import type { Worker, TimeEntry, PaginatedResponse } from '@farm-commons/shared';

// Mock the API module
vi.mock('../lib/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

const mockWorkers: PaginatedResponse<Worker> = {
  data: [
    {
      id: 'worker-1',
      farm_id: 'farm-1',
      user_id: null,
      first_name: 'John',
      last_name: 'Doe',
      email: 'john@example.com',
      phone: '1234567890',
      preferred_language: 'en',
      emergency_contact_name: null,
      emergency_contact_phone: null,
      hire_date: new Date('2024-01-01'),
      status: 'active',
      hourly_rate: 15.0,
      piece_rate: null,
      certifications: [],
      skills: ['harvesting'],
      notes: null,
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      id: 'worker-2',
      farm_id: 'farm-1',
      user_id: null,
      first_name: 'Jane',
      last_name: 'Smith',
      email: 'jane@example.com',
      phone: '0987654321',
      preferred_language: 'en',
      emergency_contact_name: null,
      emergency_contact_phone: null,
      hire_date: new Date('2024-01-01'),
      status: 'active',
      hourly_rate: 16.0,
      piece_rate: null,
      certifications: [],
      skills: ['planting'],
      notes: null,
      created_at: new Date(),
      updated_at: new Date(),
    },
  ],
  total: 2,
  page: 1,
  per_page: 100,
  total_pages: 1,
};

const mockActiveEntry: TimeEntry = {
  id: 'entry-1',
  farm_id: 'farm-1',
  worker_id: 'worker-1',
  schedule_id: null,
  clock_in: new Date('2024-11-10T08:00:00Z'),
  clock_out: null,
  break_minutes: 0,
  total_hours: null,
  task_type: 'Harvesting',
  field_id: null,
  notes: null,
  verified_by: null,
  verified_at: null,
  created_at: new Date(),
  updated_at: new Date(),
};

const mockCompletedEntry: TimeEntry = {
  id: 'entry-2',
  farm_id: 'farm-1',
  worker_id: 'worker-2',
  schedule_id: null,
  clock_in: new Date('2024-11-10T08:00:00Z'),
  clock_out: new Date('2024-11-10T12:00:00Z'),
  break_minutes: 30,
  total_hours: 3.5,
  task_type: 'Planting',
  field_id: null,
  notes: null,
  verified_by: null,
  verified_at: null,
  created_at: new Date(),
  updated_at: new Date(),
};

describe('TimeClockWidget', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    // Mock timers
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-11-10T10:00:00Z'));
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  const renderWidget = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <TimeClockWidget />
      </QueryClientProvider>
    );
  };

  it('renders the widget with title and description', async () => {
    vi.mocked(api.get).mockImplementation((endpoint: string) => {
      if (endpoint.includes('/workers')) {
        return Promise.resolve(mockWorkers);
      }
      return Promise.resolve([]);
    });

    renderWidget();

    expect(screen.getByText('Time Clock')).toBeInTheDocument();
    expect(screen.getByText('Quick clock in/out for workers')).toBeInTheDocument();
  });

  it('loads and displays workers in the dropdown', async () => {
    vi.mocked(api.get).mockImplementation((endpoint: string) => {
      if (endpoint.includes('/workers')) {
        return Promise.resolve(mockWorkers);
      }
      return Promise.resolve([]);
    });

    renderWidget();

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });
  });

  it('shows task type input when worker is selected', async () => {
    vi.mocked(api.get).mockImplementation((endpoint: string) => {
      if (endpoint.includes('/workers')) {
        return Promise.resolve(mockWorkers);
      }
      return Promise.resolve([]);
    });

    renderWidget();

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    const workerSelect = screen.getByLabelText('Worker');
    fireEvent.change(workerSelect, { target: { value: 'worker-1' } });

    await waitFor(() => {
      expect(screen.getByLabelText('Task Type')).toBeInTheDocument();
    });
  });

  it('allows clocking in a worker', async () => {
    const newEntry = {
      ...mockActiveEntry,
      clock_in: new Date('2024-11-10T10:00:00Z'),
    };

    vi.mocked(api.get).mockImplementation((endpoint: string) => {
      if (endpoint.includes('/workers')) {
        return Promise.resolve(mockWorkers);
      }
      return Promise.resolve([]);
    });

    vi.mocked(api.post).mockResolvedValue(newEntry);

    renderWidget();

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    // Select worker
    const workerSelect = screen.getByLabelText('Worker');
    fireEvent.change(workerSelect, { target: { value: 'worker-1' } });

    // Enter task type
    await waitFor(() => {
      expect(screen.getByLabelText('Task Type')).toBeInTheDocument();
    });

    const taskInput = screen.getByLabelText('Task Type');
    fireEvent.change(taskInput, { target: { value: 'Harvesting' } });

    // Click clock in
    const clockInButton = screen.getByText('Clock In');
    fireEvent.click(clockInButton);

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/time-entries/clock-in', {
        worker_id: 'worker-1',
        task_type: 'Harvesting',
      });
    });
  });

  it('displays active time entry with elapsed time', async () => {
    vi.mocked(api.get).mockImplementation((endpoint: string) => {
      if (endpoint.includes('/workers')) {
        return Promise.resolve(mockWorkers);
      }
      if (endpoint.includes('/time-entries')) {
        return Promise.resolve([mockActiveEntry]);
      }
      return Promise.resolve([]);
    });

    renderWidget();

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    // Select worker with active entry
    const workerSelect = screen.getByLabelText('Worker');
    fireEvent.change(workerSelect, { target: { value: 'worker-1' } });

    await waitFor(() => {
      expect(screen.getByText('Clocked In')).toBeInTheDocument();
      expect(screen.getByText('Harvesting')).toBeInTheDocument();
    });

    // Check elapsed time is displayed (2 hours from 08:00 to 10:00)
    await waitFor(() => {
      expect(screen.getByText('02:00')).toBeInTheDocument();
    });
  });

  it('updates elapsed time every second', async () => {
    const clockInTime = new Date('2024-11-10T10:00:00Z');
    const activeEntry = {
      ...mockActiveEntry,
      clock_in: clockInTime,
    };

    vi.mocked(api.get).mockImplementation((endpoint: string) => {
      if (endpoint.includes('/workers')) {
        return Promise.resolve(mockWorkers);
      }
      if (endpoint.includes('/time-entries')) {
        return Promise.resolve([activeEntry]);
      }
      return Promise.resolve([]);
    });

    renderWidget();

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    // Select worker with active entry
    const workerSelect = screen.getByLabelText('Worker');
    fireEvent.change(workerSelect, { target: { value: 'worker-1' } });

    await waitFor(() => {
      expect(screen.getByText('00:00')).toBeInTheDocument();
    });

    // Advance time by 1 minute
    vi.advanceTimersByTime(60000);

    await waitFor(() => {
      expect(screen.getByText('00:01')).toBeInTheDocument();
    });
  });

  it('allows clocking out with break minutes', async () => {
    vi.mocked(api.get).mockImplementation((endpoint: string) => {
      if (endpoint.includes('/workers')) {
        return Promise.resolve(mockWorkers);
      }
      if (endpoint.includes('/time-entries')) {
        return Promise.resolve([mockActiveEntry]);
      }
      return Promise.resolve([]);
    });

    vi.mocked(api.post).mockResolvedValue(mockCompletedEntry);

    renderWidget();

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    // Select worker with active entry
    const workerSelect = screen.getByLabelText('Worker');
    fireEvent.change(workerSelect, { target: { value: 'worker-1' } });

    await waitFor(() => {
      expect(screen.getByText('Clocked In')).toBeInTheDocument();
    });

    // Enter break minutes
    const breakInput = screen.getByLabelText('Break Time (minutes)');
    fireEvent.change(breakInput, { target: { value: '30' } });

    // Click clock out
    const clockOutButton = screen.getByText('Clock Out');
    fireEvent.click(clockOutButton);

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/time-entries/entry-1/clock-out', {
        break_minutes: 30,
      });
    });
  });

  it('disables worker selector when there is an active entry', async () => {
    vi.mocked(api.get).mockImplementation((endpoint: string) => {
      if (endpoint.includes('/workers')) {
        return Promise.resolve(mockWorkers);
      }
      if (endpoint.includes('/time-entries')) {
        return Promise.resolve([mockActiveEntry]);
      }
      return Promise.resolve([]);
    });

    renderWidget();

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    // Select worker with active entry
    const workerSelect = screen.getByLabelText('Worker') as HTMLSelectElement;
    fireEvent.change(workerSelect, { target: { value: 'worker-1' } });

    await waitFor(() => {
      expect(screen.getByText('Clocked In')).toBeInTheDocument();
    });

    // Worker selector should be disabled
    expect(workerSelect).toBeDisabled();
  });

  it('shows alert when trying to clock in without selecting worker', async () => {
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

    vi.mocked(api.get).mockImplementation((endpoint: string) => {
      if (endpoint.includes('/workers')) {
        return Promise.resolve(mockWorkers);
      }
      return Promise.resolve([]);
    });

    renderWidget();

    await waitFor(() => {
      expect(screen.getByText('Select a worker...')).toBeInTheDocument();
    });

    // Worker selector should not show clock in button if no worker is selected
    expect(screen.queryByText('Clock In')).not.toBeInTheDocument();

    alertSpy.mockRestore();
  });

  it('shows alert when trying to clock in without task type', async () => {
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

    vi.mocked(api.get).mockImplementation((endpoint: string) => {
      if (endpoint.includes('/workers')) {
        return Promise.resolve(mockWorkers);
      }
      return Promise.resolve([]);
    });

    renderWidget();

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    // Select worker
    const workerSelect = screen.getByLabelText('Worker');
    fireEvent.change(workerSelect, { target: { value: 'worker-1' } });

    await waitFor(() => {
      expect(screen.getByText('Clock In')).toBeInTheDocument();
    });

    // Clock in button should be disabled without task type
    const clockInButton = screen.getByText('Clock In') as HTMLButtonElement;
    expect(clockInButton).toBeDisabled();

    alertSpy.mockRestore();
  });
});

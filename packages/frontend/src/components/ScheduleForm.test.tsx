import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ScheduleForm from './ScheduleForm';
import type { Worker, Field, Schedule, PaginatedResponse } from '@farm-commons/shared';

// Mock API
vi.mock('../lib/api', () => ({
  api: {
    get: vi.fn(),
  },
}));

// Import the mocked api
import { api } from '../lib/api';

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
      hire_date: new Date('2023-01-01'),
      status: 'active',
      hourly_rate: 15.0,
      piece_rate: null,
      certifications: [],
      skills: ['planting', 'harvesting'],
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
      hire_date: new Date('2023-02-01'),
      status: 'active',
      hourly_rate: 16.0,
      piece_rate: null,
      certifications: [],
      skills: ['irrigation'],
      notes: null,
      created_at: new Date(),
      updated_at: new Date(),
    },
  ],
  total: 2,
  page: 1,
  per_page: 20,
  total_pages: 1,
};

const mockFields: PaginatedResponse<Field> = {
  data: [
    {
      id: 'field-1',
      farm_id: 'farm-1',
      name: 'North Field',
      size_acres: 10,
      location_gps: { lat: 45.0, lng: -122.0 },
      current_crop: 'Tomatoes',
      soil_type: 'Loam',
      notes: null,
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      id: 'field-2',
      farm_id: 'farm-1',
      name: 'South Field',
      size_acres: 5,
      location_gps: { lat: 45.1, lng: -122.1 },
      current_crop: 'Lettuce',
      soil_type: 'Sandy',
      notes: null,
      created_at: new Date(),
      updated_at: new Date(),
    },
  ],
  total: 2,
  page: 1,
  per_page: 20,
  total_pages: 1,
};

const mockSchedule: Schedule = {
  id: 'schedule-1',
  farm_id: 'farm-1',
  worker_id: 'worker-1',
  field_id: 'field-1',
  scheduled_date: new Date('2025-11-15'),
  start_time: '08:00',
  end_time: '17:00',
  task_type: 'Harvesting',
  task_description: 'Harvest tomatoes',
  status: 'scheduled',
  notes: 'Bring extra baskets',
  created_at: new Date(),
  updated_at: new Date(),
};

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe('ScheduleForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (api.get as ReturnType<typeof vi.fn>).mockImplementation((endpoint: string) => {
      if (endpoint === '/workers') {
        return Promise.resolve(mockWorkers);
      }
      if (endpoint === '/fields') {
        return Promise.resolve(mockFields);
      }
      return Promise.reject(new Error('Unknown endpoint'));
    });
  });

  it('renders all form fields', async () => {
    const onSubmit = vi.fn();
    const wrapper = createWrapper();

    render(<ScheduleForm onSubmit={onSubmit} />, { wrapper });

    // Wait for workers and fields to load
    await waitFor(() => {
      expect(screen.getByLabelText(/worker/i)).toBeInTheDocument();
    });

    expect(screen.getByLabelText(/field/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/date/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/start time/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/end time/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/task type/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/task description/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/notes/i)).toBeInTheDocument();
  });

  it('populates worker and field selectors with data', async () => {
    const onSubmit = vi.fn();
    const wrapper = createWrapper();

    render(<ScheduleForm onSubmit={onSubmit} />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(screen.getByText(/North Field/)).toBeInTheDocument();
    expect(screen.getByText(/South Field/)).toBeInTheDocument();
  });

  it('displays all common task types', async () => {
    const onSubmit = vi.fn();
    const wrapper = createWrapper();

    render(<ScheduleForm onSubmit={onSubmit} />, { wrapper });

    await waitFor(() => {
      expect(screen.getByLabelText(/task type/i)).toBeInTheDocument();
    });

    const taskTypeSelect = screen.getByLabelText(/task type/i);
    expect(taskTypeSelect).toBeInTheDocument();

    // Check for some common task types
    expect(screen.getByRole('option', { name: 'Planting' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Harvesting' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Weeding' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Watering/Irrigation' })).toBeInTheDocument();
  });

  it('submits form with valid data', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const wrapper = createWrapper();

    render(<ScheduleForm onSubmit={onSubmit} />, { wrapper });

    await waitFor(() => {
      expect(screen.getByLabelText(/worker/i)).toBeInTheDocument();
    });

    // Fill out the form
    const workerSelect = screen.getByLabelText(/worker/i);
    const fieldSelect = screen.getByLabelText(/field/i);
    const dateInput = screen.getByLabelText(/date/i);
    const startTimeInput = screen.getByLabelText(/start time/i);
    const endTimeInput = screen.getByLabelText(/end time/i);
    const taskTypeSelect = screen.getByLabelText(/task type/i);

    await user.selectOptions(workerSelect, 'worker-1');
    await user.selectOptions(fieldSelect, 'field-1');
    await user.clear(dateInput);
    await user.type(dateInput, '2025-11-20');
    await user.clear(startTimeInput);
    await user.type(startTimeInput, '09:00');
    await user.clear(endTimeInput);
    await user.type(endTimeInput, '16:00');
    await user.selectOptions(taskTypeSelect, 'Planting');

    // Submit the form
    const submitButton = screen.getByRole('button', { name: /create schedule/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          worker_id: 'worker-1',
          field_id: 'field-1',
          scheduled_date: '2025-11-20',
          start_time: '09:00',
          end_time: '16:00',
          task_type: 'Planting',
        })
      );
    });
  });

  it('shows validation errors for required fields', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    const wrapper = createWrapper();

    render(<ScheduleForm onSubmit={onSubmit} />, { wrapper });

    await waitFor(() => {
      expect(screen.getByLabelText(/worker/i)).toBeInTheDocument();
    });

    // Clear required fields
    const workerSelect = screen.getByLabelText(/worker/i);
    await user.selectOptions(workerSelect, '');

    // Try to submit
    const submitButton = screen.getByRole('button', { name: /create schedule/i });
    await user.click(submitButton);

    // Should not call onSubmit
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('populates form fields when editing existing schedule', async () => {
    const onSubmit = vi.fn();
    const wrapper = createWrapper();

    render(<ScheduleForm schedule={mockSchedule} onSubmit={onSubmit} />, { wrapper });

    await waitFor(() => {
      expect(screen.getByLabelText(/worker/i)).toBeInTheDocument();
    });

    const workerSelect = screen.getByLabelText(/worker/i) as HTMLSelectElement;
    const fieldSelect = screen.getByLabelText(/field/i) as HTMLSelectElement;
    const dateInput = screen.getByLabelText(/date/i) as HTMLInputElement;
    const startTimeInput = screen.getByLabelText(/start time/i) as HTMLInputElement;
    const endTimeInput = screen.getByLabelText(/end time/i) as HTMLInputElement;
    const taskTypeSelect = screen.getByLabelText(/task type/i) as HTMLSelectElement;

    expect(workerSelect.value).toBe('worker-1');
    expect(fieldSelect.value).toBe('field-1');
    expect(dateInput.value).toBe('2025-11-15');
    expect(startTimeInput.value).toBe('08:00');
    expect(endTimeInput.value).toBe('17:00');
    expect(taskTypeSelect.value).toBe('Harvesting');
  });

  it('shows update button text when editing', async () => {
    const onSubmit = vi.fn();
    const wrapper = createWrapper();

    render(<ScheduleForm schedule={mockSchedule} onSubmit={onSubmit} />, { wrapper });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /update schedule/i })).toBeInTheDocument();
    });
  });

  it('calls onCancel when cancel button is clicked', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    const onCancel = vi.fn();
    const wrapper = createWrapper();

    render(<ScheduleForm onSubmit={onSubmit} onCancel={onCancel} />, { wrapper });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await user.click(cancelButton);

    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('disables form fields when submitting', async () => {
    const onSubmit = vi.fn();
    const wrapper = createWrapper();

    render(<ScheduleForm onSubmit={onSubmit} isSubmitting={true} />, { wrapper });

    await waitFor(() => {
      expect(screen.getByLabelText(/worker/i)).toBeInTheDocument();
    });

    const workerSelect = screen.getByLabelText(/worker/i) as HTMLSelectElement;
    const submitButton = screen.getByRole('button', { name: /saving/i });

    expect(workerSelect).toBeDisabled();
    expect(submitButton).toBeDisabled();
  });

  it('shows repeating schedule feature note', async () => {
    const onSubmit = vi.fn();
    const wrapper = createWrapper();

    render(<ScheduleForm onSubmit={onSubmit} />, { wrapper });

    await waitFor(() => {
      expect(
        screen.getByText(/Repeating schedule functionality will allow/i)
      ).toBeInTheDocument();
    });
  });
});

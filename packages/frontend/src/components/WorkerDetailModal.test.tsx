import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import WorkerDetailModal from './WorkerDetailModal';
import type { Worker } from '@farm-commons/shared';

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => children,
}));

// Mock the API
vi.mock('../lib/api', () => ({
  api: {
    get: vi.fn(),
  },
}));

const mockWorker: Worker = {
  id: 'worker-1',
  farm_id: 'farm-1',
  user_id: 'user-1',
  first_name: 'John',
  last_name: 'Doe',
  email: 'john.doe@example.com',
  phone: '(555) 123-4567',
  preferred_language: 'english',
  emergency_contact_name: 'Jane Doe',
  emergency_contact_phone: '(555) 987-6543',
  hire_date: new Date('2024-01-15'),
  status: 'active',
  hourly_rate: 18.5,
  piece_rate: null,
  certifications: ['Food Handler', 'Forklift Operator'],
  skills: ['Harvesting', 'Irrigation', 'Tractor Operation'],
  notes: 'Excellent worker, very reliable',
  created_at: new Date('2024-01-15'),
  updated_at: new Date('2024-01-15'),
};

const mockTimeEntries = {
  data: [
    {
      id: 'entry-1',
      farm_id: 'farm-1',
      worker_id: 'worker-1',
      schedule_id: 'schedule-1',
      clock_in: new Date('2024-01-20T08:00:00'),
      clock_out: new Date('2024-01-20T16:00:00'),
      break_minutes: 30,
      total_hours: 7.5,
      task_type: 'Harvesting',
      field_id: 'field-1',
      notes: null,
      verified_by: 'manager-1',
      verified_at: new Date('2024-01-21'),
      created_at: new Date('2024-01-20'),
      updated_at: new Date('2024-01-21'),
    },
  ],
  total: 1,
  page: 1,
  per_page: 10,
  total_pages: 1,
};

const mockSchedules = {
  data: [
    {
      id: 'schedule-1',
      farm_id: 'farm-1',
      worker_id: 'worker-1',
      field_id: 'field-1',
      scheduled_date: new Date('2024-01-25'),
      start_time: '08:00',
      end_time: '16:00',
      task_type: 'Planting',
      task_description: 'Plant winter crops',
      status: 'scheduled' as const,
      notes: null,
      created_at: new Date('2024-01-20'),
      updated_at: new Date('2024-01-20'),
    },
  ],
  total: 1,
  page: 1,
  per_page: 10,
  total_pages: 1,
};

const mockCertifications = [
  {
    id: 'cert-1',
    worker_id: 'worker-1',
    name: 'Food Handler Certificate',
    issuing_organization: 'State Health Department',
    issue_date: new Date('2023-01-15'),
    expiration_date: new Date('2025-01-15'),
    document_url: null,
    verified: true,
    created_at: new Date('2023-01-15'),
    updated_at: new Date('2023-01-15'),
  },
  {
    id: 'cert-2',
    worker_id: 'worker-1',
    name: 'Forklift Operator License',
    issuing_organization: 'OSHA',
    issue_date: new Date('2023-06-01'),
    expiration_date: new Date('2024-02-01'), // Expired
    document_url: null,
    verified: false,
    created_at: new Date('2023-06-01'),
    updated_at: new Date('2023-06-01'),
  },
];

describe('WorkerDetailModal', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    vi.clearAllMocks();
  });

  const renderModal = (props: Partial<typeof mockWorker> = {}) => {
    const worker = { ...mockWorker, ...props };
    const onClose = vi.fn();
    const onEdit = vi.fn();

    return {
      ...render(
        <QueryClientProvider client={queryClient}>
          <WorkerDetailModal
            worker={worker}
            isOpen={true}
            onClose={onClose}
            onEdit={onEdit}
          />
        </QueryClientProvider>
      ),
      onClose,
      onEdit,
    };
  };

  describe('Modal Display', () => {
    it('should render the modal when isOpen is true', () => {
      renderModal();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    it('should not render the modal when isOpen is false', () => {
      const onClose = vi.fn();
      const onEdit = vi.fn();

      const { container } = render(
        <QueryClientProvider client={queryClient}>
          <WorkerDetailModal
            worker={mockWorker}
            isOpen={false}
            onClose={onClose}
            onEdit={onEdit}
          />
        </QueryClientProvider>
      );

      expect(container.firstChild).toBeNull();
    });

    it('should display worker name and initials', () => {
      renderModal();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('JD')).toBeInTheDocument();
    });

    it('should display worker status badge', () => {
      renderModal();
      expect(screen.getByText('active')).toBeInTheDocument();
    });

    it('should display hire date', () => {
      renderModal();
      expect(screen.getByText(/Hired: 2024-01-15/)).toBeInTheDocument();
    });
  });

  describe('Overview Tab', () => {
    it('should display contact information', () => {
      renderModal();
      expect(screen.getByText('(555) 123-4567')).toBeInTheDocument();
      expect(screen.getByText('john.doe@example.com')).toBeInTheDocument();
    });

    it('should display emergency contact information', () => {
      renderModal();
      expect(screen.getByText('Jane Doe')).toBeInTheDocument();
      expect(screen.getByText('(555) 987-6543')).toBeInTheDocument();
    });

    it('should display hourly rate', () => {
      renderModal();
      expect(screen.getByText('$18.50/hour')).toBeInTheDocument();
    });

    it('should display piece rate when available', () => {
      renderModal({ hourly_rate: null, piece_rate: 2.5 });
      expect(screen.getByText('$2.50/unit')).toBeInTheDocument();
    });

    it('should display skills', () => {
      renderModal();
      expect(screen.getByText('Harvesting')).toBeInTheDocument();
      expect(screen.getByText('Irrigation')).toBeInTheDocument();
      expect(screen.getByText('Tractor Operation')).toBeInTheDocument();
    });

    it('should display notes', () => {
      renderModal();
      expect(
        screen.getByText('Excellent worker, very reliable')
      ).toBeInTheDocument();
    });

    it('should show "No skills listed" when worker has no skills', () => {
      renderModal({ skills: [] });
      expect(screen.getByText('No skills listed')).toBeInTheDocument();
    });
  });

  describe('Modal Interactions', () => {
    it('should call onClose when close button is clicked', async () => {
      const { onClose } = renderModal();

      const closeButtons = screen.getAllByRole('button');
      const closeButton = closeButtons.find((btn) =>
        btn.querySelector('svg')
      ) as HTMLElement;

      fireEvent.click(closeButton);
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('should call onEdit when edit button is clicked', async () => {
      const { onEdit } = renderModal();

      const editButton = screen.getByTitle('Edit worker');
      fireEvent.click(editButton);
      expect(onEdit).toHaveBeenCalledWith(mockWorker);
    });

    it('should call onClose when backdrop is clicked', async () => {
      const { onClose } = renderModal();

      const backdrop = screen.getByRole('generic').parentElement;
      if (backdrop) {
        fireEvent.click(backdrop);
        expect(onClose).toHaveBeenCalled();
      }
    });
  });

  describe('Tab Navigation', () => {
    it('should switch to time entries tab', async () => {
      renderModal();

      const timeEntriesTab = screen.getByText('Time Entries');
      fireEvent.click(timeEntriesTab);

      await waitFor(() => {
        expect(screen.getByText('Recent Time Entries')).toBeInTheDocument();
      });
    });

    it('should switch to schedules tab', async () => {
      renderModal();

      const schedulesTab = screen.getByText('Schedules');
      fireEvent.click(schedulesTab);

      await waitFor(() => {
        expect(screen.getByText('Upcoming Schedules')).toBeInTheDocument();
      });
    });

    it('should switch to certifications tab', async () => {
      renderModal();

      const certificationsTab = screen.getByText('Certifications');
      fireEvent.click(certificationsTab);

      await waitFor(() => {
        expect(screen.getByText('Certifications')).toBeInTheDocument();
      });
    });
  });

  describe('Status Display', () => {
    it('should display active status with green badge', () => {
      renderModal({ status: 'active' });
      const badge = screen.getByText('active');
      expect(badge.className).toContain('green');
    });

    it('should display seasonal status with blue badge', () => {
      renderModal({ status: 'seasonal' });
      const badge = screen.getByText('seasonal');
      expect(badge.className).toContain('blue');
    });

    it('should display inactive status with gray badge', () => {
      renderModal({ status: 'inactive' });
      const badge = screen.getByText('inactive');
      expect(badge.className).toContain('gray');
    });
  });

  describe('Empty States', () => {
    it('should show empty state message when no email', () => {
      renderModal({ email: null });
      expect(screen.queryByText('Email')).not.toBeInTheDocument();
    });

    it('should show empty state message when no emergency contact', () => {
      renderModal({ emergency_contact_name: null, emergency_contact_phone: null });
      expect(screen.queryByText('Emergency Contact')).not.toBeInTheDocument();
    });

    it('should show empty state message when no notes', () => {
      renderModal({ notes: null });
      expect(screen.queryByText('Notes')).not.toBeInTheDocument();
    });
  });

  describe('Language Display', () => {
    it('should display preferred language capitalized', () => {
      renderModal({ preferred_language: 'spanish' });
      expect(screen.getByText('Spanish')).toBeInTheDocument();
    });
  });
});

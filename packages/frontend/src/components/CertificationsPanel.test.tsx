import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '../test/utils';
import CertificationsPanel from './CertificationsPanel';
import { api } from '../lib/api';
import type { Certification } from '@farm-commons/shared';

// Mock the API module
vi.mock('../lib/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('CertificationsPanel', () => {
  const mockWorkerId = 'worker-123';

  const mockCertifications: Certification[] = [
    {
      id: 'cert-1',
      worker_id: mockWorkerId,
      name: 'Pesticide Applicator License',
      issuing_organization: 'State Department of Agriculture',
      issue_date: new Date('2023-01-15'),
      expiration_date: new Date('2025-01-15'),
      document_url: 'https://example.com/cert1.pdf',
      verified: true,
      created_at: new Date('2023-01-15'),
      updated_at: new Date('2023-01-15'),
    },
    {
      id: 'cert-2',
      worker_id: mockWorkerId,
      name: 'First Aid Certificate',
      issuing_organization: 'Red Cross',
      issue_date: new Date('2024-06-01'),
      expiration_date: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000), // 20 days from now
      document_url: null,
      verified: false,
      created_at: new Date('2024-06-01'),
      updated_at: new Date('2024-06-01'),
    },
    {
      id: 'cert-3',
      worker_id: mockWorkerId,
      name: 'Forklift Operator',
      issuing_organization: 'OSHA',
      issue_date: new Date('2022-03-10'),
      expiration_date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago (expired)
      document_url: 'https://example.com/cert3.pdf',
      verified: true,
      created_at: new Date('2022-03-10'),
      updated_at: new Date('2022-03-10'),
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state initially', () => {
    vi.mocked(api.get).mockImplementation(() => new Promise(() => {}));

    render(<CertificationsPanel workerId={mockWorkerId} />);

    expect(screen.getByText('Loading certifications...')).toBeInTheDocument();
  });

  it('renders certifications list', async () => {
    vi.mocked(api.get).mockResolvedValue(mockCertifications);

    render(<CertificationsPanel workerId={mockWorkerId} />);

    await waitFor(() => {
      expect(screen.getByText('Pesticide Applicator License')).toBeInTheDocument();
    });

    expect(screen.getByText('First Aid Certificate')).toBeInTheDocument();
    expect(screen.getByText('Forklift Operator')).toBeInTheDocument();
    expect(screen.getByText('3 certifications on file')).toBeInTheDocument();
  });

  it('displays verification status correctly', async () => {
    vi.mocked(api.get).mockResolvedValue(mockCertifications);

    render(<CertificationsPanel workerId={mockWorkerId} />);

    await waitFor(() => {
      expect(screen.getAllByText('Verified')).toHaveLength(2);
    });

    expect(screen.getByText('Pending Verification')).toBeInTheDocument();
  });

  it('displays expiry warnings with correct colors', async () => {
    vi.mocked(api.get).mockResolvedValue(mockCertifications);

    render(<CertificationsPanel workerId={mockWorkerId} />);

    await waitFor(() => {
      expect(screen.getByText(/Expires in 20 days/)).toBeInTheDocument();
    });

    expect(screen.getByText(/Expired 10 days ago/)).toBeInTheDocument();
  });

  it('shows empty state when no certifications', async () => {
    vi.mocked(api.get).mockResolvedValue([]);

    render(<CertificationsPanel workerId={mockWorkerId} />);

    await waitFor(() => {
      expect(screen.getByText('No certifications on file')).toBeInTheDocument();
    });

    expect(
      screen.getByText('Add certifications to track worker qualifications and expiry dates')
    ).toBeInTheDocument();
  });

  it('opens add certification form when clicking Add button', async () => {
    vi.mocked(api.get).mockResolvedValue([]);
    const user = userEvent.setup();

    render(<CertificationsPanel workerId={mockWorkerId} />);

    await waitFor(() => {
      expect(screen.getByText('No certifications on file')).toBeInTheDocument();
    });

    const addButton = screen.getByRole('button', { name: /Add Certification/i });
    await user.click(addButton);

    expect(screen.getByText('Add New Certification')).toBeInTheDocument();
    expect(screen.getByLabelText(/Certification Name/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Issuing Organization/)).toBeInTheDocument();
  });

  it('creates a new certification', async () => {
    vi.mocked(api.get).mockResolvedValue([]);
    vi.mocked(api.post).mockResolvedValue({
      id: 'cert-new',
      worker_id: mockWorkerId,
      name: 'New Certification',
      issuing_organization: 'Test Org',
      issue_date: new Date('2024-01-01'),
      expiration_date: new Date('2025-01-01'),
      document_url: 'https://example.com/new.pdf',
      verified: false,
      created_at: new Date(),
      updated_at: new Date(),
    });

    const user = userEvent.setup();

    render(<CertificationsPanel workerId={mockWorkerId} />);

    await waitFor(() => {
      expect(screen.getByText('No certifications on file')).toBeInTheDocument();
    });

    // Open form
    const addButton = screen.getByRole('button', { name: /Add Certification/i });
    await user.click(addButton);

    // Fill in form
    await user.type(screen.getByLabelText(/Certification Name/), 'New Certification');
    await user.type(screen.getByLabelText(/Issuing Organization/), 'Test Org');
    await user.type(screen.getByLabelText(/Issue Date/), '2024-01-01');
    await user.type(screen.getByLabelText(/Expiration Date/), '2025-01-01');
    await user.type(screen.getByLabelText(/Document URL/), 'https://example.com/new.pdf');

    // Submit form
    const submitButton = screen.getByRole('button', { name: /Add Certification/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/certifications', {
        worker_id: mockWorkerId,
        name: 'New Certification',
        issuing_organization: 'Test Org',
        issue_date: '2024-01-01',
        expiration_date: '2025-01-01',
        document_url: 'https://example.com/new.pdf',
        verified: false,
      });
    });
  });

  it('edits an existing certification', async () => {
    vi.mocked(api.get).mockResolvedValue(mockCertifications);
    vi.mocked(api.put).mockResolvedValue({
      ...mockCertifications[0],
      name: 'Updated Certification Name',
    });

    const user = userEvent.setup();

    render(<CertificationsPanel workerId={mockWorkerId} />);

    await waitFor(() => {
      expect(screen.getByText('Pesticide Applicator License')).toBeInTheDocument();
    });

    // Click edit button (first one)
    const editButtons = screen.getAllByTitle('Edit certification');
    await user.click(editButtons[0]);

    // Form should be open with pre-filled data
    expect(screen.getByText('Edit Certification')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Pesticide Applicator License')).toBeInTheDocument();

    // Update the name
    const nameInput = screen.getByLabelText(/Certification Name/);
    await user.clear(nameInput);
    await user.type(nameInput, 'Updated Certification Name');

    // Submit
    const submitButton = screen.getByRole('button', { name: /Update Certification/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(api.put).toHaveBeenCalledWith('/certifications/cert-1', expect.any(Object));
    });
  });

  it('deletes a certification with confirmation', async () => {
    vi.mocked(api.get).mockResolvedValue(mockCertifications);
    vi.mocked(api.delete).mockResolvedValue({ success: true });

    // Mock window.confirm
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

    const user = userEvent.setup();

    render(<CertificationsPanel workerId={mockWorkerId} />);

    await waitFor(() => {
      expect(screen.getByText('Pesticide Applicator License')).toBeInTheDocument();
    });

    // Click delete button (first one)
    const deleteButtons = screen.getAllByTitle('Delete certification');
    await user.click(deleteButtons[0]);

    expect(confirmSpy).toHaveBeenCalledWith('Are you sure you want to delete this certification?');

    await waitFor(() => {
      expect(api.delete).toHaveBeenCalledWith('/certifications/cert-1');
    });

    confirmSpy.mockRestore();
  });

  it('cancels delete when user declines confirmation', async () => {
    vi.mocked(api.get).mockResolvedValue(mockCertifications);

    // Mock window.confirm to return false
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);

    const user = userEvent.setup();

    render(<CertificationsPanel workerId={mockWorkerId} />);

    await waitFor(() => {
      expect(screen.getByText('Pesticide Applicator License')).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByTitle('Delete certification');
    await user.click(deleteButtons[0]);

    expect(confirmSpy).toHaveBeenCalled();
    expect(api.delete).not.toHaveBeenCalled();

    confirmSpy.mockRestore();
  });

  it('displays document links when available', async () => {
    vi.mocked(api.get).mockResolvedValue(mockCertifications);

    render(<CertificationsPanel workerId={mockWorkerId} />);

    await waitFor(() => {
      expect(screen.getByText('Pesticide Applicator License')).toBeInTheDocument();
    });

    const documentLinks = screen.getAllByText('View Document');
    expect(documentLinks).toHaveLength(2); // Two certs have document URLs

    expect(documentLinks[0]).toHaveAttribute('href', 'https://example.com/cert1.pdf');
    expect(documentLinks[0]).toHaveAttribute('target', '_blank');
  });

  it('handles certification with no expiration date', async () => {
    const certWithoutExpiry: Certification = {
      id: 'cert-no-expiry',
      worker_id: mockWorkerId,
      name: 'Permanent Certification',
      issuing_organization: 'Permanent Org',
      issue_date: new Date('2024-01-01'),
      expiration_date: null,
      document_url: null,
      verified: true,
      created_at: new Date(),
      updated_at: new Date(),
    };

    vi.mocked(api.get).mockResolvedValue([certWithoutExpiry]);

    render(<CertificationsPanel workerId={mockWorkerId} />);

    await waitFor(() => {
      expect(screen.getByText('Permanent Certification')).toBeInTheDocument();
    });

    expect(screen.getByText('No expiration')).toBeInTheDocument();
  });

  it('can toggle verified checkbox when adding certification', async () => {
    vi.mocked(api.get).mockResolvedValue([]);
    const user = userEvent.setup();

    render(<CertificationsPanel workerId={mockWorkerId} />);

    await waitFor(() => {
      expect(screen.getByText('No certifications on file')).toBeInTheDocument();
    });

    // Open form
    const addButton = screen.getByRole('button', { name: /Add Certification/i });
    await user.click(addButton);

    // Find and click verified checkbox
    const verifiedCheckbox = screen.getByLabelText(/Verified/i);
    expect(verifiedCheckbox).not.toBeChecked();

    await user.click(verifiedCheckbox);
    expect(verifiedCheckbox).toBeChecked();
  });

  it('cancels form and resets fields', async () => {
    vi.mocked(api.get).mockResolvedValue([]);
    const user = userEvent.setup();

    render(<CertificationsPanel workerId={mockWorkerId} />);

    await waitFor(() => {
      expect(screen.getByText('No certifications on file')).toBeInTheDocument();
    });

    // Open form
    const addButton = screen.getByRole('button', { name: /Add Certification/i });
    await user.click(addButton);

    // Fill in some data
    await user.type(screen.getByLabelText(/Certification Name/), 'Test Name');

    // Cancel
    const cancelButton = screen.getByRole('button', { name: /Cancel/i });
    await user.click(cancelButton);

    // Form should be closed
    expect(screen.queryByText('Add New Certification')).not.toBeInTheDocument();

    // Open again and check fields are empty
    await user.click(screen.getByRole('button', { name: /Add Certification/i }));
    expect(screen.getByLabelText(/Certification Name/)).toHaveValue('');
  });
});

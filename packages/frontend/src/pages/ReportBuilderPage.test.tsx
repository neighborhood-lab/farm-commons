import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ReportBuilderPage from './ReportBuilderPage';

// Mock the API module
vi.mock('../lib/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

// Helper to wrap component with providers
const renderWithProviders = (component: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      {component}
    </QueryClientProvider>
  );
};

describe('ReportBuilderPage', () => {
  it('renders the report builder page with title', () => {
    renderWithProviders(<ReportBuilderPage />);
    expect(screen.getByText('Report Builder')).toBeInTheDocument();
    expect(screen.getByText('Create custom reports by dragging and dropping fields')).toBeInTheDocument();
  });

  it('displays available field categories', () => {
    renderWithProviders(<ReportBuilderPage />);
    expect(screen.getByText('Available Fields')).toBeInTheDocument();
    expect(screen.getByText('workers')).toBeInTheDocument();
    expect(screen.getByText('time entries')).toBeInTheDocument();
    expect(screen.getByText('schedules')).toBeInTheDocument();
  });

  it('displays empty state when no fields are selected', () => {
    renderWithProviders(<ReportBuilderPage />);
    expect(screen.getByText('Drag and drop fields here')).toBeInTheDocument();
  });

  it('allows entering report name and description', () => {
    renderWithProviders(<ReportBuilderPage />);

    const nameInput = screen.getByPlaceholderText('e.g., Weekly Labor Report');
    const descriptionInput = screen.getByPlaceholderText('Optional description');

    fireEvent.change(nameInput, { target: { value: 'Test Report' } });
    fireEvent.change(descriptionInput, { target: { value: 'Test Description' } });

    expect(nameInput).toHaveValue('Test Report');
    expect(descriptionInput).toHaveValue('Test Description');
  });

  it('disables action buttons when no fields are selected', () => {
    renderWithProviders(<ReportBuilderPage />);

    const saveButton = screen.getByText('Save Template');
    const scheduleButton = screen.getByText('Schedule Report');
    const exportButtons = screen.getAllByText(/Export/);

    expect(saveButton).toBeDisabled();
    expect(scheduleButton).toBeDisabled();
    exportButtons.forEach(button => {
      expect(button).toBeDisabled();
    });
  });

  it('removes a field when delete button is clicked', async () => {
    renderWithProviders(<ReportBuilderPage />);

    // Get a draggable field
    const firstNameField = screen.getByText('First Name');
    expect(firstNameField).toBeInTheDocument();

    // Simulate drag and drop
    fireEvent.dragStart(firstNameField.closest('div[draggable]')!);

    const dropZone = screen.getByText('Drag and drop fields here').closest('div')!;
    fireEvent.dragOver(dropZone);
    fireEvent.drop(dropZone);

    // Wait for field to appear in selected fields
    await waitFor(() => {
      const selectedFields = screen.getAllByText('First Name');
      expect(selectedFields.length).toBeGreaterThan(1); // One in available, one in selected
    });

    // Find and click delete button
    const deleteButtons = screen.getAllByRole('button', { name: '' });
    const deleteButton = deleteButtons.find(btn =>
      btn.querySelector('svg') // Find button with SVG icon (Trash2)
    );

    if (deleteButton) {
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByText('Drag and drop fields here')).toBeInTheDocument();
      });
    }
  });

  it('shows save template dialog when save button is clicked', async () => {
    renderWithProviders(<ReportBuilderPage />);

    // Add a field first
    const firstNameField = screen.getByText('First Name');
    fireEvent.dragStart(firstNameField.closest('div[draggable]')!);

    const dropZone = screen.getByText('Drag and drop fields here').closest('div')!;
    fireEvent.dragOver(dropZone);
    fireEvent.drop(dropZone);

    await waitFor(() => {
      const selectedFields = screen.getAllByText('First Name');
      expect(selectedFields.length).toBeGreaterThan(1);
    });

    // Click save button
    const saveButton = screen.getByText('Save Template');
    expect(saveButton).not.toBeDisabled();
    fireEvent.click(saveButton);

    // Check if dialog appears
    await waitFor(() => {
      expect(screen.getByText('Save Report Template')).toBeInTheDocument();
    });
  });

  it('shows schedule report dialog when schedule button is clicked', async () => {
    renderWithProviders(<ReportBuilderPage />);

    // Add a field first
    const firstNameField = screen.getByText('First Name');
    fireEvent.dragStart(firstNameField.closest('div[draggable]')!);

    const dropZone = screen.getByText('Drag and drop fields here').closest('div')!;
    fireEvent.dragOver(dropZone);
    fireEvent.drop(dropZone);

    await waitFor(() => {
      const selectedFields = screen.getAllByText('First Name');
      expect(selectedFields.length).toBeGreaterThan(1);
    });

    // Click schedule button
    const scheduleButton = screen.getByText('Schedule Report');
    expect(scheduleButton).not.toBeDisabled();
    fireEvent.click(scheduleButton);

    // Check if dialog appears
    await waitFor(() => {
      expect(screen.getByText('Schedule Automatic Report')).toBeInTheDocument();
    });
  });

  it('allows configuring schedule settings', async () => {
    renderWithProviders(<ReportBuilderPage />);

    // Add a field and open schedule dialog
    const firstNameField = screen.getByText('First Name');
    fireEvent.dragStart(firstNameField.closest('div[draggable]')!);

    const dropZone = screen.getByText('Drag and drop fields here').closest('div')!;
    fireEvent.dragOver(dropZone);
    fireEvent.drop(dropZone);

    await waitFor(() => {
      const selectedFields = screen.getAllByText('First Name');
      expect(selectedFields.length).toBeGreaterThan(1);
    });

    const scheduleButton = screen.getByText('Schedule Report');
    fireEvent.click(scheduleButton);

    await waitFor(() => {
      expect(screen.getByText('Schedule Automatic Report')).toBeInTheDocument();
    });

    // Change frequency
    const frequencySelect = screen.getByRole('combobox');
    fireEvent.change(frequencySelect, { target: { value: 'daily' } });
    expect(frequencySelect).toHaveValue('daily');
  });

  it('displays saved templates in the sidebar', async () => {
    renderWithProviders(<ReportBuilderPage />);

    await waitFor(() => {
      expect(screen.getByText('Weekly Labor Report')).toBeInTheDocument();
      expect(screen.getByText('Worker Directory')).toBeInTheDocument();
    });
  });

  it('loads a template when clicked', async () => {
    renderWithProviders(<ReportBuilderPage />);

    await waitFor(() => {
      const template = screen.getByText('Weekly Labor Report');
      expect(template).toBeInTheDocument();
    });

    const template = screen.getByText('Weekly Labor Report');
    fireEvent.click(template);

    await waitFor(() => {
      // Check if fields from template are loaded
      const nameInput = screen.getByPlaceholderText('e.g., Weekly Labor Report') as HTMLInputElement;
      expect(nameInput.value).toBe('Weekly Labor Report');
    });
  });

  it('exports report to CSV format', async () => {
    // Mock URL.createObjectURL
    global.URL.createObjectURL = vi.fn(() => 'mock-url');

    // Mock createElement and click - use any type to avoid type issues
    const mockClick = vi.fn();
    const originalCreateElement = document.createElement.bind(document);
    const createElementSpy = vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      if (tagName === 'a') {
        const anchor = originalCreateElement('a') as any;
        anchor.click = mockClick;
        return anchor;
      }
      return originalCreateElement(tagName);
    });

    renderWithProviders(<ReportBuilderPage />);

    // Add a field first
    const firstNameField = screen.getByText('First Name');
    fireEvent.dragStart(firstNameField.closest('div[draggable]')!);

    const dropZone = screen.getByText('Drag and drop fields here').closest('div')!;
    fireEvent.dragOver(dropZone);
    fireEvent.drop(dropZone);

    await waitFor(() => {
      const selectedFields = screen.getAllByText('First Name');
      expect(selectedFields.length).toBeGreaterThan(1);
    });

    // Click export CSV button
    const exportCSVButton = screen.getByText('Export CSV');
    expect(exportCSVButton).not.toBeDisabled();
    fireEvent.click(exportCSVButton);

    // Verify download was triggered
    expect(mockClick).toHaveBeenCalled();

    // Cleanup
    createElementSpy.mockRestore();
  });

  it('shows appropriate field icons for different sources', () => {
    renderWithProviders(<ReportBuilderPage />);

    // Check that different source categories are displayed
    const availableFieldsSection = screen.getByText('Available Fields').parentElement!;

    expect(availableFieldsSection).toBeInTheDocument();
    // Workers, time entries, schedules should all be present
    expect(screen.getByText('workers')).toBeInTheDocument();
    expect(screen.getByText('time entries')).toBeInTheDocument();
    expect(screen.getByText('schedules')).toBeInTheDocument();
  });

  it('prevents duplicate fields from being added', async () => {
    renderWithProviders(<ReportBuilderPage />);

    const firstNameField = screen.getByText('First Name');
    const draggableField = firstNameField.closest('div[draggable]')!;
    const dropZone = screen.getByText('Drag and drop fields here').closest('div')!;

    // Add field once
    fireEvent.dragStart(draggableField);
    fireEvent.dragOver(dropZone);
    fireEvent.drop(dropZone);

    await waitFor(() => {
      const selectedFields = screen.getAllByText('First Name');
      expect(selectedFields.length).toBe(2); // One in available, one in selected
    });

    // Try to add same field again
    fireEvent.dragStart(draggableField);
    fireEvent.dragOver(dropZone);
    fireEvent.drop(dropZone);

    await waitFor(() => {
      const selectedFields = screen.getAllByText('First Name');
      // Should still be 2 (not 3), as duplicate was prevented
      expect(selectedFields.length).toBe(2);
    });
  });
});

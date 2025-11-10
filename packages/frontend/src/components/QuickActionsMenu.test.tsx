import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import QuickActionsMenu from './QuickActionsMenu';

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ pathname: '/' }),
  };
});

describe('QuickActionsMenu', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  const renderWithRouter = (component: React.ReactElement) => {
    return render(<BrowserRouter>{component}</BrowserRouter>);
  };

  it('renders the floating action button', () => {
    renderWithRouter(<QuickActionsMenu />);
    const fab = screen.getByLabelText('Quick Actions Menu');
    expect(fab).toBeInTheDocument();
  });

  it('opens menu when FAB is clicked', async () => {
    renderWithRouter(<QuickActionsMenu />);
    const fab = screen.getByLabelText('Quick Actions Menu');

    fireEvent.click(fab);

    await waitFor(() => {
      expect(screen.getByText('Clock In/Out')).toBeInTheDocument();
      expect(screen.getByText('Create Schedule')).toBeInTheDocument();
      expect(screen.getByText('Add Time Entry')).toBeInTheDocument();
      expect(screen.getByText('Keyboard Shortcuts')).toBeInTheDocument();
    });
  });

  it('closes menu when FAB is clicked again', async () => {
    renderWithRouter(<QuickActionsMenu />);
    const fab = screen.getByLabelText('Quick Actions Menu');

    // Open menu
    fireEvent.click(fab);
    await waitFor(() => {
      expect(screen.getByText('Clock In/Out')).toBeInTheDocument();
    });

    // Close menu
    fireEvent.click(fab);
    await waitFor(() => {
      expect(screen.queryByText('Clock In/Out')).not.toBeInTheDocument();
    });
  });

  it('navigates to time tracking when Clock In/Out is clicked', async () => {
    renderWithRouter(<QuickActionsMenu />);
    const fab = screen.getByLabelText('Quick Actions Menu');

    fireEvent.click(fab);

    await waitFor(() => {
      const clockInButton = screen.getByText('Clock In/Out');
      fireEvent.click(clockInButton);
    });

    expect(mockNavigate).toHaveBeenCalledWith('/time-tracking');
  });

  it('navigates to schedule when Create Schedule is clicked', async () => {
    renderWithRouter(<QuickActionsMenu />);
    const fab = screen.getByLabelText('Quick Actions Menu');

    fireEvent.click(fab);

    await waitFor(() => {
      const scheduleButton = screen.getByText('Create Schedule');
      fireEvent.click(scheduleButton);
    });

    expect(mockNavigate).toHaveBeenCalledWith('/schedule');
  });

  it('shows keyboard shortcuts modal when Keyboard Shortcuts is clicked', async () => {
    renderWithRouter(<QuickActionsMenu />);
    const fab = screen.getByLabelText('Quick Actions Menu');

    fireEvent.click(fab);

    await waitFor(() => {
      const shortcutsButton = screen.getByText('Keyboard Shortcuts');
      fireEvent.click(shortcutsButton);
    });

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Keyboard Shortcuts' })).toBeInTheDocument();
    });
  });

  it('closes keyboard shortcuts modal when close button is clicked', async () => {
    renderWithRouter(<QuickActionsMenu />);
    const fab = screen.getByLabelText('Quick Actions Menu');

    fireEvent.click(fab);

    await waitFor(() => {
      const shortcutsButton = screen.getByText('Keyboard Shortcuts');
      fireEvent.click(shortcutsButton);
    });

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Keyboard Shortcuts' })).toBeInTheDocument();
    });

    const closeButton = screen.getByLabelText('Close');
    fireEvent.click(closeButton);

    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: 'Keyboard Shortcuts' })).not.toBeInTheDocument();
    });
  });

  describe('Keyboard Shortcuts', () => {
    it('toggles menu with Alt+Q', async () => {
      renderWithRouter(<QuickActionsMenu />);

      // Open menu
      fireEvent.keyDown(window, { key: 'q', altKey: true });

      await waitFor(() => {
        expect(screen.getByText('Clock In/Out')).toBeInTheDocument();
      });

      // Close menu
      fireEvent.keyDown(window, { key: 'q', altKey: true });

      await waitFor(() => {
        expect(screen.queryByText('Clock In/Out')).not.toBeInTheDocument();
      });
    });

    it('navigates to time tracking with Alt+C', () => {
      renderWithRouter(<QuickActionsMenu />);

      fireEvent.keyDown(window, { key: 'c', altKey: true });

      expect(mockNavigate).toHaveBeenCalledWith('/time-tracking');
    });

    it('navigates to schedule with Alt+S', () => {
      renderWithRouter(<QuickActionsMenu />);

      fireEvent.keyDown(window, { key: 's', altKey: true });

      expect(mockNavigate).toHaveBeenCalledWith('/schedule');
    });

    it('navigates to time entry with Alt+T', () => {
      renderWithRouter(<QuickActionsMenu />);

      fireEvent.keyDown(window, { key: 't', altKey: true });

      expect(mockNavigate).toHaveBeenCalledWith('/time-tracking');
    });

    it('shows keyboard shortcuts modal with Alt+K', async () => {
      renderWithRouter(<QuickActionsMenu />);

      fireEvent.keyDown(window, { key: 'k', altKey: true });

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Keyboard Shortcuts' })).toBeInTheDocument();
      });
    });

    it('navigates to dashboard with Alt+D', () => {
      renderWithRouter(<QuickActionsMenu />);

      fireEvent.keyDown(window, { key: 'd', altKey: true });

      expect(mockNavigate).toHaveBeenCalledWith('/');
    });

    it('navigates to workers with Alt+W', () => {
      renderWithRouter(<QuickActionsMenu />);

      fireEvent.keyDown(window, { key: 'w', altKey: true });

      expect(mockNavigate).toHaveBeenCalledWith('/workers');
    });

    it('closes menu with Escape key', async () => {
      renderWithRouter(<QuickActionsMenu />);

      // Open menu
      fireEvent.keyDown(window, { key: 'q', altKey: true });

      await waitFor(() => {
        expect(screen.getByText('Clock In/Out')).toBeInTheDocument();
      });

      // Close with Escape
      fireEvent.keyDown(window, { key: 'Escape' });

      await waitFor(() => {
        expect(screen.queryByText('Clock In/Out')).not.toBeInTheDocument();
      });
    });

    it('closes shortcuts modal with Escape key', async () => {
      renderWithRouter(<QuickActionsMenu />);

      // Open shortcuts modal
      fireEvent.keyDown(window, { key: 'k', altKey: true });

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Keyboard Shortcuts' })).toBeInTheDocument();
      });

      // Close with Escape
      fireEvent.keyDown(window, { key: 'Escape' });

      await waitFor(() => {
        expect(screen.queryByRole('heading', { name: 'Keyboard Shortcuts' })).not.toBeInTheDocument();
      });
    });
  });

  it('displays keyboard shortcuts in the modal', async () => {
    renderWithRouter(<QuickActionsMenu />);

    fireEvent.keyDown(window, { key: 'k', altKey: true });

    await waitFor(() => {
      expect(screen.getByText('Go to Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Go to Workers')).toBeInTheDocument();
      expect(screen.getByText('Go to Schedule')).toBeInTheDocument();
      expect(screen.getByText('Go to Time Tracking')).toBeInTheDocument();
      expect(screen.getByText('Toggle Quick Actions Menu')).toBeInTheDocument();
      expect(screen.getByText('Add Time Entry')).toBeInTheDocument();
      expect(screen.getByText('Show Keyboard Shortcuts')).toBeInTheDocument();
      expect(screen.getByText('Close Modal/Menu')).toBeInTheDocument();
    });
  });

  it('shows action shortcuts in the menu', async () => {
    renderWithRouter(<QuickActionsMenu />);
    const fab = screen.getByLabelText('Quick Actions Menu');

    fireEvent.click(fab);

    await waitFor(() => {
      expect(screen.getByText('Alt+C')).toBeInTheDocument();
      expect(screen.getByText('Alt+S')).toBeInTheDocument();
      expect(screen.getByText('Alt+T')).toBeInTheDocument();
      expect(screen.getByText('Alt+K')).toBeInTheDocument();
    });
  });
});

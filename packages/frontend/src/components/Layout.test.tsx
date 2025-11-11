import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders, userEvent } from '../test/utils';
import Layout from './Layout';
import { mockAuthUser } from '../test/mockData';
import { useAuthStore } from '../lib/store';

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ pathname: '/' }),
    Outlet: () => <div>Page Content</div>,
  };
});

describe('Layout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();

    // Set up authenticated user
    useAuthStore.setState({
      user: mockAuthUser,
      token: 'test-token',
      isAuthenticated: true,
    });
  });

  it('renders Farm Commons logo and branding', () => {
    renderWithProviders(<Layout />);

    expect(screen.getByRole('heading', { name: /farm commons/i })).toBeInTheDocument();
    expect(screen.getByText(/community owned/i)).toBeInTheDocument();
  });

  it('renders all navigation items', () => {
    renderWithProviders(<Layout />);

    expect(screen.getByRole('link', { name: /dashboard/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /workers/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /schedule/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /time tracking/i })).toBeInTheDocument();
  });

  it('displays user email and role', () => {
    renderWithProviders(<Layout />);

    expect(screen.getByText(mockAuthUser.email)).toBeInTheDocument();
    expect(screen.getByText(mockAuthUser.role)).toBeInTheDocument();
  });

  it('highlights active navigation item based on current route', () => {
    renderWithProviders(<Layout />);

    // Dashboard should be active (route is '/')
    const dashboardLink = screen.getByRole('link', { name: /dashboard/i });
    expect(dashboardLink.className).toContain('bg-earth-700');
  });

  it('renders logout button', () => {
    renderWithProviders(<Layout />);

    const logoutButton = screen.getByRole('button', { name: /logout/i });
    expect(logoutButton).toBeInTheDocument();
  });

  it('logs out user and navigates to login when logout is clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Layout />);

    const logoutButton = screen.getByRole('button', { name: /logout/i });
    await user.click(logoutButton);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/login');

      // Verify user is logged out in store
      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.token).toBeNull();
      expect(state.isAuthenticated).toBe(false);
    });
  });

  it('renders page content in outlet', () => {
    renderWithProviders(<Layout />);

    expect(screen.getByText('Page Content')).toBeInTheDocument();
  });

  it('applies correct styling to sidebar', () => {
    renderWithProviders(<Layout />);

    const sidebar = screen.getByRole('heading', { name: /farm commons/i }).closest('div');
    expect(sidebar?.className).toContain('bg-earth-800');
  });

  it('navigation links have correct hrefs', () => {
    renderWithProviders(<Layout />);

    expect(screen.getByRole('link', { name: /dashboard/i })).toHaveAttribute('href', '/');
    expect(screen.getByRole('link', { name: /workers/i })).toHaveAttribute('href', '/workers');
    expect(screen.getByRole('link', { name: /schedule/i })).toHaveAttribute('href', '/schedule');
    expect(screen.getByRole('link', { name: /time tracking/i })).toHaveAttribute(
      'href',
      '/time-tracking'
    );
  });

  it('capitalizes user role in display', () => {
    renderWithProviders(<Layout />);

    // Role should be capitalized (CSS capitalize)
    const roleElement = screen.getByText(mockAuthUser.role);
    expect(roleElement.className).toContain('capitalize');
  });

  it('renders navigation icons', () => {
    renderWithProviders(<Layout />);

    // Icons should be rendered (lucide-react components)
    const dashboardLink = screen.getByRole('link', { name: /dashboard/i });
    expect(dashboardLink.querySelector('svg')).toBeInTheDocument();
  });

  it('applies hover effects to navigation items', () => {
    renderWithProviders(<Layout />);

    const workersLink = screen.getByRole('link', { name: /workers/i });
    expect(workersLink.className).toContain('hover:bg-earth-700');
  });

  it('applies hover effect to logout button', () => {
    renderWithProviders(<Layout />);

    const logoutButton = screen.getByRole('button', { name: /logout/i });
    expect(logoutButton.className).toContain('hover:bg-earth-700');
  });

  it('has fixed sidebar with correct positioning', () => {
    renderWithProviders(<Layout />);

    const sidebar = screen
      .getByRole('heading', { name: /farm commons/i })
      .closest('div')?.parentElement;
    expect(sidebar?.className).toContain('fixed');
  });

  it('has main content area with left margin for sidebar', () => {
    renderWithProviders(<Layout />);

    const mainContent = screen.getByText('Page Content').closest('main');
    const contentWrapper = mainContent?.parentElement;
    expect(contentWrapper?.className).toContain('ml-64');
  });

  it('handles missing user gracefully', () => {
    useAuthStore.setState({
      user: null,
      token: null,
      isAuthenticated: false,
    });

    renderWithProviders(<Layout />);

    // Should not crash when user is null
    expect(screen.getByRole('heading', { name: /farm commons/i })).toBeInTheDocument();
  });

  it('navigation items have consistent spacing', () => {
    renderWithProviders(<Layout />);

    const nav =
      screen.getByRole('navigation') ||
      screen.getByRole('link', { name: /dashboard/i }).closest('nav');
    expect(nav?.className || nav?.parentElement?.className).toContain('space-y-2');
  });

  it('divides header, nav, and user sections visually', () => {
    renderWithProviders(<Layout />);

    // Border dividers should be present
    const logo = screen.getByRole('heading', { name: /farm commons/i });
    expect(logo.closest('div')?.className).toContain('border-b');

    const userSection = screen.getByText(mockAuthUser.email).closest('div');
    expect(userSection?.className).toContain('border-t');
  });
});

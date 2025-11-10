import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders, userEvent } from '../test/utils';
import LoginPage from './LoginPage';
import * as api from '../lib/api';
import * as store from '../lib/store';

// Mock the API module
vi.mock('../lib/api', () => ({
  api: {
    post: vi.fn(),
  },
}));

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('renders login form with all elements', () => {
    renderWithProviders(<LoginPage />);

    expect(screen.getByRole('heading', { name: /farm commons/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('displays community-owned messaging', () => {
    renderWithProviders(<LoginPage />);

    expect(screen.getByText(/shared farm management software, community owned/i)).toBeInTheDocument();
    expect(screen.getByText(/for the humans who feed us/i)).toBeInTheDocument();
    expect(screen.getByText(/built with soil under our fingernails/i)).toBeInTheDocument();
  });

  it('updates input fields when user types', async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoginPage />);

    const emailInput = screen.getByLabelText(/email/i) as HTMLInputElement;
    const passwordInput = screen.getByLabelText(/password/i) as HTMLInputElement;

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');

    expect(emailInput.value).toBe('test@example.com');
    expect(passwordInput.value).toBe('password123');
  });

  it('submits form with valid credentials and navigates to dashboard', async () => {
    const user = userEvent.setup();
    const mockResponse = {
      user: { id: 1, email: 'test@example.com', role: 'manager', farm_id: 1 },
      access_token: 'mock-token-123',
    };

    vi.mocked(api.api.post).mockResolvedValue(mockResponse);

    renderWithProviders(<LoginPage />);

    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(api.api.post).toHaveBeenCalledWith('/auth/login', {
        email: 'test@example.com',
        password: 'password123',
      });
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  it('displays error message when login fails', async () => {
    const user = userEvent.setup();
    const errorMessage = 'Invalid credentials';

    vi.mocked(api.api.post).mockRejectedValue(new Error(errorMessage));

    renderWithProviders(<LoginPage />);

    await user.type(screen.getByLabelText(/email/i), 'wrong@example.com');
    await user.type(screen.getByLabelText(/password/i), 'wrongpassword');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  it('displays generic error for non-Error rejections', async () => {
    const user = userEvent.setup();

    vi.mocked(api.api.post).mockRejectedValue('Some string error');

    renderWithProviders(<LoginPage />);

    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/password/i), 'password');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText(/login failed/i)).toBeInTheDocument();
    });
  });

  it('disables submit button and shows loading state during login', async () => {
    const user = userEvent.setup();
    let resolveLogin: any;

    vi.mocked(api.api.post).mockImplementation(
      () => new Promise((resolve) => { resolveLogin = resolve; })
    );

    renderWithProviders(<LoginPage />);

    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');

    const submitButton = screen.getByRole('button', { name: /sign in/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/signing in/i)).toBeInTheDocument();
      expect(submitButton).toBeDisabled();
    });

    // Resolve the login
    resolveLogin({
      user: { id: 1, email: 'test@example.com', role: 'manager', farm_id: 1 },
      access_token: 'token',
    });
  });

  it('validates email field is required', async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoginPage />);

    const emailInput = screen.getByLabelText(/email/i);
    expect(emailInput).toHaveAttribute('required');
    expect(emailInput).toHaveAttribute('type', 'email');
  });

  it('validates password field is required', async () => {
    renderWithProviders(<LoginPage />);

    const passwordInput = screen.getByLabelText(/password/i);
    expect(passwordInput).toHaveAttribute('required');
    expect(passwordInput).toHaveAttribute('type', 'password');
  });

  it('clears error message when starting new login attempt', async () => {
    const user = userEvent.setup();

    // First login attempt fails
    vi.mocked(api.api.post).mockRejectedValueOnce(new Error('Login failed'));
    renderWithProviders(<LoginPage />);

    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/password/i), 'wrong');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText(/login failed/i)).toBeInTheDocument();
    });

    // Second login attempt should clear the error
    vi.mocked(api.api.post).mockResolvedValueOnce({
      user: { id: 1, email: 'test@example.com', role: 'manager', farm_id: 1 },
      access_token: 'token',
    });

    await user.clear(screen.getByLabelText(/password/i));
    await user.type(screen.getByLabelText(/password/i), 'correct');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.queryByText(/login failed/i)).not.toBeInTheDocument();
    });
  });
});

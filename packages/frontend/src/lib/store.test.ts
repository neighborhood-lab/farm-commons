import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from './store';
import { mockAuthUser } from '../test/mockData';

describe('useAuthStore', () => {
  beforeEach(() => {
    // Reset store to initial state
    useAuthStore.setState({
      user: null,
      token: null,
      isAuthenticated: false,
    });
    localStorage.clear();
  });

  it('initializes with null user and not authenticated', () => {
    const state = useAuthStore.getState();

    expect(state.user).toBeNull();
    expect(state.token).toBeNull();
    expect(state.isAuthenticated).toBe(false);
  });

  it('sets user and token on login', () => {
    const { login } = useAuthStore.getState();
    const token = 'test-token-123';

    login(mockAuthUser, token);

    const state = useAuthStore.getState();
    expect(state.user).toEqual(mockAuthUser);
    expect(state.token).toBe(token);
    expect(state.isAuthenticated).toBe(true);
  });

  it('persists auth state to localStorage on login', () => {
    const { login } = useAuthStore.getState();
    const token = 'test-token-123';

    login(mockAuthUser, token);

    const storedData = localStorage.getItem('farm-commons-auth');
    expect(storedData).toBeTruthy();

    const parsed = JSON.parse(storedData!);
    expect(parsed.state.user).toEqual(mockAuthUser);
    expect(parsed.state.token).toBe(token);
    expect(parsed.state.isAuthenticated).toBe(true);
  });

  it('clears user and token on logout', () => {
    const { login, logout } = useAuthStore.getState();

    // First login
    login(mockAuthUser, 'test-token');

    // Then logout
    logout();

    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.token).toBeNull();
    expect(state.isAuthenticated).toBe(false);
  });

  it('clears localStorage on logout', () => {
    const { login, logout } = useAuthStore.getState();

    login(mockAuthUser, 'test-token');
    logout();

    const storedData = localStorage.getItem('farm-commons-auth');
    const parsed = JSON.parse(storedData!);

    expect(parsed.state.user).toBeNull();
    expect(parsed.state.token).toBeNull();
    expect(parsed.state.isAuthenticated).toBe(false);
  });

  it('can handle multiple login/logout cycles', () => {
    const { login, logout } = useAuthStore.getState();

    // First cycle
    login(mockAuthUser, 'token-1');
    expect(useAuthStore.getState().isAuthenticated).toBe(true);

    logout();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);

    // Second cycle
    login(mockAuthUser, 'token-2');
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
    expect(useAuthStore.getState().token).toBe('token-2');
  });

  it('overwrites existing user data on new login', () => {
    const { login } = useAuthStore.getState();

    const user1 = { ...mockAuthUser, email: 'user1@example.com' };
    const user2 = { ...mockAuthUser, email: 'user2@example.com' };

    login(user1, 'token-1');
    expect(useAuthStore.getState().user?.email).toBe('user1@example.com');

    login(user2, 'token-2');
    expect(useAuthStore.getState().user?.email).toBe('user2@example.com');
    expect(useAuthStore.getState().token).toBe('token-2');
  });

  it('uses correct storage key for persistence', () => {
    const { login } = useAuthStore.getState();

    login(mockAuthUser, 'test-token');

    expect(localStorage.getItem('farm-commons-auth')).toBeTruthy();
    expect(localStorage.getItem('some-other-key')).toBeNull();
  });

  it('allows subscribing to state changes', () => {
    let notificationCount = 0;

    const unsubscribe = useAuthStore.subscribe(() => {
      notificationCount++;
    });

    const { login, logout } = useAuthStore.getState();

    login(mockAuthUser, 'token');
    expect(notificationCount).toBe(1);

    logout();
    expect(notificationCount).toBe(2);

    unsubscribe();
  });
});

// Authentication resource
import type { FarmCommonsClient } from '../client/base.js';
import type { LoginCredentials, AuthUser } from '../types/index.js';

export interface LoginResponse {
  user: AuthUser;
  access_token: string;
  expires_in: number;
}

export interface RegisterData {
  email: string;
  password: string;
  role: 'admin' | 'manager' | 'worker';
  farm_id: string;
}

export class AuthResource {
  constructor(private client: FarmCommonsClient) {}

  /**
   * Login with email and password
   * Automatically sets the access token for subsequent requests
   */
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    const response = await this.client.post<LoginResponse>('/api/auth/login', credentials);

    if (response.success && response.data) {
      // Automatically set the token for future requests
      this.client.setAccessToken(response.data.access_token);
      return response.data;
    }

    throw new Error(response.error || 'Login failed');
  }

  /**
   * Register a new user account
   * Automatically sets the access token for subsequent requests
   */
  async register(data: RegisterData): Promise<LoginResponse> {
    const response = await this.client.post<LoginResponse>('/api/auth/register', data);

    if (response.success && response.data) {
      // Automatically set the token for future requests
      this.client.setAccessToken(response.data.access_token);
      return response.data;
    }

    throw new Error(response.error || 'Registration failed');
  }

  /**
   * Get current user profile (requires authentication)
   */
  async me(): Promise<AuthUser> {
    const response = await this.client.get<AuthUser>('/api/auth/me');

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.error || 'Failed to get user profile');
  }

  /**
   * Logout (clear local token)
   */
  logout(): void {
    this.client.setAccessToken('');
  }
}

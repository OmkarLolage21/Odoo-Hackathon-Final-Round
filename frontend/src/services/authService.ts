// Auth API service types and functions
import apiClient from '../utils/apiClient';

// Auth API Types based on the OpenAPI spec
export interface UserRegister {
  email: string;
  password: string;
  username: string;
  full_name?: string;
  role: 'admin' | 'invoicing_user' | 'contact_user';
}

export interface UserLogin {
  email: string;
  password: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export interface TokenRefresh {
  refresh_token: string;
}

export interface UserProfile {
  id: string;
  user_id: string;
  username: string;
  full_name?: string;
  avatar_url?: string;
  bio?: string;
  created_at: string;
  updated_at: string;
}

export interface UserWithProfile {
  id: string;
  email: string;
  role: 'admin' | 'invoicing_user' | 'contact_user';
  is_active: boolean;
  profile?: UserProfile;
}

export interface PasswordChange {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

export interface UserSession {
  id: string;
  user_agent?: string;
  ip_address?: string;
  is_active: boolean;
  expires_at: string;
  created_at: string;
}

// Auth API Service
export class AuthService {
  private readonly BASE_PATH = '/api/v1/auth';

  async register(userData: UserRegister): Promise<TokenResponse> {
    return apiClient.post<TokenResponse>(`${this.BASE_PATH}/register`, userData);
  }

  async login(credentials: UserLogin): Promise<TokenResponse> {
    return apiClient.post<TokenResponse>(`${this.BASE_PATH}/login`, credentials);
  }

  async refreshToken(refreshData: TokenRefresh): Promise<TokenResponse> {
    return apiClient.post<TokenResponse>(`${this.BASE_PATH}/refresh`, refreshData);
  }

  async logout(refreshData: TokenRefresh): Promise<void> {
    return apiClient.post<void>(`${this.BASE_PATH}/logout`, refreshData);
  }

  async logoutAll(): Promise<void> {
    return apiClient.post<void>(`${this.BASE_PATH}/logout-all`);
  }

  async getCurrentUser(): Promise<UserWithProfile> {
    return apiClient.get<UserWithProfile>(`${this.BASE_PATH}/me`);
  }

  async changePassword(passwordData: PasswordChange): Promise<void> {
    return apiClient.post<void>(`${this.BASE_PATH}/change-password`, passwordData);
  }

  async getSessions(): Promise<UserSession[]> {
    return apiClient.get<UserSession[]>(`${this.BASE_PATH}/sessions`);
  }

  async healthCheck(): Promise<{ status: string; service: string }> {
    return apiClient.get<{ status: string; service: string }>(`${this.BASE_PATH}/health`);
  }
}

export const authService = new AuthService();
export default authService;
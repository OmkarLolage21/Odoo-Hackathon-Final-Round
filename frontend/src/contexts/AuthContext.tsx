import { createContext, useContext, useEffect, useState, ReactNode, useRef } from 'react';
import { User } from '../types';
import { authService, UserWithProfile, TokenResponse } from '../services/authService';
import { normalizeRole } from '../utils/rolePermissions';
import { apiClient } from '../utils/apiClient';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (email: string, password: string, username: string, fullName?: string, role?: string) => Promise<void>;
  isLoading: boolean;
  refreshToken: () => Promise<void>;
  isAuthenticated: boolean;
  authError: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Convert backend user format to frontend format
const convertBackendUser = (backendUser: UserWithProfile): User => {
  return {
    id: backendUser.id,
    name: backendUser.profile?.full_name || backendUser.profile?.username || 'Unknown User',
    email: backendUser.email,
    role: normalizeRole(backendUser.role) || 'contact',
    username: backendUser.profile?.username,
    full_name: backendUser.profile?.full_name,
    is_active: backendUser.is_active,
    profileImage: backendUser.profile?.avatar_url,
  };
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const refreshTimerRef = useRef<number | null>(null);

  // Configure api client handlers once
  useEffect(() => {
    apiClient.setHandlers({
      refresh: async () => {
        await refreshTokens();
      },
      logout: async () => {
        await logout();
      }
    });
    apiClient.onUnauthorized(() => {
      setAuthError('Your session has expired. Please sign in again.');
    });
  }, []);

  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    setIsLoading(true);
    try {
      const accessToken = localStorage.getItem('access_token');
      const refreshToken = localStorage.getItem('refresh_token');

      if (accessToken) {
        // Try to get current user with existing token
        try {
          const userData = await authService.getCurrentUser();
          setUser(convertBackendUser(userData));
        } catch (error) {
          // Token might be expired, try to refresh if we have refresh token
          if (refreshToken) {
            try {
              await refreshTokens();
            } catch (refreshError) {
              // Refresh failed, clear tokens
              clearTokens();
            }
          } else {
            clearTokens();
          }
        }
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
      clearTokens();
    } finally {
      setIsLoading(false);
    }
  };

  const storeTokens = (tokenResponse: TokenResponse) => {
    localStorage.setItem('access_token', tokenResponse.access_token);
    localStorage.setItem('refresh_token', tokenResponse.refresh_token);
    localStorage.setItem('token_type', tokenResponse.token_type);
    localStorage.setItem('expires_in', tokenResponse.expires_in.toString());
    scheduleSilentRefresh(tokenResponse.expires_in);
  };

  const clearTokens = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('token_type');
    localStorage.removeItem('expires_in');
    setUser(null);
    setAuthError(null);
    if (refreshTimerRef.current) {
      window.clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }
  };

  const scheduleSilentRefresh = (expiresInSeconds: number) => {
    // Refresh 30 seconds before expiry, clamp minimum to 10s
    const buffer = 30;
    const timeoutMs = Math.max((expiresInSeconds - buffer) * 1000, 10_000);
    if (refreshTimerRef.current) window.clearTimeout(refreshTimerRef.current);
    refreshTimerRef.current = window.setTimeout(async () => {
      try {
        await refreshTokens();
      } catch (e) {
        // handled in refreshTokens
      }
    }, timeoutMs);
  };

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const tokenResponse = await authService.login({ email, password });
      storeTokens(tokenResponse);
      
      // Get user data after successful login
      const userData = await authService.getCurrentUser();
      setUser(convertBackendUser(userData));
      setAuthError(null);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (
    email: string, 
    password: string, 
    username: string, 
    fullName?: string, 
    role: string = 'contact_user'
  ) => {
    setIsLoading(true);
    try {
      const tokenResponse = await authService.register({
        email,
        password,
        username,
        full_name: fullName,
        role: role as any,
      });
      
      storeTokens(tokenResponse);
      
      // Get user data after successful registration
      const userData = await authService.getCurrentUser();
      setUser(convertBackendUser(userData));
      setAuthError(null);
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const refreshTokens = async () => {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const tokenResponse = await authService.refreshToken({ refresh_token: refreshToken });
      storeTokens(tokenResponse);
      
      // Get updated user data
      const userData = await authService.getCurrentUser();
      setUser(convertBackendUser(userData));
      setAuthError(null);
    } catch (error) {
      clearTokens();
      throw error;
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        try {
          await authService.logout({ refresh_token: refreshToken });
        } catch (error) {
          // Even if logout fails on backend, clear local tokens
          console.error('Logout error:', error);
        }
      }
    } finally {
      clearTokens();
      setIsLoading(false);
    }
  };

  const value = {
    user,
    login,
    logout,
    register,
    isLoading,
    refreshToken: refreshTokens,
    isAuthenticated: !!user,
    authError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
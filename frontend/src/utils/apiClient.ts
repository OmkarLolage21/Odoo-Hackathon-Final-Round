// API configuration and utilities
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
}

export interface ApiError {
  detail: string;
  status: number;
}

class ApiClient {
  private baseURL: string;
  private isRefreshing = false;
  private refreshQueue: Array<() => void> = [];
  private onUnauthorizedCallbacks: Array<() => void> = [];
  // Injected callbacks (set by Auth layer)
  private refreshHandler?: () => Promise<void>;
  private logoutHandler?: () => Promise<void>;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  setHandlers(handlers: { refresh?: () => Promise<void>; logout?: () => Promise<void> }) {
    this.refreshHandler = handlers.refresh;
    this.logoutHandler = handlers.logout;
  }

  onUnauthorized(cb: () => void) {
    this.onUnauthorizedCallbacks.push(cb);
  }

  private emitUnauthorized() {
    this.onUnauthorizedCallbacks.forEach(cb => {
      try { cb(); } catch { /* ignore */ }
    });
  }

  private async performFetch(url: string, config: RequestInit) {
    const response = await fetch(url, config);
    return response;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}, retry = true): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;

    const token = localStorage.getItem('access_token');
    const defaultHeaders: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) defaultHeaders.Authorization = `Bearer ${token}`;

    const config: RequestInit = {
      ...options,
      headers: { ...defaultHeaders, ...options.headers },
    };

    let response: Response;
    try {
      response = await this.performFetch(url, config);
    } catch (e) {
      throw new Error('Network error occurred');
    }

    if (response.status === 204) {
      return {} as T;
    }

    if (response.status === 401) {
      // Attempt refresh once if possible
      if (retry && this.refreshHandler) {
        try {
          await this.queueRefresh();
          // Retry original request after successful refresh
          return await this.request<T>(endpoint, options, false);
        } catch (refreshErr) {
          // Refresh failed - force logout
          if (this.logoutHandler) await this.logoutHandler();
          this.emitUnauthorized();
          throw new Error('Unauthorized');
        }
      } else {
        this.emitUnauthorized();
        throw new Error('Unauthorized');
      }
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const message = errorData.detail || `HTTP ${response.status}: ${response.statusText}`;
      throw new Error(message);
    }

    return response.json() as Promise<T>;
  }

  private async queueRefresh(): Promise<void> {
    if (!this.refreshHandler) throw new Error('No refresh handler configured');
    if (this.isRefreshing) {
      return new Promise(resolve => this.refreshQueue.push(resolve));
    }
    this.isRefreshing = true;
    try {
      await this.refreshHandler();
      this.refreshQueue.forEach(r => r());
    } finally {
      this.refreshQueue = [];
      this.isRefreshing = false;
    }
  }

  async get<T>(endpoint: string, config: { headers?: Record<string,string> } = {}): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET', headers: config.headers });
  }

  async post<T>(endpoint: string, data?: any, config: { headers?: Record<string,string> } = {}): Promise<T> {
    return this.request<T>(endpoint, { method: 'POST', body: data ? JSON.stringify(data) : undefined, headers: config.headers });
  }

  async put<T>(endpoint: string, data?: any, config: { headers?: Record<string,string> } = {}): Promise<T> {
    return this.request<T>(endpoint, { method: 'PUT', body: data ? JSON.stringify(data) : undefined, headers: config.headers });
  }

  async delete<T>(endpoint: string, config: { headers?: Record<string,string> } = {}): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE', headers: config.headers });
  }
}

export const apiClient = new ApiClient();
export default apiClient;
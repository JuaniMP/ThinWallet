const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

interface RequestOptions {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
}

class ApiService {
  private getToken(): string | null {
    return localStorage.getItem('token');
  }

  async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { method = 'GET', body, headers = {} } = options;

    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const config: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    };

    if (body) {
      config.body = JSON.stringify(body);
    }

    const response = await fetch(`${API_URL}${endpoint}`, config);

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    return response.json();
  }

  get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint);
  }

  post<T>(endpoint: string, body: unknown): Promise<T> {
    return this.request<T>(endpoint, { method: 'POST', body });
  }

  put<T>(endpoint: string, body: unknown): Promise<T> {
    return this.request<T>(endpoint, { method: 'PUT', body });
  }

  delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

export const api = new ApiService();
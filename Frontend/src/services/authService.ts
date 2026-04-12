import { api } from './api';
import type { AuthResponse, LoginRequest, RegisterRequest } from '../types';

export const authService = {
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    return api.post<AuthResponse>('/auth/login', credentials);
  },

  async register(data: RegisterRequest): Promise<AuthResponse> {
    return api.post<AuthResponse>('/auth/register', data);
  },

  async logout(): Promise<void> {
    await api.post('/auth/logout', {});
  },

  async forgotPassword(email: string): Promise<{ message: string }> {
    return api.post('/auth/forgot-password', { email });
  },
};
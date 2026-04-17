import { api } from './api';
import type { LoginRequest, RegisterRequest, User } from '../types';

export const authService = {
  async login(credentials: LoginRequest): Promise<User> {
    return api.post<User>('/usuarios/login', credentials);
  },

  async register(data: RegisterRequest): Promise<User> {
    return api.post<User>('/usuarios/register', data);
  },

  async logout(): Promise<void> {
    return Promise.resolve();
  },

  async forgotPassword(email: string): Promise<{ message: string }> {
    return api.post('/usuarios/forgot-password', { email });
  },
};
import { api } from './api';
import type { AuthResponse, LoginRequest, RegisterRequest } from '../types';

export const authService = {
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    return api.post<AuthResponse>('/usuarios/login', credentials);
  },

  async register(data: RegisterRequest): Promise<AuthResponse> {
    return api.post<AuthResponse>('/usuarios/register', data);
  },

  async verify(correo: string, codigo: string): Promise<string> {
    return api.post<string>('/usuarios/verify', { correo, codigo });
  },

  async logout(): Promise<void> {
    await api.post('/usuarios/logout', {});
  },

  async forgotPassword(email: string): Promise<{ message: string }> {
    return api.post('/usuarios/forgot-password', { email });
  },
};
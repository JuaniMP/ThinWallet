import { api } from './api';
import type { AuthResponse, LoginRequest, RegisterRequest } from '../types';

export const authService = {
  async login(credentials: LoginRequest): Promise<AuthResponse> {
 dev-frontend
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
main
  },
};